<script setup>
import { useDispatchMode } from "../transport-mode.js";
import { computed, ref } from "vue";
import DispatchMap from "./DispatchMap.vue";
import RouteStops from "./RouteStops.vue";
import ProgressBlock from "./ProgressBlock.vue";
import { createRouteStops } from "../mock-data.js";
const labels = useDispatchMode();
const props = defineProps({ record: Object, plans: Array });
defineEmits(["back"]);
const tab = ref("运输路线");
const relatedTab = ref("关联计划");
const expandedTask = ref(0);
const stops = ref(
  (props.record.stops || createRouteStops(labels.value.key).slice(0, 4)).map(
    (stop, index) => ({
      ...stop,
      expanded: index === 0,
      plans: ["", ""],
      loading: ["可口可乐", "百事可乐"],
      unloading: [],
    }),
  ),
);
const tasks = computed(() => {
  if (!props.record.assignment)
    return Array.from({ length: 3 }, (_, index) => ({
      id: `detail-task-${index}`,
      number: `SF222121313321-${index === 0 ? 1 : 2}`,
      enterprise: "福建万维宇宙科技有限公司",
      validity: "2025-12-01~2025-12-30",
      billing: "单位计费 | 按吨数 | 30元/吨",
      progress: 50,
    }));
  return props.record.assignment.flatMap((period) =>
    period.vessels.map((vessel) => ({
      id: vessel.id,
      number:
        props.record.tasks.find((task) => task.owner?.includes(vessel.ship))
          ?.number || vessel.ship,
      enterprise: "福建万维宇宙科技有限公司",
      validity: `${period.start.replace("T", " ")}~${period.end.replace("T", " ")}`,
      billing:
        vessel.billing === "模板计费"
          ? `模板计费 | ${vessel.template}`
          : `单位计费 | ${vessel.condition} | 按${vessel.basis} | ${vessel.unitPrice}元`,
      progress: props.record.progress,
    })),
  );
});
const relatedItems = computed(() => {
  if (relatedTab.value === "关联计划" && props.record.planIds)
    return props.plans
      .filter((plan) => props.record.planIds.includes(plan.id))
      .map((plan) => ({
        id: plan.id,
        title: plan.name,
        enterprise: plan.enterprise,
      }));
  if (relatedTab.value === "关联运输任务" && props.record.assignment)
    return props.record.tasks.map((task) => ({
      id: task.id,
      title: task.number,
      enterprise: task.enterprise,
      kind: task.kind,
    }));
  return Array.from({ length: 8 }, (_, index) => ({
    id: index,
    title:
      relatedTab.value === "关联计划"
        ? labels.value.planName
        : "YT4646464646464",
    enterprise:
      relatedTab.value === "关联计划"
        ? "564546461156 | 至简至一有限公司"
        : "至简至一运输企业",
    kind: index === 1 ? "内部调度" : "委外调度",
  }));
});
function switchTab(value) {
  tab.value = value;
  relatedTab.value = value === "任务信息" ? "关联运输任务" : "关联计划";
}
function toggleStop(id) {
  const stop = stops.value.find((item) => item.id === id);
  stop.expanded = !stop.expanded;
}
</script>

<template>
  <main class="dispatch-detail-view">
    <nav class="dispatch-breadcrumb">
      <button type="button" @click="$emit('back', 'center')">调度中心</button
      ><span>›</span
      ><button type="button" @click="$emit('back', 'records')">调度记录</button
      ><span>›</span><span class="active">调度记录详情</span
      ><button
        type="button"
        class="breadcrumb-back"
        @click="$emit('back', 'records')"
      >
        返回
      </button>
    </nav>
    <div class="detail-content">
      <section class="detail-map-area">
        <DispatchMap kind="detail" />
        <aside class="detail-left-panel">
          <div class="dispatch-tabs">
            <button
              v-for="item in ['运输路线', '任务信息']"
              :key="item"
              type="button"
              :class="{ active: tab === item }"
              @click="switchTab(item)"
            >
              {{ item }}
            </button>
          </div>
          <div class="detail-left-scroll">
            <RouteStops
              v-if="tab === '运输路线'"
              :stops="stops"
              detail
              @toggle="toggleStop"
            />
            <div v-else class="detail-task-cards">
              <article v-for="(task, index) in tasks" :key="task.id">
                <header>
                  任务{{ index + 1 }}：{{ task.number
                  }}<button
                    type="button"
                    class="fold-toggle"
                    :aria-label="`展开任务 ${index + 1}`"
                    @click="expandedTask = expandedTask === index ? -1 : index"
                  >
                    {{ expandedTask === index ? "⌃" : "⌄" }}
                  </button>
                </header>
                <template v-if="expandedTask === index">
                  <div class="task-enterprise">
                    <span>福</span>
                    <div>
                      {{ task.enterprise }}
                      <p>承运有效期：{{ task.validity }}</p>
                    </div>
                  </div>
                  <ProgressBlock task :value="task.progress" />
                  <footer>计费方式：{{ task.billing }}</footer>
                </template>
              </article>
            </div>
          </div>
        </aside>
      </section>
      <aside class="detail-right-panel">
        <section class="detail-record-summary">
          <header>
            调度记录单号：{{ record.number
            }}<span
              class="dispatch-status"
              :class="record.valid ? 'valid' : 'invalid'"
              >{{ record.valid ? "有效" : "无效" }}</span
            >
          </header>
          <p>{{ labels.ownerName }} | 2024-12-29 10:20:32</p>
          <ProgressBlock :value="record.progress" />
        </section>
        <div class="dispatch-tabs detail-related-tabs">
          <button
            v-for="item in ['关联计划', '关联运输任务']"
            :key="item"
            type="button"
            :class="{ active: relatedTab === item }"
            @click="relatedTab = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="detail-related-list">
          <article v-for="item in relatedItems" :key="item.id">
            <header>
              {{ item.title }}<span class="dispatch-status transit">运输中</span
              ><span
                v-if="relatedTab !== '关联计划'"
                class="dispatch-tag"
                :class="item.kind === '内部调度' ? 'mint' : 'slate'"
                >{{ item.kind }}</span
              >
            </header>
            <p>{{ item.enterprise }}</p>
            <p>总数量100件+数量100吨+体积100m³=300</p>
          </article>
        </div>
      </aside>
    </div>
  </main>
</template>
