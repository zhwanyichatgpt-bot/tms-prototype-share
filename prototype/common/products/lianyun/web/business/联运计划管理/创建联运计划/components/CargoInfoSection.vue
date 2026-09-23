<script setup>
import { ref } from 'vue'
import { stowageModes, cargoRows as mockRows } from '../mock-data'

const activeMode = ref('按数量')
const rows = ref(mockRows.map(r => ({ ...r })))
const editing = ref(null)

function addRow() {
  rows.value.push({ id: `c${Date.now()}`, name: '', volume: 0, weight: 0, quantity: 0, unitPrice: 0, totalPrice: 0, package: '', remark: '', editing: true })
}
function removeRow(index) {
  rows.value.splice(index, 1)
}
function editRow(row) {
  editing.value = row.id
}
function saveRow() {
  editing.value = null
}
</script>

<template>
  <section class="cp-section">
    <h3 class="cp-section-title">货品信息</h3>

    <!-- 配载方式 -->
    <div class="cp-stowage">
      <span class="cp-stowage-label">配载方式</span>
      <label v-for="m in stowageModes" :key="m" class="cp-radio" :class="{ on: activeMode === m }">
        <input v-model="activeMode" type="radio" :value="m" />
        <span class="cp-radio-dot"></span>{{ m }}
      </label>
    </div>

    <!-- 货品表格 -->
    <div class="cp-table-wrap">
      <table class="cp-table">
        <thead>
          <tr>
            <th class="col-cargo">货品 <i class="cp-th-icon">⊙</i></th>
            <th>发货体积（m³）</th>
            <th>发货重量（吨）</th>
            <th>发货数量</th>
            <th>货品单价（元）</th>
            <th>货品总价（元）</th>
            <th>货品包装</th>
            <th>货品备注</th>
            <th class="col-op">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.id">
            <td>
              <select v-if="editing === row.id || row.editing" v-model="row.name" class="cp-cell-input">
                <option value="">请选择</option>
                <option>玉米</option><option>小麦</option>
              </select>
              <span v-else>{{ row.name }}</span>
            </td>
            <td><input v-if="editing === row.id || row.editing" v-model.number="row.volume" class="cp-cell-input" type="number" /><span v-else>{{ row.volume }}</span></td>
            <td><input v-if="editing === row.id || row.editing" v-model.number="row.weight" class="cp-cell-input" type="number" /><span v-else>{{ row.weight }}</span></td>
            <td><input v-if="editing === row.id || row.editing" v-model.number="row.quantity" class="cp-cell-input" type="number" /><span v-else>{{ row.quantity }}</span></td>
            <td><input v-if="editing === row.id || row.editing" v-model.number="row.unitPrice" class="cp-cell-input" type="number" /><span v-else>{{ row.unitPrice }}</span></td>
            <td><input v-if="editing === row.id || row.editing" v-model.number="row.totalPrice" class="cp-cell-input" type="number" /><span v-else>{{ row.totalPrice }}</span></td>
            <td>
              <select v-if="editing === row.id || row.editing" v-model="row.package" class="cp-cell-input">
                <option value="">请选择</option><option>散装</option><option>袋装</option><option>箱装</option>
              </select>
              <span v-else>{{ row.package }}</span>
            </td>
            <td><input v-if="editing === row.id || row.editing" v-model="row.remark" class="cp-cell-input" type="text" placeholder="请输入" /><span v-else class="cp-remark">{{ row.remark }}</span></td>
            <td class="col-op">
              <template v-if="editing === row.id || row.editing">
                <button type="button" class="cp-link danger" @click="removeRow(i)">删除</button>
                <button type="button" class="cp-link" @click="saveRow">保存</button>
              </template>
              <template v-else>
                <button type="button" class="cp-link" @click="editRow(row)">编辑</button>
                <button type="button" class="cp-link danger" @click="removeRow(i)">删除</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button type="button" class="cp-add-btn" @click="addRow">添加货品</button>
  </section>
</template>
