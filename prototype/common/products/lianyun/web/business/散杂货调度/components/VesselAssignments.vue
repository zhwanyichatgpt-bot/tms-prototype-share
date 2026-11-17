<script setup>
import { useDispatchMode } from "../transport-mode.js";
import { computed, reactive, ref } from "vue";
import { ElDatePicker, ElMessage, ElTooltip } from "element-plus";
import {
  createVessel,
  getVesselFreight,
  getVesselTotal,
} from "../mock-data.js";

const labels = useDispatchMode();
const props = defineProps({
  periods: { type: Array, required: true },
  table: Boolean,
});
const emit = defineEmits(["add-period", "remove-period"]);
const billingScope = defineModel("billingScope", { type: String, default: "trip" });
const segmented = computed(() => labels.value.key === "road" && billingScope.value === "segment");
const batchVisible = ref(false);
const batchPeriodId = ref(null);
const batchAnchor = ref({ left: 623, top: 166 });
const batch = reactive({ weight: "", volume: "", quantity: "" });
const formatFreight = (amount) => amount?.toFixed(2) ?? "—";
const singleFreight = (vessel) => formatFreight(getVesselFreight(vessel));
const totalFreight = (vessel) => formatFreight(getVesselTotal(vessel));

function openBatch(period, event) {
  batchPeriodId.value = period.id;
  const stage = event.currentTarget
    .closest(".bulk-dispatch-stage")
    .getBoundingClientRect();
  const rect = event.currentTarget.getBoundingClientRect();
  batchAnchor.value = {
    left: Math.max(16, Math.min(stage.width - 456, rect.left - stage.left)),
    top: Math.max(16, Math.min(stage.height - 156, rect.top - stage.top - 150)),
  };
  batchVisible.value = true;
}
function addVessel(period) {
  period.vessels.push({
    ...createVessel(period.vessels.length, true, labels.value.key),
    ship: "",
    owner: "",
  });
}
function removeVessel(period, id) {
  period.vessels = period.vessels.filter((vessel) => vessel.id !== id);
}
function applyBatch() {
  if (
    Object.values(batch).some(
      (value) =>
        value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0),
    )
  )
    return ElMessage.warning("最高配载不能为负数");
  if (batch.quantity !== "" && !Number.isInteger(Number(batch.quantity)))
    return ElMessage.warning("最高配载数量请输入整数");
  props.periods
    .filter((period) => period.id === batchPeriodId.value)
    .forEach((period) =>
      period.vessels.forEach((vessel) => Object.assign(vessel, batch)),
    );
  batchVisible.value = false;
}
function updatePeriodRange(period, range) {
  if (!range) return;
  [period.start, period.end] = range;
}
</script>

