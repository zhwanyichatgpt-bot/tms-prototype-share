<script setup>
import { ref } from 'vue'
import { extraFeeRows as mockRows } from '../mock-data'

const rows = ref(mockRows.map(r => ({ ...r })))
function addRow() {
  rows.value.push({ id: `e${Date.now()}`, name: '', amount: '', attachment: false })
}
function removeRow(i) {
  rows.value.splice(i, 1)
}
</script>

<template>
  <section class="cp-section">
    <h3 class="cp-section-title">其他费用</h3>
    <div class="cp-table-wrap">
      <table class="cp-table cp-extra-table">
        <thead>
          <tr>
            <th class="col-seq">序号</th>
            <th class="required">费用名称</th>
            <th class="required">总额(元)</th>
            <th>附件(0/3)</th>
            <th class="col-op">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.id">
            <td class="col-seq">{{ i + 1 }}</td>
            <td><input v-model="row.name" class="cp-cell-input" type="text" placeholder="请输入" /></td>
            <td><input v-model="row.amount" class="cp-cell-input" type="number" placeholder="请输入" /></td>
            <td>
              <button type="button" class="cp-attach-btn">＋ 附件</button>
              <span v-if="row.attachment" class="cp-attach-tag">附件 ✕</span>
            </td>
            <td class="col-op"><button type="button" class="cp-link danger" @click="removeRow(i)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button type="button" class="cp-add-btn" @click="addRow">添加</button>
  </section>
</template>
