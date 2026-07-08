<template>
  <div class="quote-root">
    <BackBar current-title="承运商报价" />
    <!-- 顶部导航（按源文件还原） -->
    <nav class="top-nav">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#2468F2"/><path d="M10 14h20M10 20h20M10 26h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">至简至一</span>
          <span class="brand-sub">融合TMS 数字货运平台</span>
        </div>
      </div>
      <div class="nav-links">
        <span>首页</span>
        <span class="active">货源大厅</span>
        <span>联运方案</span>
        <span>物流专线</span>
        <span>运力大厅</span>
        <a class="nav-link-blue">工作台</a>
      </div>
      <a class="login-btn">登录</a>
    </nav>

    <div class="main-wrap">
      <!-- 左侧报价表单 -->
      <div class="form-pane">
        <!-- demo 切换条（原型演示用，弱化样式） -->
        <div class="demo-switcher">
          <span>演示托运单：</span>
          <button :class="{ active: currentWaybillId === 'TY20260701001' }" @click="switchWaybill('TY20260701001')">散杂货</button>
          <button :class="{ active: currentWaybillId === 'TY20260701002' }" @click="switchWaybill('TY20260701002')">集装箱</button>
        </div>

        <div class="breadcrumb">货源大厅 <span>/</span> 货源详情 <span>/</span> <b>竞价报价</b></div>

        <!-- 报价企业信息 -->
        <section class="form-section">
          <div class="section-label">
            <svg class="section-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2468F2"/><path d="M6 10l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            报价企业
          </div>
          <div class="field-grid three">
            <div class="field">
              <span>报价企业</span>
              <input class="q-input" :value="'顺达物流有限公司'" readonly />
            </div>
            <div class="field required">
              <span>联系人</span>
              <input class="q-input" v-model="form.contactName" placeholder="请输入联系人" />
            </div>
            <div class="field required">
              <span>联系电话</span>
              <input class="q-input" v-model="form.contactPhone" placeholder="请输入联系电话" />
            </div>
          </div>
        </section>

        <!-- 运输方式与路线 -->
        <section class="form-section">
          <div class="section-label">
            <svg class="section-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2468F2"/><path d="M5 12l5-6 5 6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            运输方案
          </div>
          <div>
            <div class="field required" style="margin-bottom: 12px">
              <span>运输方式</span>
              <div class="segmented">
                <button
                  v-for="m in transportModeOptions.filter(o => waybill.availableModes.includes(o))"
                  :key="m"
                  :class="{ active: form.transportMode === m }"
                  @click="setTransportMode(m)"
                >{{ m }}</button>
              </div>
            </div>

            <div class="field" style="margin-bottom: 12px">
              <span>报价模式</span>
              <div class="segmented">
                <button :class="{ active: form.quoteMode === '整段报价' }" @click="form.quoteMode = '整段报价'">整段报价</button>
                <button :class="{ active: form.quoteMode === '分段报价', disabled: form.transportMode !== '多式联运' }" :disabled="form.transportMode !== '多式联运'" @click="form.quoteMode = '分段报价'">分段报价</button>
              </div>
              <p class="field-tip" v-if="form.transportMode !== '多式联运'">单一运输方式仅支持整段报价</p>
            </div>

            <!-- 路线区 -->
            <h4 class="block-title">{{ routeSectionTitle }}</h4>

            <!-- 单一·散杂货：装卸点 -->
            <div v-if="form.transportMode !== '多式联运' && !isContainer" class="route-box">
              <div class="point-group" v-for="(point, idx) in singleRouteLoad" :key="'l'+idx">
                <div class="point-title"><i class="装">装</i>{{ point.name }}</div>
              </div>
              <div class="point-group" v-for="(point, idx) in singleRouteUnload" :key="'u'+idx">
                <div class="point-title"><i class="卸">卸</i>{{ point.name }}</div>
              </div>
            </div>

            <!-- 单一·集装箱：节点承接 -->
            <div v-else-if="form.transportMode !== '多式联运' && isContainer" class="route-box">
              <div class="container-chain">
                <div v-for="n in waybill.containerNodes" :key="n.id" class="chain-node">
                  <span class="node-type" :class="nodeTypeClass(n.nodeType)">{{ n.nodeType }}</span>
                  <strong>{{ n.name }}</strong>
                  <span class="addr">{{ n.address }}</span>
                </div>
              </div>
              <p class="route-tip">集装箱节点按托运单原始顺序只读承接，不支持新增托运单外节点</p>
            </div>

            <!-- 多式联运路段表 -->
            <div v-else class="route-box">
              <div class="segment-list">
                <div v-for="(seg, idx) in segments" :key="idx" class="segment-card">
                  <div class="segment-head-row">
                    <span class="segment-no"><i></i>路段{{ idx + 1 }}</span>
                    <select class="q-select-sm" v-model="seg.mode">
                      <option v-for="m in segmentModeOptions" :key="m" :value="m">{{ m }}</option>
                    </select>
                    <select class="q-select-sm" v-model="seg.carryForm" @change="onCarryFormChange(seg)">
                      <option v-for="c in carryFormOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <span class="seg-from">{{ seg.from || '起点' }}</span>
                    <span class="seg-arrow">→</span>
                    <span class="seg-to">{{ seg.to || '终点' }}</span>
                    <input class="duration-input" v-model="seg.duration" placeholder="时效" />
                    <div class="seg-actions">
                      <button v-if="idx > 0" class="text-btn" @click="moveSegment(idx, -1)">↑</button>
                      <button v-if="idx < segments.length - 1" class="text-btn" @click="moveSegment(idx, 1)">↓</button>
                      <button v-if="segments.length > 2" class="text-btn danger" @click="removeSegment(idx)">删</button>
                    </div>
                  </div>
                  <div class="segment-cargo">
                    <span class="cargo-label">承运货品：</span>
                    <span v-for="(c, ci) in seg.cargoItems" :key="ci" class="cargo-tag">{{ c.cargoName }}<em v-if="c.qty"> | {{ c.qty }}{{ c.unit }}</em></span>
                    <span v-if="!seg.cargoItems.length" class="empty-cargo">无</span>
                  </div>
                </div>
              </div>
              <button class="add-segment-btn" @click="addSegment">+ 添加路段</button>
            </div>

            <!-- 路线提示 -->
            <div v-if="routeErrors.length" class="route-error">
              <strong>路线存在 {{ routeErrors.length }} 个错误：</strong>
              <ul><li v-for="(e, i) in routeErrors" :key="i">{{ e }}</li></ul>
            </div>
            <div v-else class="route-success">✓ {{ routeSuccessText }}</div>
          </div>
        </section>

        <!-- 费用明细 -->
        <section class="form-section">
          <div class="section-label">
            <svg class="section-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2468F2"/><path d="M10 5v10M7 8h5M7 12h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
            费用明细
          </div>
          <div>
            <!-- 整段报价 -->
            <template v-if="form.quoteMode === '整段报价'">
              <div class="field-grid three" style="margin-bottom: 16px">
                <div class="field">
                  <span>计费条件</span>
                  <select class="q-input" v-model="fee.billingDimension" :disabled="isContainer">
                    <option v-for="b in (isContainer ? ['按集装箱'] : segmentBillingOptionsBulk)" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div class="field" v-if="!isContainer">
                  <span>计费依据</span>
                  <select class="q-input" v-model="fee.billingBasis">
                    <option v-for="b in billingBasisOptions" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div class="field" v-if="!isContainer">
                  <span>运输单价</span>
                  <input class="q-input" type="number" v-model.number="fee.unitPrice" min="0" />
                </div>
              </div>

              <!-- 集装箱箱型明细 -->
              <table v-if="isContainer" class="q-table">
                <thead><tr><th>箱型</th><th>尺寸</th><th>箱数</th><th>货品</th><th>单价</th><th>金额</th></tr></thead>
                <tbody>
                  <tr v-for="(b, i) in boxPrices" :key="i">
                    <td>{{ b.boxType }}</td><td>{{ b.size }}</td><td>{{ b.quantity }}</td><td>{{ b.cargoName }}</td>
                    <td><input class="table-input" type="number" v-model.number="b.unitPrice" min="0" /></td>
                    <td><strong class="blue">¥{{ ((b.unitPrice || 0) * b.quantity).toFixed(2) }}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div class="estimate" v-else>
                预计总价：{{ totalCargoQty }} × ¥{{ fee.unitPrice || 0 }} = <strong>¥{{ totalFee.toFixed(2) }}</strong>
              </div>
            </template>

            <!-- 分段报价 -->
            <template v-else>
              <div v-for="(seg, idx) in segments" :key="idx" class="segment-fee-card">
                <div class="segment-route-title">
                  <span class="seg-num"><i></i>路段{{ idx + 1 }}</span>
                  <span class="mode-tag" :class="'mode-' + seg.mode">{{ seg.mode }}</span>
                  <span class="seg-carry">{{ seg.carryForm }}</span>
                  <span>{{ seg.from }} → {{ seg.to }}</span>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <span>计费条件</span>
                    <select class="q-input" v-model="seg.billingDimension">
                      <option v-for="b in (seg.carryForm === '集装箱运输' ? segmentBillingOptionsContainer : segmentBillingOptionsBulk)" :key="b" :value="b">{{ b }}</option>
                    </select>
                  </div>
                  <div class="field" v-if="seg.carryForm === '散货运输'">
                    <span>计费依据</span>
                    <select class="q-input" v-model="seg.billingBasis">
                      <option v-for="b in billingBasisOptions" :key="b" :value="b">{{ b }}</option>
                    </select>
                  </div>
                  <div class="field">
                    <span>运输单价</span>
                    <input class="q-input" type="number" v-model.number="seg.unitPrice" min="0" />
                  </div>
                </div>
                <div class="seg-amount">路段金额：<strong class="blue">¥{{ calcSegmentAmount(seg).toFixed(2) }}</strong></div>
              </div>
              <div class="estimate">分段合计：<strong>¥{{ segmentTotalFee.toFixed(2) }}</strong></div>
            </template>
          </div>
        </section>

        <!-- 其他费用 -->
        <section class="form-section">
          <div class="section-label">
            <svg class="section-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2468F2"/><path d="M10 5v10" stroke="#fff" stroke-width="2"/><circle cx="10" cy="14" r="1.5" fill="#fff"/></svg>
            其他费用
          </div>
          <div>
            <table class="q-table">
              <thead><tr><th>类型</th><th>费用名称</th><th>基数</th><th>单价</th><th>金额</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="(e, i) in extraFees" :key="i">
                  <td>
                    <select class="table-input" v-model="e.type">
                      <option v-for="t in extraFeeTypeOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </td>
                  <td><input class="table-input" v-model="e.name" /></td>
                  <td><input class="table-input" type="number" v-model.number="e.base" min="0" /></td>
                  <td><input class="table-input" type="number" v-model.number="e.unitPrice" min="0" /></td>
                  <td><strong class="blue">¥{{ ((e.base || 0) * (e.unitPrice || 0)).toFixed(2) }}</strong></td>
                  <td><button class="text-btn danger" @click="extraFees.splice(i, 1)">删除</button></td>
                </tr>
                <tr v-if="!extraFees.length"><td colspan="6" class="empty-row">暂无其他费用</td></tr>
              </tbody>
            </table>
            <button class="add-row-btn" @click="addExtraFee">+ 添加费用项</button>
          </div>
        </section>

        <!-- 服务承诺 -->
        <section class="form-section last">
          <div class="section-label">
            <svg class="section-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2468F2"/><path d="M10 5l2 4 4 .5-3 3 .8 4L10 14.5 6.2 16.5 7 12.5l-3-3 4-.5z" fill="#fff"/></svg>
            服务承诺
          </div>
          <div>
            <div class="field required" style="margin-bottom: 12px">
              <span>配送方式（至少一种）</span>
              <div class="check-row">
                <label v-for="d in deliveryOptions" :key="d"><input type="checkbox" :value="d" v-model="service.delivery" />{{ d }}</label>
              </div>
            </div>
            <div class="field" style="margin-bottom: 12px">
              <span>增值服务</span>
              <div class="check-row">
                <label v-for="v in valueAddOptions" :key="v"><input type="checkbox" :value="v" v-model="service.valueAdd" />{{ v }}</label>
              </div>
            </div>
            <div class="field required">
              <span>方案概述</span>
              <textarea class="q-textarea" v-model="service.outline" maxlength="500" placeholder="补充服务范围、特殊说明等"></textarea>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧托运单信息卡片 -->
      <aside class="source-card">
        <div class="card-head">
          <span>{{ waybill.publishMode || '限时竞价' }}</span>
          <b>距离竞价结束</b>
          <strong>{{ countdown }}</strong>
        </div>
        <div class="source-body">
          <div class="order-line"><b>{{ waybill.id }}</b></div>
          <h2>{{ waybill.routeTitle }}</h2>
          <div class="price-line">
            <strong>{{ waybill.expectedPrice }}</strong>
            <span>元/{{ isContainer ? '箱' : '吨' }}</span>
            <em>期望价格</em>
          </div>
          <div class="meta-grid">
            <span>托运企业</span><b>{{ waybill.ownerCompany }}</b>
            <span>付款方式</span><b>{{ waybill.paymentMethod }}</b>
            <span>可报价方式</span><b>{{ waybill.availableModes.join('、') }}</b>
            <span>税务要求</span><b>{{ waybill.taxRequirement }}</b>
            <span v-if="waybill.transportRequirement">运输要求</span><b v-if="waybill.transportRequirement">{{ waybill.transportRequirement }}</b>
          </div>
          <div class="owner-box">
            <div class="logo-mini">企</div>
            <div>
              <b>{{ waybill.ownerCompany }}</b>
              <span>交易 2000 次 | 评分 4.8</span>
            </div>
          </div>

          <!-- 散杂货：装卸点+货品 -->
          <template v-if="!isContainer">
            <h3>运输需求</h3>
            <div class="point-block" v-for="p in waybill.loadOrderNodes" :key="'l'+p.id">
              <div class="point-title"><i class="装">装</i><strong>{{ p.name }}</strong></div>
            </div>
            <div class="point-block" v-for="p in waybill.unloadOrderNodes" :key="'u'+p.id">
              <div class="point-title"><i class="卸">卸</i><strong>{{ p.name }}</strong></div>
            </div>
            <h3>货品</h3>
            <div class="cargo-card" v-for="(c, i) in waybill.cargoFlows" :key="i">
              <div class="cargo-no">{{ i + 1 }}</div>
              <div class="cargo-info">
                <strong>{{ c.cargoName }}</strong>
                <span>{{ c.packageType }}</span>
              </div>
              <div class="cargo-qty">{{ c.quantity }}{{ c.unit }}</div>
            </div>
          </template>

          <!-- 集装箱：箱型+节点链 -->
          <template v-else>
            <h3>集装箱来源</h3>
            <div class="meta-grid"><span>来源</span><b>{{ waybill.containerSource }}</b></div>
            <h3>箱型箱量</h3>
            <div class="cargo-card" v-for="(b, i) in waybill.containerBoxes" :key="i">
              <div class="cargo-no">{{ i + 1 }}</div>
              <div class="cargo-info">
                <strong>{{ b.boxType }} {{ b.size }}</strong>
                <span>{{ b.cargoName }} · {{ b.weight }}吨</span>
              </div>
              <div class="cargo-qty">{{ b.quantity }}箱</div>
            </div>
            <h3>节点链</h3>
            <div class="node-chain">
              <div v-for="n in waybill.containerNodes" :key="n.id" class="node-chain-item">
                <span class="node-type" :class="nodeTypeClass(n.nodeType)">{{ n.nodeType }}</span>
                <strong>{{ n.name }}</strong>
                <span>{{ n.address }}</span>
              </div>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <!-- 底部提交栏 -->
    <footer class="submit-bar">
      <div class="submit-inner">
        <div>
          <span>合计费用</span>
          <strong>¥{{ grandTotal.toFixed(2) }}</strong>
          <span>（运输费 ¥{{ transportFee.toFixed(2) }} + 附加费 ¥{{ extraFeeTotal.toFixed(2) }}）</span>
          <p>提交后将生成报价记录，进入托运订单管理。</p>
        </div>
        <div class="submit-actions">
          <button class="cancel-btn">取消</button>
          <button class="primary-btn" :disabled="submitting" @click="submitQuote">{{ submitting ? '提交中...' : '提交报价' }}</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  transportModeOptions, carryFormOptions, billingBasisOptions,
  segmentBillingOptionsBulk, segmentBillingOptionsContainer,
  deliveryOptions, valueAddOptions, extraFeeTypeOptions,
  bulkWaybill, containerWaybill, carrierAddressOptions,
} from './mock-data'
import { addQuote } from '../../src/shared/prototype-store'
import BackBar from '../../src/components/BackBar.vue'

