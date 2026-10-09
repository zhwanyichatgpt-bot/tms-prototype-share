<template>
  <section class="invoice-page" :data-annotation-content="planPicker || waybillSheet ? null : 'modal'" aria-label="发票管理">
    <!-- 顶部渐变背景：Pixso 导出 6:479 分组6（750x660 → 375x330） -->
    <img class="apply-bg" src="/zhiyun-mobile-assets/invoice/apply-hero-bg.png" alt="" />

    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <!-- ==================== 申请开票视图 ==================== -->
    <template v-if="view === 'apply' && !activePlan">
      <div class="apply-body">
        <header class="nav-bar apply-nav">
          <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1>申请开票</h1>
          <button type="button" class="nav-record" @click="view = 'record'">
            <img src="/zhiyun-mobile-assets/invoice/icon-record.svg" alt="" />
            <span>开票记录</span>
          </button>
        </header>

        <main class="apply-scroll">
        <!-- 金额区：待开票金额 + 3D 徽章（坐在渐变背景上，无卡片） -->
        <div class="hero-amount">
          <div class="hero-left">
            <div class="hero-label-row">
              <span class="hero-label-text">待开票金额（元）</span>
              <button type="button" class="hero-eye" @click="amountVisible = true" :class="{ active: amountVisible }" aria-label="显示金额">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.3 8C2.7 5.1 5.2 3.3 8 3.3s5.3 1.8 6.7 4.7c-1.4 2.9-3.9 4.7-6.7 4.7S2.7 10.9 1.3 8z" stroke="#5b6c8a" stroke-width="1.3"/><circle cx="8" cy="8" r="2" fill="#5b6c8a"/></svg>
              </button>
              <button type="button" class="hero-eye" @click="amountVisible = false" :class="{ active: !amountVisible }" aria-label="隐藏金额">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.1 6.4A2 2 0 0 0 9.6 9.9M4.1 4.5C2.6 5.6 1.7 7 1.3 8c1.4 2.9 3.9 4.7 6.7 4.7 1 0 1.9-.2 2.7-.6M7 3.4c.3-.05.66-.1 1-.1 2.8 0 5.3 1.8 6.7 4.7-.3.6-.8 1.3-1.4 1.9" stroke="#5b6c8a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <p class="hero-value">{{ amountVisible && selectedPlan ? money(openableTotal).replace('¥','¥ ') : '* * * *' }}</p>
          </div>
          <img class="hero-badge" src="/zhiyun-mobile-assets/invoice/amount-badge-3d.png" alt="" />
        </div>

        <!-- 未选货源：选择货源计划卡 -->
        <section v-if="!selectedPlan" class="cargo-card picker-card">
          <div class="picker-row">
            <h3 class="picker-title">
              选择货源计划
              <svg class="picker-check" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5.5 11L12 3.5" stroke="#3dc86e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </h3>
            <button type="button" class="picker-cta" @click="pickPlan">
              去选择
              <svg width="7" height="12" viewBox="0 0 14 24" fill="none"><path d="M2.5 2.5L11.5 12L2.5 21.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <p class="picker-hint">请选择货源计划后查看可开票运单</p>
        </section>

        <!-- 货源卡：货品 + 装卸日期 + 两点一线地址 + 实付运费 + 切换 -->
        <section v-else class="cargo-card">
          <div class="cargo-head">
            <p class="cargo-goods">{{ selectedPlan.goods }} <b>{{ selectedPlan.quantity }}</b></p>
            <p class="cargo-dates">{{ selectedPlan.loadDate.replace('装货','') }}装货 <svg width="10" height="8" viewBox="0 0 20 16" fill="none"><path d="M1 8h16M13 2.5L18.5 8L13 13.5" stroke="#5b6c8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> {{ selectedPlan.unloadDate.replace('卸货','') }}卸货</p>
            <button type="button" class="link-switch" @click="pickPlan">
              切换
              <svg width="7" height="12" viewBox="0 0 14 24" fill="none"><path d="M2.5 2.5L11.5 12L2.5 21.5" stroke="#3a65ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="cargo-body">
            <div class="addr-line">
              <span class="addr-dot"></span>
              <span class="addr-vline"></span>
              <span class="addr-dot"></span>
            </div>
            <div class="addr-texts">
              <p>{{ selectedPlan.loadAddress }}</p>
              <p>{{ selectedPlan.unloadAddress }}</p>
            </div>
            <div class="cargo-freight">
              <small>实付运费</small>
              <p>{{ amountVisible ? (selectedPlan.paid ? selectedPlan.paidAmount.toLocaleString() : '暂无') : '＊＊＊＊' }}<i v-if="selectedPlan.paid">元</i></p>
            </div>
          </div>
        </section>
        </main>

        <!-- 白色面板：可开票运单（可多选提交，逐运单生成申请） -->
        <section class="panel" :class="{ 'annot-zhiyunShipperHome-rule-invoice-paid-waybill': !planPicker && !waybillSheet }">
          <h2 class="panel-title" v-if="selectedPlan">可开票运单({{ openableWaybills.length }})</h2>
          <h2 class="panel-title" v-else>可开票运单</h2>

          <div class="panel-scroll">
          <template v-if="selectedPlan">
            <article v-for="item in openableWaybills" :key="item.id" class="settle-card" :class="{ checked: isSelected(item.id) }" @click="toggleSelect(item.id)">
              <span class="checkbox" :class="{ on: isSelected(item.id) }" aria-hidden="true">
                <svg v-if="isSelected(item.id)" width="11" height="9" viewBox="0 0 17 14" fill="none"><path d="M1.5 7.5L6 12L15.5 1.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div class="settle-main">
                <p class="settle-period">{{ item.platform }} · {{ item.paidTime }} 付款</p>
                <div class="settle-row">
                  <h3 class="settle-no">{{ item.number }}</h3>
                  <span class="settle-amount">{{ amountVisible ? money(waybillInvoiceAmount(item)) : '* * *' }}</span>
                </div>
                <button type="button" class="settle-waybills" @click.stop="openWaybill(item)">查看运单 · {{ item.plate }} <svg width="6" height="10" viewBox="0 0 14 24" fill="none"><path d="M2.5 2.5L11.5 12L2.5 21.5" stroke="#3a65ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              </div>
            </article>
            <div v-if="!openableWaybills.length" class="empty-state">
              <span>¥</span>
              <p>该货源暂无可开票运单；未付款或已申请的运单不在此展示</p>
            </div>
          </template>
          <div v-else class="empty-illustration">
            <img class="empty-img" src="/zhiyun-mobile-assets/invoice/empty-box.png" alt="" />
            <p class="empty-text">请选择货源计划后查看</p>
          </div>
        </div>
        </section>

        <!-- 底部合计栏：已选货源才显示 -->
        <div v-if="selectedPlan" class="bottom-bar">
          <div class="bottom-amount">
            <p class="bottom-value">{{ amountVisible ? `¥${selectedTotal.toLocaleString()}` : '¥ * * * *' }}</p>
            <small>已选开票金额</small>
          </div>
          <button type="button" class="bottom-btn" @click="startApply">去开票</button>
        </div>
      </div>
    </template>

    <!-- ==================== 开票信息填写 ==================== -->
    <template v-if="view === 'apply' && activePlan">
      <header class="nav-bar">
        <button type="button" class="back-button" aria-label="返回" @click="cancelApply">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>填写开票信息</h1>
        <span class="nav-spacer"></span>
      </header>

      <main class="invoice-content">
        <section class="card">
          <div class="summary-row"><span>归属货源</span><b>{{ activePlan.route }} · {{ activePlan.goods }}</b></div>
          <div class="summary-row"><span>承接平台</span><b>{{ applyPlatforms }}</b></div>
          <div class="summary-row"><span>关联运单</span><b>{{ applyWaybills.length }} 张</b></div>
          <div class="summary-row"><span>开票金额合计</span><b class="blue">{{ money(applyAmount) }}</b></div>
        </section>

        <section class="card form-card" :class="{ 'annot-zhiyunShipperHome-field-invoice-company-header': titleType === '企业' && !planPicker && !waybillSheet }">
          <h3 class="card-title">开票信息</h3>

          <!-- 已存抬头：点选即回填，避免每次重复填写；维护入口在开票记录页 -->
          <div v-if="savedTitles.length" class="saved-titles">
            <button
              v-for="item in savedTitles"
              :key="item.id"
              type="button"
              class="saved-title"
              :class="{ active: activeTitleId === item.id }"
              @click="useTitle(item)"
            >
              <span class="saved-name">{{ item.name }}</span>
              <span class="saved-meta">{{ item.type }}<template v-if="item.isDefault"> · 默认</template></span>
            </button>
          </div>

          <div class="title-switch" role="group" aria-label="抬头类型">
            <button type="button" :class="{ active: titleType === '企业' }" @click="switchTitleType('企业')">企业</button>
            <button type="button" :class="{ active: titleType === '个人' }" @click="switchTitleType('个人')">个人</button>
          </div>

          <template v-if="titleType === '企业'">
            <label class="field"><span>企业名称<i>*</i></span><input v-model="form.company" type="text" placeholder="请输入" /></label>
            <label class="field"><span>纳税人识别号<i>*</i></span><input v-model="form.taxNo" type="text" placeholder="请输入" /></label>
            <label class="field"><span>收票邮箱<i>*</i></span><input v-model="form.email" type="text" placeholder="请输入" /></label>
            <p class="field-note">开具增值税普通发票仅需企业名称与纳税人识别号；开具专用发票时才需补充地址、电话与开户信息。</p>
            <label class="field"><span>注册地址</span><input v-model="form.address" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>注册电话</span><input v-model="form.phone" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>开户行</span><input v-model="form.bank" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>开户账号</span><input v-model="form.account" type="text" placeholder="开具专用发票时填写" /></label>
          </template>
          <template v-else>
            <label class="field"><span>姓名<i>*</i></span><input v-model="form.personName" type="text" placeholder="请输入" /></label>
            <label class="field"><span>联系电话<i>*</i></span><input v-model="form.personPhone" type="text" placeholder="请输入" /></label>
            <label class="field"><span>收票邮箱<i>*</i></span><input v-model="form.email" type="text" placeholder="请输入" /></label>
          </template>
          <p class="field-note strong">请确保开票信息准确无误；提交后每张运单分别生成开票申请，由对应承接平台处理。</p>
        </section>

        <div class="apply-actions">
          <button type="button" class="cargo-action wide" @click="cancelApply">返回</button>
          <button type="button" class="submit-action wide" @click="submitApply">提交开票</button>
        </div>
      </main>
    </template>

    <!-- ==================== 开票记录视图 ==================== -->
    <template v-if="view === 'record'">
      <!-- 顶部渐变背景：Pixso 6:1379 分组1（750x422 → 375x211） -->
      <img class="record-bg" src="/zhiyun-mobile-assets/invoice/record-hero-bg.png" alt="" />

      <div class="record-body">
        <header class="nav-bar">
          <button type="button" class="back-button" aria-label="返回" @click="view = 'apply'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1>开票记录</h1>
          <button type="button" class="nav-record" @click="$emit('manage-titles')">抬头管理</button>
        </header>

        <!-- 统计区：累计开票金额 + 已开发票（Pixso 6:1440 / 6:1454） -->
        <section class="record-stats">
          <div class="stat-block">
            <div class="stat-label">
              <span>累计开票金额（元)</span>
              <button type="button" class="stat-eye" @click="amountVisible = !amountVisible" :aria-label="amountVisible ? '隐藏金额' : '显示金额'">
                <svg v-if="amountVisible" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.3 8C2.7 5.1 5.2 3.3 8 3.3s5.3 1.8 6.7 4.7c-1.4 2.9-3.9 4.7-6.7 4.7S2.7 10.9 1.3 8z" stroke="#647090" stroke-width="1.3"/><circle cx="8" cy="8" r="2" fill="#647090"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.1 6.4A2 2 0 0 0 9.6 9.9M4.1 4.5C2.6 5.6 1.7 7 1.3 8c1.4 2.9 3.9 4.7 6.7 4.7 1 0 1.9-.2 2.7-.6M7 3.4c.3-.05.66-.1 1-.1 2.8 0 5.3 1.8 6.7 4.7-.3.6-.8 1.3-1.4 1.9" stroke="#647090" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <p class="stat-value">{{ amountVisible ? money2(summary.totalAmount) : '* * * *' }}</p>
          </div>

          <span class="stat-divider"></span>

          <div class="stat-block stat-block-right">
            <div class="stat-label"><span>已开发票</span></div>
            <p class="stat-value">{{ summary.count }}<i>张</i></p>
          </div>
        </section>

        <!-- 白色面板：筛选栏 + 记录卡片 -->
        <section class="record-panel" :class="{ 'annot-zhiyunShipperHome-rule-invoice-record-status': !planPicker && !waybillSheet }">
          <div class="filter-bar">
            <button v-for="f in filters" :key="f.key" type="button" class="filter-item" :class="{ active: sortKey === f.key }" @click="toggleSort(f.key)">
              {{ f.label }}
              <svg class="filter-arrow" :class="{ desc: sortKey === f.key && sortDesc }" width="9" height="5" viewBox="0 0 17 9" fill="none"><path d="M1 1l7.5 7L16 1" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>

          <div class="record-scroll">
            <article v-for="item in sortedRecords" :key="item.id" class="record-card" @click="emit('open-detail', item)">
              <div class="record-head">
                <span class="record-no">{{ item.titleType }}开票 {{ item.applyNo }}</span>
                <button type="button" class="copy-btn" aria-label="复制申请编号" @click.stop="copyNo(item.applyNo)">
                  <svg width="11" height="11" viewBox="0 0 21 21" fill="none"><path d="M7.5 7.5V4.2c0-.9.8-1.7 1.7-1.7h7.6c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7h-3.3" stroke="#BCBCBC" stroke-width="1.6"/><rect x="2" y="7.5" width="11" height="11" rx="1.7" stroke="#BCBCBC" stroke-width="1.6"/></svg>
                </button>
              </div>
              <div class="record-main">
                <h3 class="record-name">{{ item.title.name }}</h3>
                <span class="record-amount"><i>￥</i>{{ money2(item.amount) }}</span>
              </div>
              <p class="record-waybill">运单 {{ item.waybillNo }} · {{ item.platform }}</p>
              <div class="record-foot">
                <span class="record-state" :class="stateClass(item.status)">
                  <i class="dot"></i>{{ item.status }}
                </span>
                <span class="record-time">{{ recordTime(item) }}</span>
              </div>
            </article>
            <div v-if="!records.length" class="empty-state"><span>¥</span><p>暂无开票记录</p></div>
          </div>
        </section>
      </div>
    </template>

    <div v-if="notice" class="notice" role="status">{{ notice }}<button type="button" @click="notice = ''">×</button></div>

    <!-- 货源计划选择弹层 -->
    <div v-if="planPicker" class="overlay" data-annotation-container="drawer" @click.self="planPicker = false">
      <section class="sheet" data-annotation-content="drawer">
        <div class="sheet-head"><h2>选择货源计划</h2><button type="button" aria-label="关闭" @click="planPicker = false">×</button></div>
        <button v-for="plan in plans" :key="plan.id" type="button" class="plan-option" :class="{ muted: !hasOpenable(plan) }" @click="choosePlan(plan)">
          <div class="row-between">
            <strong>{{ plan.route }} · {{ plan.goods }}</strong>
            <span v-if="hasOpenable(plan)" class="plan-amount">{{ openableCount(plan) }} 张可开票</span>
            <span v-else class="plan-locked">暂无可开票</span>
          </div>
          <p class="secondary">{{ plan.loadDate }} · {{ plan.quantity }} · {{ plan.paid ? '含已付款运单' : '运单未付款' }}</p>
        </button>
        <button type="button" class="sheet-close" @click="planPicker = false">取消</button>
      </section>
    </div>

    <!-- 运单信息弹层 -->
    <div v-if="waybillSheet" class="overlay" data-annotation-container="drawer" @click.self="waybillSheet = null">
      <section class="sheet" data-annotation-content="drawer">
        <div class="sheet-head"><h2>运单信息</h2><button type="button" aria-label="关闭" @click="waybillSheet = null">×</button></div>
        <div class="summary-row"><span>运单号</span><b>{{ waybillSheet.number }}</b></div>
        <div class="summary-row"><span>承接平台</span><b>{{ waybillSheet.platform }}</b></div>
        <div class="summary-row"><span>车牌 / 司机</span><b>{{ waybillSheet.plate }} · {{ waybillSheet.driver }}</b></div>
        <div class="summary-row"><span>装卸地点</span><b>{{ waybillSheet.loadCity }} → {{ waybillSheet.unloadCity }}</b></div>
        <div class="summary-row"><span>付款时间</span><b>{{ waybillSheet.paidTime }}</b></div>
        <div class="summary-row"><span>可开票金额</span><b class="blue">{{ money(waybillInvoiceAmount(waybillSheet)) }}</b></div>
        <p class="gap-note">仅已付款运单可申请，开票金额取该运单的实际结算金额。</p>
        <button type="button" class="sheet-close" @click="waybillSheet = null">返回</button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { canInvoiceWaybill, cargoPlans, defaultTitle, invoiceRecords, invoiceSummary, invoiceTitles, titleToForm, waybillInvoiceAmount } from './invoice-data.js'
