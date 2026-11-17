<script setup>
import { useDispatchMode } from "../transport-mode.js";
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import DispatchMap from "./DispatchMap.vue";
import RouteStops from "./RouteStops.vue";
import VesselAssignments from "./VesselAssignments.vue";
import { assetRoot } from "../mock-data.js";

const labels = useDispatchMode();
const props = defineProps({
  annotationActive: { type: Boolean, default: true },
  stops: Array,
  periods: Array,
  initialStep: { type: String, default: "route" },
  plans: Array,
});
const dispatchMethods = [
  {
    key: "department",
    title: "分配运输部门",
    description: "前往设置",
    disabled: true,
  },
  {
    key: "carrier",
    title: "委派承运商",
    description: "前往设置",
    disabled: true,
  },
  {
    key: "direct",
    title: "直接指派",
    description: "前往设置",
    step: "ship",
  },
  {
    key: "share",
    title: "分享任务码",
    description: "扫码自主接单",
    step: "share",
  },
];
const emit = defineEmits([
  "close",
  "collapse-map",
  "complete",
  "add-period",
  "remove-period",
  "step-change",
  "share",
  "add-plan",
]);
const step = ref(props.initialStep);
const billingScope = defineModel("billingScope", { type: String, default: "trip" });
const showUnselected = ref(true);
const share = reactive({
  billing: "模板计费",
  template: "",
  condition: "",
  basis: "",
  price: "",
});
const selectedStops = computed(
  () => props.stops.filter((stop) => stop.selected).length,
);
const allSelected = computed(() => props.stops.every((stop) => stop.selected));

function goStep(value) {
  step.value = value;
  emit("step-change", value);
}
function toggleStop(id) {
  const stop = props.stops.find((item) => item.id === id);
  stop.expanded = !stop.expanded;
}
function toggleSelection(id) {
  const stop = props.stops.find((item) => item.id === id);
  stop.selected = !stop.selected;
}
function toggleAllStops() {
  const selected = !allSelected.value;
  props.stops.forEach((stop) => (stop.selected = selected));
}
function reorder(sourceId, targetId) {
  const source = props.stops.findIndex((stop) => stop.id === sourceId);
  const target = props.stops.findIndex((stop) => stop.id === targetId);
  if (source < 0 || target < 0 || source === target) return;
  const [stop] = props.stops.splice(source, 1);
  props.stops.splice(target, 0, stop);
}
function optimizeRoute() {
  props.stops.sort(
    (first, second) =>
      Number(second.selected) - Number(first.selected) ||
      first.routeOrder - second.routeOrder,
  );
  ElMessage.success("已按示例路线顺序排列地点");
}
function next() {
  if (!selectedStops.value) return ElMessage.warning("请选择地点");
  goStep("method");
}
function addPlan(event) {
  if (!event.target.value) return;
  if (labels.value.key === "road") {
    emit("add-plan", event.target.value);
    event.target.value = "";
    return;
  }
  const stop = {
    ...props.stops[0],
    planName: props.plans.find((plan) => plan.id === event.target.value)?.name,
    id: crypto.randomUUID(),
    selected: true,
    expanded: true,
  };
  props.stops.push(stop);
  emit("add-plan", event.target.value);
  event.target.value = "";
}
function generateCode() {
  const ready =
    share.billing === "模板计费"
      ? share.template
      : share.condition && share.basis && Number(share.price) > 0;
  if (!ready)
    return ElMessage.warning(`请设置${labels.value.owner}运费计费方式`);
  emit("share", { ...share });
}
defineExpose({ goStep });
</script>