const currentWaybillId = ref('TY20260701001')
const waybill = ref(bulkWaybill)
const countdown = ref('47:23:08') // 演示用静态倒计时

const form = reactive({ contactName: '', contactPhone: '', transportMode: '多式联运', quoteMode: '分段报价' })
const fee = reactive({ billingDimension: '按重量', billingBasis: '按装货口径', unitPrice: 0 })
const boxPrices = ref([])
const segments = ref([])
const extraFees = ref([])
const service = reactive({ delivery: [], valueAdd: [], outline: '' })
const submitting = ref(false)
const routeErrors = ref([])

const segmentModeOptions = ['公路', '铁路', '水路']
const isContainer = computed(() => waybill.value.businessType === '集装箱')
const routeSectionTitle = computed(() => form.transportMode === '多式联运' ? '多式联运路线设计' : '运输路线')
const singleRouteLoad = computed(() => waybill.value.loadOrderNodes)
const singleRouteUnload = computed(() => waybill.value.unloadOrderNodes)

function switchWaybill(id) {
  currentWaybillId.value = id
  waybill.value = id === 'TY20260701002' ? containerWaybill : bulkWaybill
  initForm()
}

function initForm() {
  form.transportMode = '多式联运'
  form.quoteMode = '分段报价'
  fee.unitPrice = 0
  segments.value = initSegments()
  boxPrices.value = isContainer.value ? waybill.value.containerBoxes.map(b => ({ ...b, unitPrice: 0 })) : []
  extraFees.value = []
  service.delivery = []
  service.valueAdd = []
  service.outline = ''
  recalculateRoute()
}

