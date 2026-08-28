<template>
  <div v-if="record" class="cqd-overlay" data-annotation-container="modal" @click.self="close">
    <div class="cqd-dialog" data-annotation-content="modal">
      <!-- 顶部标题栏 -->
      <div class="cqd-header">
        <span class="cqd-title">运力竞价详情</span>
        <button type="button" class="cqd-close" @click="close" aria-label="关闭">×</button>
      </div>

      <div class="cqd-body">
        <!-- 分区标题：竞价信息 -->
        <div class="cqd-section-head">
          <span class="cqd-bar"></span>
          <span class="cqd-section-title">竞价信息</span>
        </div>

        <!-- 浅蓝渐变信息卡：两行六项基础信息 -->
        <div class="cqd-info annot-transport-plan-field-quote-summary">
          <div class="cqd-info-item">
            <span class="cqd-label">竞价编号</span>
            <span class="cqd-value">{{ record.biddingNo }}</span>
          </div>
          <div class="cqd-info-item">
            <span class="cqd-label">竞价状态</span>
            <span class="cqd-value"><span :class="['cqd-status', statusClass(record.status)]">{{ record.status }}</span></span>
          </div>
          <div class="cqd-info-item">
            <span class="cqd-label">本次发布运力</span>
            <span class="cqd-value">{{ record.totalPublishWeight }} {{ record.unit }}</span>
          </div>
          <div class="cqd-info-item">
            <span class="cqd-label">可见范围</span>
            <span class="cqd-value">{{ scopeLabel }}</span>
          </div>
          <div class="cqd-info-item">
            <span class="cqd-label">报价有效期</span>
            <span class="cqd-value">{{ record.quoteStart }} 至 {{ record.quoteEnd }}</span>
          </div>
          <div class="cqd-info-item">
            <span class="cqd-label">报价规则</span>
            <span class="cqd-value">{{ ruleLabel }}</span>
          </div>
        </div>

        <!-- 竞价结果栏：需求确认后展示 -->
        <div v-if="record.status === '已确认'" class="cqd-result">
          <span class="cqd-result-label">竞价结果：</span>
          <span class="cqd-result-carrier">{{ record.confirmedCarrier }}</span>
          <span class="cqd-result-divider">　</span>
          <span class="cqd-result-label">确认报价：</span>
          <span class="cqd-result-value">{{ confirmedPrice }}元/{{ record.unit }}</span>
          <span class="cqd-result-divider">　</span>
          <span class="cqd-result-label">调度编号：</span>
          <span class="cqd-result-value">{{ record.dispatchNo }}</span>
        </div>

        <!-- 分区标题：承运商报价 -->
        <div class="cqd-section-head annot-transport-plan-rule-quote-list">
          <span class="cqd-bar"></span>
          <span class="cqd-quote-title">承运商报价（{{ record.quotes.length }}）</span>
        </div>

        <div v-if="record.quotes.length === 0" class="cqd-empty">
          <span>暂无承运商报价</span>
        </div>

        <div v-else class="cqd-table-wrap">
          <table class="cqd-table">
            <thead>
              <tr>
                <th class="cq-col-no">序号</th>
                <th class="cq-col-carrier">承运商信息</th>
                <th class="cq-col-price">报价单价</th>
                <th class="cq-col-freight">预估总运费</th>
                <th class="cq-col-time">报价时间</th>
                <th class="cq-col-remark">报价说明</th>
                <th class="cq-col-status">报价状态</th>
                <th class="cq-col-op">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(quote, idx) in record.quotes" :key="quote.carrier" class="cqd-row">
                <td class="cq-col-no">{{ idx + 1 }}</td>
                <td class="cq-col-carrier">
                  <div class="cq-carrier">{{ quote.carrier }}</div>
                  <div class="cq-carrier-sub">{{ quote.contactName || '暂无联系人' }} · {{ quote.contactPhone || '-' }}</div>
                </td>
                <td class="cq-col-price">{{ quote.price }} 元/{{ record.unit }}</td>
                <td class="cq-col-freight">{{ quote.totalFreight }} 元</td>
                <td class="cq-col-time">{{ quote.quoteTime }}</td>
                <td class="cq-col-remark" :title="quote.remark || ''">{{ quote.remark || '-' }}</td>
                <td class="cq-col-status">
                  <span :class="['cqd-status', quote.status === '已确认' ? 'won' : quote.status === '已拒绝' ? 'lost' : 'quoting']">{{ quote.status }}</span>
                </td>
                <td class="cq-col-op">
                  <template v-if="record.status === '竞价中' && quote.status === '报价中'">
                    <a class="cqd-link" @click="confirmQuote(quote)">确认</a>
                    <a class="cqd-link cqd-reject" @click="rejectQuote(quote)">拒绝</a>
                  </template>
                  <span v-else class="cqd-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  record: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm-quote', 'reject-quote'])

// 已确认报价金额（需求确认后展示在确认结果栏）
const confirmedPrice = computed(() => {
  if (!props.record) return null
  if (props.record.confirmedPrice != null) return props.record.confirmedPrice
  const q = (props.record.quotes || []).find(x => x.status === '已确认')
  return q ? q.price : null
})

