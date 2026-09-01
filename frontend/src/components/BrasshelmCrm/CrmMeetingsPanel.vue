<template>
  <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
    <div
      v-if="meetings.list?.loading && !rows.length"
      class="flex items-center gap-2 text-p-base text-ink-gray-5"
    >
      <LoadingIndicator class="h-4 w-4" />
      <span>{{ __('Loading meetings') }}</span>
    </div>
    <EmptyState
      v-else-if="!rows.length"
      :icon="CalendarIcon"
      name="Meetings"
      :title="__('No meetings yet')"
      :description="__('No meeting has been filed against this lead.')"
    />
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="meeting in rows"
        :key="meeting.name"
        class="rounded border border-outline-gray-2"
      >
        <button
          class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-gray-1"
          @click="$emit('toggle', meeting.name)"
        >
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-base text-ink-gray-8">
              {{ meeting.title || meeting.name }}
            </span>
            <span class="text-p-sm text-ink-gray-5">
              {{ subtitle(meeting) }}
            </span>
          </div>
          <FeatherIcon
            :name="
              expandedName === meeting.name ? 'chevron-up' : 'chevron-down'
            "
            class="h-4 w-4 shrink-0 text-ink-gray-5"
          />
        </button>
        <div
          v-if="expandedName === meeting.name"
          class="flex flex-col gap-4 border-t border-outline-gray-2 px-3 py-3"
        >
          <div
            v-if="!detailOf(meeting.name)?.data"
            class="flex items-center gap-2 text-p-base text-ink-gray-5"
          >
            <LoadingIndicator
              v-if="detailOf(meeting.name)?.loading"
              class="h-4 w-4"
            />
            <span>
              {{
                detailOf(meeting.name)?.loading
                  ? __('Loading meeting')
                  : __('This meeting could not be loaded')
              }}
            </span>
          </div>
          <template v-else>
            <!-- Who was on the call. The people from outside are the ones
                 being read about, so they lead and they carry the weight;
                 Cameron and his own side are muted behind them. -->
            <div
              v-if="peopleOn(meeting.name).length"
              class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-p-sm"
            >
              <span
                v-for="(person, index) in peopleOn(meeting.name)"
                :key="`${person.name}-${index}`"
                :class="
                  person.external
                    ? 'text-ink-gray-8'
                    : 'text-ink-gray-5 font-normal'
                "
              >
                {{ person.name
                }}<span v-if="index < peopleOn(meeting.name).length - 1"
                  >,</span
                >
              </span>
            </div>

            <AudioPlayer
              v-if="detailOf(meeting.name).data.audio"
              :src="detailOf(meeting.name).data.audio"
            />
            <div
              v-else-if="detailOf(meeting.name).data.audio_missing_reason"
              class="text-p-sm text-ink-gray-5"
            >
              {{ detailOf(meeting.name).data.audio_missing_reason }}
            </div>

            <CrmRichText
              v-if="!richTextIsEmpty(detailOf(meeting.name).data.summary)"
              :text="detailOf(meeting.name).data.summary"
            />
            <div v-else class="text-p-base text-ink-gray-5">
              {{ __('This meeting has no summary') }}
            </div>

            <div
              v-if="detailOf(meeting.name).data.transcript"
              class="flex flex-col gap-1.5"
            >
              <div class="flex items-center gap-3">
                <div class="text-p-sm text-ink-gray-5">
                  {{ __('Transcript') }}
                </div>
                <Button
                  :label="
                    copiedName === meeting.name
                      ? __('Copied')
                      : __('Copy transcript')
                  "
                  class="ml-auto"
                  @click="
                    copyTranscript(
                      meeting.name,
                      detailOf(meeting.name).data.transcript,
                    )
                  "
                />
              </div>
              <div
                v-if="copyFailed === meeting.name"
                class="text-p-sm text-ink-gray-5"
              >
                {{
                  __(
                    'The browser would not let the page copy. Select the transcript and copy it yourself.',
                  )
                }}
              </div>
              <!-- The whole transcript is in the page, not windowed, so the
                   browser's own find lands on it. -->
              <pre
                class="max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-words rounded bg-surface-gray-1 px-3 py-2.5 font-mono text-p-sm text-ink-gray-8"
                >{{ detailOf(meeting.name).data.transcript }}</pre
              >
            </div>
          </template>
        </div>
      </div>

      <Button
        v-if="meetings.hasNextPage"
        :label="__('Load more')"
        :loading="meetings.list?.loading"
        class="self-start"
        @click="$emit('loadMore')"
      />
    </div>
  </div>
</template>

<script setup>
import AudioPlayer from '@/components/Activities/AudioPlayer.vue'
import CalendarIcon from '@/components/Icons/CalendarIcon.vue'
import CrmRichText from '@/components/BrasshelmCrm/CrmRichText.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { meetingParticipants } from '@/utils/participants'
import { richTextIsEmpty } from '@/utils/richText'
import { formatDate, formatDuration } from '@/utils'
import { Button, FeatherIcon } from 'frappe-ui'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  meetings: { type: Object, required: true },
  details: { type: Object, required: true },
  expandedName: { type: String, default: '' },
})

defineEmits(['toggle', 'loadMore'])

const rows = computed(() => props.meetings.data || [])

function detailOf(name) {
  return props.details[name] || null
}

function peopleOn(name) {
  const doc = detailOf(name)?.data
  return doc ? meetingParticipants(doc) : []
}

// Which meeting is currently showing "Copied", and which one could not copy.
// Held by meeting name rather than as booleans so two open rows cannot report
// each other's result.
const copiedName = ref('')
const copyFailed = ref('')
let copiedTimer = null

onBeforeUnmount(() => clearTimeout(copiedTimer))

// The raw transcript as stored, speaker labels and all. What lands on the
// clipboard is what a person would paste into notes, not the rendered page.
async function copyTranscript(name, transcript) {
  if (!transcript) return

  clearTimeout(copiedTimer)
  copyFailed.value = ''

  try {
    await navigator.clipboard.writeText(transcript)
  } catch {
    // Some contexts refuse clipboard writes outright. Say so plainly and
    // leave the transcript on the page for the reader to take themselves.
    copiedName.value = ''
    copyFailed.value = name
    return
  }

  copiedName.value = name
  copiedTimer = setTimeout(() => (copiedName.value = ''), 2000)
}

// Date first, then whatever else the record actually knows.
function subtitle(meeting) {
  return [
    formatDate(meeting.meeting_date, undefined, true),
    formatDuration(meeting.duration_seconds),
    meeting.platform,
  ]
    .filter(Boolean)
    .join(' · ')
}
</script>