import { waybillList } from './mock-data.js'

const props = defineProps({
  initialTab: { type: String, default: 'apply' },
  /* 重新申请：令牌递增触发回到申请页，同时清空上一次的选择 */
  resetToken: { type: Number, default: 0 },
})
const emit = defineEmits(['back', 'open-detail', 'manage-titles'])

const plans = cargoPlans
const records = invoiceRecords
/* apply 视图内部再分：apply=申请开票、record=开票记录；表单叠在 apply 之上 */
const view = ref(props.initialTab === 'record' ? 'record' : 'apply')
watch(() => props.initialTab, (value) => {
  if (value === 'apply' || value === 'record') view.value = value
})
watch(() => props.resetToken, () => {
  view.value = 'apply'
  selectedPlanId.value = null
  selectedIds.value = []
  activePlan.value = null
  titleType.value = '企业'
})

const selectedPlanId = ref(null)
const selectedPlan = computed(() => plans.value.find(plan => plan.id === selectedPlanId.value) || null)
const selectedIds = ref([])
const activePlan = ref(null)
const planPicker = ref(false)
const waybillSheet = ref(null)
const titleType = ref('企业')
const notice = ref('')
/* 金额显隐：眼睛图标切换 */
const amountVisible = ref(true)
/* 当前选用的已存抬头：高亮用；未选用时按表单内容自由填写 */
const activeTitleId = ref('')

