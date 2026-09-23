<script setup>
/**
 * 运单详情 —— 左侧信息列
 * 运单号卡片 + 运输路线/任务信息/地址变更页签 + 装卸货节点卡片（含附件照片）。
 * 附件缩略图点击可查看大图。
 * 地址变更页签：当前变更卡片 + 历史变更列表，点击记录打开详情抽屉。
 */
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWaybillDetail, addressChangeStatusMeta } from '../mock-data'
import { getChangeData, withdrawChange, getWaybill, actualCarrierConfirm, actualCarrierReject, statusLabelFor } from '../../address-change-store'
import AddressChangeDrawer from './AddressChangeDrawer.vue'

const props = defineProps({
  waybillKey: { type: String, default: '' },
  initialTab: { type: String, default: '' },
})

/* 详情数据按运单 key 合成（路线/地图/费用布局 + 该运单主数据） */
const data = computed(() => getWaybillDetail(props.waybillKey))
/* 初始页签：查看变更时定位到地址变更 */
const activeTab = ref(props.initialTab === 'addressChange' ? 'addressChange' : 'route')

/* 附件大图预览 */
const preview = ref(null) // { label, kind }
function openPreview(att) {
  preview.value = att
}
function closePreview() {
  preview.value = null
}

/* ==================== 地址变更 ==================== */
/* 变更数据从统一数据源派生（响应式）：current 处理中 + history 终态 */
const changeData = getChangeData(props.waybillKey)
const hasProcessing = computed(() => !!changeData.value.current)
/* 当前运单运输组织方式（直接指派船东/委外实际承运商），驱动下游价格命名 */
const currentOrgMode = computed(() => getWaybill(props.waybillKey)?.orgMode || 'direct')
/* 当前运单视角（合同承运商/实际承运商），驱动价格可见性与操作 */
const currentPerspective = computed(() => getWaybill(props.waybillKey)?.perspective || 'contractCarrier')
/* 是否实际承运商视角：隐藏托运企业单价，只展示本企业承运价格 */
const isActualCarrier = computed(() => currentPerspective.value === 'actualCarrier')
/* 本企业（实际承运商）当前给船东的运输单价：确认时作为默认值传给抽屉 */
const currentShipownerPrice = computed(() => getWaybill(props.waybillKey)?.shipownerPrice || null)

/* 当前变更价格是否变化：未变化时卡片不展示价格行 */
const currentPriceChanged = computed(() => {
  const c = changeData.value.current
  if (!c) return false
  return isActualCarrier.value
    ? c.downstream?.newPrice !== c.downstream?.oldPrice
    : c.newPrice !== c.oldPrice
})

/* 详情抽屉 */
const drawerVisible = ref(false)
const drawerRecord = ref(null)
function openDrawer(record) {
  drawerRecord.value = record
  drawerVisible.value = true
}
function closeDrawer() {
  drawerVisible.value = false
}

