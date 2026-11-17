<script setup>
import { useDispatchMode } from "../transport-mode.js";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { assetRoot, mapPoints } from "../mock-data.js";

const labels = useDispatchMode();
const props = defineProps({
  kind: { type: String, default: "plan" },
  showUnselected: { type: Boolean, default: true },
  routeStops: { type: Array, default: () => [] },
  focusedPlan: { type: Object, default: null },
});
const isRoad = computed(() => labels.value.key === "road");
const zoom = ref(1);
const mapElement = ref(null);
const mapSize = ref({ width: 0, height: 0 });
const designSizes = {
  plan: [400, 536],
  record: [488, 250],
  planning: [1127, 930],
  detail: [1357, 757],
};
const sceneStyle = computed(() => {
  const [width, height] = designSizes[props.kind];
  const scaleX = mapSize.value.width / width || 1;
  const scaleY = mapSize.value.height / height || 1;
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(${scaleX * zoom.value}, ${scaleY * zoom.value})`,
  };
});
let observer;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    mapSize.value = { width, height };
  });
  observer.observe(mapElement.value);
});
onUnmounted(() => observer?.disconnect());
const activePoint = ref(0);
const strategy = ref("最快捷");
const mapNames = {
  plan: "plan-map.png",
  record: "record-map.png",
  planning: "route-map.png",
  detail: "detail-map.png",
};
const points = computed(() => {
  if (isRoad.value && props.kind === "planning" && props.routeStops.some((stop) => stop.planId)) {
    return props.routeStops.map((stop) => [
      ...stop.mapPosition,
      stop.selected ? stop.kind : stop.kind === "unload" ? "inactive-unload" : "inactive",
    ]);
  }
  return mapPoints[props.kind];
});
const tipVisible = ref(true);
const changedRoute = computed(
  () =>
    props.kind === "planning" &&
    props.routeStops.length > 0 &&
    props.routeStops
      .filter((stop) => stop.selected)
      .map((stop) => stop.routeOrder)
      .join(",") !== "0,1,2,3,4",
);
const routeLine = computed(() =>
  props.routeStops
    .filter((stop) => stop.selected)
    .map((stop) => `${stop.mapPosition[0] + 15},${stop.mapPosition[1] + 25}`)
    .join(" "),
);

const routeViewBoxes = {
  planning: "0 0 1127 930",
  record: "0 0 488 250",
  detail: "0 0 1357 757",
};
const roadRouteLine = computed(() => {
  const names =
    props.kind === "record"
      ? [0, 4, 1, 3, 5, 2]
      : [13, 1, 8, 14, 9, 7, 11, 6, 10, 12];
  return names
    .map((index) => {
      const [x, y] = points.value[index];
      return `${x + 15},${y + 24}`;
    })
    .join(" ");
});

function selectPoint(index) {
  tipVisible.value = !tipVisible.value || activePoint.value !== index;
  activePoint.value = index;
}
function focusPoint(index) {
  activePoint.value = index % points.value.length;
  tipVisible.value = true;
}
defineExpose({ focusPoint });
</script>

<template>
  <div
    ref="mapElement"
    class="dispatch-map"
    :class="[`dispatch-map--${kind}`, { 'dispatch-map--road': isRoad }]"
    aria-label="运输路线地图"
  >
    <div class="map-window">
      <div class="map-scene" :style="sceneStyle">
        <img
          class="map-background"
          :src="assetRoot + mapNames[kind]"
          alt="福州运输路线底图"
          draggable="false"
        />
        <img
          v-if="kind !== 'plan' && !changedRoute && !isRoad"
          class="map-route"
          :src="`${assetRoot}${kind === 'planning' ? 'planning-route' : kind === 'detail' ? 'detail-route' : 'record-route'}.svg`"
          alt=""
        />
        <svg
          v-if="changedRoute || (isRoad && kind !== 'plan')"
          class="map-dynamic-route"
          :viewBox="routeViewBoxes[kind]"
          aria-label="所选地点路线"
        >
          <polyline
            :points="isRoad && kind !== 'planning' ? roadRouteLine : routeLine"
            fill="none"
            stroke="#3a65ff"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <button
          v-for="(point, index) in points"
          v-show="showUnselected || !point[2].startsWith('inactive')"
          :key="index"
          type="button"
          class="map-marker"
          :style="{ left: `${point[0]}px`, top: `${point[1]}px` }"
          :aria-label="`${point[2] === 'load' ? '装货' : point[2] === 'unload' ? '卸货' : '途经'}地点 ${index + 1}`"
          @click="selectPoint(index)"
        >
          <img :src="`${assetRoot}pin-${point[2]}.svg`" alt="" />
          <span v-if="point[3]" class="map-distance">{{ point[3] }}</span>
        </button>
        <template v-if="kind === 'detail'">
          <img
            class="map-ship map-ship--first"
            :class="{ 'map-vehicle': isRoad }"
            :src="labels.marker"
            :alt="`在途${labels.asset}`"
          />
          <img
            class="map-ship map-ship--second"
            :class="{ 'map-vehicle': isRoad }"
            :src="labels.marker"
            :alt="`在途${labels.asset}`"
          />
        </template>
        <div v-if="kind === 'record'" class="record-map-distances">
          <span>20.14 公里</span><span>32.14 公里</span><span>48.14 公里</span
          ><span>54.24 公里</span><span>80.24 公里</span>
        </div>
      </div>
    </div>

    <div
      v-if="tipVisible && kind !== 'planning'"
      class="map-plan-popover"
      :class="`map-plan-popover--${kind}`"
    >
      <div>
        {{ focusedPlan?.name || (isRoad ? labels.planName : "这里是计划名称") }}
      </div>
      <p>福建万维宇宙科技有限公司</p>
      <p>
        {{
          kind === "detail"
            ? `${labels.arrival}：2023-12-14 00:00`
            : "装货：2024-4-3 12:00"
        }}
      </p>
      <p v-if="kind === 'detail'">{{ labels.departure }}：2023-12-14 00:00</p>
      <div class="map-cargo">
        <span v-for="index in 4" :key="index">玉米：30吨</span>
      </div>
    </div>
    <div v-if="kind === 'detail' && tipVisible" class="map-ship-popover">
      <div>{{ labels.mapNumber }} <span>30元/吨</span></div>
      <p>运单号：251452154574857</p>
      <p>{{ labels.owner }}：{{ labels.ownerName }} | 17811112222</p>
      <div class="map-cargo">
        <span>玉米：30吨</span><span>玉米：30吨</span>
      </div>
    </div>
    <div v-if="kind === 'plan'" class="map-zoom-controls">
      <img :src="`${assetRoot}map-tools.svg`" alt="" />
      <button type="button" aria-label="地图复位" @click="zoom = 1"></button>
      <button
        type="button"
        aria-label="放大地图"
        @click="zoom = Math.min(zoom + 0.1, 1.8)"
      ></button>
      <button
        type="button"
        aria-label="缩小地图"
        @click="zoom = Math.max(zoom - 0.1, 0.7)"
      ></button>
      <button
        type="button"
        aria-label="恢复地图范围"
        @click="zoom = 1"
      ></button>
    </div>
    <div
      v-if="kind === 'planning'"
      class="route-strategies"
      role="tablist"
      aria-label="路线偏好"
    >
      <button
        v-for="item in ['最快捷', '最省钱', '距离最短', '实时路况']"
        :key="item"
        type="button"
        role="tab"
        :aria-selected="strategy === item"
        :class="{ active: strategy === item }"
        @click="strategy = item"
      >
        {{ item }}
      </button>
    </div>
    <div v-if="kind === 'detail'" class="map-summary">
      <span>◉ 途径点&nbsp; 8</span><span>合计公里数&nbsp; 73.68 km</span
      ><span>▣ 货品&nbsp; 2</span><span>▤ 运单&nbsp; 3</span
      ><span>在途{{ labels.asset }}&nbsp; 3</span>
    </div>
  </div>
</template>
