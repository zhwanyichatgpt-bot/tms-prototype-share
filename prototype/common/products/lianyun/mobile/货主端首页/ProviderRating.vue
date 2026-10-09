<template>
  <button class="ly-rating" :class="{ compact, 'ly-rating-readable': readable, 'ly-rating-concise': concise, 'ly-rating-stars-mode': stars }" :aria-label="provider.name + '的企业服务评价' + (provider.reviewCount > 0 ? '，' + provider.score.toFixed(1) + '分，' + provider.reviewCount + '条评价' : '，暂无评价')" @click="$emit('open', provider)">
    <template v-if="provider.reviewCount > 0 && provider.score !== null">
      <span v-if="stars" class="ly-rating-stars" aria-hidden="true"><span>★★★★★</span><span class="ly-rating-stars-fill" :style="{width: Math.max(0,Math.min(100,provider.score*20))+'%'}">★★★★★</span></span><van-icon v-else name="star"/><span v-if="concise">企业</span><span v-else-if="!compact">服务评分</span><strong>{{ provider.score.toFixed(1) }}<small v-if="!compact">／5</small></strong><span v-if="!concise">· {{ provider.reviewCount }}条评价</span><em v-if="!concise && provider.reviewCount < 5">评价较少</em>
    </template>
    <template v-else><van-icon name="star-o"/><span>暂无评价</span></template>
    <van-icon name="arrow"/>
  </button>
</template>
<script setup>
defineProps({ provider: { type: Object, required: true }, compact: Boolean, readable: Boolean, concise: Boolean, stars: Boolean })
defineEmits(['open'])
</script>

<style scoped>
/* 首页可读变体保留原有图标和评价行为。 */
.ly-rating.ly-rating-readable { --ly-rating-color:#647090; font-size:12px; color:#647090; padding:0; gap:4px; }
.ly-rating.ly-rating-readable strong { font-size:14px; color:var(--ly-text); }
.ly-rating.ly-rating-readable em { font-size:11px; }
.ly-rating.ly-rating-concise{white-space:nowrap;font-size:11px;gap:3px}
.ly-rating.ly-rating-concise strong{font-size:13px;color:#b57416}
.ly-rating.ly-rating-readable :deep(.van-icon-star){color:#e6a23c}
.ly-rating.ly-rating-stars-mode>.ly-rating-stars{position:relative;display:inline-block;flex:none;width:70px;order:0;font-size:14px;line-height:18px;letter-spacing:0;color:#dbe1eb;white-space:nowrap;text-align:left}
.ly-rating-stars>span{display:block;width:70px;white-space:nowrap}
.ly-rating-stars .ly-rating-stars-fill{position:absolute;inset:0 auto 0 0;overflow:hidden;color:#e6a23c}
</style>
