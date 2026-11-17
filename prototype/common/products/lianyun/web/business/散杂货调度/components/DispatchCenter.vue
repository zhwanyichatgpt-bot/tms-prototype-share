<script setup>
import { computed, nextTick, reactive, ref } from "vue";
import DispatchMap from "./DispatchMap.vue";
import ProgressBlock from "./ProgressBlock.vue";
import { metricItems, assetRoot } from "../mock-data.js";

import { transportModes, useDispatchMode } from "../transport-mode.js";

const labels = useDispatchMode();
const props = defineProps({
  mode: String,
  plans: Array,
  records: Array,
  selectedPlans: Array,
});
const emit = defineEmits([
  "update:mode",
  "select-plan",
  "select-all",
  "assign",
  "records",
  "detail",
  "edit",
  "invalidate",
]);
async function switchTransport(event, key) {
  const index = Object.keys(transportModes).indexOf(key);
  const stage = event.currentTarget.closest(".bulk-dispatch-stage");
  emit("update:mode", key);
  await nextTick();
  stage
    .querySelectorAll('.dispatch-transport-tabs [role="tab"]')
    [index]?.focus();
}
const tab = ref("待执行");
const planMap = ref(null);
const focusedPlan = ref(null);
function focusPlan(plan) {
  focusedPlan.value = plan;
  planMap.value.focusPoint(plan.number - 1);
}
const selectedOnly = ref(false);
const recordTab = ref("全部");
const recordQuery = ref("");
const recordCreator = ref("");
const recordDate = ref("");
const filters = reactive({
  query: "",
  enterprise: "",
  transport: "",
  business: "",
  salesperson: "",
  timeKind: "装货时间",
  start: "",
  end: "",
});
const applied = ref({});
const visiblePlans = computed(() =>
  props.plans.filter((plan) => {
    const filter = applied.value;
    return (
      plan.status === tab.value &&
      (!selectedOnly.value || props.selectedPlans.includes(plan.id)) &&
      (!filter.query || `${plan.name}${plan.id}`.includes(filter.query)) &&
      (!filter.enterprise || plan.enterprise.includes(filter.enterprise)) &&
      (!filter.transport || plan.transport === filter.transport) &&
      (!filter.business || plan.mode === filter.business) &&
      (!filter.salesperson || plan.salesperson === filter.salesperson) &&
      (!filter.start ||
        (filter.timeKind === "卸货时间"
          ? plan.unloading
          : plan.loading
        ).replace(" ", "T") >= filter.start) &&
      (!filter.end ||
        (filter.timeKind === "卸货时间"
          ? plan.unloading
          : plan.loading
        ).replace(" ", "T") <= filter.end)
    );
  }),
);
const allVisibleSelected = computed(
  () =>
    visiblePlans.value.length > 0 &&
    visiblePlans.value.every((plan) => props.selectedPlans.includes(plan.id)),
);
const visibleRecords = computed(() =>
  props.records.filter(
    (record) =>
      (recordTab.value === "全部" ||
        (recordTab.value === "有效") === record.valid) &&
      (!recordQuery.value || record.number.includes(recordQuery.value)) &&
      (!recordCreator.value || record.creator === recordCreator.value) &&
      (!recordDate.value || record.created.startsWith(recordDate.value)),
  ),
);
</script>