/* 抽屉打开时锁定页面滚动，只留抽屉自身滚动条 */
watch(drawerVisible, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

/* 撤回变更（船东确认前，合同承运商可撤回）：当前有效地址价格不变，申请转入历史 */
function withdraw(record) {
  ElMessageBox.confirm(
    '撤回后本次地址及运价变更将终止，运单继续使用申请前的有效地址和价格。确定撤回？',
    '撤回变更',
    { confirmButtonText: '确定撤回', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    withdrawChange(props.waybillKey, new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'))
    drawerVisible.value = false
    ElMessage.success('已撤回本次地址变更')
  }).catch(() => {})
}

/* 实际承运商「确认并发送船东」：状态转待船东确认，自动发送当前执行船东；可同时提交给船东的运输单价 */
function actualConfirm(record, shipownerPrice) {
  actualCarrierConfirm(props.waybillKey, new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'), shipownerPrice)
  drawerVisible.value = false
  ElMessage.success('已确认新地址，已发送船东确认')
}

/* 实际承运商「拒绝」：必填拒绝原因，状态转已拒绝，不发送船东 */
function actualReject() {
  ElMessageBox.prompt('请填写拒绝原因', '拒绝地址变更', {
    confirmButtonText: '确定拒绝',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入拒绝原因（必填）',
    inputValidator: (v) => (v && v.trim() ? true : '拒绝原因不能为空'),
  }).then(({ value }) => {
    actualCarrierReject(props.waybillKey, new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'), value.trim())
    drawerVisible.value = false
    ElMessage.success('已拒绝本次地址变更')
  }).catch(() => {})
}

/* 卡片状态文案按视角：实际承运商视角「待实际承运商确认」→「待本企业确认」 */
function statusLabel(status) {
  return statusLabelFor(status, currentPerspective.value)
}
function statusTone(status) {
  return addressChangeStatusMeta[status]?.tone || 'gray'
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
      <button type="button" class="wd-left-tab" :class="{ active: activeTab === 'addressChange' }" @click="activeTab = 'addressChange'">
        地址变更
        <span v-if="hasProcessing" class="wd-tab-dot" aria-label="有处理中变更" />
      </button>
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

    <!-- 地址变更页签 -->
    <template v-else-if="activeTab === 'addressChange'">
      <!-- 当前变更卡片 -->
      <div v-if="changeData.current" class="wd-ac-card processing annot-waybill-detail-beigang-rule-current-change" @click="openDrawer(changeData.current)">
        <div class="wd-ac-card-head">
          <span class="wd-ac-seq">第 {{ changeData.current.seq }} 次变更</span>
          <span class="wd-ac-status" :class="statusTone(changeData.current.status)">{{ statusLabel(changeData.current.status) }}</span>
        </div>
        <div class="wd-ac-card-body">
          <div class="wd-ac-line wd-ac-line-addr">
            <span class="wd-ac-label">卸货地址</span>
            <span class="wd-ac-addr">
              <span class="wd-ac-addr-row">
                <span class="wd-ac-addr-tag old">原</span>
                <span class="wd-ac-addr-old">{{ changeData.current.oldAddress }}</span>
              </span>
              <span class="wd-ac-addr-row">
                <span class="wd-ac-addr-tag new">新</span>
                <span class="wd-ac-addr-new">{{ changeData.current.newAddress }}</span>
              </span>
            </span>
          </div>
          <div v-if="currentPriceChanged" class="wd-ac-line">
            <span class="wd-ac-label">{{ isActualCarrier ? '本企业承运价格' : '托运企业单价' }}</span>
            <span class="wd-ac-price" v-if="isActualCarrier">{{ changeData.current.downstream.oldPrice }} → <b>{{ changeData.current.downstream.newPrice }}</b> {{ changeData.current.downstream.unit }}</span>
            <span class="wd-ac-price" v-else>{{ changeData.current.oldPrice }} → <b>{{ changeData.current.newPrice }}</b> {{ changeData.current.priceUnit }}</span>
          </div>
          <div class="wd-ac-line">
            <span class="wd-ac-label">发起方</span>
            <span class="wd-ac-value">{{ changeData.current.initiator }} · {{ changeData.current.initiateTime }}</span>
          </div>
        </div>
        <div class="wd-ac-card-foot">查看详情</div>
      </div>

      <!-- 历史变更列表 -->
      <template v-if="changeData.history.length">
        <div class="wd-ac-history-title annot-waybill-detail-beigang-rule-change-history">历史变更</div>
        <div
          v-for="record in changeData.history"
          :key="record.id"
          class="wd-ac-card history"
          @click="openDrawer(record)"
        >
          <div class="wd-ac-card-head">
            <span class="wd-ac-seq">第 {{ record.seq }} 次变更</span>
            <span class="wd-ac-status" :class="statusTone(record.status)">{{ statusLabel(record.status) }}</span>
          </div>
          <div class="wd-ac-card-body">
            <div class="wd-ac-line wd-ac-line-addr">
              <span class="wd-ac-label">卸货地址</span>
              <span class="wd-ac-addr">
                <span class="wd-ac-addr-row">
                  <span class="wd-ac-addr-tag old">原</span>
                  <span class="wd-ac-addr-old">{{ record.oldAddress }}</span>
                </span>
                <span class="wd-ac-addr-row">
                  <span class="wd-ac-addr-tag new">新</span>
                  <span class="wd-ac-addr-new">{{ record.newAddress }}</span>
                </span>
              </span>
            </div>
            <div class="wd-ac-line">
              <span class="wd-ac-label">发起方</span>
              <span class="wd-ac-value">{{ record.initiator }} · {{ record.initiateTime }}</span>
            </div>
          </div>
          <div class="wd-ac-card-foot">查看详情</div>
        </div>
      </template>

      <!-- 空态 -->
      <div v-if="!changeData.current && !changeData.history.length" class="wd-tab-empty">
        暂无地址变更记录
      </div>
    </template>

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

    <!-- 地址变更详情抽屉 -->
    <AddressChangeDrawer
      :visible="drawerVisible"
      :record="drawerRecord"
      :org-mode="currentOrgMode"
      :perspective="currentPerspective"
      :shipowner-price="currentShipownerPrice"
      @close="closeDrawer"
      @withdraw="withdraw"
      @actual-confirm="actualConfirm"
      @actual-reject="actualReject"
    />
  </aside>
</template>
