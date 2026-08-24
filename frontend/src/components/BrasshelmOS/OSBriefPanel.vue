<template>
  <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
    <OSSectionState
      v-if="
        brief.loading || (brief.error && brief.error !== OS_ERRORS.notFound)
      "
      :loading="brief.loading"
      :error="brief.error"
    />
    <EmptyState
      v-else-if="brief.error === OS_ERRORS.notFound || !brief.data?.markdown"
      :icon="FileTextIcon"
      name="Brief"
      :title="__('No brief yet')"
      :description="
        __('The BrassHelm OS has not written a brief for this person.')
      "
    />
    <div v-else class="flex flex-col gap-3">
      <div v-if="brief.data.updatedAt" class="text-p-sm text-ink-gray-5">
        {{ __('Updated {0}', [formatDate(brief.data.updatedAt)]) }}
      </div>
      <OSMarkdown :markdown="brief.data.markdown" />
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/ListViews/EmptyState.vue'
import FileTextIcon from '@/components/Icons/FileTextIcon.vue'
import OSMarkdown from '@/components/BrasshelmOS/OSMarkdown.vue'
import OSSectionState from '@/components/BrasshelmOS/OSSectionState.vue'
import { OS_ERRORS } from '@/data/brasshelmOS'
import { formatDate } from '@/utils'

defineProps({
  brief: { type: Object, required: true },
})
</script>
