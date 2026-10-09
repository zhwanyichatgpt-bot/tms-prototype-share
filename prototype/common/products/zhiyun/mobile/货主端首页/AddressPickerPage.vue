<template>
  <div class="ap-page" data-annotation-container="modal" data-annotation-content="modal">
    <!-- 状态栏（与首页一致） -->
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <!-- 顶部导航：返回 + 标题（按装/卸货模式切换） -->
    <div class="ap-nav">
      <button type="button" class="ap-back" @click="$emit('back')" aria-label="返回">
        <svg width="6.5" height="12" viewBox="0 0 13 24" fill="none"><path d="M10.6 1.2L2.4 12L10.6 22.8" stroke="#333" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1 class="ap-title">{{ mode === 'load' ? '请选择装货地' : '请选择卸货地' }}</h1>
    </div>

    <!-- 搜索卡片：Pixso 组 686×104 @32,168 -->
    <div class="ap-search-card">
      <div class="ap-search-field">
        <svg class="ap-search-icon" width="8.5" height="8.5" viewBox="0 0 17 17" fill="none"><circle cx="7" cy="7" r="5.4" stroke="#3A65FF" stroke-width="1.6"/><path d="M11.4 11.4L15.6 15.6" stroke="#3A65FF" stroke-width="1.6" stroke-linecap="round"/></svg>
        <input
          class="ap-search-input"
          type="text"
          placeholder="请输入装货地或卸货地"
          v-model="keyword"
        />
      </div>
    </div>

    <!-- 快捷操作卡片：我的位置 | 地图选点 -->
    <div class="ap-quick-card">
      <button type="button" class="ap-quick-btn" @click="selectCurrent">我的位置</button>
      <span class="ap-quick-divider" aria-hidden="true"></span>
      <button type="button" class="ap-quick-btn" @click="selectFromMap">地图选点</button>
    </div>

    <!-- 地址列表卡片 -->
    <div class="ap-list-card annot-zhiyunShipperHome-action-address-confirm">
      <button v-if="keyword.trim() && !filteredList.some((item) => item.name === keyword.trim())" type="button" class="ap-item ap-custom-item" @click="selected = { name: keyword.trim(), detail: '' }">
        <span class="ap-item-main"><span class="ap-item-name">使用“{{ keyword.trim() }}”作为地址</span><span class="ap-item-detail">确认后补充详细地址和联系人</span></span>
      </button>
      <button
        v-for="item in filteredList"
        :key="item.name"
        type="button"
        class="ap-item"
        :class="{ 'ap-item-active': selected && selected.name === item.name }"
        @click="selected = item"
      >
        <span class="ap-item-icon" aria-hidden="true">
          <svg width="9" height="10.5" viewBox="0 0 18 21" fill="none"><path d="M9 1.2C4.9 1.2 1.6 4.5 1.6 8.6C1.6 13.2 7.2 18.4 8.5 19.5C8.8 19.8 9.2 19.8 9.5 19.5C10.8 18.4 16.4 13.2 16.4 8.6C16.4 4.5 13.1 1.2 9 1.2Z" fill="#3A65FF"/><circle cx="9" cy="8.4" r="2.6" fill="#fff"/></svg>
        </span>
        <span class="ap-item-main">
          <span class="ap-item-name">
            {{ item.name }}
            <span v-if="item.preset" class="ap-item-tag">常用装货点</span>
          </span>
          <span class="ap-item-detail">{{ item.detail }}</span>
        </span>
      </button>
    </div>

    <!-- 底部操作条：设置别名 | 确认地址 -->
    <div class="ap-bottom">
      <button type="button" class="ap-btn-alias" @click="$emit('set-alias')">设置别名</button>
      <button
        type="button"
        class="ap-btn-confirm"
        :disabled="!selected"
        @click="confirm"
      >确认地址</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'load' }, // load | unload
})

const emit = defineEmits(['back', 'confirm', 'set-alias'])

const keyword = ref('')
const selected = ref(null)

// 附近地址（Pixso 重复网格 322 内容）+ 常用装货点置顶
const loadNearbyList = [
  { name: '福州市·江上图首府叁号', detail: '常用装货点 · 榕城江上图', preset: true },
  { name: '福建医科大学附属口腔医院', detail: '杨桥中路246号(陆庄地铁站B口步行290米)' },
  { name: '光明港公园', detail: '远洋路153号' },
  { name: '福州山姆超市有限公司', detail: '南江滨东大道与彭岐一巷交叉口西侧' },
  { name: '宜家福州商场', detail: '福马路788号(上洋地铁站E2口步行260米)' },
  { name: '三坊七巷', detail: '鼓楼区南后街东侧' },
  { name: '福州火车南站', detail: '仓山区城门镇永南路' },
  { name: '福州奥林匹克体育中心', detail: '仓山区建新镇福湾路' },
  { name: '青口东南汽车城', detail: '闽侯县青口镇东南大道' },
  { name: '江阴港城经济区', detail: '福清市江阴镇江阴港' },
  { name: '可门港物流园区', detail: '连江县可门港区' },
  { name: '罗源湾港区', detail: '罗源县碧里乡将军帽' },
  { name: '元洪投资区', detail: '福清市城头镇元洪路' },
  { name: '华能福州电厂', detail: '长乐区航城街道湖东路' },
  { name: '闽江口工业区', detail: '马尾区琅岐镇' },
  { name: '中亭街五金机电市场', detail: '台江区中亭街' },
]
const unloadNearbyList = [
  { name: '厦门市·江上图首府叁号', detail: '厦门市海沧区江上图首府叁号' },
  { name: '厦门海沧港区', detail: '厦门市海沧区港南路' },
  { name: '厦门象屿保税区', detail: '厦门市湖里区象屿路' },
  { name: '厦门集美物流园', detail: '厦门市集美区锦园西路' },
]
const nearbyList = computed(() => props.mode === 'unload' ? unloadNearbyList : loadNearbyList)