<template>
  <main class="dispatch-center-view">
    <section class="center-left annot-bulkDispatch-rule-transport-plan">
      <nav
        class="dispatch-tabs dispatch-transport-tabs"
        role="tablist"
        aria-label="计划运输方式"
      >
        <button
          v-for="(item, key) in transportModes"
          :key="key"
          type="button"
          role="tab"
          :aria-selected="mode === key"
          :tabindex="mode === key ? 0 : -1"
          :class="{ active: mode === key }"
          @click="switchTransport($event, key)"
          @keydown.left.prevent="switchTransport($event, 'road')"
          @keydown.right.prevent="switchTransport($event, 'water')"
        >
          {{ item.tab }}
        </button>
      </nav>
      <section class="dispatch-metrics" aria-label="调度概况">
        <div v-for="item in metricItems" :key="item.label">
          <p>{{ item.label }}</p>
          <div>
            <strong>{{ item.value }}</strong><small v-if="item.change"
              >较昨日<span
                :class="item.change.startsWith('-') ? 'decrease' : 'increase'"
                >{{ item.change }}</span
              ></small
            >
          </div>
        </div>
      </section>
      <section class="dispatch-plan-panel">
        <h2>待调度计划</h2>
        <form
          class="center-plan-filters"
          @submit.prevent="applied = { ...filters }"
        >
          <label class="dispatch-search plan-name-search"
            ><span aria-hidden="true" class="search-glyph" /><input
              v-model="filters.query"
              aria-label="计划名称或编号"
              placeholder="输入计划名称/编号搜索"
          /></label>
          <input
            v-model="filters.enterprise"
            class="enterprise-filter"
            aria-label="企业名称"
            placeholder="输入企业名称"
          />
          <div class="dispatch-date-range">
            <select v-model="filters.timeKind" aria-label="计划时间类型">
              <option>装货时间</option>
              <option>卸货时间</option></select
            ><span class="calendar-glyph">▦</span
            ><input
              v-model="filters.start"
              aria-label="计划开始时间"
              placeholder="请选择开始时间"
              onfocus="this.type = 'datetime-local'"
              onblur="if (!this.value) this.type = 'text';"
            /><span>—</span
            ><input
              v-model="filters.end"
              aria-label="计划结束时间"
              placeholder="请选择结束时间"
              onfocus="this.type = 'datetime-local'"
              onblur="if (!this.value) this.type = 'text';"
            />
          </div>
          <select v-model="filters.transport" aria-label="运输类型">
            <option value="">运输类型</option>
            <option>{{ labels.transport }}</option>
          </select>
          <select v-model="filters.business" aria-label="业务类型">
            <option value="">业务类型</option>
            <option v-for="item in labels.businessTypes" :key="item">
              {{ item }}
            </option>
          </select>
          <select v-model="filters.salesperson" aria-label="业务员">
            <option value="">业务员</option>
            <option>小张</option>
          </select>
          <button type="submit" class="dispatch-primary">搜索</button>
        </form>
        <div class="center-plan-body">
          <DispatchMap ref="planMap" kind="plan" :focused-plan="focusedPlan" />
          <div class="center-plan-table">
            <div class="plan-tabs-bar">
              <div class="dispatch-tabs">
                <button
                  v-for="item in ['待执行', '执行中', '已执行']"
                  :key="item"
                  type="button"
                  :class="{ active: tab === item }"
                  @click="tab = item"
                >
                  {{ item }}
                </button>
              </div>
              <div class="plan-selection">
                <span
                  >已选 <b>{{ selectedPlans.length }}</b></span
                ><label
                  ><input
                    v-model="selectedOnly"
                    type="checkbox"
                  />仅展示已选</label
                ><button
                  type="button"
                  class="dispatch-primary small"
                  @click="emit('assign')"
                >
                  调度指派
                </button>
              </div>
            </div>
            <div class="plan-table-scroll">
              <table class="dispatch-plan-table">
                <colgroup>
                  <col style="width: 44px" />
                  <col style="width: 40px" />
                  <col style="width: 196px" />
                  <col style="width: 96px" />
                  <col style="width: 92px" />
                  <col style="width: 88px" />
                  <col style="width: 224px" />
                  <col style="width: 60px" />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        :checked="allVisibleSelected"
                        :indeterminate="
                          !allVisibleSelected && selectedPlans.length > 0
                        "
                        aria-label="选择全部可见计划"
                        @change="
                          emit(
                            'select-all',
                            visiblePlans.map((plan) => plan.id),
                          )
                        "
                      />
                    </th>
                    <th>序号</th>
                    <th>计划信息</th>
                    <th>运输方式</th>
                    <th>业务模式</th>
                    <th>基础运费(元)</th>
                    <th>装卸货时间</th>
                    <th>业务员</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="plan in visiblePlans" :key="plan.id">
                    <td>
                      <input
                        type="checkbox"
                        :checked="selectedPlans.includes(plan.id)"
                        :aria-label="`选择计划 ${plan.number}`"
                        @change="emit('select-plan', plan.id)"
                      />
                    </td>
                    <td class="plan-row-number">{{ plan.number }}</td>
                    <td>
                      <div class="plan-name">
                        {{ plan.name
                        }}<button
                          type="button"
                          aria-label="定位计划"
                          @click="emit('select-plan', plan.id)"
                        >
                          ⌕
                        </button>
                      </div>
                      <p>{{ plan.enterprise }}</p>
                    </td>
                    <td>
                      <span class="dispatch-tag mint">{{
                        plan.transport
                      }}</span>
                    </td>
                    <td>
                      <span
                        class="dispatch-tag"
                        :class="
                          plan.mode === labels.businessTypes[0]
                            ? 'purple'
                            : 'slate'
                        "
                        >{{ plan.mode }}</span
                      >
                    </td>
                    <td>{{ plan.freight }}</td>
                    <td>
                      <div class="plan-load-time">
                        <span>装</span>{{ plan.loading }}<em>（最早）</em>
                      </div>
                      <div class="plan-load-time unload">
                        <span>卸</span>{{ plan.unloading }}<em>（最迟）</em>
                      </div>
                    </td>
                    <td>{{ plan.salesperson }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="!visiblePlans.length" class="dispatch-empty">
                暂无符合条件的计划
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
    <aside class="center-record-panel">
      <DispatchMap kind="record" />
      <header>
        <h2>调度记录（{{ records.length }}）</h2>
        <button type="button" class="dispatch-link" @click="emit('records')">
          全部 ›
        </button>
      </header>
      <div class="center-record-filters">
        <label class="dispatch-search"
          ><span class="search-glyph" /><input
            v-model="recordQuery"
            aria-label="调度记录号"
            placeholder="输入调度记录号搜索" /></label
        ><input
          v-model="recordDate"
          aria-label="调度日期"
          placeholder="请选择调度时间"
          onfocus="this.type = 'date'"
          onblur="if (!this.value) this.type = 'text';"
        /><select v-model="recordCreator" aria-label="指派人">
          <option value="">指派人</option>
          <option>小明</option>
        </select>
      </div>
      <div class="dispatch-tabs record-tabs">
        <button
          v-for="item in ['全部', '有效', '失效']"
          :key="item"
          type="button"
          :class="{ active: recordTab === item }"
          @click="recordTab = item"
        >
          {{ item }}
        </button>
      </div>
      <div class="center-record-list">
        <article
          v-for="record in visibleRecords"
          :key="record.id"
          class="center-record-card"
        >
          <header>
            <button
              type="button"
              class="record-number"
              @click="emit('detail', record)"
            >
              {{ record.number }}</button><span
              class="dispatch-status"
              :class="record.valid ? 'valid' : 'invalid'"
              >{{ record.valid ? "有效" : "无效" }}</span
            ><button
              type="button"
              class="fold-toggle"
              :aria-label="`${record.expanded ? '收起' : '展开'}调度记录 ${record.id}`"
              @click="record.expanded = !record.expanded"
            >
              {{ record.expanded ? "⌃" : "⌄" }}
            </button>
          </header>
          <div class="record-counts">
            <span>内部调度：3</span><span>途径点：3</span
            ><span>委外运输：2</span><span>货品：2</span>
          </div>
          <template v-if="record.expanded"
            ><ProgressBlock :value="record.progress" />
            <footer>
              <span>{{ record.creator }} | 2024-12-29 10:20:32</span>
              <div>
                <button
                  type="button"
                  :disabled="!record.valid"
                  @click="emit('edit', record)"
                >
                  <img :src="`${assetRoot}edit.svg`" alt="" /> 编辑</button
                ><button
                  type="button"
                  :disabled="!record.valid"
                  @click="emit('invalidate', record)"
                >
                  <img :src="`${assetRoot}trash.svg`" alt="" /> 作废</button
                ><button type="button" @click="emit('detail', record)">
                  <img :src="`${assetRoot}more.svg`" alt="" /> 详情
                </button>
              </div>
            </footer></template
          >
        </article>
        <div v-if="!visibleRecords.length" class="dispatch-empty">
          暂无调度记录
        </div>
      </div>
    </aside>
  </main>
</template>
