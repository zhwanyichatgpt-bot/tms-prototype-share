<script setup>
import { reactive } from 'vue'

const form = reactive({
  waybillNo: '',
  planName: '',
  shipper: '',
  contact: '',
  phone: '',
  remark: '',
})
</script>

<template>
  <section class="cp-section">
    <h3 class="cp-section-title">基础信息</h3>
    <div class="cp-form-grid">
      <div class="cp-field">
        <label class="cp-label">关联托运单</label>
        <div class="cp-input-wrap">
          <input v-model="form.waybillNo" class="cp-input" type="text" placeholder="请输入" maxlength="10" />
          <span class="cp-count">{{ form.waybillNo.length }}/10</span>
        </div>
      </div>
      <div class="cp-field">
        <label class="cp-label required">计划名称</label>
        <div class="cp-input-wrap">
          <select v-model="form.planName" class="cp-input cp-select">
            <option value="" disabled>请选择</option>
            <option value="福州到上海-9月12日汽运计划">福州到上海-9月12日汽运计划</option>
          </select>
          <span class="cp-caret">▾</span>
        </div>
      </div>
      <div class="cp-field">
        <label class="cp-label required">托运企业</label>
        <div class="cp-input-wrap">
          <select v-model="form.shipper" class="cp-input cp-select">
            <option value="" disabled>请选择</option>
            <option value="福建万维宇宙科技有限公司">福建万维宇宙科技有限公司</option>
          </select>
          <span class="cp-caret">▾</span>
        </div>
      </div>
      <div class="cp-field">
        <label class="cp-label required">联系人</label>
        <div class="cp-input-wrap">
          <input v-model="form.contact" class="cp-input" type="text" placeholder="请输入" />
        </div>
      </div>
      <div class="cp-field">
        <label class="cp-label required">联系电话</label>
        <div class="cp-input-wrap">
          <input v-model="form.phone" class="cp-input" type="text" placeholder="请输入" />
        </div>
      </div>
      <div class="cp-field">
        <label class="cp-label">备注</label>
        <div class="cp-input-wrap">
          <input v-model="form.remark" class="cp-input" type="text" placeholder="请输入" />
        </div>
      </div>
    </div>
  </section>
</template>
