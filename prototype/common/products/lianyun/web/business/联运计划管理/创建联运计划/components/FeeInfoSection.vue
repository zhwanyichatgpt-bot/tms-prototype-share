<script setup>
import { reactive, ref } from 'vue'
import { feeConfig } from '../mock-data'

const enabled = ref(feeConfig.shipperFeeEnabled)
const form = reactive({
  calcType: '模板计费',
  includeTax: '是',
  payType: '预付',
  prepayType: '固定金额',
  prepayAmount: '',
  payMethod: '银行转账',
  calcRule: '按里程',
  calcUnit: '吨',
  billingBasis: '装卸货最大重量',
  unitPrice: '',
  lossRule: '按里程',
})
</script>

<template>
  <section class="cp-section">
    <h3 class="cp-section-title">费用信息</h3>

    <!-- 货主费用设置开关 -->
    <div class="cp-fee-switch">
      <span class="cp-fee-switch-label">货主费用设置</span>
      <button type="button" class="cp-switch" :class="{ on: enabled }" @click="enabled = !enabled"><i></i></button>
      <span class="cp-fee-switch-tip">{{ feeConfig.shipperFeeTip }}</span>
    </div>

    <div v-if="enabled" class="cp-fee-body">
      <!-- 第一行 -->
      <div class="cp-fee-row">
        <div class="cp-fee-item">
          <label class="cp-label">计费类型</label>
          <div class="cp-radio-group">
            <label v-for="t in feeConfig.calcTypes" :key="t" class="cp-radio" :class="{ on: form.calcType === t }">
              <input v-model="form.calcType" type="radio" :value="t" /><span class="cp-radio-dot"></span>{{ t }}
            </label>
          </div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">是否含税</label>
          <div class="cp-radio-group">
            <label v-for="t in feeConfig.includeTax" :key="t" class="cp-radio" :class="{ on: form.includeTax === t }">
              <input v-model="form.includeTax" type="radio" :value="t" /><span class="cp-radio-dot"></span>{{ t }}
            </label>
          </div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">付款类型</label>
          <div class="cp-input-wrap"><select v-model="form.payType" class="cp-input cp-select"><option v-for="t in feeConfig.payTypes" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
        </div>
        <div class="cp-fee-item cp-fee-prepay">
          <label class="cp-label">预付金额</label>
          <div class="cp-prepay">
            <div class="cp-input-wrap"><select v-model="form.prepayType" class="cp-input cp-select"><option v-for="t in feeConfig.prepayTypes" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
            <div class="cp-input-wrap"><input v-model="form.prepayAmount" class="cp-input" type="number" placeholder="0.00" /></div>
          </div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">付款方式</label>
          <div class="cp-input-wrap"><select v-model="form.payMethod" class="cp-input cp-select"><option v-for="t in feeConfig.payMethods" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
        </div>
      </div>

      <!-- 第二行 -->
      <div class="cp-fee-row">
        <div class="cp-fee-item">
          <label class="cp-label">计费规则</label>
          <div class="cp-input-wrap"><select v-model="form.calcRule" class="cp-input cp-select"><option v-for="t in feeConfig.calcRules" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">计费单位</label>
          <div class="cp-input-wrap"><select v-model="form.calcUnit" class="cp-input cp-select"><option v-for="t in feeConfig.calcUnits" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">计费依据</label>
          <div class="cp-input-wrap"><select v-model="form.billingBasis" class="cp-input cp-select"><option v-for="t in feeConfig.billingBasis" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
        </div>
        <div class="cp-fee-item">
          <label class="cp-label">运输单价</label>
          <div class="cp-input-wrap cp-unit-price">
            <input v-model="form.unitPrice" class="cp-input" type="number" placeholder="0.00" />
            <span class="cp-unit">元/吨</span>
          </div>
        </div>
        <div class="cp-fee-item cp-fee-loss">
          <label class="cp-label">货品路耗扣罚规则</label>
          <div class="cp-loss">
            <div class="cp-input-wrap"><select v-model="form.lossRule" class="cp-input cp-select"><option v-for="t in feeConfig.lossRules" :key="t">{{ t }}</option></select><span class="cp-caret">▾</span></div>
            <button type="button" class="cp-link">设置容忍值</button>
          </div>
        </div>
      </div>

      <!-- 计算公式 -->
      <div class="cp-formula">
        <span class="cp-formula-ic">✓</span>
        <span class="cp-formula-text">{{ feeConfig.formulaText }}</span>
        <strong class="cp-formula-amount">{{ feeConfig.formulaAmount }} 元</strong>
      </div>
    </div>
  </section>
</template>
