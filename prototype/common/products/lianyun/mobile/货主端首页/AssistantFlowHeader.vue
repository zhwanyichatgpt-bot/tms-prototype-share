<template>
  <header class="lyf-page-header"><button type="button" :aria-label="backLabel" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>{{ title }}</h1><div class="lyf-capsule"><img src="/lianyun-mobile-assets/scheme-detail/capsule.svg" alt="" aria-hidden="true"/><button type="button" aria-label="返回首页" @click="$emit('close')"/></div></header>
</template>
<script setup>
defineProps({title:String,backLabel:{default:'返回上一页'}})
defineEmits(['back','close'])
</script>
