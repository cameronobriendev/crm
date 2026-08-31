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
      <div v-if="row.generated_at" class="text-p-sm text-ink-gray-5">
        {{ __('Generated {0}', [formatDate(row.generated_at)]) }}
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
import { computed } from 'vue'

const props = defineProps({
  brief: { type: Object, required: true },
})

// One brief per lead. If more than one is ever filed, the newest wins.
const row = computed(() => props.brief.data?.[0] || null)
</script>
