<script setup>
/**
 * 结算单列表 —— 按真实系统 运输结算3.0 列表页复刻
 * 只承载列表页状态与交互，系统框架由 App.vue 提供。
 */
import { computed, ref } from 'vue'
import { settlementRows, statusOptions, partyOptions, creatorOptions } from '../mock-data'

const emit = defineEmits(['create', 'notice', 'detail'])

const asset = (name) => `/transport-settlement-assets/${name}`

const tabs = [
  { key: 'settlements', label: '结算单列表' },
  { key: 'pending', label: '待结算列表' },
  { key: 'waybills', label: '运单列表(已核算)' },
]
const activeTab = ref('settlements')

const keyword = ref('')
const appliedKeyword = ref('')
const status = ref('全部')
const party = ref('')
const creator = ref('')
const openSelect = ref('')
const createMenuOpen = ref(false)

const page = ref(1)
const pageSize = ref(10)

const checked = ref([])

const filteredRows = computed(() => {
  let rows = settlementRows
  if (appliedKeyword.value.trim()) {
    const kw = appliedKeyword.value.trim()
    rows = rows.filter((row) => row.id.includes(kw) || row.settleParty.includes(kw))
  }
  if (status.value && status.value !== '全部') {
    rows = rows.filter((row) => row.payStatus === status.value)
  }
  if (party.value) rows = rows.filter((row) => row.settleParty === party.value)
  if (creator.value) rows = rows.filter((row) => row.creator === creator.value)
  return rows
})