function initSegments() {
  if (isContainer.value && waybill.value.containerNodes.length >= 2) {
    const nodes = waybill.value.containerNodes
    const segs = []
    for (let i = 0; i < nodes.length - 1; i++) {
      segs.push({
        mode: i === 0 ? '公路' : (i === nodes.length - 2 ? '公路' : '铁路'),
        carryForm: '集装箱运输',
        from: nodes[i].name, to: nodes[i + 1].name,
        duration: '1天',
        cargoItems: [{ cargoName: '集装箱', qty: waybill.value.containerBoxes.reduce((s, b) => s + b.quantity, 0), unit: '箱' }],
        billingDimension: '按集装箱', billingBasis: '', unitPrice: 0,
      })
    }
    return segs
  }
  const load = waybill.value.loadOrderNodes[0]
  const unload = waybill.value.unloadOrderNodes[0]
  const cargo = waybill.value.cargoFlows[0]
  return [
    { mode: '公路', carryForm: '散货运输', from: load?.name || '', to: '上海铁路货运站', duration: '1天', cargoItems: [{ cargoName: cargo?.cargoName, qty: cargo?.quantity, unit: cargo?.unit }], billingDimension: '按重量', billingBasis: '按装货口径', unitPrice: 80 },
    { mode: '铁路', carryForm: '散货运输', from: '上海铁路货运站', to: '武汉港', duration: '2天', cargoItems: [{ cargoName: cargo?.cargoName, qty: cargo?.quantity, unit: cargo?.unit }], billingDimension: '按重量', billingBasis: '按装货口径', unitPrice: 60 },
    { mode: '公路', carryForm: '散货运输', from: '武汉港', to: unload?.name || '', duration: '1天', cargoItems: [{ cargoName: cargo?.cargoName, qty: cargo?.quantity, unit: cargo?.unit }], billingDimension: '按重量', billingBasis: '按卸货口径', unitPrice: 70 },
  ]
}

