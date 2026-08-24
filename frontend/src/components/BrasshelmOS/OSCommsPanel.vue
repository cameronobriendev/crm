<template>
  <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
    <OSSectionState
      v-if="
        comms.loading || (comms.error && comms.error !== OS_ERRORS.notFound)
      "
      :loading="comms.loading"
      :error="comms.error"
    />
    <EmptyState
      v-else-if="!emailHistory && !notes"
      :icon="EmailIcon"
      name="Comms"
      :title="__('Nothing here yet')"
      :description="
        __('The BrassHelm OS has no email history or notes for this person.')
      "
    />
    <div v-else class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <div class="text-base-medium text-ink-gray-8">
          {{ __('Email history') }}
        </div>
        <OSMarkdown v-if="emailHistory" :markdown="emailHistory" />
        <div v-else class="text-p-base text-ink-gray-5">
          {{ __('No email history in the OS') }}
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="text-base-medium text-ink-gray-8">
          {{ __('Notes') }}
        </div>
        <OSMarkdown v-if="notes" :markdown="notes" />
        <div v-else class="text-p-base text-ink-gray-5">
          {{ __('No notes in the OS') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/ListViews/EmptyState.vue'
import EmailIcon from '@/components/Icons/EmailIcon.vue'
import OSMarkdown from '@/components/BrasshelmOS/OSMarkdown.vue'
import OSSectionState from '@/components/BrasshelmOS/OSSectionState.vue'
import { OS_ERRORS } from '@/data/brasshelmOS'
import { computed } from 'vue'

const props = defineProps({
  comms: { type: Object, required: true },
})

const emailHistory = computed(
  () => props.comms.data?.emailHistory?.trim() || '',
)
const notes = computed(() => props.comms.data?.notes?.trim() || '')
</script>
