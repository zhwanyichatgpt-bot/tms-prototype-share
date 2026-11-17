<script setup>
import { useDispatchMode } from "../transport-mode.js";
import { assetRoot } from "../mock-data.js";
const labels = useDispatchMode();
defineProps({
  stops: { type: Array, required: true },
  selectable: Boolean,
  detail: Boolean,
});
defineEmits(["toggle", "select", "reorder"]);
</script>

<template>
  <div
    class="dispatch-route-stops"
    :class="{
      'route-stops--selectable': selectable,
      'route-stops--detail': detail,
    }"
  >
    <div v-for="(stop, index) in stops" :key="stop.id" class="route-stop-row">
      <input
        v-if="selectable"
        type="checkbox"
        :checked="stop.selected"
        :aria-label="`选择地点 ${index + 1}`"
        @change="$emit('select', stop.id)"
      />
      <article
        class="route-stop"
        draggable="true"
        @dragstart="$event.dataTransfer.setData('text/plain', stop.id)"
        @dragover.prevent
        @drop.prevent="
          $emit('reorder', $event.dataTransfer.getData('text/plain'), stop.id)
        "
      >
        <header>
          <span class="stop-square" :class="stop.kind" />
          <span>{{ stop.name }}</span><span
            v-if="stop.network"
            class="network-label"
            >网点</span
          >
          <button
            type="button"
            class="fold-toggle"
            :aria-label="`${stop.expanded ? '收起' : '展开'}地点 ${index + 1}`"
            :aria-expanded="stop.expanded"
            @click="$emit('toggle', stop.id)"
          >
            {{ stop.expanded ? "⌃" : "⌄" }}
          </button>
          <span v-if="selectable" class="drag-handle" aria-hidden="true"
            >⠿</span
          >
        </header>
        <p class="stop-address">{{ stop.address }}</p>
        <div class="stop-times">
          <span>{{ labels.arrival }}：{{ stop.arrival }}</span
          ><span>{{ labels.departure }}：{{ stop.departure }}</span>
        </div>
        <div v-if="stop.expanded" class="stop-expanded">
          <div
            v-for="(plan, planIndex) in stop.plans"
            :key="planIndex"
            class="stop-plan"
          >
            <span class="plan-document"
              ><img :src="`${assetRoot}plan-document.svg`" alt=""
            /></span>
            <div>
              <div>
                {{ stop.planName || labels.planName }}
                <span
                  v-if="!detail"
                  class="dispatch-tag"
                  :class="planIndex ? 'slate' : 'purple'"
                  >{{ plan }}</span
                >
              </div>
              <p>福建万维宇宙科技有限公司</p>
            </div>
          </div>
          <p class="stop-cargo-title">{{ labels.cargoLoading }}</p>
          <div
            v-for="(cargo, cargoIndex) in stop.loading"
            :key="`load-${cargoIndex}`"
            class="stop-cargo-row"
          >
            <span>{{ cargo }}</span><span>{{
              detail
                ? "装货重量(吨)：50/100"
                : "数量 : 10  |  重量 : 0.2吨  |  体积 : 1m³"
            }}</span
            ><span v-if="detail">50%</span>
          </div>
          <template v-if="stop.unloading.length">
            <p class="stop-cargo-title">{{ labels.cargoUnloading }}</p>
            <div
              v-for="(cargo, cargoIndex) in stop.unloading"
              :key="`unload-${cargoIndex}`"
              class="stop-cargo-row"
            >
              <span>{{ cargo }}</span><span
                >数量 : 10 | 重量 : 0.2吨 | 体积 : 1m³</span
              >
            </div>
          </template>
        </div>
      </article>
    </div>
  </div>
</template>
