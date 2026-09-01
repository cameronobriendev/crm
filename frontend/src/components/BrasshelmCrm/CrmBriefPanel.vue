<template>
  <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
    <div
      v-if="brief.list?.loading && !row"
      class="flex items-center gap-2 text-p-base text-ink-gray-5"
    >
      <LoadingIndicator class="h-4 w-4" />
      <span>{{ __('Loading the brief') }}</span>
    </div>
    <EmptyState
      v-else-if="!row || richTextIsEmpty(row.brief)"
      :icon="SparkleIcon"
      name="Brief"
      :title="__('No brief yet')"
      :description="__('No brief has been written for this lead.')"
    />
    <div v-else class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div v-if="row.generated_at" class="text-p-sm text-ink-gray-5">
          {{ __('Generated {0}', [formatDate(row.generated_at)]) }}
        </div>

        <!-- Everything from here to the rebuild button is the OS's answer
             about freshness. When the OS has not answered, none of it is on
             the page and the brief reads exactly as it did before. -->
        <template v-if="showFreshness">
          <div
            v-if="isRunning"
            class="flex items-center gap-1.5 text-p-sm text-ink-gray-5"
          >
            <LoadingIndicator class="h-3 w-3" />
            <span>{{ __('Rebuilding now') }}</span>
          </div>
          <div
            v-else-if="isPending"
            class="flex flex-wrap items-center gap-x-2 gap-y-1 text-p-sm"
          >
            <span
              class="rounded border border-outline-amber-2 px-1.5 py-0.5 text-ink-gray-7"
            >
              {{ __('Not current') }}
            </span>
            <span class="text-ink-gray-5">{{ pendingReason }}</span>
          </div>
          <div v-else class="text-p-sm text-ink-gray-5">
            {{ __('Current') }}
          </div>

          <Button
            v-if="!isRunning"
            :label="__('Rebuild')"
            class="ml-auto"
            @click="$emit('rebuild')"
          />
        </template>
      </div>

      <!-- Only ever shown when the brief is behind, so it explains a state the
           reader can already see rather than announcing a schedule at random. -->
      <div
        v-if="showFreshness && isPending && !isRunning && scheduleLine"
        class="text-p-sm text-ink-gray-5"
      >
        {{ scheduleLine }}
      </div>

      <div v-if="startRefused" class="text-p-sm text-ink-gray-5">
        {{ startRefused }}
      </div>

      <CrmRichText :text="row.brief" />
    </div>
  </div>
</template>

<script setup>
import CrmRichText from '@/components/BrasshelmCrm/CrmRichText.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import SparkleIcon from '@/components/Icons/SparkleIcon.vue'
import { richTextIsEmpty } from '@/utils/richText'
import { formatDate } from '@/utils'
import { Button } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  brief: { type: Object, required: true },
  // The OS's freshness answer, or null when it has not given one.
  freshness: { type: Object, default: null },
  isRunning: { type: Boolean, default: false },
  startRefused: { type: String, default: '' },
})

defineEmits(['rebuild'])

// One brief per lead. If more than one is ever filed, the newest wins.
const row = computed(() => props.brief.data?.[0] || null)

// The header appears only on a real answer from the OS. A rebuild we started
// keeps it up even if a later status read comes back empty, so the button
// never vanishes underneath the person who just pressed it.
const showFreshness = computed(() => !!props.freshness || props.isRunning)

const isPending = computed(() => !!props.freshness?.pending)

const pendingReason = computed(
  () => props.freshness?.pendingReason || __('data changed since this brief'),
)

const scheduleLine = computed(() => {
  switch (props.freshness?.nextRun) {
    case 'today':
      return __('rebuilds before your next meeting')
    case 'tonight':
      return __('rebuilds tonight')
    default:
      return __(
        'no rebuild scheduled, rebuilds when used, or right now with the button',
      )
  }
})
</script>
