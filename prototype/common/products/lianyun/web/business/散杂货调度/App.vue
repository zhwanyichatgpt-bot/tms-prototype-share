<script setup>
import { computed, provide, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import { TmsWebShell } from "../../../../../shared/web/tms-web-shell/index.js";
import DispatchCenter from "./components/DispatchCenter.vue";
import DispatchRecords from "./components/DispatchRecords.vue";
import DispatchDetail from "./components/DispatchDetail.vue";
import DispatchWizard from "./components/DispatchWizard.vue";
import VesselAssignments from "./components/VesselAssignments.vue";
import {
  assetRoot,
  createPlans,
  createRecords,
  createRouteStops,
  createRoadPlanStops,
  getRoadBillingSegments,
  createPeriods,
  createVessel,
} from "./mock-data.js";
import { dispatchModeKey, transportModes } from "./transport-mode.js";
import "./dispatch.css";

const wizard = ref(null);
const assignmentOrigin = ref("center");
const screen = ref("center");
const mode = ref(useRoute().query.mode === "road" ? "road" : "water");
const labels = computed(() => transportModes[mode.value]);
provide(dispatchModeKey, labels);
const stateByMode = reactive(
  Object.fromEntries(
    Object.keys(transportModes).map((key) => [
      key,
      {
        plans: createPlans(key),
        records: createRecords(key === "water" ? 4433 : 24, key),
        selectedPlans: key === "water" ? ["water-plan-1", "water-plan-4"] : [],
        recordsPage: 2,
      },
    ]),
  ),
);
const currentState = computed(() => stateByMode[mode.value]);
const plans = computed(() => currentState.value.plans);
const records = computed(() => currentState.value.records);
const selectedPlans = computed({
  get: () => currentState.value.selectedPlans,
  set: (value) => (currentState.value.selectedPlans = value),
});
const activeRecord = ref(null);
const stops = ref([]);
const billingScope = ref("trip");
const roadSegments = computed(() => mode.value === "road" ? getRoadBillingSegments(stops.value, plans.value) : []);
const roadSegmentsComplete = computed(() => roadSegments.value.length > 0 &&
  roadSegments.value.length * 2 === stops.value.filter((stop) => stop.selected).length);
const periods = ref([]);
const assignmentOpen = ref(false);
const tableMode = ref(false);
const wizardStep = ref("route");
const editRecordId = ref(null);
const taskCodes = new Map();
const navItems = [
  {
    key: "dispatch",
    label: "调度中心",
    left: 20,
    top: 296,
    width: 32,
    height: 117,
    imgs: [
      { src: `${assetRoot}side-navigation.svg`, x: 0, y: 0, w: 32, h: 117 },
    ],
  },
];
function togglePlan(id) {
  selectedPlans.value = selectedPlans.value.includes(id)
    ? selectedPlans.value.filter((item) => item !== id)
    : [...selectedPlans.value, id];
}
function selectAll(ids) {
  const allSelected = ids.every((id) => selectedPlans.value.includes(id));
  selectedPlans.value = allSelected
    ? selectedPlans.value.filter((id) => !ids.includes(id))
    : [...new Set([...selectedPlans.value, ...ids])];
}
function startAssignment(record) {
  if (!record && !selectedPlans.value.length)
    return ElMessage.warning("请选择待调度计划");
  assignmentOrigin.value = screen.value;
  editRecordId.value = record?.id || null;
  wizardStep.value = record ? "ship" : "route";
  screen.value = "center";
  assignmentOpen.value = true;
  tableMode.value = false;
  billingScope.value = record?.billingScope ??
    (record?.assignment?.some((period) => period.vessels.some((vessel) => vessel.billingScope === "segment")) ? "segment" : "trip");
  periods.value = record?.assignment
    ? JSON.parse(JSON.stringify(record.assignment))
    : createPeriods(mode.value);
  stops.value = record?.stops
    ? JSON.parse(JSON.stringify(record.stops))
    : mode.value === "road" && (record?.planIds || selectedPlans.value).length
      ? createRoadPlanStops(plans.value.filter((plan) => (record?.planIds || selectedPlans.value).includes(plan.id)))
      : createRouteStops(mode.value);
}
function addAssignmentPlan(id) {
  if (mode.value === "road" && !stops.value.some((stop) => stop.planId === id)) {
    const plan = plans.value.find((item) => item.id === id);
    if (!plan) return;
    const [load, unload] = createRoadPlanStops([plan]);
    const firstUnload = stops.value.findIndex((stop) => stop.kind === "unload");
    stops.value.splice(firstUnload < 0 ? stops.value.length : firstUnload, 0, load);
    stops.value.push(unload);
  }
  selectedPlans.value = [...new Set([...selectedPlans.value, id])];
}
function closeAssignment() {
  screen.value = assignmentOrigin.value;
  assignmentOpen.value = false;
  tableMode.value = false;
}
function returnToMethods() {
  tableMode.value = false;
  wizard.value.goStep("method");
}
function addPeriod() {
  periods.value.push({
    id: crypto.randomUUID(),
    start: "2024-12-10T00:00",
    end: "2024-12-10T23:59",
    vessels: [{ ...createVessel(0, true, mode.value), ship: "", owner: "" }],
  });
}
function removePeriod(id) {
  periods.value = periods.value.filter((period) => period.id !== id);
}
function completeAssignment() {
  const configured = periods.value.filter((period) =>
    period.vessels.some((vessel) => vessel.ship),
  );
  if (!configured.length)
    return ElMessage.warning(`请选择${labels.value.asset}`);
  const segmented = mode.value === "road" && billingScope.value === "segment";
  if (segmented && !roadSegmentsComplete.value)
    return ElMessage.warning("请在规划路线中选全各段的装卸点，并将装货点排在对应卸货点之前");
  if (segmented && roadSegments.value.some((segment) => !segment.rule))
    return ElMessage.warning("部分分段所属计划缺少司机计费规则");
  for (const period of configured) {
    if (!period.start || !period.end || period.end < period.start)
      return ElMessage.warning("请检查承运时间");
    for (const vessel of period.vessels.filter((item) => item.ship)) {
      if (
        [vessel.weight, vessel.volume, vessel.quantity].some(
          (value) =>
            value !== "" &&
            (!Number.isFinite(Number(value)) || Number(value) < 0),
        )
      )
        return ElMessage.warning("最高配载不能为负数");
      if (vessel.quantity !== "" && !Number.isInteger(Number(vessel.quantity)))
        return ElMessage.warning("最高配载数量请输入整数");
      if (!vessel.owner)
        return ElMessage.warning(`请选择${labels.value.ownerField}`);
      if (
        vessel.frequency !== "不限" &&
        (!Number.isInteger(Number(vessel.trips)) || Number(vessel.trips) < 1)
      )
        return ElMessage.warning("请输入有效承运趟数");
      if (!segmented) {
        if (vessel.billing === "模板计费" && !vessel.template)
          return ElMessage.warning("请选择费用模板");
        if (
          vessel.billing === "单位计费" &&
          (!vessel.condition || !vessel.basis || Number(vessel.unitPrice) <= 0)
        ) return ElMessage.warning("请完整设置单位计费方式");
      }
    }
  }
  const assignment = configured.map((period) => ({
    ...period,
    vessels: period.vessels
      .filter((vessel) => vessel.ship)
      .map(({ billingScope: _legacyScope, segmentPricing: _legacyPricing, ...vessel }) => vessel),
  }));
  const editing = records.value.find(
    (record) => record.id === editRecordId.value,
  );
  const taskNumber = Date.now();
  const chosenStops = stops.value.filter((stop) => stop.selected);
  const routePlanIds = [...new Set(chosenStops.map((stop) => stop.planId).filter(Boolean))];
  const assignedPlanIds = mode.value === "road" && routePlanIds.length
    ? routePlanIds
    : [...(editing?.planIds || selectedPlans.value)];
  const pricing = mode.value === "road" ? {
    billingScope: billingScope.value,
    segmentPricing: segmented ? roadSegments.value.map((segment) => ({ ...segment, rule: { ...segment.rule } })) : [],
  } : {};
  const tasks = assignment
    .flatMap((period) => period.vessels)
    .map((vessel, index) => ({
      id: crypto.randomUUID(),
      number: `SF${taskNumber}-${index + 1}`,
      kind: "内部调度",
      owner: `${vessel.owner} | ${vessel.ship}`,
      enterprise: "福建万维宇宙科技有限公司",
      valid: true,
    }));
  if (editing) {
    editing.assignment = assignment;
    Object.assign(editing, pricing);
    editing.tasks = tasks;
    if (mode.value === "road" && routePlanIds.length) editing.planIds = assignedPlanIds;
    editing.stops = JSON.parse(
      JSON.stringify(stops.value.filter((stop) => stop.selected)),
    );
  } else {
    const record = createRecords(1, mode.value)[0];
    record.id = crypto.randomUUID();
    record.number = `YD${Date.now()}`;
    record.listNumber = record.number.replace("YD", "DD");
    record.assignment = assignment;
    Object.assign(record, pricing);
    record.planIds = assignedPlanIds;
    record.stops = JSON.parse(
      JSON.stringify(stops.value.filter((stop) => stop.selected)),
    );
    record.progress = 0;
    record.tasks = tasks;
    record.created = new Date().toLocaleString("sv-SE");
    records.value.unshift(record);
    plans.value.forEach((plan) => {
      if (assignedPlanIds.includes(plan.id)) plan.status = "执行中";
    });
    selectedPlans.value = [];
  }
  closeAssignment();
  currentState.value.recordsPage = 1;
  screen.value = "records";
  ElMessage.success(editing ? "调度指派已更新" : "调度指派已完成");
}
function showDetail(record) {
  activeRecord.value = record;
  screen.value = "detail";
}
function invalidate(record) {
  record.valid = false;
  record.tasks.forEach((task) => (task.valid = false));
  ElMessage.success("调度记录已作废");
}
async function shareTask(config) {
  const key = JSON.stringify({ plans: selectedPlans.value, config });
  if (!taskCodes.has(key)) taskCodes.set(key, `DD${Date.now()}`);
  const code = taskCodes.get(key);
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success(`任务码 ${code} 已生成并复制`);
  } catch {
    ElMessage.success(`任务码已生成：${code}`);
  }
}
</script>