function setTransportMode(m) {
  form.transportMode = m
  if (m === '多式联运') {
    form.quoteMode = '分段报价'
    segments.value = initSegments()
  } else {
    form.quoteMode = '整段报价'
  }
  recalculateRoute()
}

function addSegment() {
  const last = segments.value[segments.value.length - 1]
  segments.value.push({
    mode: '公路', carryForm: '散货运输',
    from: last?.to || '', to: '', duration: '',
    cargoItems: [], billingDimension: '按重量', billingBasis: '按装货口径', unitPrice: 0,
  })
  recalculateRoute()
}
function removeSegment(idx) { segments.value.splice(idx, 1); recalculateRoute() }
function moveSegment(idx, dir) {
  const n = idx + dir; if (n < 0 || n >= segments.value.length) return
  const arr = segments.value; const tmp = arr[idx]; arr[idx] = arr[n]; arr[n] = tmp
  syncContinuation(); recalculateRoute()
}
function onCarryFormChange(seg) {
  if (seg.carryForm === '集装箱运输') { seg.billingDimension = '按集装箱'; seg.billingBasis = '' }
  else { seg.billingDimension = '按重量'; seg.billingBasis = '按装货口径' }
}
function syncContinuation() {
  for (let i = 1; i < segments.value.length; i++) segments.value[i].from = segments.value[i - 1].to
}