const savedTitles = computed(() => invoiceTitles.filter(item => item.type === titleType.value))

const form = reactive({
  company: '',
  taxNo: '',
  email: '',
  address: '',
  phone: '',
  bank: '',
  account: '',
  personName: '',
  personPhone: '',
})

/* 带出默认抬头，开票时无需重复维护 */
function applyTitle(title) {
  if (!title) return
  const values = titleToForm(title)
  Object.keys(values).forEach(key => { form[key] = values[key] })
  titleType.value = title.type
  activeTitleId.value = title.id
}
applyTitle(defaultTitle())

/* 切换票种时若当前抬头类型不匹配，自动落到该类型下的第一条 */
function switchTitleType(type) {
  if (titleType.value === type) return
  titleType.value = type
  const match = invoiceTitles.find(item => item.type === type)
  if (match) applyTitle(match)
  else activeTitleId.value = ''
}

function useTitle(title) {
  applyTitle(title)
}
function refreshTitles() {
  /* 抬头维护页新增后回到表单：保持当前选择，若已失效则回落到默认 */
  if (activeTitleId.value && !invoiceTitles.some(item => item.id === activeTitleId.value)) {
    applyTitle(defaultTitle())
  }
}
defineExpose({ refreshTitles })

const summary = computed(() => invoiceSummary(records))
const openableWaybills = computed(() => waybillList.filter(waybill => waybill.cargoId === selectedPlanId.value && canInvoiceWaybill(waybill, records)))
const openableTotal = computed(() => openableWaybills.value.reduce((sum, waybill) => sum + waybillInvoiceAmount(waybill), 0))
const selectedTotal = computed(() => openableWaybills.value.filter(waybill => selectedIds.value.includes(waybill.id)).reduce((sum, waybill) => sum + waybillInvoiceAmount(waybill), 0))