<template>
  <div class="bulk-dispatch-viewport">
    <div class="bulk-dispatch-stage" :data-transport-mode="mode">
      <TmsWebShell
        variant="business"
        site-name="楹联集运站"
        organization-name="企业名称企业名称企业企业名称..."
        date-text="2022 年 05 月 27 日"
        weather-text="24℃ 多云"
        fluid
        :tabs="[{ key: 'dispatch', label: '调度中心' }]"
        active-tab-key="dispatch"
        :nav-items="navItems"
        active-nav="dispatch"
        @go-workbench="screen = 'center'"
        @switch-tab="screen = 'center'"
        @close-tab="screen = 'center'"
        @navigate="screen = 'center'"
      >
        <template #logo
          ><img :src="`${assetRoot}brand.svg`" alt="至简集运"
        /></template>
        <template #avatar
          ><img :src="`${assetRoot}avatar.png`" alt="企业头像"
        /></template>
        <template #home-icon
          ><img :src="`${assetRoot}home-grid.svg`" alt=""
        /></template>
        <template #weather-icon
          ><img :src="`${assetRoot}weather.svg`" alt=""
        /></template>
        <template #actions
          ><span class="dispatch-header-divider" /><img
            v-for="name in ['archive', 'notification', 'settings']"
            :key="name"
            :src="`${assetRoot}${name}.svg`"
            alt=""
        /></template>
        <template v-if="tableMode">
          <main class="dispatch-full-assignment">
            <nav class="dispatch-breadcrumb">
              <button type="button" @click="tableMode = false">调度方式</button
              ><span>›</span><span class="active">调度指派</span
              ><button
                type="button"
                class="breadcrumb-back"
                @click="tableMode = false"
              >
                查看地图
              </button>
            </nav>
            <nav class="dispatch-steps">
              <button type="button" @click="tableMode = false">
                <img
                  :src="`${assetRoot}route-step.svg`"
                  alt=""
                />规划路线</button
              ><i class="complete" /><button
                type="button"
                @click="tableMode = false"
              >
                <img :src="`${assetRoot}method-step.svg`" alt="" />调度方式
              </button>
            </nav>
            <div class="full-assignment-heading">
              <h2>{{ labels.asset }}指派</h2>
              <button
                type="button"
                class="dispatch-primary small"
                @click="addPeriod"
              >
                添加时段
              </button>
            </div>
            <div class="full-assignment-scroll">
              <VesselAssignments
                :periods="periods"
                v-model:billing-scope="billingScope"
                table
                @add-period="addPeriod"
                @remove-period="removePeriod"
              />
            </div>
            <footer class="full-assignment-footer">
              <button type="button" @click="tableMode = false">上一步</button
              ><button
                type="button"
                class="dispatch-primary"
                @click="completeAssignment"
              >
                确认
              </button>
            </footer>
          </main>
        </template>
        <DispatchCenter
          v-else-if="screen === 'center'"
          :key="mode"
          :mode="mode"
          :plans="plans"
          :records="records.slice(0, 10)"
          :selected-plans="selectedPlans"
          @update:mode="mode = $event"
          @select-plan="togglePlan"
          @select-all="selectAll"
          @assign="startAssignment()"
          @records="screen = 'records'"
          @detail="showDetail"
          @edit="startAssignment"
          @invalidate="invalidate"
        />
        <DispatchRecords
          :initial-page="currentState.recordsPage"
          v-else-if="screen === 'records'"
          :records="records"
          @back="screen = 'center'"
          @detail="showDetail"
          @assign="startAssignment"
          @edit="startAssignment"
          @invalidate="invalidate"
        />
        <DispatchDetail
          v-else
          :record="activeRecord"
          :plans="plans"
          @back="screen = $event"
        />
      </TmsWebShell>
      <DispatchWizard
        ref="wizard"
        :annotation-active="!tableMode"
        v-if="assignmentOpen"
        v-show="!tableMode"
        :stops="stops"
        :periods="periods"
        v-model:billing-scope="billingScope"
        :plans="plans.filter((plan) => plan.status === '待执行')"
        :initial-step="wizardStep"
        @close="closeAssignment"
        @collapse-map="tableMode = true"
        @complete="completeAssignment"
        @add-period="addPeriod"
        @remove-period="removePeriod"
        @step-change="wizardStep = $event"
        @share="shareTask"
        @add-plan="addAssignmentPlan"
      />
    </div>
  </div>
</template>
