<script setup>
import TmsWebShell from './TmsWebShell.vue'
import './ai-workbench-chrome.css'

defineProps({ fluid: Boolean })
const asset = name => '/ai-workbench-assets/' + name
</script>

<template>
  <TmsWebShell
    class="tms-ai-workbench-chrome"
    :class="{ 'tms-ai-workbench-chrome-fluid': fluid }"
  >
    <template #logo><img :src="asset('brand-logo.svg')" alt="至简集运" class="tms-ai-brand-logo"></template>
    <template #avatar><img :src="asset('company-avatar.png')" alt=""></template>
    <template #weather-icon><img :src="asset('weather.svg')" alt=""></template>
    <template #home-icon>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z"/>
      </svg>
    </template>
    <template #status><slot name="status" /></template>
    <template #menu-extra><slot name="menu-extra" /></template>
    <template #actions>
      <span class="tms-ai-header-divider"></span>
      <img :src="asset('inbox.svg')" alt="收件箱">
      <img :src="asset('bell.svg')" alt="通知">
      <img :src="asset('settings.svg')" alt="设置">
    </template>
    <slot />
  </TmsWebShell>
</template>
