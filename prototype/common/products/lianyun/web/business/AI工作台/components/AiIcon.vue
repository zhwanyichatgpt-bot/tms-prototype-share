<script setup>
defineProps({ name: { type: String, required: true }, size: { type: [Number, String], default: 18 } })
const paths = {
  plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M18 6 6 18', search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chevron: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6', star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z',
  chat: 'M4 4h16v12H9l-5 4ZM8 9h.1M12 9h.1M16 9h.1', more: 'M12 4h.01M12 12h.01M12 20h.01',
  refresh: 'M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5',
  clock: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM12 8v4l2.5 1.5M4 5l2-2M18 3l2 2M5.5 19l-1 2M18.5 19l1 2',
  attach: 'm8 12 6-6a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7L12 2M6 14l9-9',
  send: 'm3 10 18-7-7 18-3-8Zm8 3L21 3', copy: 'M8 8h12v13H8ZM4 16H2V2h13v2',
  quote: 'M14 3H4v14h5M9 7h11v14l-5-4H9Z', speaker: 'm3 9 5 0 5-5v16l-5-5H3ZM17 8a7 7 0 0 1 0 8M20 5a11 11 0 0 1 0 14',
  share: 'M13 3v5C6 8 3 12 3 19c3-5 6-6 10-6v5l8-8Z',
  like: 'M7 21H3V10h4ZM7 10l5-8c3 0 2 5 1 8h6c2 0 2 2 1 4l-2 7H7Z',
  dislike: 'M7 3H3v11h4ZM7 14l5 8c3 0 2-5 1-8h6c2 0 2-2 1-4l-2-7H7Z',
  pin: 'm8 3 8 0-1 6 4 4v2H5v-2l4-4ZM12 15v7', edit: 'm4 16 12-12 4 4-12 12-5 1ZM14 6l4 4',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  settings: 'm12 2 9 5v10l-9 5-9-5V7ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
  chart: 'M4 21V12M10 21V7M16 21V3M3 6l6-4 5 2 6-3', grip: 'M6 7h12M6 12h12M6 17h12',
  check: 'm5 12 4 4 10-10', file: 'M6 2h8l4 4v16H6ZM14 2v5h5M9 12h6M9 16h6', stop: 'M6 6h12v12H6Z',
  sidebar: 'M3 4h18v16H3ZM9 4v16',
  account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a8 8 0 0 1 16 0v1',
}
</script>
<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="name === 'more' ? 3 : 1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.chat" /></svg>
</template>