<template>
  <div class="dispatch-wizard-mask" :data-annotation-container="annotationActive ? 'modal' : undefined" @click.self="emit('close')">
    <section
      class="dispatch-wizard"
      :data-annotation-content="annotationActive ? 'modal' : undefined"
      aria-label="调度指派"
      :class="`dispatch-wizard--${step}`"
    >
      <aside class="wizard-panel">
        <header class="wizard-heading">
          调度指派<button
            type="button"
            aria-label="关闭调度指派"
            @click="emit('close')"
          >
            ×
          </button>
        </header>
        <nav class="dispatch-steps">
          <button type="button" @click="goStep('route')">
            <img :src="`${assetRoot}route-step.svg`" alt="" />规划路线</button
          ><i :class="{ complete: step !== 'route' }" /><button
            type="button"
            :class="{ pending: step === 'route' }"
            @click="next"
          >
            <img :src="`${assetRoot}method-step.svg`" alt="" />调度方式
          </button>
        </nav>
        <div class="wizard-section-heading">
          <h2>
            {{
              {
                route: "选择地点",
                method: "调度方式",
                share: "分享任务码",
                ship: `${labels.asset}指派`,
              }[step]
            }}
          </h2>
          <template v-if="step === 'route'"
            ><select
              class="dispatch-primary add-plan-select"
              aria-label="新增计划"
              @change="addPlan"
            >
              <option value="">新增计划</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                {{ plan.name }}
              </option></select
            ><button
              type="button"
              class="dispatch-primary small"
              @click="optimizeRoute"
            >
              智能排线
            </button></template
          ><template v-if="step === 'ship'"
            ><button type="button" @click="emit('collapse-map')">
              ⇥ 收起地图</button
            ><button
              type="button"
              class="dispatch-primary small"
              @click="emit('add-period')"
            >
              添加时段
            </button></template
          >
        </div>
        <div class="wizard-scroll" :class="{ 'annot-bulkDispatch-rule-route-plan': annotationActive && step === 'route' && labels.key === 'road' }">
          <RouteStops
            v-if="step === 'route'"
            :stops="stops"
            selectable
            @toggle="toggleStop"
            @select="toggleSelection"
            @reorder="reorder"
          />
          <div v-else-if="step === 'method'" class="dispatch-method-grid">
            <button
              v-for="method in dispatchMethods"
              :key="method.key"
              type="button"
              :class="`method-${method.key}`"
              :disabled="method.disabled"
              @click="method.step && goStep(method.step)"
            >
              <span
                >{{ method.title
                }}{{ method.key === "direct" ? labels.asset : "" }}</span
              >
              <small
                >{{ method.description
                }}<img :src="`${assetRoot}method-arrow.svg`" alt=""
              /></small>
              <img
                class="method-illustration"
                :src="`${assetRoot}method-${method.key}.svg`"
                alt=""
              />
            </button>
          </div>
          <div v-else-if="step === 'share'" class="share-task-form">
            <p>请设置{{ labels.owner }}运费计费方式</p>
            <label class="share-billing-label">计费类型</label>
            <div class="dispatch-radio-group">
              <label
                v-for="type in ['模板计费', '单位计费']"
                :key="type"
                :class="{ active: share.billing === type }"
                ><input
                  v-model="share.billing"
                  type="radio"
                  :value="type"
                  name="share-billing"
                />{{ type }}</label
              >
            </div>
            <div v-if="share.billing === '模板计费'" class="share-template">
              <label
                ><em>*</em>费用模板<select
                  v-model="share.template"
                  aria-label="分享任务费用模板"
                >
                  <option value="">请选择</option>
                  <option>单趟运费：3000元</option>
                </select></label
              ><output>单趟运费：3000元</output>
            </div>
            <div v-else class="share-unit-billing">
              <label>计费方式</label
              ><select v-model="share.condition" aria-label="任务码计费条件">
                <option value="">计费条件</option>
                <option>按装货</option>
                <option>按卸货</option></select
              ><select v-model="share.basis" aria-label="任务码计费依据">
                <option value="">计费依据</option>
                <option>吨数</option>
                <option>数量</option>
                <option>体积</option></select
              ><input
                v-model="share.price"
                type="number"
                min="0"
                placeholder="请输入"
                aria-label="任务码计费单价"
              /><span>元/吨</span>
            </div>
            <button
              type="button"
              class="dispatch-primary small"
              @click="generateCode"
            >
              生成任务码
            </button>
          </div>
          <VesselAssignments
            v-else
            :periods="periods"
            v-model:billing-scope="billingScope"
            @add-period="emit('add-period')"
            @remove-period="emit('remove-period', $event)"
          />
        </div>
        <footer class="wizard-footer">
          <template v-if="step === 'route'"
            ><label
              ><input
                type="checkbox"
                :checked="allSelected"
                aria-label="选择全部地点"
                @change="toggleAllStops"
              />已选 <span>{{ selectedStops }}/{{ stops.length }}</span></label
            ><button type="button" @click="emit('close')">取消</button
            ><button type="button" class="dispatch-primary" @click="next">
              下一步
            </button></template
          ><template v-else
            ><button
              type="button"
              @click="goStep(step === 'method' ? 'route' : 'method')"
            >
              上一步</button
            ><button
              v-if="step === 'ship'"
              type="button"
              class="dispatch-primary"
              @click="emit('complete')"
            >
              完成
            </button></template
          >
        </footer>
      </aside>
      <div class="wizard-map-area">
        <DispatchMap
          :route-stops="stops"
          kind="planning"
          :show-unselected="showUnselected"
        /><label v-if="step === 'route'" class="show-unset-places"
          ><input
            v-model="showUnselected"
            type="checkbox"
            role="switch"
          />显示未设置地点</label
        >
      </div>
    </section>
  </div>
</template>
