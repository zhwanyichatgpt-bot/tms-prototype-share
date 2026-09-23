<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['view-mode-change'])

const activeViewMode = ref('multimodal')
const legendStates = ref({
  inTransit: true,
  toLoad: true,
  unloaded: true,
})
</script>

<template>
  <div class="waybill-map-col">
    <!-- 地图底图与城市网格 -->
    <div class="map-inner-stage">
      <div class="map-real-canvas">
        <!-- 城市地名标注点 -->
        <div class="map-city-mark p-zhengzhou"><span class="c-dot" />郑州</div>
        <div class="map-city-mark p-luoyang"><span class="c-dot" />洛阳</div>
        <div class="map-city-mark p-xuchang"><span class="c-dot" />许昌</div>
        <div class="map-city-mark p-zhoukou"><span class="c-dot" />周口</div>
        <div class="map-city-mark p-bozhou"><span class="c-dot" />亳州</div>
        <div class="map-city-mark p-lianyungang"><span class="c-dot" />连云港</div>
        <div class="map-city-mark p-huaian"><span class="c-dot" />淮安</div>
        <div class="map-city-mark p-yangzhou"><span class="c-dot" />扬州</div>
        <div class="map-city-mark p-zhenjiang"><span class="c-dot" />镇江</div>
        <div class="map-city-mark p-nanjing"><span class="c-dot" />南京</div>
        <div class="map-city-mark p-hefei"><span class="c-dot" />合肥</div>
        <div class="map-city-mark p-liuan"><span class="c-dot" />六安</div>
        <div class="map-city-mark p-wuhu"><span class="c-dot" />芜湖</div>
        <div class="map-city-mark p-chizhou"><span class="c-dot" />池州</div>
        <div class="map-city-mark p-tongling"><span class="c-dot" />铜陵</div>
        <div class="map-city-mark p-anqing"><span class="c-dot" />安庆</div>
        <div class="map-city-mark p-wuhan"><span class="c-dot" />武汉</div>
        <div class="map-city-mark p-huangshi"><span class="c-dot" />黄石</div>
        <div class="map-city-mark p-xianning"><span class="c-dot" />咸宁</div>
        <div class="map-city-mark p-jingdezhen"><span class="c-dot" />景德镇</div>
        <div class="map-city-mark p-huangshan"><span class="c-dot" />黄山</div>
        <div class="map-city-mark p-quzhou"><span class="c-dot" />衢州</div>
      </div>

      <!-- SVG 联运路线矢量图 -->
      <svg class="map-routes-svg" viewBox="0 0 652 751" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 1. 汽运段（草绿实线）: 阜阳站到鑫淮港口 -->
        <path
          d="M 175 220 L 185 260 L 260 236 L 318 206"
          stroke="#80d148"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- 2. 水运段（蔚蓝实线）: 鑫淮港口沿长江水路到水转铁枢纽 -->
        <path
          d="M 318 206 L 380 228 L 450 250 L 440 325 L 380 365 L 328 375"
          stroke="#3a84ff"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- 3. 铁路段（黑白双轨线）: 水转铁枢纽到九江站 -->
        <path
          d="M 328 375 L 320 435 L 282 505 L 250 565"
          stroke="#ffffff"
          stroke-width="6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M 328 375 L 320 435 L 282 505 L 250 565"
          stroke="#5c6068"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="6 6"
        />
      </svg>

      <!-- 节点标记与卡片浮层 -->
      <div class="map-overlay-layer">
        <!-- 阜阳站 -->
        <div class="map-pin pin-fuyang">
          <span class="pin-badge load-badge">装</span>
          <span class="pin-label">阜阳站</span>
        </div>

        <!-- 鑫淮港口浮层 -->
        <div class="map-popup-port">
          <div class="port-popup-header">
            <span class="port-name">鑫淮港口</span>
            <span class="port-tag tag-transfer">公转水</span>
            <span class="port-tag tag-bulk">散改集</span>
          </div>
          <div class="port-time-row">汽运装货时间：2024-9-3 12:00</div>
          <div class="port-time-row">水运装货时间：2024-9-3 12:00</div>
          <div class="port-cargo-grid">
            <div class="port-cargo-item">玉米：30吨</div>
            <div class="port-cargo-item">玉米：30吨</div>
            <div class="port-cargo-item full-row">集装箱：20GP | 30吨</div>
            <div class="port-cargo-item full-row">集装箱：40GP | 30吨</div>
          </div>
        </div>

        <!-- 水转铁节点 -->
        <div class="map-node-capsule node-transfer">
          <span>水转铁 | 集装箱</span>
        </div>

        <!-- 九江站 -->
        <div class="map-pin pin-jiujiang">
          <span class="pin-badge unload-badge">卸</span>
          <span class="pin-label">九江站</span>
        </div>

        <!-- 右下角警示图标 -->
        <div class="map-alert-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5L22 20.5H2L12 2.5Z" fill="#ff4d4f" fill-opacity="0.2" stroke="#ff4d4f" stroke-width="1.4" stroke-linejoin="round" />
            <path d="M12 8.5V14M12 17.5H12.01" stroke="#ff4d4f" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <!-- 底部图例开关 -->
      <div class="map-bottom-legend">
        <label class="legend-switch">
          <input type="checkbox" v-model="legendStates.inTransit" />
          <span class="switch-bullet" />
          <span class="switch-text">在途货品</span>
        </label>
        <label class="legend-switch">
          <input type="checkbox" v-model="legendStates.toLoad" />
          <span class="switch-bullet" />
          <span class="switch-text">待装货货品</span>
        </label>
        <label class="legend-switch">
          <input type="checkbox" v-model="legendStates.unloaded" />
          <span class="switch-bullet" />
          <span class="switch-text">已卸货货品</span>
        </label>
      </div>
    </div>
  </div>
</template>
