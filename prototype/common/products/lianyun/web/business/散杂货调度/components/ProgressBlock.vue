<script setup>
import { assetRoot } from "../mock-data.js";
defineProps({ value: { type: Number, default: 50 }, task: Boolean });
</script>

<template>
  <div class="dispatch-progress-block">
    <div v-if="task" class="progress-title">装卸进度</div>
    <div class="progress-loaded">
      <img :src="`${assetRoot}pin-load.svg`" alt="" />
      <span>{{
        value === 0
          ? "已装 0吨  |  0m³  |  0件"
          : task
            ? "已装 100吨  |  1500m³  |  50件"
            : "已装 75 （数量50件+重量25吨）"
      }}</span>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="装卸进度"
    >
      <div :style="{ width: `${value}%` }" />
      <span :style="{ left: `${value}%` }">{{ value }}%</span>
    </div>
    <p>
      {{
        task
          ? "总量：100吨  |  1500m³  |  50件"
          : "总量300=数量100件+重量100吨+体积100m³"
      }}
    </p>
  </div>
</template>
