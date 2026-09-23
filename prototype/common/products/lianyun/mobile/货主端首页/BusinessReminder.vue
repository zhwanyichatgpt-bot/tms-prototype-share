<template>
  <button class="transit-card" aria-label="查看武汉到广州的3份新报价" @click="$emit('open')">
    <span v-for="layer in layers" :key="layer" :class="['transit-layer', `transit-${layer}`]" aria-hidden="true"></span>
    <div class="transit-copy">
      <p class="transit-title">收到 <b>3</b> 份新报价</p>
      <p class="transit-meta-line">武汉 → 广州 · 待您比较</p>
      <p class="transit-meta-line"><span class="transit-action">查看报价 ›</span></p>
    </div>
    <span class="transit-mascot" aria-hidden="true"><span class="transit-mascot-image"></span></span>
  </button>
</template>
<script setup>
defineEmits(['open'])
const layers = ['outline', 'glow', 'surface', 'border', 'watermark', 'avatar-panel']
</script>
<style scoped>
.transit-card {
  position: relative;
  flex-shrink: 0;
  width: 330.5px;
  height: 77.23px;
  border: 0;
  padding: 0;
  background: transparent;
  overflow: visible;
  text-align: left;
  font-family: 'PingFang SC', sans-serif;
  color: #333;
  cursor: pointer;
  scroll-snap-align: start;
}
.transit-layer {
  position: absolute;
  display: block;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
}
.transit-outline {
  left: -14.5px;
  top: -11.34px;
  width: 363.17px;
  height: 97.77px;
  background-image: url('/zhiyun-mobile-assets/transit-outline.svg');
}
.transit-glow {
  left: 225.5px;
  top: 7.23px;
  width: 100px;
  height: 70px;
  background-image: url('/zhiyun-mobile-assets/transit-glow.svg');
}
.transit-surface {
  left: -0.75px;
  top: 5.23px;
  width: 324.17px;
  height: 62.77px;
  background-image: url('/zhiyun-mobile-assets/transit-surface.svg');
}
.transit-border {
  left: 0;
  top: 6.73px;
  width: 322.67px;
  height: 61.27px;
  background-image: url('/zhiyun-mobile-assets/transit-border.svg');
}
.transit-watermark {
  left: 98.31px;
  top: 9.67px;
  width: 211.36px;
  height: 17.13px;
  background-image: url('/zhiyun-mobile-assets/transit-watermark.svg');
}
.transit-avatar-panel {
  left: 247.88px;
  top: 0;
  width: 70.92px;
  height: 67.25px;
  background-image: url('/zhiyun-mobile-assets/transit-avatar-panel.svg');
}
.transit-copy {
  position: absolute;
  left: 14.5px;
  top: 14px;
  width: 220px;
  z-index: 2;
}
.transit-title {
  margin: 0;
  font-size: 15px;
  line-height: 18px;
  font-weight: 600;
  color: #252b3a;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.transit-title b {
  color: #3a65ff;
  font-weight: 500;
}
.transit-status {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  line-height: 14px;
  font-weight: 500;
  color: #3a65ff;
  background: #e8efff;
}
.transit-status-abnormal {
  color: #e15b3a;
  background: #ffede6;
}
.transit-meta-line {
  margin: 3px 0 0;
  font-size: 10.5px;
  line-height: 14px;
  font-weight: 500;
  color: #4a5263;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.transit-meta-abnormal {
  color: #e15b3a;
}
.transit-deadline-inline {
  margin-left: 6px;
  color: #4a5263;
}
.transit-action {
  margin-left: 0;
  color: #3a65ff;
  font-weight: 600;
}
.transit-mascot {
  position: absolute;
  left: 232.5px;
  top: -4.5px;
  display: block;
  width: 90px;
  height: 71.5px;
  overflow: hidden;
  border-radius: 8.5px;
  z-index: 3;
  pointer-events: none;
}
.transit-mascot-image {
  position: absolute;
  left: -7px;
  top: -12.5px;
  display: block;
  width: 122.5px;
  height: 122.5px;
  transform: rotateY(180deg);
  background: url('/zhiyun-mobile-assets/transit-mascot-source.png') no-repeat center / cover;
}


</style>