function recalculateRoute() {
  const errors = []
  if (form.transportMode === '多式联运') {
    for (let i = 1; i < segments.value.length; i++) {
      if (segments.value[i].from !== segments.value[i - 1].to) errors.push(`路段 ${i + 1} 起点必须等于路段 ${i} 终点`)
    }
    segments.value.forEach((s, i) => { if (!s.from || !s.to) errors.push(`路段 ${i + 1} 起点终点必填`) })
    if (isContainer.value) {
      const allPts = segments.value.flatMap(s => [s.from, s.to])
      waybill.value.containerNodes.forEach(n => { if (!allPts.includes(n.name)) errors.push(`集装箱节点「${n.nodeType}-${n.name}」未被覆盖`) })
    }
  }
  routeErrors.value = errors
}
const routeSuccessText = computed(() => form.transportMode !== '多式联运' ? '单一运输方式承接完整' : `可完整承接，共 ${segments.value.length} 段，首尾连续`)

const totalCargoQty = computed(() => waybill.value.cargoFlows.reduce((s, c) => s + (Number(c.quantity) || 0), 0))
const totalFee = computed(() => (totalCargoQty.value || 0) * (fee.unitPrice || 0))
const boxTotal = computed(() => boxPrices.value.reduce((s, b) => s + (b.unitPrice || 0) * b.quantity, 0))
function calcSegmentAmount(seg) {
  if (!seg.unitPrice) return 0
  if (seg.carryForm === '集装箱运输') {
    const boxes = waybill.value.containerBoxes.reduce((s, b) => s + b.quantity, 0); return seg.unitPrice * boxes
  }
  const qty = seg.cargoItems.reduce((s, c) => s + (Number(c.qty) || 0), 0); return seg.unitPrice * qty
}
const segmentTotalFee = computed(() => segments.value.reduce((s, seg) => s + calcSegmentAmount(seg), 0))
const transportFee = computed(() => form.quoteMode === '整段报价' ? (isContainer.value ? boxTotal.value : totalFee.value) : segmentTotalFee.value)
const extraFeeTotal = computed(() => extraFees.value.reduce((s, e) => s + (e.base || 0) * (e.unitPrice || 0), 0))
const grandTotal = computed(() => transportFee.value + extraFeeTotal.value)

function addExtraFee() { extraFees.value.push({ type: '增项', name: '', base: 0, unitPrice: 0 }) }

function submitQuote() {
  if (!form.contactName?.trim()) return ElMessage.warning('请填联系人')
  if (!form.contactPhone?.trim()) return ElMessage.warning('请填联系电话')
  if (routeErrors.value.length) return ElMessage.warning('请先修复路线错误')
  if (form.quoteMode === '整段报价' && !isContainer.value && !fee.unitPrice) return ElMessage.warning('请填运输单价')
  if (form.quoteMode === '分段报价') {
    for (let i = 0; i < segments.value.length; i++) { if (!segments.value[i].unitPrice) return ElMessage.warning(`路段 ${i + 1} 请填运输单价`) }
  }
  if (!service.delivery.length) return ElMessage.warning('请选择至少一种配送方式')
  if (!service.outline?.trim()) return ElMessage.warning('请填方案概述')
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    addQuote({
      id: `QT${Date.now().toString().slice(-8)}`, waybillId: waybill.value.id,
      carrier: '顺达物流有限公司', contactName: form.contactName, contactPhone: form.contactPhone,
      transportMode: form.transportMode, quoteMode: form.quoteMode,
      totalAmount: grandTotal.value, createdAt: new Date().toISOString(),
    })
    ElMessage.success('提交成功，已生成报价记录并跳转托运订单管理（原型演示）')
  }, 800)
}

function nodeTypeClass(t) {
  return 'nt-' + t
}

initForm()
watch(() => form.transportMode, () => recalculateRoute())
</script>