<template>
  <div
    class="vessel-assignments"
    :class="{ 'vessel-assignments--table': table }"
  >
    <section v-if="labels.key === 'road'" class="road-dispatch-billing">
      <div class="vessel-field" :class="{ 'annot-bulkDispatch-rule-billing-scope-card': !table, 'annot-bulkDispatch-rule-billing-scope-table': table }">
        <span class="road-dispatch-billing-label">计费范围</span>
        <div class="dispatch-radio-group" role="group" aria-label="调度计费范围">
          <label v-for="option in [{ value: 'trip', label: '整趟计费' }, { value: 'segment', label: '分段计费' }]"
            :key="option.value" :class="{ active: billingScope === option.value }">
            <input v-model="billingScope" type="radio" :name="table ? 'dispatch-scope-table' : 'dispatch-scope-card'" :value="option.value" />
            {{ option.label }}
          </label>
        </div>
      </div>
    </section>
    <section
      v-for="(period, periodIndex) in periods"
      :key="period.id"
      class="vessel-period"
    >
      <header class="vessel-period-header">
        <label>承运时间</label>
        <div class="vessel-period-date">
          <ElDatePicker
            :model-value="[period.start, period.end]"
            type="datetimerange"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm"
            range-separator="—"
            :clearable="false"
            :aria-label="`承运时段 ${periodIndex + 1}`"
            @update:model-value="updatePeriodRange(period, $event)"
          />
        </div>
        <button
          v-if="table"
          type="button"
          class="dispatch-link"
          @click="addVessel(period)"
        >
          ⊕ {{ labels.key === 'road' ? '添加车辆' : '选择船舶' }}
        </button>
        <div class="vessel-period-actions">
          <button
            type="button"
            :aria-label="`删除时段 ${periodIndex + 1}`"
            @click="emit('remove-period', period.id)"
          >
            ⊖<span v-if="table"> 删除时段</span></button
          ><button v-if="table" type="button" @click="period.vessels = []">
            ♜ 清空{{ labels.asset }}
          </button>
        </div>
      </header>
      <div v-if="table" class="vessel-table-scroll">
        <table class="dispatch-vessel-table">
          <colgroup>
            <col style="width: 60px" />
            <col style="width: 136px" />
            <col style="width: 196px" />
            <col style="width: 384px" />
            <col style="width: 292px" />
            <col style="width: 180px" />
            <col v-if="!segmented" style="width: 452px" />
            <col v-if="!segmented" style="width: 142px" />
            <col style="width: 80px" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>指派{{ labels.asset }}</th>
              <th>{{ labels.asset }}信息</th>
              <th>
                <button type="button" @click="openBatch(period, $event)">
                  单{{ labels.assetUnit }}最高配载 ⓘ
                </button>
              </th>
              <th>{{ labels.ownerField }}</th>
              <th>
                <ElTooltip
                  placement="top"
                  :offset="0"
                  popper-class="bulk-dispatch-trip-tooltip"
                >
                  <template #content
                    ><div>用于计算预估剩余货量</div>
                    <div>
                      不限趟数时无法计算，只根据实际运输更新余量
                    </div></template
                  >
                  <span class="trip-help-trigger">承运趟数 ⓘ</span>
                </ElTooltip>
              </th>
              <th v-if="!segmented">计费方式</th>
              <th v-if="!segmented">单趟基础运费</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(vessel, vesselIndex) in period.vessels"
              :key="vessel.id"
            >
              <td>{{ vesselIndex + 1 }}</td>
              <td>
                <select
                  v-model="vessel.ship"
                  :aria-label="`${labels.asset} ${vesselIndex + 1}`"
                >
                  <option value="">请选择</option>
                  <option v-for="ship in labels.assetNumbers" :key="ship">
                    {{ ship }}
                  </option>
                </select>
              </td>
              <td>
                <div>
                  {{ labels.assetType }}
                  <span class="dispatch-tag tiny slate">自有</span>
                </div>
                <p>
                  出车超快的车队
                  <span class="dispatch-status valid tiny">空闲</span>
                </p>
              </td>
              <td>
                <div class="vessel-capacity">
                  <label
                    ><input
                      v-model="vessel.weight"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      aria-label="最高配载吨数"
                    /><span>吨</span></label
                  ><label
                    ><input
                      v-model="vessel.volume"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      aria-label="最高配载体积"
                    /><span>m³</span></label
                  ><label
                    ><input
                      v-model="vessel.quantity"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0.00"
                      aria-label="最高配载数量"
                    /><span>数量</span></label
                  >
                </div>
              </td>
              <td>
                <select v-model="vessel.owner" :aria-label="labels.ownerField">
                  <option value="">请选择{{ labels.ownerField }}</option>
                  <option>{{ labels.ownerName }}</option>
                </select>
              </td>
              <td>
                <div class="vessel-trips">
                  <select v-model="vessel.frequency" aria-label="承运频次">
                    <option>每日</option>
                    <option>不限</option></select
                  ><input
                    v-if="vessel.frequency !== '不限'"
                    v-model="vessel.trips"
                    type="number"
                    min="1"
                    placeholder="输入趟数"
                    aria-label="承运趟数"
                  />
                </div>
              </td>
              <td v-if="!segmented">
                <div class="table-billing">
                  <select v-model="vessel.billing" aria-label="计费类型">
                    <option>模板计费</option>
                    <option>单位计费</option></select
                  ><select
                    v-if="vessel.billing === '模板计费'"
                    v-model="vessel.template"
                    aria-label="费用模板"
                  >
                    <option value="">请选择模板</option>
                    <option>单趟运费：3000元</option></select
                  ><template v-else
                    ><select v-model="vessel.condition" aria-label="计费条件">
                      <option value="">计费条件</option>
                      <option>按装货</option>
                      <option>按卸货</option></select
                    ><select v-model="vessel.basis" aria-label="计费依据">
                      <option value="">计费依据</option>
                      <option>吨数</option>
                      <option>数量</option>
                      <option>体积</option></select
                    ><label class="vessel-unit-price"
                      ><input
                        v-model="vessel.unitPrice"
                        type="number"
                        min="0"
                        placeholder="0.00"
                        aria-label="计费单价"
                      /><span>元/吨</span></label
                    ></template
                  >
                </div>
              </td>
              <td v-if="!segmented">{{ singleFreight(vessel) }}</td>
              <td>
                <button
                  type="button"
                  class="dispatch-link"
                  @click="removeVessel(period, vessel.id)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!period.vessels.length" class="dispatch-empty">
          请选择{{ labels.asset }}
        </div>
      </div>
      <template v-else>
        <article
          v-for="(vessel, vesselIndex) in period.vessels.filter(
            (vessel) => !vessel.placeholder || vessel.ship,
          )"
          :key="vessel.id"
          class="vessel-card"
        >
          <header class="vessel-card-heading">
            <label>指派{{ labels.asset }}</label
            ><select
              v-model="vessel.ship"
              :aria-label="`指派${labels.asset} ${periodIndex + 1}-${vesselIndex + 1}`"
              @change="vessel.expanded = true"
            >
              <option value="">选择{{ labels.asset }}</option>
              <option v-for="ship in labels.assetNumbers" :key="ship">
                {{ ship }}
              </option></select
            ><template v-if="vessel.ship"
              ><span class="dispatch-status valid tiny">空闲</span
              ><span class="dispatch-tag tiny slate">自有</span></template
            ><button
              type="button"
              class="fold-toggle"
              :aria-label="`展开${labels.asset}设置`"
              @click="vessel.expanded = !vessel.expanded"
            >
              {{ vessel.expanded ? "⌃" : "⌄" }}</button
            ><button
              type="button"
              class="remove-vessel"
              :aria-label="`删除${labels.asset}`"
              @click="removeVessel(period, vessel.id)"
            >
              ⊗
            </button>
          </header>
          <template v-if="vessel.expanded"
            ><div class="vessel-field">
              <label>最高配载</label>
              <div class="vessel-capacity">
                <label
                  ><input
                    v-model="vessel.weight"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    aria-label="最高配载吨数"
                  /><span>吨</span></label
                ><label
                  ><input
                    v-model="vessel.volume"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    aria-label="最高配载体积"
                  /><span>m³</span></label
                ><label
                  ><input
                    v-model="vessel.quantity"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    aria-label="最高配载数量"
                  /><span>数量</span></label
                >
              </div>
            </div>
            <div class="vessel-field">
              <label>{{ labels.ownerField }}</label><select
                v-model="vessel.owner"
                :aria-label="labels.ownerField"
              >
                <option value="">请选择{{ labels.ownerField }}</option>
                <option>{{ labels.ownerName }}</option>
              </select>
            </div>
            <div class="vessel-field">
              <label>承运趟次</label>
              <div class="vessel-trips">
                <select v-model="vessel.frequency" aria-label="承运频次">
                  <option>每日</option>
                  <option>不限</option></select
                ><input
                  v-if="vessel.frequency !== '不限'"
                  v-model="vessel.trips"
                  type="number"
                  min="1"
                  placeholder="请输入承运趟数"
                  aria-label="承运趟数"
                />
              </div>
            </div>
            <template v-if="!segmented">
            <div class="vessel-field">
              <label>计费类型</label>
              <div class="dispatch-radio-group">
                <label
                  v-for="type in ['模板计费', '单位计费']"
                  :key="type"
                  :class="{ active: vessel.billing === type }"
                  ><input
                    v-model="vessel.billing"
                    type="radio"
                    :value="type"
                    :name="`billing-${vessel.id}`"
                  />{{ type }}</label
                >
              </div>
            </div>
            <div v-if="vessel.billing === '模板计费'" class="vessel-field">
              <label>费用模板</label
              ><select v-model="vessel.template" aria-label="费用模板">
                <option value="">请选择</option>
                <option>单趟运费：3000元</option>
              </select>
            </div>
            <div v-else class="vessel-field">
              <label>计费方式</label>
              <div class="vessel-unit-billing">
                <select v-model="vessel.condition" aria-label="计费条件">
                  <option value="">计费条件</option>
                  <option>按装货</option>
                  <option>按卸货</option></select
                ><select v-model="vessel.basis" aria-label="计费依据">
                  <option value="">计费依据</option>
                  <option>吨数</option>
                  <option>数量</option>
                  <option>体积</option></select
                ><label class="vessel-unit-price"
                  ><input
                    v-model="vessel.unitPrice"
                    type="number"
                    min="0"
                    placeholder="请输入"
                    aria-label="计费单价"
                  /><span>元/吨</span></label
                >
              </div>
            </div>
            <div class="vessel-field vessel-freight">
              <label>单趟运费</label
              ><output>{{ singleFreight(vessel) }}</output
              ><label>{{
                vessel.billing === "模板计费" ? "合计运费" : "本次总收"
              }}</label
              ><output>{{
                totalFreight(vessel)
              }}</output>
            </div>
            </template>
          </template>
        </article>
        <button
          type="button"
          class="dispatch-link add-vessel"
          @click="addVessel(period)"
        >
          ⊕ {{ labels.key === 'road' ? '添加车辆' : '选择船舶' }}
        </button>
      </template>
    </section>
    <Teleport to=".bulk-dispatch-stage">
      <div
        v-if="table && batchVisible"
        class="vessel-batch-popover"
        :style="{ left: `${batchAnchor.left}px`, top: `${batchAnchor.top}px` }"
      >
        <h3>批量设置</h3>
        <div>
          <label>最高配载</label>
          <div class="vessel-capacity">
            <label
              v-for="(unit, key) in {
                weight: '吨',
                volume: 'm³',
                quantity: '数量',
              }"
              :key="key"
              ><input
                v-model="batch[key]"
                type="number"
                min="0"
                placeholder="0.00"
                :aria-label="`批量最高配载${unit}`"
              /><span>{{ unit }}</span></label
            >
          </div>
        </div>
        <footer>
          <button type="button" @click="batchVisible = false">取消</button
          ><button type="button" class="dispatch-primary" @click="applyBatch">
            确定
          </button>
        </footer>
      </div>
    </Teleport>
  </div>
</template>
