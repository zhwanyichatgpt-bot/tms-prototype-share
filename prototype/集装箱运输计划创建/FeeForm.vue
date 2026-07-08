<template>
  <div class="fee-form">
    <div class="fee-row">
      <span class="fee-label">计费规则</span>
      <el-select v-model="fee.rule" size="small" style="width: 100%" placeholder="请选择计费规则">
        <el-option v-for="r in feeRules" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
    </div>
    <div class="fee-row">
      <span class="fee-label">税务</span>
      <el-select v-model="fee.tax" size="small" style="width: 100%" placeholder="请选择税务">
        <el-option v-for="t in feeTax" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
    </div>

    <!-- 按集装箱：箱型价格明细 -->
    <template v-if="fee.rule === 'byBox'">
      <div v-if="containerGroups.length" class="fee-row">
        <span class="fee-label">箱型单价</span>
        <div class="box-price-list">
          <div v-for="g in containerGroups" :key="g.type + '_' + g.size" class="box-price-row">
            <span>{{ g.typeLabel }} {{ g.size }}（{{ g.count }}）</span>
            <el-input-number
              v-model="fee.boxUnitPrices[g.type + '_' + g.size]"
              :min="0"
              :controls="false"
              size="small"
              style="width: 120px"
            />
            <span class="unit">元/箱</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="请先添加集装箱" :image-size="40" />
    </template>

    <!-- 按里程 -->
    <template v-if="fee.rule === 'byDistance'">
      <div class="fee-row">
        <span class="fee-label">计费依据</span>
        <el-select v-model="fee.distanceBasis" size="small" style="width: 100%">
          <el-option v-for="d in distanceBasis" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </div>
      <div class="fee-row">
        <span class="fee-label">参考里程</span>
        <span class="fee-value">{{ fee.distanceBasis === 'plan' ? planDistanceKm + ' km' : '按实际结算' }}</span>
      </div>
      <div class="fee-row">
        <span class="fee-label">运输单价</span>
        <el-input-number v-model="fee.unitPrice" :min="0" :controls="false" size="small" style="width: 120px" />
        <span class="unit">元/km</span>
      </div>
    </template>

    <!-- 按车 -->
    <template v-if="fee.rule === 'byTruck'">
      <div class="fee-row">
        <span class="fee-label">计费车次</span>
        <el-input-number v-model="fee.truckCount" :min="0" :controls="false" size="small" style="width: 120px" />
        <span class="unit">车</span>
      </div>
      <div class="fee-row">
        <span class="fee-label">单车单价</span>
        <el-input-number v-model="fee.unitPrice" :min="0" :controls="false" size="small" style="width: 120px" />
        <span class="unit">元/车</span>
      </div>
    </template>

    <!-- 预估费用 -->
    <div class="fee-estimate">
      <span class="fee-label">预估费用</span>
      <strong>{{ estimateFeeText }}</strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { feeRules, feeTax, distanceBasis } from './mock-data'

const props = defineProps({
  fee: { type: Object, required: true },
  containerGroups: { type: Array, default: () => [] },
  planDistanceKm: { type: Number, default: 0 },
})

const estimateFeeText = computed(() => {
  const fee = props.fee
  if (!fee.rule) return '-'
  if (fee.rule === 'byBox') {
    let total = 0
    let hasAll = true
    props.containerGroups.forEach(g => {
      const price = fee.boxUnitPrices[g.type + '_' + g.size] || 0
      if (!price) hasAll = false
      total += price * g.count
    })
    if (!props.containerGroups.length) return '请先添加集装箱'
    return hasAll ? `¥${total.toFixed(2)}` : '请补齐箱型单价'
  }
  if (fee.rule === 'byDistance') {
    if (fee.distanceBasis === 'actual') return '按实际结算'
    if (!fee.unitPrice) return '请填运输单价'
    return `¥${(props.planDistanceKm * fee.unitPrice).toFixed(2)}`
  }
  if (fee.rule === 'byTruck') {
    if (!fee.truckCount || !fee.unitPrice) return '请填车次与单价'
    return `¥${(fee.truckCount * fee.unitPrice).toFixed(2)}`
  }
  return '-'
})
</script>

<style scoped>
.fee-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fee-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fee-label {
  width: 80px;
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}
.fee-value {
  font-size: 13px;
  color: #1f2d3d;
}
.box-price-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.box-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.box-price-row span {
  flex: 1;
}
.unit {
  font-size: 12px;
  color: #909399;
}
.fee-estimate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f2f6ff;
  border-radius: 4px;
  margin-top: 6px;
}
.fee-estimate strong {
  color: #f53f3f;
  font-size: 16px;
}
</style>