<style scoped>
/* ===== 全局重置 ===== */
* { box-sizing: border-box; margin: 0; padding: 0; }
.quote-root { min-height: 100vh; background: #fff; padding-bottom: 86px; }

/* ===== 顶部导航 ===== */
.top-nav {
  height: 56px; border-bottom: 1px solid #e8ebf0; background: #fff;
  display: flex; align-items: center; justify-content: center; padding: 0 24px;
}
.brand { width: 280px; display: flex; align-items: center; gap: 12px; }
.brand-icon { width: 40px; height: 40px; flex-shrink: 0; }
.brand-text { display: flex; flex-direction: column; }
.brand-name { font-size: 16px; font-weight: 700; color: #1f2430; line-height: 1.2; }
.brand-sub { font-size: 11px; color: #8b93a1; line-height: 1.2; margin-top: 2px; letter-spacing: 1px; }
.nav-links { flex: 1; height: 100%; display: flex; align-items: center; gap: 40px; color: #4b5563; font-size: 14px; padding-left: 40px; }
.nav-links span { cursor: pointer; }
.nav-links span.active { color: #1f2430; font-weight: 600; }
.nav-link-blue { color: #2f68ed; font-weight: 600; cursor: pointer; }
.login-btn {
  width: 90px; height: 56px; display: flex; align-items: center; justify-content: center;
  background: #2f68ed; color: #fff; font-size: 14px; cursor: pointer; margin-left: 24px;
}

/* ===== 主区域 ===== */
.main-wrap {
  width: min(1440px, calc(100vw - 48px)); margin: 32px auto 0;
  display: grid; grid-template-columns: minmax(0, 980px) 400px; gap: 40px; align-items: start;
}
.form-pane { min-width: 0; }

/* demo 切换条 */
.demo-switcher {
  display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px;
  background: #f5f7fa; border-radius: 14px; font-size: 12px; color: #6b7280; margin-bottom: 16px;
}
.demo-switcher button {
  border: none; background: transparent; padding: 4px 12px; font-size: 12px;
  cursor: pointer; border-radius: 10px; color: #6b7280;
}
.demo-switcher button.active { background: #2f68ed; color: #fff; }

.breadcrumb { margin-bottom: 24px; color: #252a34; font-size: 14px; font-weight: 600; }
.breadcrumb span { color: #9ca3af; margin: 0 8px; font-weight: 400; }
.breadcrumb b { color: #2f68ed; }

/* ===== Form Section ===== */
.form-section {
  display: grid; grid-template-columns: 120px minmax(0, 1fr); column-gap: 24px; margin-bottom: 36px;
}
.form-section.last { margin-bottom: 0; }
.section-label {
  font-size: 17px; font-weight: 600; color: #2c3440;
  display: flex; align-items: center; gap: 10px; white-space: nowrap;
}
.section-icon { width: 20px; height: 20px; flex-shrink: 0; }

/* ===== 字段 ===== */
.field-grid { display: grid; gap: 16px; }
.field-grid.three { grid-template-columns: 1.5fr 1fr 1fr; }
.field { display: flex; flex-direction: column; gap: 8px; color: #4e5969; font-size: 14px; }
.field.required > span::before { content: "* "; color: #e64b4b; font-weight: 600; }
.field > span { font-weight: 500; }
.field-tip { font-size: 12px; color: #9ca3af; margin-top: 4px; }

.q-input, .q-select {
  height: 38px; padding: 0 12px; border: 1px solid #d9dee8; border-radius: 4px;
  font-size: 14px; color: #1f2430; background: #fff; outline: none; width: 100%;
}
.q-input:focus { border-color: #2f68ed; box-shadow: 0 0 0 3px rgba(47, 104, 237, 0.1); }
.q-textarea { min-height: 80px; padding: 10px 12px; border: 1px solid #d9dee8; border-radius: 4px; font-size: 14px; resize: vertical; width: 100%; outline: none; font-family: inherit; }
.q-textarea:focus { border-color: #2f68ed; }
.q-select-sm {
  height: 30px; padding: 0 8px; border: 1px solid #e5e8ef; border-radius: 3px;
  font-size: 12px; background: #fff; outline: none; min-width: 90px;
}
.duration-input {
  height: 30px; width: 70px; padding: 0 8px; border: 1px solid #e5e8ef; border-radius: 3px; font-size: 12px; outline: none;
}

/* segmented 按钮组 */
.segmented { display: inline-flex; gap: 0; border: 1px solid #e5e8ef; border-radius: 4px; overflow: hidden; }
.segmented button {
  height: 38px; padding: 0 18px; border: none; background: #f7f8fa; color: #4e5969;
  font-size: 14px; cursor: pointer; border-right: 1px solid #e5e8ef; transition: all 0.15s;
}
.segmented button:last-child { border-right: none; }
.segmented button.active { background: #eef4ff; color: #2f68ed; font-weight: 600; }
.segmented button.disabled, .segmented button:disabled { color: #c0c4cc; cursor: not-allowed; }

/* 区块标题 */
.block-title { font-size: 14px; font-weight: 600; color: #2c3440; margin: 16px 0 12px; }

/* ===== 路线区 ===== */
.route-box { background: #f6f8fc; border-radius: 6px; padding: 16px; }
.point-group { margin-bottom: 8px; }
.point-title { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1f2430; }
.point-title i {
  width: 22px; height: 22px; border-radius: 4px; display: inline-flex;
  align-items: center; justify-content: center; font-size: 12px; font-style: normal;
  color: #fff; font-weight: 600;
}
.point-title i.装 { background: #3b82f6; }
.point-title i.卸 { background: #10b981; }

/* 集装箱节点链 */
.container-chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chain-node {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  background: #fff; border-radius: 4px; font-size: 13px;
}
.chain-node strong { color: #1f2430; }
.chain-node .addr { color: #6b7280; font-size: 12px; }
.route-tip { font-size: 12px; color: #9ca3af; margin-top: 12px; }

.node-type {
  padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; color: #fff;
}
.node-type.nt-提空 { background: #64748b; }
.node-type.nt-提重 { background: #0f766e; }
.node-type.nt-装货 { background: #3b82f6; }
.node-type.nt-卸货 { background: #10b981; }
.node-type.nt-还重 { background: #b45309; }
.node-type.nt-还空 { background: #6b7280; }

/* ===== 多式联运路段卡 ===== */
.segment-list { display: flex; flex-direction: column; gap: 10px; }
.segment-card {
  background: #fff; border: 1px solid #eef0f5; border-radius: 4px; overflow: hidden;
}
.segment-head-row {
  display: grid; grid-template-columns: 90px 100px 130px minmax(120px, 1fr) 24px minmax(120px, 1fr) 80px 90px;
  gap: 8px; align-items: center; padding: 8px 12px; background: #f5f7fa;
}
.segment-no { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #2f68ed; }
.segment-no i { width: 8px; height: 8px; border-radius: 50%; background: #2f68ed; display: inline-block; }
.seg-from, .seg-to { font-size: 13px; color: #1f2430; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seg-arrow { color: #9ca3af; text-align: center; }
.seg-actions { display: flex; gap: 4px; justify-content: flex-end; }
.text-btn {
  border: none; background: transparent; color: #2f68ed; font-size: 12px; cursor: pointer; padding: 2px 6px;
}
.text-btn.danger { color: #ef4444; }

.segment-cargo {
  padding: 8px 12px 8px 32px; font-size: 12px; color: #6b7280;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.cargo-label { color: #9ca3af; }
.cargo-tag {
  background: #eef4ff; color: #2f68ed; padding: 2px 8px; border-radius: 3px; font-size: 12px;
}
.cargo-tag em { font-style: normal; color: #6b7280; }
.empty-cargo { color: #c0c4cc; }

.add-segment-btn {
  margin-top: 10px; padding: 8px 16px; border: 1px dashed #2f68ed; background: transparent;
  color: #2f68ed; border-radius: 4px; cursor: pointer; font-size: 13px; width: 100%;
}

/* 路线提示 */
.route-success {
  margin-top: 12px; padding: 10px 14px; background: #eff4ff; color: #2f68ed;
  border: 1px solid #dbeafe; border-radius: 6px; font-size: 13px;
}
.route-error {
  margin-top: 12px; padding: 10px 14px; background: #fff1f0; color: #d93026;
  border: 1px solid #fecaca; border-radius: 6px; font-size: 13px;
}
.route-error ul { margin: 4px 0 0 18px; padding: 0; }

/* ===== 表格 ===== */
.q-table {
  width: 100%; border-collapse: collapse; margin-bottom: 8px; background: #fff;
}
.q-table th, .q-table td {
  padding: 10px 14px; border: 1px solid #e8e8e8; font-size: 13px; text-align: left;
}
.q-table th { background: #f5f7fa; color: #4e5969; font-weight: 600; }
.q-table .empty-row { text-align: center; color: #9ca3af; }
.table-input {
  height: 30px; padding: 0 8px; border: 1px solid #e5e8ef; border-radius: 3px; font-size: 13px; width: 100%; outline: none; background: #fff;
}
.table-input:focus { border-color: #2f68ed; }
.blue { color: #2f68ed; }
.estimate {
  padding: 14px 16px; background: #f5f7fa; border-radius: 6px; font-size: 14px; color: #1f2430;
}
.estimate strong { color: #2f68ed; font-size: 20px; font-weight: 700; }

/* 分段费用卡 */
.segment-fee-card {
  background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(15, 28, 56, 0.04);
  padding: 18px 20px; margin-bottom: 12px;
}
.segment-route-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 12px; color: #1f2430;
}
.seg-num { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #2f68ed; }
.seg-num i { width: 8px; height: 8px; border-radius: 50%; background: #2f68ed; }
.mode-tag {
  padding: 2px 8px; border-radius: 3px; font-size: 12px; color: #fff;
}
.mode-tag.mode-公路 { background: #22b98f; }
.mode-tag.mode-铁路 { background: #5678e8; }
.mode-tag.mode-水路 { background: #4aa8e8; }
.seg-carry { color: #6b7280; font-size: 12px; }
.seg-amount {
  margin-top: 8px; padding-top: 8px; border-top: 1px dashed #eef0f5;
  font-size: 13px; color: #1f2430; text-align: right;
}
.seg-amount strong { font-size: 16px; }

.add-row-btn {
  padding: 6px 14px; border: 1px dashed #2f68ed; background: transparent;
  color: #2f68ed; border-radius: 4px; cursor: pointer; font-size: 13px;
}

/* 复选框行 */
.check-row { display: flex; flex-wrap: wrap; gap: 14px; }
.check-row label {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: #4e5969;
}

/* ===== 右侧托运单卡片 ===== */
.source-card {
  position: sticky; top: 78px; background: #f6f8fc; border-radius: 8px;
  overflow: hidden; box-shadow: 0 2px 8px rgba(15, 28, 56, 0.06);
}
.card-head {
  height: 56px; background: linear-gradient(135deg, #2f68ed, #5a8ff5); color: #fff;
  display: flex; align-items: center; gap: 18px; padding: 0 24px;
}
.card-head span { font-size: 22px; font-weight: 700; font-style: italic; letter-spacing: 1px; }
.card-head b { font-size: 13px; opacity: 0.9; font-weight: 400; }
.card-head strong { font-size: 20px; letter-spacing: 4px; font-weight: 600; margin-left: auto; }
.source-body { padding: 20px 24px 28px; }

.order-line { display: flex; gap: 8px; align-items: center; color: #6b7280; font-size: 13px; }
.order-line b {
  padding: 4px 10px; border-radius: 4px; background: #4f7df2; color: #fff;
  font-size: 12px; font-weight: 600;
}
.source-body h2 { margin: 14px 0; font-size: 18px; line-height: 1.4; color: #1f2430; font-weight: 600; }

.price-line { display: flex; align-items: baseline; gap: 4px; margin-bottom: 14px; }
.price-line strong { font-size: 32px; color: #ff3434; font-weight: 700; }
.price-line span { color: #ff3434; font-size: 18px; font-weight: 500; }
.price-line em {
  margin-left: 10px; background: #fff0f0; color: #d93026; padding: 4px 10px;
  border-radius: 4px; font-style: normal; font-size: 12px;
}

.meta-grid { display: grid; grid-template-columns: 72px 1fr; row-gap: 10px; font-size: 13px; }
.meta-grid span { color: #6b7280; }
.meta-grid b { color: #1f2430; font-weight: 500; }

.owner-box { margin: 22px 0; display: flex; align-items: center; gap: 12px; }
.logo-mini {
  width: 40px; height: 40px; border: 1px solid #e0e5ef; background: #fff;
  display: flex; align-items: center; justify-content: center; color: #2f68ed;
  font-weight: 700; border-radius: 4px; font-size: 14px;
}
.owner-box b { display: block; font-size: 14px; color: #1f2430; }
.owner-box span { display: block; margin-top: 4px; font-size: 12px; color: #6b7280; }

.source-body h3 { font-size: 16px; margin: 18px 0 14px; color: #1f2430; font-weight: 600; }

.point-block { margin-bottom: 12px; }

.cargo-card {
  background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(15, 28, 56, 0.05);
  display: grid; grid-template-columns: 32px minmax(0, 1fr) 80px;
  align-items: center; gap: 12px; padding: 10px 14px; margin-bottom: 8px;
}
.cargo-no {
  width: 26px; height: 26px; border-radius: 4px; background: #eef4ff; color: #2f68ed;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
}
.cargo-info strong { display: block; font-size: 14px; color: #1f2430; }
.cargo-info span { display: block; font-size: 12px; color: #6b7280; margin-top: 2px; }
.cargo-qty { color: #2f68ed; font-size: 15px; font-weight: 600; text-align: right; }

.node-chain { display: flex; flex-direction: column; gap: 8px; }
.node-chain-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: #fff; border-radius: 4px; font-size: 13px;
}
.node-chain-item strong { color: #1f2430; }
.node-chain-item span { color: #6b7280; font-size: 12px; }

/* ===== 底部提交栏 ===== */
.submit-bar {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.98); border-top: 1px solid #e8ebf0;
  box-shadow: 0 -2px 12px rgba(20, 32, 56, 0.06); z-index: 20;
}
.submit-inner {
  width: min(1440px, calc(100vw - 48px)); height: 76px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; padding: 0 4px;
}
.submit-inner > div:first-child {
  display: flex; flex-direction: row; align-items: baseline; gap: 10px; flex-wrap: wrap; max-width: 760px;
}
.submit-inner strong { color: #ff3434; font-size: 30px; margin-right: 2px; font-weight: 700; line-height: 1; }
.submit-inner span { color: #6b7280; font-size: 13px; }
.submit-inner p { flex-basis: 100%; color: #9ca3af; font-size: 12px; margin: -2px 0 0; }
.submit-actions { display: flex; gap: 12px; flex-shrink: 0; }
.cancel-btn, .primary-btn {
  width: 150px; height: 42px; border-radius: 4px; font-size: 15px;
  cursor: pointer; transition: all 0.2s; font-weight: 500; border: none;
}
.cancel-btn { border: 1px solid #d1d5db; background: #fff; color: #374151; }
.primary-btn {
  background: linear-gradient(135deg, #2f68ed, #3b82f6); color: #fff;
  box-shadow: 0 4px 12px rgba(47, 104, 237, 0.3);
}
.primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(47, 104, 237, 0.4); }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

@media (max-width: 1200px) {
  .main-wrap { grid-template-columns: 1fr; gap: 24px; }
  .source-card { position: static; }
}
</style>
