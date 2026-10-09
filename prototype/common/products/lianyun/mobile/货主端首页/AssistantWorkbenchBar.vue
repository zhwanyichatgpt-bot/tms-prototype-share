<template>
  <header class="assistant-workbench-bar">
    <button type="button" aria-label="返回上一页" @click="$emit('back')"><van-icon name="arrow-left"/></button>
    <strong>{{ title }}</strong>
    <button type="button" aria-label="重新开始会话" @click="$emit('restart')"><img src="/zhiyun-mobile-assets/ai-workbench/new-chat.svg" alt=""/></button>
  </header>
</template>
<script setup>
defineProps({ title:String })
defineEmits(['back','restart'])
</script>
<style scoped>
/* 提取自智运 AiHomePage.vue 的 workbench-bar/header-icon；保留联运返回与会话动作。 */
.assistant-workbench-bar { height:44px; min-height:44px; padding:0 12px; display:flex; align-items:center; gap:8px; background:transparent; }
.assistant-workbench-bar button { display:grid; place-items:center; flex:none; width:32px; height:32px; padding:5px; border:0; background:none; color:#333; font-size:21px; }
.assistant-workbench-bar strong { flex:1; color:#333; font-size:16px; font-weight:600; }
.assistant-workbench-bar img { display:block; width:20px; height:20px; }
</style>
