<template>
  <div class="bidding-panel">
    <!-- 顶部紧凑标题行 -->
    <div class="bp-head">
      <span class="bp-title">竞价记录（{{ sortedRecords.length }}）</span>
      <a class="bp-publish" @click="$emit('publish')">发布运力</a>
    </div>

    <div v-if="sortedRecords.length === 0" class="bp-empty">
      <span>暂无运力竞价记录</span>
    </div>

    <div v-else class="bp-list">
      <div
        v-for="(record, idx) in sortedRecords"
        :key="record.biddingNo"
        class="bp-card"
        :class="{ highlight: idx === 0 && highlightNew }"
        @click="$emit('view-detail', record)"
      >
        <!-- 卡片头部：竞价编号 + 状态 + 展开箭头 -->
        <div class="bp-card-head">
          <span class="bp-no">{{ record.biddingNo }}</span>
          <span :class="['bp-status', statusClass(record.status)]">{{ record.status }}</span>
          <span class="bp-arrow">›</span>
        </div>

        <!-- 统计行 -->
        <div class="bp-stats">
          <div class="bp-stat"><span class="bp-stat-label">本次运力</span><span class="bp-stat-value">{{ record.totalPublishWeight }}{{ record.unit }}</span></div>
          <div class="bp-stat"><span class="bp-stat-label">报价承运商</span><span class="bp-stat-value">{{ record.quotes.length }} 家</span></div>
          <div class="bp-stat"><span class="bp-stat-label">可见范围</span><span class="bp-stat-value">{{ record.visibilityScope }}</span></div>
        </div>

        <!-- 辅助信息 -->
        <div class="bp-aux">
          <div class="bp-aux-item"><span class="bp-aux-label">发布时间</span><span class="bp-aux-value">{{ record.publishTime }}</span></div>
          <div class="bp-aux-item"><span class="bp-aux-label">报价截止</span><span class="bp-aux-value">{{ record.quoteEnd }}</span></div>
          <div class="bp-aux-item"><span class="bp-aux-label">关联调度</span><span v-if="record.dispatchNo" class="bp-aux-value">{{ record.dispatchNo }}</span><span v-else class="bp-aux-value bp-muted">-</span></div>
        </div>

        <!-- 操作 -->
        <div class="bp-ops">
          <a class="bp-link" @click.stop="$emit('view-detail', record)">查看报价</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
})

defineEmits(['view-detail', 'publish'])

const highlightNew = ref(false)

const sortedRecords = computed(() => {
  const records = props.plan.capacityBiddingRecords || []
  return [...records].sort((a, b) => (b.publishTime || '').localeCompare(a.publishTime || ''))
})

// 新发布成功后短暂高亮首条记录
watch(() => sortedRecords.value.length, () => {
  if (sortedRecords.value.length > 0) {
    nextTick(() => {
      highlightNew.value = true
      setTimeout(() => { highlightNew.value = false }, 1600)
    })
  }
})

function statusClass(status) {
  if (status === '报价中') return 'quoting'
  if (status === '竞价成功') return 'won'
  return 'lost'
}
</script>

<style scoped>
.bidding-panel {
  padding: 12px;
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
}
.bp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bp-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.bp-publish {
  color: #3a65ff;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
}
.bp-publish:hover { opacity: 0.8; }
.bp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260px;
  color: #797b7d;
  font-size: 14px;
}
.bp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bp-card {
  border: 1px solid #e6ebf2;
  border-radius: 4px;
  background: #fff;
  padding: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.bp-card.highlight {
  box-shadow: 0 0 0 1px #3a65ff, 0 0 10px rgba(58, 101, 255, 0.2);
}
.bp-card:hover {
  border-color: #b9cdff;
}
.bp-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bp-no {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.bp-status {
  padding: 1px 8px;
  border-radius: 2px;
  font-size: 12px;
}
.bp-status.quoting { background: #eef4ff; color: #3a65ff; }
.bp-status.won { background: #e8f7ef; color: #1a9e64; }
.bp-status.lost { background: #f2f3f5; color: #8a8f99; }
.bp-arrow {
  margin-left: auto;
  color: #a0a3aa;
  font-size: 16px;
  line-height: 1;
}
.bp-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f2f6;
}
.bp-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bp-stat-label {
  font-size: 12px;
  color: #797b7d;
}
.bp-stat-value {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bp-aux {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f2f6;
}
.bp-aux-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}
.bp-aux-label {
  flex: 0 0 auto;
  font-size: 12px;
  color: #797b7d;
}
.bp-aux-value {
  font-size: 12px;
  color: #333;
}
.bp-muted { color: #a0a3aa; }
.bp-ops {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f2f6;
}
.bp-link {
  color: #3a65ff;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.bp-link:hover { opacity: 0.8; }
</style>
