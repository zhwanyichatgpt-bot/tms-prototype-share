<script setup>
/**
 * 运单详情 —— 费用区
 * 基础运费 + 在途费用（空态） + 其他补贴（可添加/删除补贴）。
 */
import { computed, reactive, ref } from 'vue'
import { getWaybillDetail } from '../mock-data'

const props = defineProps({
  waybillKey: { type: String, default: '' },
})

const data = computed(() => getWaybillDetail(props.waybillKey))

/* 补贴列表（本地态，原型交互用） */
const subsidies = ref([...data.value.subsidies])

/* 添加补贴弹窗 */
const dialogVisible = ref(false)
const form = reactive({ name: '', amount: '', remark: '' })
const errors = reactive({ name: '', amount: '' })

function openDialog() {
  form.name = ''
  form.amount = ''
  form.remark = ''
  errors.name = ''
  errors.amount = ''
  dialogVisible.value = true
}
function closeDialog() {
  dialogVisible.value = false
}
function confirmAdd() {
  errors.name = form.name ? '' : '请选择补贴类型'
  const amount = Number(form.amount)
  errors.amount = form.amount && amount > 0 ? '' : '请输入大于 0 的金额'
  if (errors.name || errors.amount) return
  subsidies.value.push({
    id: `sub${Date.now()}`,
    name: form.name,
    amount: amount.toFixed(2),
    remark: form.remark,
  })
  dialogVisible.value = false
}
function removeSubsidy(id) {
  subsidies.value = subsidies.value.filter(s => s.id !== id)
}
</script>

<template>
  <div class="wd-fees">
    <!-- 基础运费 -->
    <section class="wd-fee-block">
      <div class="wd-fee-title">基础运费</div>
      <div class="wd-fee-meta">
        <span>计费类型：{{ data.baseFee.billType }}</span>
        <span>计费条件：{{ data.baseFee.condition }}</span>
        <span>计费依据：{{ data.baseFee.basis }}</span>
        <span>运输单价：{{ data.baseFee.unitPrice }}</span>
      </div>
      <div class="wd-fee-formula">
        <span class="wd-fee-info-icon" aria-hidden="true">i</span>
        <span>基础运费：{{ data.baseFee.formula }}</span>
      </div>
    </section>

    <!-- 在途费用 -->
    <section class="wd-fee-block">
      <div class="wd-fee-title">在途费用</div>
      <div class="wd-fee-table">
        <div class="wd-fee-table-head">
          <span v-for="col in data.transitFeeColumns" :key="col" class="wd-fee-col">{{ col }}</span>
        </div>
        <div v-if="!data.transitFees.length" class="wd-fee-empty">
          <svg class="wd-empty-illustration" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="30" y="58" width="60" height="8" rx="2" fill="#eef0f5"/>
            <rect x="40" y="30" width="40" height="30" rx="3" fill="#f4f6fb" stroke="#dfe3ee"/>
            <circle cx="60" cy="42" r="7" fill="#3a65ff" opacity="0.2"/>
            <circle cx="60" cy="42" r="3" fill="#3a65ff"/>
            <path d="M44 30l4-6h24l4 6" stroke="#dfe3ee" fill="#eef1f8"/>
          </svg>
          <div class="wd-empty-text">暂无数据</div>
        </div>
      </div>
    </section>

    <!-- 其他补贴 -->
    <section class="wd-fee-block">
      <div class="wd-fee-title-row">
        <div class="wd-fee-title">其他补贴</div>
        <button type="button" class="wd-add-subsidy" @click="openDialog">
          <span class="wd-add-icon" aria-hidden="true">+</span> 添加补贴
        </button>
      </div>

      <div v-if="subsidies.length" class="wd-subsidy-list">
        <div v-for="s in subsidies" :key="s.id" class="wd-subsidy-item">
          <span class="wd-subsidy-name">{{ s.name }}</span>
          <span class="wd-subsidy-amount">¥{{ s.amount }}</span>
          <span class="wd-subsidy-remark">{{ s.remark || '—' }}</span>
          <button type="button" class="wd-subsidy-del" @click="removeSubsidy(s.id)">删除</button>
        </div>
      </div>
      <div v-else class="wd-subsidy-empty">暂无补贴，点击右上角「添加补贴」录入</div>
    </section>

    <!-- 添加补贴弹窗 -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="wd-dialog-mask" @click.self="closeDialog">
        <div class="wd-dialog">
          <div class="wd-dialog-head">
            <span>添加补贴</span>
            <button type="button" class="wd-dialog-close" aria-label="关闭" @click="closeDialog">×</button>
          </div>
          <div class="wd-dialog-body">
            <div class="wd-form-item">
              <label class="wd-form-label"><i class="wd-required">*</i>补贴类型</label>
              <select v-model="form.name" class="wd-form-control">
                <option value="" disabled>请选择补贴类型</option>
                <option v-for="t in data.subsidyTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <div v-if="errors.name" class="wd-form-error">{{ errors.name }}</div>
            </div>
            <div class="wd-form-item">
              <label class="wd-form-label"><i class="wd-required">*</i>补贴金额（元）</label>
              <input v-model="form.amount" type="number" min="0" step="0.01" class="wd-form-control" placeholder="请输入补贴金额" />
              <div v-if="errors.amount" class="wd-form-error">{{ errors.amount }}</div>
            </div>
            <div class="wd-form-item">
              <label class="wd-form-label">备注</label>
              <textarea v-model="form.remark" class="wd-form-control wd-form-textarea" rows="2" placeholder="选填" />
            </div>
          </div>
          <div class="wd-dialog-foot">
            <button type="button" class="wd-btn" @click="closeDialog">取消</button>
            <button type="button" class="wd-btn wd-btn-primary" @click="confirmAdd">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
