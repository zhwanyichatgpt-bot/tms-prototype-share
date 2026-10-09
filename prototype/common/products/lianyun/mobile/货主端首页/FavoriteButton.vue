<template>
  <button type="button" class="ly-favorite-button" :class="{saved}" :aria-pressed="saved" :aria-label="(saved ? '取消收藏' : '收藏') + label" @click.stop="$emit('toggle')"><van-icon :name="saved ? 'like' : 'like-o'"/><span>{{ saved ? '已收藏' : '收藏' }}</span></button>
</template>
<script setup>
defineProps({ saved: Boolean, label: { type: String, required: true } })
defineEmits(['toggle'])
</script>
<style scoped>
.ly-favorite-button{display:inline-flex;align-items:center;justify-content:center;gap:3px;min-width:44px;min-height:44px;flex:none;padding:0;border:0;background:none;color:#8a91a1;font-size:11px;white-space:nowrap}
.ly-favorite-button .van-icon{font-size:16px}
.ly-favorite-button.saved{color:#3a65ff}
.ly-favorite-button:focus-visible{outline:2px solid #3a65ff;outline-offset:-2px;border-radius:6px}
</style>
