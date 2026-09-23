<template>
  <button type="button" class="platform-row" :class="{ 'row-static': !selectable }" @click="selectable && $emit('select')">
    <div class="row-body">
      <span class="platform-logo" :style="{ background: logoColor }">{{ logo }}</span>
      <span class="platform-main">
        <strong>{{ name }}</strong>
        <small v-if="feature">{{ feature }}</small>
        <span v-if="tags.length" class="platform-tags"><i v-for="tag in tags" :key="tag">{{ tag }}</i></span>
      </span>
      <span v-if="estimateValue" class="platform-estimate">
        <small>{{ estimateLabel }}</small>
        <b><strong>{{ estimateValue }}</strong><small>{{ estimateUnit }}</small></b>
      </span>
      <!-- 接单时效：沿用估价块的视觉节奏，数字为主、说明为辅 -->
      <span v-else-if="stateValue" class="platform-estimate">
        <small>{{ stateLabel }}</small>
        <b><strong>{{ stateValue }}</strong><small>{{ stateUnit }}</small></b>
      </span>
      <!-- 不可选平台只给一句状态；没有状态时退回把 meta 放右侧 -->
      <span v-else class="platform-state" :class="{ 'state-muted': muted }">{{ state || meta }}</span>
      <span v-if="selectable" class="platform-check" :class="{ checked }">{{ checked ? '✓' : '' }}</span>
    </div>
    <!-- 说明行：右侧已有内容时才下移，避免与右侧槽位重复 -->
    <em v-if="meta && (estimateValue || state || stateValue)" class="platform-meta">{{ meta }}</em>
  </button>
</template>

<script setup>
defineProps({
  logo: { type: String, required: true },
  logoColor: { type: String, default: '#246df7' },
  name: { type: String, required: true },
  feature: { type: String, default: '' },
  estimateLabel: { type: String, default: '预估' },
  estimateValue: { type: [String, Number], default: '' },
  estimateUnit: { type: String, default: '元' },
  state: { type: String, default: '' },
  stateLabel: { type: String, default: '' },
  stateValue: { type: [String, Number], default: '' },
  stateUnit: { type: String, default: '' },
  muted: { type: Boolean, default: false },
  meta: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  checked: { type: Boolean, default: false },
  selectable: { type: Boolean, default: true },
})
defineEmits(['select'])
</script>

<style scoped>
/* 平台行样式取自「发布货源」页发布方式列表；有依据文案时拆为上下两段 */
.platform-row{width:100%;padding:7px 2px;border:0;display:block;background:#fff;color:#333;text-align:left;font-family:inherit;cursor:pointer}
.platform-row.row-static{cursor:default}
.row-body{display:flex;align-items:center}
.platform-logo{width:32px;height:32px;flex:0 0 32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:10px;font-weight:700}
.platform-main{flex:1;min-width:0;margin-left:10px}
.platform-main strong{display:block;color:#252b3a;font-size:15px;line-height:20px;font-weight:700}
.platform-main small{display:block;color:#747c8c;font-size:10px;line-height:15px;font-weight:500}
.platform-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.platform-tags i{padding:1px 5px;border-radius:4px;background:#edf2fa;color:#6b7d9b;font-size:9px;line-height:14px;font-style:normal}
.platform-estimate{margin-left:auto;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;text-align:right;white-space:nowrap}
.platform-estimate > small{color:#747c8c;font-size:10px;font-weight:500;line-height:14px}
.platform-estimate > b{display:flex;align-items:baseline;gap:2px}
.platform-estimate > strong{color:#252b3a;font-size:17px;line-height:20px;font-weight:700}
.platform-estimate b > small{color:#747c8c;font-size:10px;font-weight:500}
.platform-state{margin-left:auto;font-size:10px;color:#747c8c;white-space:nowrap}
.platform-state.state-muted{color:#b0b6c3}
.platform-check{width:17px;height:17px;margin-left:10px;flex:0 0 17px;box-sizing:border-box;border:1px solid #d9dde6;border-radius:5px;color:#fff;font-size:10px;line-height:15px;text-align:center}
.platform-check.checked{border-color:#3866ff;background:#3866ff}
.platform-meta{display:block;margin:4px 0 0 42px;color:#8a91a1;font-size:10px;line-height:14px;font-weight:500;font-style:normal}
</style>
