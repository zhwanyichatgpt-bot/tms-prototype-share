<template>
  <div class="wd-preview">
    <main class="wd-screen" aria-label="运单详情">
      <div class="wd-scroll">
        <!-- 1. 顶部航线地图区 -->
        <section class="map-section annot-shipowner-waybill-detail-field-route">
          <img class="map-image" src="/cargo-detail-map.png" alt="运输路线地图" />
          <img class="status-bar" src="/shipowner-statusbar.svg" alt="" />

          <button type="button" class="back-button" aria-label="返回" @click="onBack">
            <van-icon name="arrow-left" size="22" color="#333333" />
          </button>
          <h1>运单详情</h1>

          <img class="route-image" src="/cargo-detail-route.svg" alt="" />
          <div class="port-card load-port">
            <span class="port-label load-label">装货港</span>
            <div class="port-content">{{ detail.originPort }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
          <div class="port-card unload-port">
            <span class="port-label unload-label">卸货港</span>
            <div class="port-content">{{ currentDest.port }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
        </section>

        <!-- 2. 下方面板区 -->
        <section class="detail-sheet">
          <!-- 货物与时间摘要卡 -->
          <section class="design-card summary-card annot-shipowner-waybill-detail-field-summary">
            <div class="summary-top">
              <strong>{{ detail.cargoName }} {{ detail.cargoWeight }}</strong>
              <div class="my-price">
                <b>¥{{ detail.freightAmount }}</b>
              </div>
            </div>
            <div class="time-row">
              <div class="time-block">
                <b>{{ detail.startTime }}</b>
                <span>{{ detail.startDate }}</span>
              </div>
              <div class="duration">
                <i></i>
                <span>{{ detail.durationText }}</span>
                <i></i>
              </div>
              <div class="time-block align-right">
                <b>{{ detail.endTime }}</b>
                <span>{{ detail.endDate }}</span>
              </div>
            </div>
            <div class="summary-tags">
              <span>{{ detail.cargoTag }}</span>
              <span>{{ detail.freightTag }}</span>
              <span>{{ detail.gateTag }}</span>
            </div>
          </section>

          <!-- 起终点地址卡：只展示当前有效卸货地址 -->
          <section class="design-card address-card annot-shipowner-waybill-detail-field-address">
            <div class="address-list">
              <div class="address-item">
                <span class="address-mark start">起</span>
                <div>
                  <b>{{ detail.originPort }}</b>
                  <span>{{ detail.originAddr }}</span>
                </div>
                <img src="/cargo-detail-location.svg" alt="" />
              </div>
              <div class="address-rail"></div>
              <div class="address-item">
                <span class="address-mark end">终</span>
                <div>
                  <b>{{ currentDest.port }}</b>
                  <span>{{ currentDest.addr }}</span>
                </div>
                <img src="/cargo-detail-location.svg" alt="" />
              </div>
            </div>
          </section>

          <!-- 船闸进度卡 -->
          <section class="design-card gate-card annot-shipowner-waybill-detail-field-gate">
            <div
              v-for="(gate, i) in detail.gates"
              :key="i"
              class="gate-item"
              :class="{ last: i === detail.gates.length - 1 }"
            >
              <span class="gate-badge" :class="gate.statusCls">{{ gate.status }}</span>
              <div class="gate-body">
                <div class="gate-row">
                  <b class="gate-name">{{ gate.name }}</b>
                  <span class="gate-time">{{ gate.time }}</span>
                </div>
                <div class="gate-desc">
                  <em v-if="gate.status === '进行中'" class="gate-live">{{ gate.desc }}</em>
                  <span v-else>{{ gate.desc }}</span>
                  <span v-if="gate.extra" class="gate-extra">{{ gate.extra }}</span>
                </div>
                <div v-if="gate.sub" class="gate-sub">
                  <span>{{ gate.sub }}</span>
                  <button type="button" class="gate-link" @click="onGateDetail">查看明细</button>
                </div>
                <div v-else class="gate-sub gate-sub-right">
                  <button type="button" class="gate-link" @click="onGateDetail">查看明细</button>
                </div>
              </div>
            </div>
          </section>

          <!-- 船舶信息卡 -->
          <section class="design-card ship-card annot-shipowner-waybill-detail-field-ship">
            <div class="ship-info">
              <b class="ship-name">{{ detail.shipName }}</b>
              <div class="ship-row"><span>吨位</span><b>{{ detail.shipTonnage }}</b></div>
              <div class="ship-row"><span>联系人</span><b>{{ detail.shipContact }}</b></div>
              <div class="ship-tags">
                <span v-for="(t, i) in detail.shipTags" :key="i" :class="{ cert: i === 0 }">{{ t }}</span>
              </div>
            </div>
            <div class="ship-image-wrap">
              <img :src="detail.shipImage" alt="船舶" />
              <span class="ship-image-tag">集装箱船</span>
            </div>
          </section>

          <!-- 运单信息卡 -->
          <section class="design-card info-card annot-shipowner-waybill-detail-field-info">
            <div>
              <span>运单号</span>
              <button type="button" class="copy-value" @click="onCopyNo">
                {{ detail.waybillNo }}
                <img src="/cargo-detail-copy.svg" alt="复制" />
              </button>
            </div>
            <div><span>发布时间</span><b>{{ detail.publishTime }}</b></div>
            <div>
              <span>装货凭证</span>
              <img v-if="detail.loadVoucher" class="voucher-img" :src="detail.loadVoucher" alt="装货凭证" />
              <b v-else>待上传</b>
            </div>
            <div>
              <span>卸货凭证</span>
              <b>{{ detail.unloadVoucher ? '' : '待上传' }}</b>
            </div>
          </section>
        </section>
      </div>

      <!-- 底部固定操作栏：更多 / 作废 / 立即联系 -->
      <footer class="wd-action annot-shipowner-waybill-detail-action-bar">
        <button type="button" class="more-btn" aria-label="更多" @click="showMore = true">
          <van-icon name="ellipsis" size="22" color="#333333" />
          <span>更多</span>
        </button>
        <button type="button" class="void-btn" @click="onVoid">作废</button>
        <button type="button" class="contact-btn" @click="onContact">
          <van-icon name="phone" size="18" color="#ffffff" />
          <span class="contact-text">
            <b>立即联系</b>
            <em>沟通运输需求</em>
          </span>
        </button>
      </footer>

      <!-- ===== 强制地址变更处理弹窗（无关闭按钮、遮罩不可关） ===== -->
      <div v-if="showAddressDialog" class="ac-mask" data-annotation-container="modal">
        <div class="ac-dialog annot-shipowner-waybill-detail-rule-address-change" data-annotation-content="modal" role="dialog" aria-modal="true">
          <template v-if="!rejectMode">
            <h2 class="ac-title">卸货地址变更</h2>
            <p class="ac-tip">该运单的卸货地址已变更，请确认是否按照新地址执行。</p>

            <div class="ac-body">
              <div class="ac-row">
                <span class="ac-label">原卸货地址</span>
                <b class="ac-value">{{ addressChange.originAddr }}</b>
              </div>
              <div class="ac-row">
                <span class="ac-label">新卸货地址</span>
                <b class="ac-value ac-value-new">{{ addressChange.newAddr }}</b>
              </div>
              <div class="ac-row">
                <span class="ac-label">变更原因</span>
                <b class="ac-value">{{ addressChange.reason }}</b>
              </div>
              <div class="ac-row">
                <span class="ac-label">发起企业</span>
                <b class="ac-value">{{ addressChange.initiator }}</b>
              </div>
              <div class="ac-row">
                <span class="ac-label">发起时间</span>
                <b class="ac-value">{{ addressChange.initiateTime }}</b>
              </div>
            </div>

            <div class="ac-actions">
              <button type="button" class="ac-btn ac-reject" @click="enterReject">拒绝</button>
              <button type="button" class="ac-btn ac-confirm" @click="onConfirm">确认新地址</button>
            </div>
          </template>

          <!-- 拒绝原因输入（当前弹窗内展开） -->
          <template v-else>
            <h2 class="ac-title">拒绝地址变更</h2>
            <p class="ac-tip">请填写拒绝本次卸货地址变更的原因。</p>
            <textarea
              v-model="rejectReason"
              class="ac-textarea"
              placeholder="请输入拒绝原因（必填）"
              rows="4"
            ></textarea>
            <p v-if="rejectError" class="ac-error">{{ rejectError }}</p>
            <div class="ac-actions">
              <button type="button" class="ac-btn ac-cancel" @click="cancelReject">取消</button>
              <button type="button" class="ac-btn ac-confirm-reject" @click="onConfirmReject">确认拒绝</button>
            </div>
          </template>
        </div>
      </div>

      <!-- ===== 更多功能面板（底部弹出，仅“变更记录”） ===== -->
      <div v-if="showMore" class="sheet-mask" data-annotation-container="modal" @click="showMore = false">
        <div class="sheet-panel more-panel annot-shipowner-waybill-detail-action-more" data-annotation-content="modal" @click.stop>
          <div class="more-head">
            <span class="more-title">更多</span>
          </div>
          <button type="button" class="more-item" @click="openRecords">
            <van-icon name="orders-o" size="20" color="#3a65ff" />
            <span>变更记录</span>
            <van-icon name="arrow" size="14" color="#c4cbd8" />
          </button>
          <button type="button" class="more-cancel" @click="showMore = false">取消</button>
        </div>
      </div>

      <!-- ===== 变更记录面板（底部弹出） ===== -->
      <div v-if="showRecords" class="sheet-mask" data-annotation-container="modal" @click="showRecords = false">
        <div class="sheet-panel records-panel annot-shipowner-waybill-detail-field-address-records" data-annotation-content="modal" @click.stop>
          <div class="records-head">
            <span class="records-title">地址变更记录</span>
            <button type="button" class="records-close" aria-label="关闭" @click="showRecords = false">
              <van-icon name="cross" size="16" />
            </button>
          </div>

          <div class="records-body">
            <div v-if="records.length === 0" class="records-empty">
              <van-icon name="orders-o" size="40" color="#c4cbd8" />
              <p>暂无地址变更记录</p>
            </div>

            <div v-for="rec in records" :key="rec.id" class="record-item">
              <!-- 头部：序号 + 状态徽章 -->
              <div class="record-head">
                <span class="record-seq">变更 {{ rec.seq }}</span>
                <span class="record-result" :class="rec.result">{{ rec.resultText }}</span>
              </div>

              <!-- 地址对比块（视觉主体） -->
              <div class="record-addr-compare">
                <div class="record-addr-box old">
                  <span class="record-addr-tag">原</span>
                  <span class="record-addr-text">{{ rec.originAddr }}</span>
                </div>
                <van-icon name="arrow-down" size="14" color="#c4cbd8" class="record-addr-arrow" />
                <div class="record-addr-box new">
                  <span class="record-addr-tag">新</span>
                  <span class="record-addr-text">{{ rec.newAddr }}</span>
                </div>
              </div>

              <!-- 变更原因 -->
              <div v-if="rec.reason" class="record-reason">{{ rec.reason }}</div>

              <!-- 拒绝原因（仅已拒绝） -->
              <div v-if="rec.result === 'rejected'" class="record-reject">
                <van-icon name="info-o" size="13" color="#e5484d" />
                <span>拒绝原因：{{ rec.rejectReason }}</span>
              </div>

              <!-- 底部：发起企业 · 发起时间 -->
              <div class="record-foot">
                <span class="record-initiator">{{ rec.initiator }}</span>
                <span class="record-time">{{ rec.initiateTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  detail: { type: Object, required: true },
})

const emit = defineEmits(['back', 'confirm-address', 'reject-address'])

// ===== 当前有效卸货地址（确认后更新为新地址） =====
const currentDest = computed(() => props.detail.currentDest)

// ===== 地址变更申请 =====
const addressChange = computed(() => props.detail.addressChange || {})

// 进入详情：存在待船东处理申请时立即强制弹窗
const showAddressDialog = ref(props.detail.addressChange?.status === 'pending')
const rejectMode = ref(false)
const rejectReason = ref('')
const rejectError = ref('')

const enterReject = () => {
  rejectMode.value = true
  rejectError.value = ''
}

const cancelReject = () => {
  rejectMode.value = false
  rejectReason.value = ''
  rejectError.value = ''
}

// 确认新地址：直接完成，不二次确认
const onConfirm = () => {
  emit('confirm-address', { id: addressChange.value.id })
  showAddressDialog.value = false
  showToast('已确认，新卸货地址已生效')
}

// 确认拒绝：原因必填
const onConfirmReject = () => {
  if (!rejectReason.value.trim()) {
    rejectError.value = '请填写拒绝原因'
    return
  }
  emit('reject-address', { id: addressChange.value.id, reason: rejectReason.value.trim() })
  showAddressDialog.value = false
  rejectMode.value = false
  rejectReason.value = ''
  showToast('已拒绝本次地址变更')
}

// ===== 更多面板 / 变更记录 =====
const showMore = ref(false)
const showRecords = ref(false)

const openRecords = () => {
  showMore.value = false
  showRecords.value = true
}

const records = computed(() => props.detail.addressChangeRecords || [])

// ===== 其他操作 =====
const onBack = () => {
  emit('back')
}

const onCopyNo = async () => {
  try {
    await navigator.clipboard?.writeText(props.detail.waybillNo)
  } finally {
    showToast('运单号已复制')
  }
}

const onVoid = () => {
  showToast('作废运单（演示）')
}

const onContact = () => {
  showToast('立即联系（演示）')
}

const onGateDetail = () => {
  showToast('查看船闸明细（演示）')
}
</script>

<style scoped>
.wd-screen,
.wd-screen *,
.wd-screen *::before,
.wd-screen *::after {
  box-sizing: border-box;
}

.wd-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.wd-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #eff1f6;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.wd-scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 78px;
  scrollbar-width: none;
}

.wd-scroll::-webkit-scrollbar {
  display: none;
}

/* ============ 1. 顶部地图区 ============ */
.map-section {
  position: relative;
  width: 375px;
  height: 438px;
  overflow: hidden;
}

.map-image {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
}

.status-bar {
  position: absolute;
  z-index: 8;
  inset: 0 auto auto 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

.back-button {
  position: absolute;
  z-index: 10;
  left: 8px;
  top: 46px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.map-section h1 {
  position: absolute;
  z-index: 9;
  left: 46px;
  top: 49px;
  margin: 0;
  color: #333333;
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
}

.route-image {
  position: absolute;
  z-index: 2;
  left: 142px;
  top: 150px;
  width: 106px;
  height: 139px;
}

.port-card {
  position: absolute;
  z-index: 4;
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  color: #333333;
}

.load-port { left: 120px; top: 205px; }
.unload-port { left: 205px; top: 65px; }

.port-label {
  position: absolute;
  z-index: 2;
  left: 10px;
  top: 0;
  height: 27px;
  padding: 4px 11px 0;
  border-radius: 9px 9px 0 0;
  color: #ffffff;
  font-size: 12px;
  line-height: 18px;
}

.load-label { background: #3a65ff; }
.unload-label { background: #34c7a9; }

.port-content {
  position: relative;
  left: 0;
  top: 20px;
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  height: 34px;
  padding: 5px 8px;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
  font-size: 12px;
  line-height: 24px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.port-line {
  position: absolute;
  left: 50%;
  top: 54px;
  width: 2px;
  height: 18px;
  background: #333333;
}

.port-anchor {
  position: absolute;
  left: calc(50% - 2.5px);
  top: 69px;
  width: 7px;
  height: 7px;
  border: 1px solid #ffffff;
  border-radius: 50%;
  background: #34c7a9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* ============ 2. 下方面板 ============ */
.detail-sheet {
  position: relative;
  z-index: 6;
  width: 375px;
  min-height: 470px;
  margin-top: -75px;
  padding: 12px 0 24px;
  border-radius: 12px 12px 0 0;
  background: #eff1f6;
}

.design-card {
  width: 343px;
  margin: 0 16px 16px;
  border-radius: 10px;
  background: #ffffff;
}

/* 摘要卡 */
.summary-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.summary-top > strong {
  font-size: 17px;
  line-height: 22px;
  font-weight: 600;
}

.my-price b {
  color: #3a65ff;
  font-size: 18px;
  line-height: 20px;
  font-weight: 700;
}

.time-row {
  display: grid;
  grid-template-columns: 92px 1fr 92px;
  align-items: center;
}

.time-block { display: flex; flex-direction: column; }
.time-block b { color: #2f2f2f; font-size: 24px; line-height: 28px; font-weight: 600; }
.time-block span { color: #666666; font-size: 11px; line-height: 16px; }
.time-block.align-right { align-items: flex-end; }

.duration { display: flex; align-items: center; justify-content: center; }
.duration i { width: 18px; height: 1px; background: #dfdfdf; }
.duration span {
  padding: 3px 8px;
  border: 1px solid #dddddd;
  border-radius: 11px;
  color: #9a9a9a;
  font-size: 10px;
  line-height: 13px;
}

.summary-tags { display: flex; align-items: center; gap: 4px; }
.summary-tags > span {
  padding: 2px 5px;
  border: 1px solid #d6dffc;
  border-radius: 3px;
  color: #52689c;
  font-size: 10.5px;
  line-height: 14px;
  white-space: nowrap;
}

/* 地址卡 */
.address-card { padding: 14px; }
.address-list { display: flex; flex-direction: column; gap: 20px; position: relative; }
.address-item {
  position: relative;
  display: grid;
  grid-template-columns: 18px 1fr 14px;
  column-gap: 8px;
  align-items: start;
}
.address-item > div { display: flex; flex-direction: column; }
.address-item b { color: #333333; font-size: 14px; line-height: 19px; font-weight: 600; }
.address-item div span { color: #717c8e; font-size: 11px; line-height: 15px; margin-top: 2px; }
.address-item > img { width: 14px; height: 14px; margin-top: 2px; }
.address-mark {
  width: 15px; height: 15px; margin-top: 1px;
  border-radius: 3px; display: grid; place-items: center;
  font-size: 9px; line-height: 15px;
}
.address-mark.start { background: #eef0f5; color: #708096; }
.address-mark.end { background: #3a65ff; color: #ffffff; }
.address-rail {
  position: absolute; left: 7px; top: 17px; height: 58px;
  border-left: 1px dashed #d4d7de;
}

/* 船闸进度卡 */
.gate-card { padding: 14px; }
.gate-item { display: flex; gap: 10px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #f0f2f7; }
.gate-item.last { padding-bottom: 0; margin-bottom: 0; border-bottom: 0; }
.gate-badge {
  flex-shrink: 0; height: 19px; padding: 0 7px; border-radius: 10px;
  font-size: 10.5px; font-weight: 600; line-height: 19px;
}
.gate-badge.running { background: #e8f0ff; color: #3a65ff; }
.gate-badge.passed { background: #eef0f5; color: #8a8f99; }
.gate-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.gate-row { display: flex; align-items: center; justify-content: space-between; }
.gate-name { font-size: 14px; font-weight: 600; color: #333333; }
.gate-time { font-size: 12px; color: #333333; font-weight: 500; }
.gate-desc { font-size: 12px; color: #717c8e; display: flex; gap: 6px; align-items: baseline; }
.gate-live { color: #1a9e64; font-style: normal; font-weight: 600; }
.gate-extra { color: #8a8f99; }
.gate-sub { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #8a8f99; }
.gate-sub-right { justify-content: flex-end; }
.gate-link { border: 0; background: transparent; color: #3a65ff; font-size: 11px; cursor: pointer; padding: 0; }

/* 船舶信息卡 */
.ship-card { padding: 14px; display: flex; justify-content: space-between; gap: 12px; }
.ship-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.ship-name { font-size: 15px; font-weight: 600; color: #333333; }
.ship-row { display: flex; align-items: baseline; gap: 8px; font-size: 12px; }
.ship-row span { color: #a7a7a7; }
.ship-row b { color: #333333; font-weight: 500; }
.ship-tags { display: flex; gap: 4px; margin-top: 2px; }
.ship-tags span {
  padding: 2px 6px; border-radius: 3px; font-size: 10px; line-height: 14px;
  background: #f0f4f9; color: #52689c;
}
.ship-tags span.cert { background: #fff3d9; color: #8c673b; }
.ship-image-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.ship-image-wrap img { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; }
.ship-image-tag {
  position: absolute; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.55); color: #ffffff;
  font-size: 10px; line-height: 18px; text-align: center;
  border-radius: 0 0 8px 8px;
}

/* 运单信息卡 */
.info-card { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.info-card > div { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.info-card > div > span { color: #a7a7a7; }
.info-card b, .copy-value { color: #606060; font-size: 12px; font-weight: 400; }
.copy-value { padding: 0; border: 0; background: transparent; display: flex; align-items: center; gap: 5px; cursor: pointer; }
.copy-value img { width: 14px; height: 14px; }
.voucher-img { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; }

/* ============ 底部操作栏 ============ */
.wd-action {
  position: absolute;
  z-index: 20;
  left: 0; right: 0; bottom: 0;
  width: 375px;
  height: 70px;
  padding: 10px 12px 14px;
  background: #ffffff;
  border-top: 1px solid #f0f2f7;
  display: flex;
  align-items: center;
  gap: 10px;
}

.more-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; width: 44px; height: 100%;
  border: 0; background: transparent; cursor: pointer;
  color: #333333; font-size: 10px;
}

.void-btn {
  width: 92px; height: 40px;
  border: 1px solid #d4d4d4; border-radius: 8px;
  background: #ffffff; color: #333333;
  font-size: 15px; font-weight: 500; cursor: pointer;
}

.contact-btn {
  flex: 1; height: 40px;
  border: 0; border-radius: 8px;
  background: #3a65ff; color: #ffffff;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer;
}
.contact-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
.contact-text b { font-size: 14px; font-weight: 600; }
.contact-text em { font-size: 9px; font-style: normal; opacity: 0.85; }

/* ============ 强制地址变更弹窗 ============ */
.ac-mask {
  position: absolute;
  z-index: 40;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.ac-dialog {
  width: 100%;
  max-width: 327px;
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 18px 18px;
}

.ac-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #173664;
  text-align: center;
}

.ac-tip {
  margin: 10px 0 16px;
  font-size: 13px;
  line-height: 19px;
  color: #55627a;
  text-align: center;
}

.ac-body { display: flex; flex-direction: column; gap: 12px; }
.ac-row { display: flex; flex-direction: column; gap: 3px; }
.ac-label { font-size: 11px; color: #a7a7a7; }
.ac-value { font-size: 13px; color: #333333; font-weight: 500; line-height: 18px; }
.ac-value-new { color: #3a65ff; }

.ac-actions { display: flex; gap: 12px; margin-top: 20px; }
.ac-btn {
  flex: 1; height: 40px; border: 0; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.ac-reject { background: #f4f6fa; color: #5a6e85; }
.ac-confirm { background: #3a65ff; color: #ffffff; }
.ac-cancel { background: #f4f6fa; color: #5a6e85; }
.ac-confirm-reject { background: #e5484d; color: #ffffff; }

.ac-textarea {
  width: 100%;
  border: 1px solid #e2e6ee;
  border-radius: 8px;
  background: #f8f9fb;
  padding: 10px 12px;
  font-size: 13px;
  color: #333333;
  font-family: inherit;
  resize: none;
  outline: none;
}
.ac-textarea:focus { border-color: #3a65ff; background: #ffffff; }
.ac-error { margin: 6px 0 0; font-size: 11px; color: #e5484d; }

/* ============ 底部弹出面板（约束在 .wd-screen 容器内） ============ */
.sheet-mask {
  position: absolute;
  z-index: 36;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.sheet-panel {
  width: 100%;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  animation: sheet-up 0.22s ease;
}

@keyframes sheet-up {
  from { transform: translateY(24px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}

/* ============ 更多面板 ============ */
.more-panel { padding: 16px 16px 24px; }
.more-head { padding-bottom: 12px; border-bottom: 1px solid #f0f2f7; }
.more-title { font-size: 16px; font-weight: 600; color: #173664; }
.more-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 14px 4px; border: 0; background: transparent;
  font-size: 14px; color: #333333; cursor: pointer;
  border-bottom: 1px solid #f0f2f7;
}
.more-item span { flex: 1; text-align: left; }
.more-cancel {
  width: 100%; margin-top: 12px; height: 44px;
  border: 0; border-radius: 8px; background: #f4f6fa;
  color: #5a6e85; font-size: 15px; font-weight: 500; cursor: pointer;
}

/* ============ 变更记录面板 ============ */
.records-panel {
  padding: 16px 16px 24px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}
.records-head {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 12px; border-bottom: 1px solid #f0f2f7;
}
.records-title { font-size: 16px; font-weight: 600; color: #173664; }
.records-close { border: 0; background: transparent; color: #8c99a8; cursor: pointer; padding: 4px; display: flex; }
.records-body {
  overflow-y: auto;
  padding-top: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.records-body::-webkit-scrollbar { display: none; }
.records-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 0; color: #8c99a8; gap: 12px; font-size: 13px;
}
.record-item {
  background: #ffffff;
  border: 1px solid #eef0f5;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.record-head { display: flex; align-items: center; justify-content: space-between; }
.record-seq { font-size: 14px; font-weight: 600; color: #173664; }
.record-result { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.record-result.confirmed { background: #e8f7ef; color: #1a9e64; }
.record-result.rejected { background: #fdecec; color: #e5484d; }
.record-result.withdrawn { background: #f0f2f5; color: #8a8f99; }

/* 地址对比块 */
.record-addr-compare {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  background: #f8f9fb;
  border-radius: 8px;
  padding: 10px 12px;
}
.record-addr-box { display: flex; align-items: flex-start; gap: 7px; }
.record-addr-tag {
  flex: 0 0 auto;
  width: 18px; height: 18px;
  margin-top: 1px;
  border-radius: 4px;
  font-size: 11px; line-height: 18px;
  text-align: center;
}
.record-addr-box.old .record-addr-tag { color: #909399; background: #ededf0; }
.record-addr-box.new .record-addr-tag { color: #3a65ff; background: #e3ecff; }
.record-addr-text { flex: 1; min-width: 0; font-size: 12.5px; line-height: 20px; }
.record-addr-box.old .record-addr-text { color: #8a8f99; }
.record-addr-box.new .record-addr-text { color: #173664; font-weight: 600; }
.record-addr-arrow { align-self: center; margin: -1px 0; }

/* 变更原因 */
.record-reason { font-size: 12px; color: #717c8e; line-height: 18px; }

/* 拒绝原因 */
.record-reject {
  display: flex; align-items: flex-start; gap: 5px;
  font-size: 12px; color: #e5484d; line-height: 18px;
  background: #fdecec; border-radius: 6px; padding: 7px 10px;
}

/* 底部：发起企业 · 发起时间 */
.record-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 8px; border-top: 1px solid #f0f2f7;
}
.record-initiator { font-size: 11.5px; color: #55627a; font-weight: 500; }
.record-time { font-size: 11px; color: #a7a7a7; }

@media (max-width: 420px) {
  .wd-preview { min-height: 812px; padding: 0; background: #eff1f6; }
  .wd-screen { width: 100vw; max-width: 375px; box-shadow: none; }
}
</style>
