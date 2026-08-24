<template>
  <div
    v-if="loading"
    class="flex items-center gap-2 text-p-base text-ink-gray-5"
  >
    <LoadingIndicator class="h-4 w-4" />
    <span>{{ __('Loading from the BrassHelm OS') }}</span>
  </div>
  <a
    v-else-if="error === OS_ERRORS.unauthenticated"
    :href="OS_BASE_URL"
    target="_blank"
    rel="noopener noreferrer"
    class="text-p-base text-ink-gray-6 underline underline-offset-2 hover:text-ink-gray-8"
  >
    {{ __('Sign in to the OS to see this') }}
  </a>
  <div v-else-if="error" class="text-p-base text-ink-gray-5">
    {{ __('The BrassHelm OS is not reachable right now') }}
  </div>
</template>

<script setup>
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { OS_BASE_URL, OS_ERRORS } from '@/data/brasshelmOS'

defineProps({
  loading: { type: Boolean, default: false },
  // One of OS_ERRORS, or '' when there is nothing wrong. not_found is handled
  // by the panels themselves as an empty state, not as an error.
  error: { type: String, default: '' },
})
</script>
