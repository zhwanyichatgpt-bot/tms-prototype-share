<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-expand', 'action'])

const statusClass = computed(() => {
  const map = {
    待审批: 'pending',
    生效中: 'active',
    已暂停: 'paused',
    已完成: 'finished',
    已终止: 'terminated',
    已作废: 'cancelled',
  }
  return map[props.plan.status] || 'pending'
})

// 各状态可用操作（按设计稿行尾操作）
const actions = computed(() => {
  const map = {
    待审批: ['删除', '详情', '编辑'],
    生效中: ['详情', '暂停', '作废'],
    已暂停: ['详情', '开启', '作废'],
    已完成: ['详情'],
    已终止: ['删除', '详情', '编辑'],
    已作废: ['删除', '详情'],
  }
  return map[props.plan.status] || ['详情']
})

const modeClass = (mode) => {
  const map = { 汽运: 'road', 公路: 'road', 水运: 'water', 水路: 'water', 火运: 'rail', 铁运: 'rail', 铁路: 'rail' }
  return map[mode] || 'road'
}

function onAction(name) {
  emit('action', { name, plan: props.plan })
}

function dotLeft(i, count) {
  if (count <= 1) return '0%'
  return `calc(${(i / (count - 1)) * 100}% - 3px)`
}
</script>

<template>
  <article class="plan-card" :class="{ expanded }">
    <!-- 主行 -->
    <div class="pc-main">
      <button type="button" class="pc-expand" :class="{ open: expanded }" @click="emit('toggle-expand', plan)" aria-label="展开">
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 3.5L8 1" stroke="#3D4050" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <div class="pc-tags">
        <span class="pc-tag pc-tag-combine">{{ plan.combineTag }}</span>
        <span class="pc-tag pc-tag-change">{{ plan.changeTag }}</span>
      </div>

      <h3 class="pc-title" :title="plan.title">{{ plan.title }}</h3>

      <span class="pc-status-pill" :class="statusClass">{{ plan.status }}</span>

      <!-- 运输进度 -->
      <div class="pc-progress">
        <div class="pc-progress-track">
          <div class="pc-progress-bar" :style="{ width: plan.progress.percent + '%' }"></div>
          <i v-for="(leg, i) in plan.progress.legs" :key="i" class="pc-progress-dot" :style="{ left: dotLeft(i, plan.progress.legs.length) }"></i>
          <em class="pc-progress-percent">{{ plan.progress.percent }}%</em>
        </div>
        <div class="pc-progress-legs">
          <span v-for="(leg, i) in plan.progress.legs" :key="i" :class="{ on: i === 0 }">{{ leg }}</span>
        </div>
      </div>

      <!-- 装/卸地址 -->
      <div class="pc-addr">
        <div class="pc-addr-row">
          <span class="pc-addr-badge load">装</span>
          <div class="pc-addr-text">
            <strong>{{ plan.loadAddr.alias }}</strong>
            <span>{{ plan.loadAddr.time }}</span>
          </div>
        </div>
        <div class="pc-addr-row">
          <span class="pc-addr-badge unload">卸</span>
          <div class="pc-addr-text">
            <strong>{{ plan.unloadAddr.alias }}</strong>
            <span>{{ plan.unloadAddr.time }}</span>
          </div>
        </div>
      </div>

      <span class="pc-settle-pill">{{ plan.settleStatus }}</span>

      <div class="pc-actions">
        <button
          v-for="a in actions"
          :key="a"
          type="button"
          class="pc-action"
          :class="{ danger: a === '删除' || a === '作废' }"
          @click="onAction(a)"
        >{{ a }}</button>
      </div>
    </div>

    <!-- 展开区 -->
    <div v-if="expanded" class="pc-expand-body">
      <!-- 子行详情网格 -->
      <div class="pc-detail-grid">
        <div class="pc-detail-item carrier">
          <span class="pc-detail-label">承运企业</span>
          <div class="pc-carrier">
            <span class="pc-carrier-logo">{{ plan.carrier.logoText }}</span>
            <strong>{{ plan.carrier.name }}</strong>
          </div>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">关联运单</span>
          <a class="pc-link" @click.prevent="onAction('关联运单')">{{ plan.waybillName }}</a>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">货物</span>
          <strong>{{ plan.cargo }}</strong>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">集装箱</span>
          <strong>{{ plan.containers }}</strong>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">运输单价</span>
          <strong>{{ plan.unitPrice }}</strong>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">基础运费</span>
          <strong>{{ plan.baseFreight }}</strong>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">创建人</span>
          <strong>{{ plan.creator }}</strong>
        </div>
        <div class="pc-detail-item">
          <span class="pc-detail-label">创建时间</span>
          <strong>{{ plan.createTime }}</strong>
        </div>
      </div>

      <!-- 路段列表 -->
      <div class="pc-segments">
        <div v-for="(seg, si) in plan.segments" :key="si" class="pc-segment">
          <div class="pc-segment-head">
            <button type="button" class="pc-seg-toggle"><svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 3.5L8 1" stroke="#3D4050" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <span class="pc-seg-name">{{ seg.name }}</span>
            <span class="pc-mode-tag" :class="modeClass(seg.mode)">
              <i class="pc-mode-icon" aria-hidden="true"></i>{{ seg.mode }}
            </span>
            <span class="pc-cargotype-tag">{{ seg.cargoType }}</span>
            <a class="pc-seg-plan" @click.prevent="onAction('路段计划')">{{ seg.planName }}</a>
            <span class="pc-seg-status"><i class="pc-seg-dot"></i>{{ seg.status }}</span>
          </div>
          <div class="pc-seg-nodes">
            <div v-for="(n, ni) in seg.nodes" :key="ni" class="pc-node">
              <span class="pc-node-badge" :class="n.type === '卸' ? 'unload' : 'load'">{{ n.type }}</span>
              <span class="pc-node-city">{{ n.city }}</span>
              <span class="pc-node-address">{{ n.address }}</span>
              <span class="pc-node-time">{{ n.timeLabel }}：{{ n.time }}</span>
              <span class="pc-node-cargo">{{ n.cargo }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