const applyWaybills = ref([])
const applyAmount = computed(() => applyWaybills.value.reduce((sum, waybill) => sum + waybillInvoiceAmount(waybill), 0))
const applyPlatforms = computed(() => [...new Set(applyWaybills.value.map(waybill => waybill.platform))].join('、'))
const openableCount = plan => waybillList.filter(waybill => waybill.cargoId === plan.id && canInvoiceWaybill(waybill, records)).length
const hasOpenable = plan => openableCount(plan) > 0

function money(value) {
  return `¥${Number(value).toLocaleString()}`
}
/* 记录页金额：设计稿为 ￥ + 两位小数（Pixso 6:1482） */
function money2(value) {
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
/* 记录页排序：三个筛选项共用一套升降序 */
const filters = [
  { key: 'status', label: '开票进度' },
  { key: 'time', label: '开票时间' },
  { key: 'type', label: '发票类型' },
]
const sortKey = ref('time')
const sortDesc = ref(true)
function toggleSort(key) {
  if (sortKey.value === key) sortDesc.value = !sortDesc.value
  else { sortKey.value = key; sortDesc.value = true }
}
const STATUS_ORDER = { '待开票': 0, '开票中': 1, '已开票': 2, '已驳回': 3 }

const sortedRecords = computed(() => {
  const list = [...records]
  const dir = sortDesc.value ? -1 : 1
  return list.sort((a, b) => {
    if (sortKey.value === 'status') {
      const d = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      return d !== 0 ? d * dir : a.applyTime.localeCompare(b.applyTime) * dir
    }
    if (sortKey.value === 'type') {
      return a.titleType.localeCompare(b.titleType, 'zh') * dir
    }
    return a.applyTime.localeCompare(b.applyTime) * dir
  })
})

/* 时间文案按状态收尾：完成 / 申请 / 驳回 */
function recordTime(item) {
  const action = { '已开票': '完成', '开票中': '申请', '待开票': '申请', '已驳回': '驳回' }[item.status] || '申请'
  const raw = (item.applyTime || '').replace(/-/g, '/')
  if (raw.includes(' ')) {
    const [date, time] = raw.split(' ')
    const [y, m, d] = date.split('/')
    return `${y}年${m}月${d}日 ${time} ${action}`
  }
  return `${raw} ${action}`
}
function copyNo(no) {
  navigator.clipboard?.writeText(no).then(
    () => { notice.value = '申请编号已复制' },
    () => { notice.value = '原型演示：复制失败，请手动选择文本' },
  )
}
function stateClass(status) {
  return {
    '待开票': 'is-pending',
    '开票中': 'is-doing',
    '已开票': 'is-done',
    '已驳回': 'is-reject',
  }[status] || ''
}
function isSelected(id) {
  return selectedIds.value.includes(id)
}
function toggleSelect(id) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}
function pickPlan() {
  planPicker.value = true
}
function choosePlan(plan) {
  selectedPlanId.value = plan.id
  selectedIds.value = []
  planPicker.value = false
}
function openWaybill(item) {
  waybillSheet.value = item
}
function startApply() {
  if (!selectedPlan.value) {
    notice.value = '请先选择货源计划'
    return
  }
  if (!selectedIds.value.length) {
    notice.value = '请先勾选要开票的运单'
    return
  }
  applyWaybills.value = openableWaybills.value.filter(waybill => selectedIds.value.includes(waybill.id))
  activePlan.value = selectedPlan.value
}
function cancelApply() {
  activePlan.value = null
}
function submitApply() {
  const missing = titleType.value === '企业'
    ? (!form.company || !form.taxNo || !form.email)
    : (!form.personName || !form.personPhone || !form.email)
  if (missing) {
    notice.value = '请填写完整的必填开票信息'
    return
  }
  if (!applyWaybills.value.length || applyWaybills.value.some(waybill => !canInvoiceWaybill(waybill, records))) {
    notice.value = '运单开票资格已变化，请返回重新选择'
    return
  }
  /* 一张运单一条申请、一张发票；多选只合并提交操作，不合并开票对象。 */
  const newRecords = applyWaybills.value.map((waybill, index) => ({
    id: `FP${Date.now()}${index}`,
    applyNo: `2604231448${String(Date.now()).slice(-5)}${index}`,
    platform: waybill.platform,
    cargoNo: waybill.cargoNo,
    waybillId: waybill.id,
    waybillNo: waybill.number,
    plate: waybill.plate,
    route: activePlan.value.route,
    goods: waybill.cargo,
    amount: waybillInvoiceAmount(waybill),
    titleType: titleType.value,
    status: '待开票',
    applyTime: '2026-04-15 10:30',
    invoiceNo: '',
    rejectReason: '',
    title: titleType.value === '企业'
      ? { name: form.company, taxNo: form.taxNo, email: form.email, address: form.address, phone: form.phone, bank: form.bank, account: form.account }
      : { name: form.personName, email: form.email, phone: form.personPhone },
    timeline: [{ time: '04-15 10:30', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' }],
  }))
  records.unshift(...newRecords)
  /* 开票资格直接由运单和申请记录推导，不维护第二份可开票列表。 */
  selectedIds.value = []
  activePlan.value = null
  view.value = 'record'
  notice.value = `已提交 ${newRecords.length} 张运单开票申请，由承接平台分别处理`
}
</script>

<style scoped>
/* 版式与字号沿用二级页既有规范；申请开票页结构按 Pixso 6:478（750→375 @0.5x） */
.invoice-page{position:absolute;inset:0;z-index:6;background:#EEF0F5;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.invoice-page *{box-sizing:border-box}
.invoice-page button{font-family:inherit;cursor:pointer}

.apply-bg{position:absolute;top:0;left:0;width:375px;height:330px;object-fit:cover;pointer-events:none}

.status-bar{position:relative;z-index:2;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}

.nav-bar{position:relative;z-index:2;height:50px;display:flex;align-items:center;padding:0 16px}
.nav-bar h1{margin:0;font-size:16px;font-weight:600;color:#333;letter-spacing:.5px}
.apply-nav h1{margin-left:6px}
.back-button{width:24px;height:24px;border:0;background:none;display:flex;align-items:center;justify-content:center;padding:0}
.nav-record{display:flex;align-items:center;gap:4px;margin-left:auto;border:0;background:none;padding:0;color:#333;font-size:14px;font-weight:600}
.nav-record img{width:16px;height:16px;object-fit:contain}
.nav-spacer{width:24px;height:24px}

/* ===== 申请视图布局：状态栏 + 导航 + 金额区 + 卡片 + 面板 纵向 flex ===== */
.apply-body{position:absolute;top:44px;bottom:0;left:0;right:0;z-index:2;display:flex;flex-direction:column}
.apply-scroll{position:relative;z-index:2;flex-shrink:0}

/* ===== 申请开票：金额区（设计稿 y:200/2=100） ===== */
.hero-amount{position:relative;display:flex;align-items:flex-start;justify-content:space-between;padding:6px 24px 0 30px}
.hero-label-row{display:flex;align-items:center;gap:4px}
.hero-label-text{color:#647090;font-size:12px;line-height:12px;font-weight:400}
.hero-eye{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;background:none;padding:0;opacity:.5}
.hero-eye.active{opacity:1}
.hero-value{margin:10px 0 0;font-family:'Douyin Sans','PingFang SC',sans-serif;font-size:29px;line-height:29px;font-weight:700;color:#28364A;letter-spacing:2px}
.hero-badge{width:120px;height:95px;object-fit:contain;margin-top:-14px;margin-right:-6px}

/* 货源卡 */
.cargo-card{position:relative;z-index:2;margin:14px 16px 0;padding:14px;border-radius:8px;background:#fff;box-shadow:0 2px 10px rgba(96,116,166,.08)}
.cargo-head{display:flex;align-items:flex-start;gap:8px}
.cargo-goods{flex-shrink:0;margin:0;font-size:14px;font-weight:700;color:#252b3a}
.cargo-goods b{color:#2f61f6;font-weight:700}
.cargo-dates{flex:1;margin:2px 0 0;font-size:12px;color:#5b6c8a;white-space:nowrap}
.cargo-dates svg{vertical-align:-1px;margin:0 3px}
.link-switch{display:flex;align-items:center;gap:2px;flex-shrink:0;border:0;background:none;padding:0;color:#3a65ff;font-size:13px;font-weight:600}

/* 未选货源：选择货源计划卡 —— 按 Pixso 6:617 渐变 + 白描边 + 蓝阴影 */
.picker-card{margin:14px 24px 0;padding:14px;border-radius:8px;background:linear-gradient(180deg,#E6EFFF 0%,#FFFFFF 26%);border:1px solid #fff;box-shadow:0 2px 10px rgba(207,224,252,1)}
.picker-card .picker-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.picker-title{display:flex;align-items:center;gap:4px;margin:0;font-family:'Douyin Sans','PingFang SC',sans-serif;font-size:16px;line-height:19px;font-weight:700;background:linear-gradient(180deg,#2C6EB5 0%,#08248A 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.picker-check{flex-shrink:0;width:15px;height:8px}
.picker-cta{display:inline-flex;align-items:center;justify-content:center;gap:4px;width:74px;height:28px;padding:0;border:0;border-radius:14px;background:linear-gradient(90deg,#4063FF 0%,#5CA8FF 100%);color:#fff;font-size:12px;font-weight:600;line-height:1}
.picker-hint{margin:10px 0 0;color:#333;font-size:12px;line-height:17px}
.cargo-body{display:flex;align-items:flex-start;gap:8px;margin-top:12px}
.addr-line{display:flex;flex-direction:column;align-items:center;padding-top:5px}
.addr-dot{width:6px;height:6px;border-radius:50%;background:#35b26b}
.addr-vline{width:1px;height:22px;margin:2px 0;background:#c9d4ea}
.addr-texts{flex:1;min-width:0}
.addr-texts p{margin:0;font-size:12px;line-height:17px;color:#333}
.addr-texts p + p{margin-top:12px}
.cargo-freight{flex-shrink:0;text-align:right;margin-top:2px}
.cargo-freight small{display:block;color:#a2a8b4;font-size:10px}
.cargo-freight p{margin:2px 0 0;font-size:16px;font-weight:700;color:#252b3a}
.cargo-freight i{margin-left:2px;font-size:11px;font-style:normal;font-weight:400;color:#5b6c8a}

/* ===== 白色面板：可开票运单 —— flex 自然跟随上方 ===== */
.panel{position:relative;flex:1;min-height:0;margin-top:14px;z-index:2;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.8) 0%,#EEF0F5 100%);border-radius:12px 12px 0 0;padding:14px 12px 0;box-shadow:inset 0 2px 0 #fff}
.panel-title{margin:0 0 8px;padding:0 13px;font-size:16px;line-height:22px;font-weight:600;color:#333;letter-spacing:.5px}
.panel-scroll{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;padding:0 4px 12px}
.panel-scroll::-webkit-scrollbar{display:none}

.settle-card{display:flex;gap:10px;margin-bottom:10px;padding:14px;border-radius:10px;background:#fff;box-shadow:0 1px 6px rgba(96,116,166,.1)}
.settle-card.checked{background:#f5f8ff}
.checkbox{flex-shrink:0;width:20px;height:20px;margin-top:14px;border-radius:50%;border:1.5px solid #c9cfdb;background:#fff;display:inline-flex;align-items:center;justify-content:center}
.checkbox.on{border-color:#2f61f6;background:#2f61f6}
.settle-main{flex:1;min-width:0}
.settle-period{margin:0;font-size:12px;color:#8a91a1}
.settle-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:6px}
.settle-no{margin:0;font-size:15px;font-weight:700;color:#252b3a}
.settle-amount{font-size:15px;font-weight:700;color:#252b3a;white-space:nowrap}
.settle-waybills{display:inline-flex;align-items:center;gap:3px;margin-top:8px;border:0;background:none;padding:0;color:#3a65ff;font-size:12px;font-weight:500}

/* 未选货源的空状态：Pixso 6:508 盒子 320x326/2=160x163，文案 32px/2=16 #999 */
.empty-illustration{display:flex;flex-direction:column;align-items:center;padding:50px 0 30px}
.empty-img{width:141px;height:141px;object-fit:contain;display:block}
.empty-text{margin:14px 0 0;font-size:16px;color:#999;line-height:22px}

.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:150px;padding:0 24px;text-align:center;color:#abb0b8}
.empty-state span{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#e3e8f0;color:#8f99a8;font-size:22px}
.empty-state p{margin:10px 0 0;font-size:13px;line-height:19px}

/* 底部合计栏 */
.bottom-bar{position:relative;flex-shrink:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px 18px;background:#fff;border-top:1px solid #eef0f4}
.bottom-value{margin:0;font-size:19px;font-weight:700;color:#2f61f6}
.bottom-amount small{display:block;margin-top:2px;color:#a2a8b4;font-size:10px}
.bottom-btn{flex-shrink:0;width:207px;height:40px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}

/* ===== 表单与记录视图：沿用二级页既有写法 ===== */
.invoice-content{position:absolute;top:88px;bottom:16px;left:0;right:0;z-index:2;overflow-y:auto;padding:4px 16px 24px;scrollbar-width:none}
.invoice-content::-webkit-scrollbar{display:none}

.card{position:relative;z-index:2;background:#fff;border-radius:10px;padding:14px;margin-bottom:8px;box-shadow:0 1px 6px rgba(96,116,166,.08)}
.card-title{margin:0;font-size:15px;line-height:20px;font-weight:700;color:#252b3a}
.secondary{margin:4px 0 0;color:#666;font-size:11px;line-height:17px}
.blue{color:#3a65ff}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:8px}
.list-note{position:relative;z-index:2;margin:8px 0 6px;color:#8a91a1;font-size:11px;line-height:17px}
.summary-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-top:6px;font-size:12px}
.summary-row span{flex-shrink:0;color:#747c8c}
.summary-row b{font-weight:600;color:#333;text-align:right;word-break:break-all}
.cargo-price{text-align:right;color:#3d6dff;white-space:nowrap}
.cargo-price small{display:block;color:#a2a8b4;font-size:9px;line-height:10px}
.cargo-price strong{font-size:19px;line-height:22px}

.cargo-action{min-width:82px;height:30px;padding:0 12px;flex-shrink:0;border:1px solid #d9dce3;border-radius:16px;background:#fff;color:#333;font-size:13px;font-weight:600}
.submit-action{min-width:82px;height:30px;padding:0 14px;flex-shrink:0;border:0;border-radius:16px;background:#3a65ff;color:#fff;font-size:13px;font-weight:600}
.wide{flex:1;min-width:0;height:42px;border-radius:8px;font-size:15px;font-weight:700}

.form-card{margin-top:8px}
.title-switch{display:flex;gap:8px;margin:10px 0 4px}
.title-switch button{padding:5px 16px;border:1px solid #d9dce3;border-radius:15px;background:#fff;color:#626b78;font-size:13px}
.title-switch button.active{border-color:#3a65ff;background:#eef3ff;color:#2f61f6;font-weight:600}

/* 已存抬头：横向可选，点选即回填表单 */
.saved-titles{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.saved-titles::-webkit-scrollbar{display:none}
.saved-title{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 12px;border:1px solid #e6e9f0;border-radius:8px;background:#fbfcfe;text-align:left}
.saved-title.active{border-color:#3a65ff;background:#eef3ff}
.saved-name{font-size:13px;font-weight:600;color:#252b3a;white-space:nowrap}
.saved-title.active .saved-name{color:#2f61f6}
.saved-meta{color:#8a91a1;font-size:10px;white-space:nowrap}

.field{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #f0f2f6}
.field:last-of-type{border-bottom:0}
.field span{flex-shrink:0;width:96px;color:#333;font-size:13px}
.field span i{color:#e35d5d;font-style:normal;margin-left:2px}
.field input{flex:1;min-width:0;border:0;background:none;color:#252b3a;font-size:13px;text-align:right;font-family:inherit;outline:none}
.field input::placeholder{color:#bfc5d0}
.field-note{margin:10px 0 0;padding:9px 10px;border-radius:7px;background:#f4f5f9;color:#747c8c;font-size:11px;line-height:17px}
.field-note.strong{margin-top:12px;color:#5b6c8a}

.apply-actions{display:flex;gap:10px;margin-top:14px}

/* ===== 开票记录视图（Pixso 6:1378，750→375 @0.5x） ===== */
.record-bg{position:absolute;top:0;left:0;width:375px;height:211px;object-fit:cover;pointer-events:none}
.record-body{position:absolute;top:44px;bottom:0;left:0;right:0;z-index:2;display:flex;flex-direction:column}

/* 统计区：累计开票金额 | 已开发票（Pixso 竖线 x:273，右块 x:297） */
.record-stats{position:relative;z-index:2;flex-shrink:0;display:flex;align-items:center;padding:6px 30px 0}
.stat-block{flex:1;min-width:0}
.stat-block-right{flex:0 0 48px;text-align:center}
.stat-label{display:flex;align-items:center;gap:3px;color:#647090;font-size:12px;line-height:17px}
.stat-block-right .stat-label{justify-content:center;white-space:nowrap}
.stat-eye{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;background:none;padding:0}
.stat-value{margin:4px 0 0;font-family:'Douyin Sans','PingFang SC',sans-serif;font-size:29px;line-height:29px;font-weight:700;color:#28364A;letter-spacing:.5px}
.stat-value i{margin-left:2px;font-family:'PingFang SC',sans-serif;font-size:12px;font-style:normal;font-weight:700;line-height:17px;vertical-align:5px}
.stat-divider{flex-shrink:0;width:1px;height:45px;margin-right:23px;background:rgba(109,128,161,.5)}

/* 白色面板 + 筛选栏 */
.record-panel{position:relative;z-index:2;flex:1;min-height:0;margin-top:21px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.8) 0%,#EEF0F5 100%);border-radius:12px 12px 0 0;box-shadow:inset 0 2px 0 #fff}
.filter-bar{flex-shrink:0;display:flex;align-items:center;padding:16px 28px 12px}
.filter-item{display:inline-flex;align-items:center;gap:5px;border:0;background:none;padding:0;color:#333;font-size:13px;font-weight:600;line-height:13px}
.filter-item + .filter-item{margin-left:auto}
.filter-arrow{transition:transform .2s}
.filter-arrow.desc{transform:rotate(180deg)}

.record-scroll{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;padding:0 16px 20px}
.record-scroll::-webkit-scrollbar{display:none}

.record-card{padding:13px 14px 14px;margin-bottom:10px;border-radius:8px;background:#fff;cursor:pointer}
.record-head{display:flex;align-items:center;gap:5px}
.record-no{color:#8A91A1;font-size:12px;line-height:14px}
.copy-btn{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:0;background:none;padding:0}
.record-main{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px}
.record-name{margin:0;font-size:16px;line-height:16px;font-weight:700;color:#2A2F3B}
.record-amount{flex-shrink:0;font-family:'Douyin Sans','PingFang SC',sans-serif;font-size:16px;line-height:17px;font-weight:700;color:#333;white-space:nowrap}
.record-amount i{font-size:14px;font-style:normal;font-weight:700}
.record-waybill{margin:8px 0 0;font-size:11px;color:#8a91a1}
.record-foot{display:flex;align-items:center;gap:8px;margin-top:16px}
.record-state{display:inline-flex;align-items:center;gap:4px;font-size:12px;line-height:12px;font-weight:700}
.record-state .dot{width:4px;height:4px;border-radius:50%;background:currentColor}
.record-state.is-done{color:#1CAE7C}
.record-state.is-doing{color:#3A65FF}
.record-state.is-pending{color:#E8A95C}
.record-state.is-reject{color:#EF5242}
.record-time{color:#8A91A1;font-size:12px;line-height:12px;font-weight:400}

.record-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.state-tag{padding:2px 8px;border-radius:4px;background:#eaf2ff;color:#3974d8;font-size:10px;line-height:16px;font-weight:600}
.state-tag.is-pending{background:#fff3e6;color:#d1813a}
.state-tag.is-doing{background:#eaf2ff;color:#3974d8}
.state-tag.is-done{background:#e8f6ee;color:#2f9c62}
.state-tag.is-reject{background:#fdecec;color:#d05252}

.notice{position:absolute;bottom:84px;left:24px;right:24px;z-index:6;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(51,51,51,.92);color:#fff;font-size:12px}
.notice button{border:0;background:none;color:#fff;font-size:16px;line-height:1;padding:0}

.overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;background:rgba(0,0,0,.4)}
.sheet{width:100%;max-height:84%;overflow-y:auto;background:#fff;border-radius:12px 12px 0 0;padding:16px 16px 20px}
.sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.sheet h2{margin:0;font-size:16px;font-weight:700;color:#252b3a}
.sheet-head button{border:0;background:none;font-size:20px;line-height:1;color:#747c8c}
.plan-option{margin-top:10px;padding:12px;border:1px solid #e6e9f0;border-radius:8px;background:#fff;text-align:left;width:100%;display:block}
.plan-option.muted{background:#fafbfc}
.plan-option strong{font-size:14px;color:#252b3a}
.plan-amount{color:#3d6dff;font-size:14px;font-weight:700}
.plan-locked{color:#a2a8b4;font-size:12px}
.waybill-card{margin-top:10px;padding:12px;border:1px solid #eef0f4;border-radius:8px;background:#fbfcfe}
.waybill-card strong{font-size:13px;color:#252b3a}
.sheet .summary-row{margin-top:0;padding:10px 0;border-bottom:1px solid #eef2f6;font-size:13px}
.sheet .summary-row:last-of-type{border-bottom:0}
.sheet .summary-row b{font-weight:700;color:#252b3a}
.sheet .blue{color:#3a65ff}
.gap-note{margin:10px 0 0;padding:10px;border-radius:7px;background:#f4f5f9;color:#747c8c;font-size:11px;line-height:18px}
.sheet-close{width:100%;height:42px;margin-top:14px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}
</style>
