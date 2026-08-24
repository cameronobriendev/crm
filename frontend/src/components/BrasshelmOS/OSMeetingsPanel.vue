<template>
  <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
    <OSSectionState
      v-if="
        meetings.loading ||
        (meetings.error && meetings.error !== OS_ERRORS.notFound)
      "
      :loading="meetings.loading"
      :error="meetings.error"
    />
    <EmptyState
      v-else-if="!rows.length"
      :icon="CalendarIcon"
      name="Meetings"
      :title="__('No meetings yet')"
      :description="
        __('The BrassHelm OS has not captured a meeting with this person.')
      "
    />
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="meeting in rows"
        :key="meeting.slug"
        class="rounded border border-outline-gray-2"
      >
        <button
          class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-gray-1"
          @click="$emit('toggle', meeting.slug)"
        >
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-base text-ink-gray-8">
              {{ meeting.title || meeting.slug }}
            </span>
            <span class="text-p-sm text-ink-gray-5">
              {{ formatDate(meeting.date, undefined, true) }}
              <template v-if="!meeting.hasSummary">
                {{ __('(no summary)') }}
              </template>
            </span>
          </div>
          <FeatherIcon
            :name="
              expandedSlug === meeting.slug ? 'chevron-up' : 'chevron-down'
            "
            class="h-4 w-4 shrink-0 text-ink-gray-5"
          />
        </button>
        <div
          v-if="expandedSlug === meeting.slug"
          class="border-t border-outline-gray-2 px-3 py-3"
        >
          <OSSectionState
            v-if="
              detailOf(meeting.slug).loading ||
              (detailOf(meeting.slug).error &&
                detailOf(meeting.slug).error !== OS_ERRORS.notFound)
            "
            :loading="detailOf(meeting.slug).loading"
            :error="detailOf(meeting.slug).error"
          />
          <div
            v-else-if="!detailOf(meeting.slug).data?.markdown"
            class="text-p-base text-ink-gray-5"
          >
            {{ __('This meeting has no summary in the OS') }}
          </div>
          <OSMarkdown v-else :markdown="detailOf(meeting.slug).data.markdown" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/ListViews/EmptyState.vue'
import CalendarIcon from '@/components/Icons/CalendarIcon.vue'
import OSMarkdown from '@/components/BrasshelmOS/OSMarkdown.vue'
import OSSectionState from '@/components/BrasshelmOS/OSSectionState.vue'
import { OS_ERRORS } from '@/data/brasshelmOS'
import { formatDate } from '@/utils'
import { FeatherIcon } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  meetings: { type: Object, required: true },
  meetingDetails: { type: Object, required: true },
  expandedSlug: { type: String, default: '' },
})

defineEmits(['toggle'])

const rows = computed(() => props.meetings.data?.meetings || [])

const EMPTY_DETAIL = { loading: false, loaded: false, error: '', data: null }

function detailOf(slug) {
  return props.meetingDetails[slug] || EMPTY_DETAIL
}
</script>