const filteredList = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return nearbyList.value
  return nearbyList.value.filter(
    (i) => i.name.includes(kw) || i.detail.includes(kw)
  )
})

const selectCurrent = () => {
  selected.value = nearbyList.value[0]
}

const selectFromMap = () => {
  // 地图选点：仅保留入口，不展开地图页面
  selected.value = null
}

const confirm = () => {
  if (selected.value) emit('confirm', { ...selected.value, mode: props.mode })
}
</script>

<style scoped>
/* Pixso 7:1129 选择吊运起点 @750 → @375 半分 */
.ap-page {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: linear-gradient(180deg, #e6edfa 0%, #eef0f5 240px, #eef0f5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 状态栏：与首页一致 */
.status-bar {
  height: 60px;
  padding: 16px 14.5px 0 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
}
.status-time {
  font-size: 15px;
  font-weight: 600;
  color: #0c0c0c;
  letter-spacing: 0.3px;
}
.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}
.battery {
  position: relative;
  display: inline-block;
  width: 22.8px;
  height: 11.75px;
  box-sizing: border-box;
  border: 2px solid rgba(12, 12, 12, 0.35);
  border-radius: 1.5px;
}
.battery::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #0c0c0c;
  border-radius: 0.7px;
}
.battery::after {
  content: '';
  position: absolute;
  top: 1.8px;
  right: -3.4px;
  width: 1.4px;
  height: 4.15px;
  background: rgba(12, 12, 12, 0.35);
  border-radius: 0.7px;
}

/* 顶部导航：返回箭头 13×24@32,119 → 6.5×12 @16,59.5；标题 32号#333 @66,116 */
.ap-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: 30px;
  margin-top: 0;
}
.ap-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.ap-title {
  margin: 0;
  font-size: 16px;
  line-height: 21px;
  font-weight: 400;
  color: #333;
}

/* 搜索卡片：白底 686×104 @32,168 → 343×52 @16,84 */
.ap-search-card {
  flex-shrink: 0;
  margin: 25px 16px 0;
  height: 52px;
  background: #fff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  box-sizing: border-box;
}
.ap-search-field {
  flex: 1;
  height: 40px;
  background: #f5f6fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12.5px;
  box-sizing: border-box;
}
.ap-search-icon {
  flex-shrink: 0;
}
.ap-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  line-height: 21px;
  font-weight: 400;
  color: #333;
}
.ap-search-input::placeholder {
  color: #c9c9c9;
}

/* 快捷操作卡片：686×104 @32,288 → 343×52 @16,144 */
.ap-quick-card {
  flex-shrink: 0;
  margin: 8px 16px 0;
  height: 52px;
  background: #fff;
  border-radius: 16px;
  display: flex;
  align-items: center;
}
.ap-quick-btn {
  flex: 1;
  height: 100%;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 18.5px;
  font-weight: 400;
  color: #333;
  cursor: pointer;
}
.ap-quick-btn:active {
  opacity: 0.6;
}
.ap-quick-divider {
  width: 0.5px;
  height: 32px;
  background: #cdcdcd;
  flex-shrink: 0;
}

/* 地址列表卡片：686×1168 @32,412 → 343 高度撑满到底部操作条 */
.ap-list-card {
  flex: 1;
  margin: 8px 16px 0;
  background: #fff;
  border-radius: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 11px 0 12px;
  box-sizing: border-box;
  min-height: 0;
}
.ap-list-card::-webkit-scrollbar {
  display: none;
}
.ap-item {
  display: flex;
  align-items: flex-start;
  gap: 8.5px;
  width: 100%;
  padding: 7px 15px;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
}
.ap-item:active {
  background: #f5f7fb;
}
.ap-custom-item { border-bottom: 1px solid #eef2f6; }
.ap-item-active {
  background: #f0f5ff;
}
.ap-item-icon {
  flex-shrink: 0;
  display: inline-flex;
  margin-top: 2px;
  transform: scale(0.85);
  transform-origin: left top;
}
.ap-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5px;
}
.ap-item-name {
  font-size: 12.5px;
  line-height: 17px;
  font-weight: 400;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-item-active .ap-item-name {
  color: #1e4df6;
  font-weight: 600;
}
.ap-item-tag {
  flex-shrink: 0;
  font-size: 8.5px;
  line-height: 12px;
  font-weight: 400;
  color: #3974d8;
  background: #e8f1ff;
  border-radius: 6px;
  padding: 0.5px 5.5px;
}
.ap-item-detail {
  font-size: 9.5px;
  line-height: 13px;
  font-weight: 400;
  color: #333;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部操作条：组 80380 @0,1437 → 93.5 高；按钮 y1460 → 730 */
.ap-bottom {
  flex-shrink: 0;
  height: 93.5px;
  background: #fff;
  box-shadow: 0 -4px 20px rgba(120, 140, 180, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 11.5px;
  padding: 11.5px 23px 0;
  box-sizing: border-box;
}
.ap-btn-alias {
  width: 110.5px;
  height: 50px;
  flex-shrink: 0;
  border: 1px solid #e3e7ef;
  border-radius: 25px;
  background: #fff;
  color: #333;
  font-family: inherit;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
}
.ap-btn-alias:active {
  background: #f5f7fb;
}
.ap-btn-confirm {
  flex: 1;
  height: 50px;
  border: 0;
  border-radius: 25px;
  background: linear-gradient(93deg, #5c8bfe 0%, #1e4df6 100%);
  color: #fff;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
}
.ap-btn-confirm:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>
