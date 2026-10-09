<template>
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g v-if="mode === 'road'"><path d="M3 7h16v15H3zM19 13h6l4 5v4H19M22 13v6h7"/><circle cx="8" cy="24" r="3"/><circle cx="24" cy="24" r="3"/></g>
    <g v-else-if="mode === 'water'"><path d="M4 18l12 3 12-3-4 9H8zM7 18V9h18v9M12 9V5h8v4M12 12v5M19 12v5M3 28q4-3 8 0t8 0t10 0"/></g>
    <g v-else-if="mode === 'rail'"><rect x="7" y="4" width="18" height="21" rx="4"/><path d="M10 8h12v7H10zM11 25l-4 5M21 25l4 5M10 28h12"/><circle cx="11" cy="20" r="1"/><circle cx="21" cy="20" r="1"/></g>
    <g v-else-if="mode === 'air'"><rect x="12" y="11" width="8" height="6" rx="2"/><path d="M12 12L6 8M20 12l6-4M12 16l-6 3M20 16l6 3M16 17v4M12 22h8v7h-8z"/><ellipse cx="6" cy="7" rx="5" ry="2"/><ellipse cx="26" cy="7" rx="5" ry="2"/><ellipse cx="6" cy="20" rx="5" ry="2"/><ellipse cx="26" cy="20" rx="5" ry="2"/></g>
    <g v-else><path d="M13 8l3-3a7 7 0 0110 10l-5 5a7 7 0 01-10 0M19 24l-3 3A7 7 0 016 17l5-5a7 7 0 0110 0M11 21l10-10"/></g>
  </svg>
</template>
<script setup>
defineProps({ mode: { type: String, default: 'multi' } })
</script>
