<template>
  <OSMarkdown v-if="!isHTML" :markdown="text" />
  <div v-else class="prose-f text-ink-gray-8" v-html="html" />
</template>

<script setup>
import OSMarkdown from '@/components/BrasshelmOS/OSMarkdown.vue'
import { looksLikeHTML } from '@/utils/richText'
import { sanitizeHTML } from '@/utils'
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
})

// Markdown goes through the OS renderer, which escapes its source before it
// transforms anything. Stored HTML is sanitized the way the rest of the CRM
// sanitizes stored HTML. Neither path lets raw markup through unchecked.
const isHTML = computed(() => looksLikeHTML(props.text))
const html = computed(() => sanitizeHTML(props.text))
</script>