const total = computed(() => filteredRows.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const allChecked = computed(() => pagedRows.value.length > 0 && pagedRows.value.every((row) => checked.value.includes(row.id)))
const selectedCount = computed(() => checked.value.length)
const selectedAmount = computed(() => {
  const sum = settlementRows
    .filter((row) => checked.value.includes(row.id))
    .reduce((acc, row) => acc + (Number(row.total) || 0), 0)
  return Number.isInteger(sum) ? String(sum) : sum.toFixed(2)
})

function toggleAll() {
  if (allChecked.value) {
    checked.value = checked.value.filter((id) => !pagedRows.value.some((row) => row.id === id))
  } else {
    const ids = pagedRows.value.map((row) => row.id)
    checked.value = [...new Set([...checked.value, ...ids])]
  }
}

function toggleRow(row) {
  const index = checked.value.indexOf(row.id)
  if (index >= 0) checked.value.splice(index, 1)
  else checked.value.push(row.id)
}

function applyFilters() {
  appliedKeyword.value = keyword.value
  page.value = 1
  openSelect.value = ''
  createMenuOpen.value = false
  emit('notice', '查询完成')
}

function resetFilters() {
  keyword.value = ''
  appliedKeyword.value = ''
  status.value = '全部'
  party.value = ''
  creator.value = ''
  page.value = 1
  openSelect.value = ''
  emit('notice', '已重置查询条件')
}

function choose(field, value) {
  if (field === 'status') status.value = value
  if (field === 'party') party.value = value
  if (field === 'creator') creator.value = value
  openSelect.value = ''
  page.value = 1
}

function goPage(target) {
  if (target < 1 || target > pageCount.value) return
  page.value = target
}

function openCreate(option) {
  createMenuOpen.value = false
  emit('create', option)
}

function switchTab(key) {
  activeTab.value = key
  page.value = 1
  openSelect.value = ''
  createMenuOpen.value = false
}
</script>

<template>
  <div class="ts-content">
    <!-- 顶部页签 -->
    <div class="ts-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="ts-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <template v-if="activeTab === 'settlements'">
      <!-- 查询区 -->
      <div class="ts-search">
        <div class="ts-search-fields">
          <div class="ts-input-box search">
            <svg class="ts-magnifier" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4" />
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <input v-model="keyword" placeholder="请输入结算单号搜索" @keyup.enter="applyFilters" />
          </div>

          <div class="ts-select-field" style="width: 255px" @click="openSelect = openSelect === 'status' ? '' : 'status'">
            <span class="ts-select-label">状态</span>
            <span class="ts-select-value">{{ status }}</span>
            <span class="ts-caret" />
            <div v-if="openSelect === 'status'" class="ts-select-pop">
              <div
                v-for="item in statusOptions"
                :key="item"
                class="ts-select-option"
                :class="{ selected: status === item }"
                @click.stop="choose('status', item)"
              >
                {{ item }}
              </div>
            </div>
          </div>

          <div class="ts-select-field" style="width: 283px" @click="openSelect = openSelect === 'party' ? '' : 'party'">
            <span class="ts-select-value" :class="{ placeholder: !party }">{{ party || '请选择' }}</span>
            <span class="ts-caret" />
            <div v-if="openSelect === 'party'" class="ts-select-pop">
              <div
                v-for="item in partyOptions"
                :key="item"
                class="ts-select-option"
                :class="{ selected: party === item }"
                @click.stop="choose('party', item)"
              >
                {{ item }}
              </div>
            </div>
          </div>

          <div class="ts-select-field" style="width: 269px" @click="openSelect = openSelect === 'creator' ? '' : 'creator'">
            <span class="ts-select-value" :class="{ placeholder: !creator }">{{ creator || '请选择' }}</span>
            <span class="ts-caret" />
            <div v-if="openSelect === 'creator'" class="ts-select-pop">
              <div
                v-for="item in creatorOptions"
                :key="item"
                class="ts-select-option"
                :class="{ selected: creator === item }"
                @click.stop="choose('creator', item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div class="ts-search-actions">
          <button class="ts-btn plain" type="button">更多</button>
          <button class="ts-icon-btn" type="button" title="重置" @click="resetFilters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.2 6.2A5.4 5.4 0 1 0 13.4 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              <path d="M13.6 2.6V6.4H9.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="ts-btn primary" type="button" style="width: 80px" @click="applyFilters">搜索</button>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="ts-toolbar">
        <div style="position: relative">
          <button class="ts-btn primary" type="button" style="width: 105px" @click="createMenuOpen = !createMenuOpen">
            新增核算<span class="caret-down" />
          </button>
          <div v-if="createMenuOpen" class="ts-dropdown" style="min-width: 132px">
            <div class="ts-dropdown-item" @click="openCreate('散杂货')">新增散杂货核算</div>
            <div class="ts-dropdown-item" @click="openCreate('集装箱')">新增集装箱核算</div>
          </div>
        </div>
        <button class="ts-btn default" type="button" style="width: 127px" @click="emit('notice', '结算单 PDF 导出待接入')">
          导出结算单PDF
        </button>
        <button class="ts-btn plain" type="button" style="width: 80px" @click="emit('notice', '导出功能待接入')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px">
            <path d="M8 2v8m0 0 3-3m-3 3L5 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 11.5V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>导出
        </button>
        <button class="ts-btn plain" type="button" style="width: 80px" @click="emit('notice', '排序功能待接入')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px">
            <path d="M3 4h10M3 8h7M3 12h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>排序
        </button>
      </div>

      <!-- 表格 -->
      <div class="ts-table-wrap">
        <table class="ts-table">
          <colgroup>
            <col style="width: 50px" />
            <col style="width: 320px" />
            <col style="width: 200px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 120px" />
            <col style="width: 180px" />
          </colgroup>
          <thead>
            <tr>
              <th class="col-check">
                <span class="ts-checkbox" :class="{ checked: allChecked }" @click="toggleAll" />
              </th>
              <th>结算单号</th>
              <th>结算企业</th>
              <th>打款状态</th>
              <th>运单数</th>
              <th>结算总额</th>
              <th>累计基础运费</th>
              <th>累计路耗</th>
              <th>累计在途费用</th>
              <th>累计扣减运费</th>
              <th>备注</th>
              <th class="col-op">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td class="col-check">
                <span class="ts-checkbox" :class="{ checked: checked.includes(row.id) }" @click="toggleRow(row)" />
              </td>
              <td>
                <div class="ts-settle-no">
                  <img :src="asset('pdf.png')" alt="" />
                  <div class="ts-settle-text">
                    <div class="ts-black-title">
                      <span>{{ row.id }}</span>
                      <span
                        class="ts-status-inline"
                        :class="row.status === '已打款' ? 'green' : 'blue'"
                      >{{ row.status }}</span>
                    </div>
                    <div class="ts-grey-title">{{ row.creator }} {{ row.createdAt }} 创建</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="ts-grey-title" style="padding-top: 2px">
                  <p>{{ row.settleParty }}</p>
                  <p>{{ row.settleAt }}</p>
                </div>
              </td>
              <td>
                <span class="ts-tag-pill" :class="row.payStatus === '已打款' ? 'green' : 'blue'">{{ row.payStatus }}</span>
              </td>
              <td>{{ row.waybills }}</td>
              <td>{{ row.total }}</td>
              <td>{{ row.baseFreight }}</td>
              <td>{{ row.roadLoss }}</td>
              <td>{{ row.inTransit }}</td>
              <td>{{ row.deduction }}</td>
              <td>{{ row.remark }}</td>
              <td class="col-op">
                <div class="ts-op-cell">
                  <span class="ts-link" @click="emit('detail', row)">详情</span>
                  <span v-if="row.canVoid" class="ts-link" @click="emit('notice', '作废功能待接入')">作废</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ts-list-footer">
        <div class="ts-pagination">
          <span>共 {{ total }} 条</span>
          <span class="ts-page-size">
            {{ pageSize }}条/页
            <span class="ts-caret" style="border-top-color: #c0c4cc" />
          </span>
          <button class="ts-page-btn" type="button" @click="goPage(page - 1)">‹</button>
          <button
            v-for="n in pageCount"
            :key="n"
            class="ts-page-btn"
            :class="{ active: page === n }"
            type="button"
            @click="goPage(n)"
          >{{ n }}</button>
          <button class="ts-page-btn" type="button" @click="goPage(page + 1)">›</button>
          <span class="ts-page-jump">前往 <input :value="page" /> 页</span>
        </div>
      </div>

      <div class="ts-select-info">
        勾选条数：<b>{{ selectedCount }}</b> 条&nbsp;&nbsp;已结算金额：<b>{{ selectedAmount }}</b>元
      </div>
    </template>

    <template v-else>
      <div class="ts-page-empty">
        <img :src="asset('empty-box.png')" alt="" />
        <p>暂无数据</p>
      </div>
    </template>
  </div>
</template>