// 可见范围：合并展示指定平台 / 指定承运商
const scopeLabel = computed(() => {
  if (!props.record) return ''
  const scope = props.record.visibilityScope || ''
  const list = props.record.selectedCarriers && props.record.selectedCarriers.length
    ? props.record.selectedCarriers
    : (props.record.selectedPlatforms || props.record.targets || [])
  return list.length ? `${scope} · ${list.join('、')}` : scope
})

// 报价规则：计费条件 + 期望单价合并展示
const ruleLabel = computed(() => {
  if (!props.record) return ''
  const parts = []
  if (props.record.billingMode) parts.push(props.record.billingMode)
  if (props.record.expectedPrice != null && props.record.expectedPrice !== '') {
    parts.push(`期望${props.record.expectedPrice}元/${props.record.unit}`)
  }
  return parts.join(' · ')
})

function statusClass(status) {
  if (status === '竞价中') return 'quoting'
  if (status === '已确认') return 'won'
  return 'lost'
}

function close() {
  emit('close')
}

function confirmQuote(quote) {
  ElMessageBox.confirm(
    `确认接受「${quote.carrier}」的报价（${quote.price}元/${props.record.unit}）吗？确认后，本次竞价将完成并生成正式调度记录，且不可再更换承运商。`,
    '确认报价',
    {
      confirmButtonText: '确认接受',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    emit('confirm-quote', quote)
  }).catch(() => {})
}

function rejectQuote(quote) {
  ElMessageBox.confirm(
    `确认拒绝「${quote.carrier}」提交的报价（${quote.price}元/${props.record.unit}）吗？拒绝后，该报价不可恢复。`,
    '拒绝报价',
    {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    emit('reject-quote', quote.carrier)
  }).catch(() => {})
}
</script>

<style scoped>
.cqd-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 24px;
}
.cqd-dialog {
  width: 100%;
  max-width: calc(100vw - 80px);
  height: calc(100vh - 48px);
  max-height: calc(100vh - 40px);
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.cqd-header {
  flex: 0 0 auto;
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e6ebf2;
}
.cqd-title {
  font-size: 16px;
  font-weight: 700;
  color: #323234;
}
.cqd-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #667085;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.cqd-close:hover {
  color: #3a65ff;
}
.cqd-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}
/* 分区标题：蓝色竖条 + 标题文字 */
.cqd-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.cqd-section-head:not(:first-child) {
  margin-top: 20px;
}
.cqd-bar {
  display: inline-block;
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: #3a65ff;
  flex: 0 0 auto;
}
.cqd-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.cqd-info {
  background: linear-gradient(180deg, #f2f7ff, #f8f9ff);
  border-radius: 4px;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 24px;
}
.cqd-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.cqd-label {
  color: #999999;
  font-size: 12px;
}
.cqd-value {
  color: #333;
  font-size: 14px;
  word-break: break-all;
}
/* 状态胶囊（参考结算单详情待打款/部分打款样式） */
.cqd-status {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 17px;
}
.cqd-status.quoting { background: #f0f3ff; color: #3a65ff; }
.cqd-status.won { background: #e8f7ef; color: #1a9e64; }
.cqd-status.lost { background: #f0f2f5; color: #8a8f99; }
.cqd-quote-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
/* 竞价结果栏：竞价成功后展示 */
.cqd-result {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 16px;
  background: #f8f9ff;
  border: 1px solid #e3ecff;
  border-radius: 4px;
  font-size: 14px;
}
.cqd-result-label { color: #999; flex: 0 0 auto; }
.cqd-result-carrier { color: #333; font-weight: 700; flex: 0 0 auto; }
.cqd-result-value { color: #333; flex: 0 0 auto; }
.cqd-result-divider { color: #d8dce6; flex: 0 0 auto; }
.cqd-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  border: 1px solid #e6ebf2;
  border-radius: 4px;
  color: #797b7d;
  font-size: 14px;
}
.cqd-table-wrap {
  border: 1px solid #ebebeb;
  border-radius: 4px;
  overflow: hidden;
}
.cqd-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.cqd-table th,
.cqd-table td {
  padding: 8px 12px;
  border-right: 1px solid #ebebeb;
  border-bottom: 1px solid #ebebeb;
  font-size: 14px;
  text-align: left;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.cqd-table th:last-child,
.cqd-table td:last-child { border-right: none; }
.cqd-table tbody tr:last-child td { border-bottom: none; }
.cqd-table thead th {
  height: 28px;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 400;
  line-height: 28px;
  padding: 0 12px;
}
.cq-col-no { width: 6%; }
.cq-col-carrier { width: 22%; }
.cq-col-price { width: 12%; }
.cq-col-freight { width: 12%; }
.cq-col-time { width: 13%; }
.cq-col-remark { width: 16%; }
.cq-col-status { width: 9%; }
.cq-col-op { width: 10%; }
.cq-carrier {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cq-carrier-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #797b7d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cqd-link {
  color: #3a65ff;
  cursor: pointer;
  text-decoration: none;
}
.cqd-link:hover { opacity: 0.8; }
.cqd-reject {
  margin-left: 12px;
  color: #e5484d;
}
.cqd-muted { color: #a0a3aa; }
</style>
