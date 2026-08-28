<script setup>
/**
 * 运单详情 —— 左侧信息列
 * 运单号卡片 + 运输路线/任务信息页签 + 装卸货节点卡片（含附件照片）。
 * 附件缩略图点击可查看大图。
 */
import { computed, ref } from 'vue'
import { getWaybillDetail } from '../mock-data'

const props = defineProps({
  waybillKey: { type: String, default: '' },
  initialTab: { type: String, default: '' },
})

/* 详情数据按运单 key 合成（路线/地图/费用布局 + 该运单主数据） */
const data = computed(() => getWaybillDetail(props.waybillKey))
/* 初始页签：默认运输路线 */
const activeTab = ref(['route', 'task'].includes(props.initialTab) ? props.initialTab : 'route')

/* 附件大图预览 */
const preview = ref(null) // { label, kind }
function openPreview(att) {
  preview.value = att
}
function closePreview() {
  preview.value = null
}
</script>

<template>
  <aside class="wd-left">
    <!-- 运单号卡片 -->
    <div class="wd-waybill-card">
      <div class="wd-waybill-no-row">
        <span class="wd-waybill-no">运单号：{{ data.waybillNo }}</span>
        <span class="wd-status-badge">{{ data.statusLabel }}</span>
      </div>
      <div class="wd-vehicle-row">
        <span class="wd-vehicle-icon" aria-hidden="true" />
        <span class="wd-vehicle-text">
          <span class="wd-vehicle-plate">{{ data.vehicle.plate }}</span>
          <span class="wd-vehicle-driver">主驾 {{ data.vehicle.driver }} {{ data.vehicle.phone }}</span>
        </span>
      </div>
    </div>

    <!-- 页签 -->
    <div class="wd-left-tabs">
      <button type="button" class="wd-left-tab" :class="{ active: activeTab === 'route' }" @click="activeTab = 'route'">运输路线</button>
      <button type="button" class="wd-left-tab" :class="{ active: activeTab === 'task' }" @click="activeTab = 'task'">任务信息</button>
    </div>

    <!-- 运输路线页签：装卸货节点卡片 -->
    <template v-if="activeTab === 'route'">
      <div v-for="node in data.route" :key="node.key" class="wd-node-card">
        <div class="wd-node-head">
          <span class="wd-node-sign" :class="node.tone">{{ node.sign }}</span>
          <span class="wd-node-name">{{ node.name }}</span>
          <svg class="wd-node-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="#c0c4cc" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="wd-node-body">
          <div class="wd-node-address">{{ node.address }}</div>
          <div class="wd-node-line">联系人：{{ node.contact }}（{{ node.phone }}）</div>
          <div class="wd-node-line">计划{{ node.key === 'load' ? '装货' : '卸货' }}：{{ node.planTime }}</div>
          <div class="wd-node-line">{{ node.actualLabel }}：{{ node.actualTime }}</div>
          <div v-for="(c, i) in node.cargo" :key="i" class="wd-node-cargo">
            <span class="wd-cargo-type">{{ c.type }}</span>
            <span class="wd-cargo-sep">|</span>
            <span class="wd-cargo-name">{{ c.name }}</span>
            <span class="wd-cargo-weight">重量:{{ c.weight }}</span>
          </div>
        </div>

        <!-- 附件照片（装货单/卸货单/回单） -->
        <div v-for="att in node.attachments" :key="att.key" class="wd-node-att">
          <div class="wd-att-label">{{ att.label }}：</div>
          <button type="button" class="wd-att-thumb" :title="`查看${att.label}大图`" @click="openPreview(att)">
            <!-- 单据样式缩略图 -->
            <svg v-if="att.kind === 'bill'" class="wd-att-img" viewBox="0 0 120 84" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="118" height="82" rx="3" fill="#fff" stroke="#dfe3ee"/>
              <rect x="10" y="10" width="52" height="8" rx="2" fill="#3a65ff" opacity="0.85"/>
              <rect x="10" y="24" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="33" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="42" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="51" width="64" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="64" width="30" height="10" rx="2" fill="#20be8d" opacity="0.7"/>
              <rect x="80" y="62" width="30" height="12" rx="6" fill="none" stroke="#f56c6c" stroke-width="1.5" opacity="0.6"/>
            </svg>
            <!-- 现场照片样式缩略图 -->
            <svg v-else class="wd-att-img" viewBox="0 0 120 84" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="118" height="82" rx="3" fill="#e8edf3" stroke="#dfe3ee"/>
              <rect x="1" y="46" width="118" height="37" fill="#d5dde6"/>
              <rect x="34" y="38" width="52" height="22" rx="3" fill="#c24a3f"/>
              <rect x="38" y="30" width="26" height="12" rx="2" fill="#c24a3f"/>
              <rect x="40" y="33" width="10" height="7" rx="1" fill="#dfe9f2"/>
              <rect x="88" y="42" width="20" height="18" rx="2" fill="#9aa7b9"/>
              <circle cx="46" cy="62" r="5" fill="#3d4050"/>
              <circle cx="74" cy="62" r="5" fill="#3d4050"/>
              <circle cx="46" cy="62" r="2" fill="#b8c2d0"/>
              <circle cx="74" cy="62" r="2" fill="#b8c2d0"/>
              <circle cx="18" cy="16" r="6" fill="#f5d67b" opacity="0.9"/>
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- 任务信息页签：占位 -->
    <div v-else-if="activeTab === 'task'" class="wd-tab-empty">任务信息待补充</div>

    <!-- 附件大图预览弹层 -->
    <Teleport to="body">
      <div v-if="preview" class="wd-att-preview-mask" @click.self="closePreview">
        <div class="wd-att-preview">
          <div class="wd-att-preview-head">
            <span>{{ preview.label }}</span>
            <button type="button" class="wd-att-preview-close" aria-label="关闭" @click="closePreview">×</button>
          </div>
          <div class="wd-att-preview-body">
            <svg v-if="preview.kind === 'bill'" class="wd-att-preview-img" viewBox="0 0 120 84" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="118" height="82" rx="3" fill="#fff" stroke="#dfe3ee"/>
              <rect x="10" y="10" width="52" height="8" rx="2" fill="#3a65ff" opacity="0.85"/>
              <rect x="10" y="24" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="33" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="42" width="100" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="51" width="64" height="5" rx="2" fill="#eef0f5"/>
              <rect x="10" y="64" width="30" height="10" rx="2" fill="#20be8d" opacity="0.7"/>
              <rect x="80" y="62" width="30" height="12" rx="6" fill="none" stroke="#f56c6c" stroke-width="1.5" opacity="0.6"/>
            </svg>
            <svg v-else class="wd-att-preview-img" viewBox="0 0 120 84" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="118" height="82" rx="3" fill="#e8edf3" stroke="#dfe3ee"/>
              <rect x="1" y="46" width="118" height="37" fill="#d5dde6"/>
              <rect x="34" y="38" width="52" height="22" rx="3" fill="#c24a3f"/>
              <rect x="38" y="30" width="26" height="12" rx="2" fill="#c24a3f"/>
              <rect x="40" y="33" width="10" height="7" rx="1" fill="#dfe9f2"/>
              <rect x="88" y="42" width="20" height="18" rx="2" fill="#9aa7b9"/>
              <circle cx="46" cy="62" r="5" fill="#3d4050"/>
              <circle cx="74" cy="62" r="5" fill="#3d4050"/>
              <circle cx="46" cy="62" r="2" fill="#b8c2d0"/>
              <circle cx="74" cy="62" r="2" fill="#b8c2d0"/>
              <circle cx="18" cy="16" r="6" fill="#f5d67b" opacity="0.9"/>
            </svg>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>
