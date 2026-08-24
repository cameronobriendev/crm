<template>
  <div class="prose-f text-ink-gray-8" v-html="html" />
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { sanitizeHTML } from '@/utils'

const props = defineProps({
  markdown: { type: String, default: '' },
})

// renderMarkdown escapes the source before it transforms anything, so the only
// markup here is the markup it emits. Sanitizing on top costs nothing and keeps
// the rendered OS content on the same footing as the rest of the CRM's HTML.
const html = computed(() => sanitizeHTML(renderMarkdown(props.markdown)))
</script>
