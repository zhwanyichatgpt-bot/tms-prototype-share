<template>
  <section class="shipper-account-page" aria-label="我的账户">
    <div class="account-status-bar">
      <span>9:41</span>
      <span class="account-status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="currentColor"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="currentColor"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="currentColor"/></svg>
        <i class="account-battery"></i>
      </span>
    </div>

    <header class="account-nav">
      <button type="button" aria-label="返回" @click="back">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ view === 'manage' ? (config.manageTitle || '账户管理') : view === 'cards' ? '银行卡' : (config.pageTitle || '我的账户') }}</h1>
      <button v-if="view === 'home'" type="button" class="manage-entry" @click="view = 'manage'">账户管理</button>
      <span v-else />
    </header>

    <main v-if="view === 'home'" ref="scrollEl" class="account-scroll">
      <section class="asset-card">
        <div class="balance-row">
          <div>
            <small>可用余额（元）</small>
            <strong><em>¥</em>{{ config.account.balance }}</strong>
          </div>
          <van-icon name="balance-o" />
        </div>
        <button class="frozen-row" type="button" @click="openSheet('frozen')">
          <span>冻结金额</span>
          <b>¥{{ config.account.frozen }}</b>
          <small v-if="config.account.frozenCount">{{ config.account.frozenCount }}笔{{ config.account.frozenNote || '处理中' }}</small>
          <van-icon name="arrow" />
        </button>
        <div v-if="config.walletActions !== false" class="asset-actions">
          <button type="button" class="primary" @click="openSheet('recharge')">充值</button>
          <button type="button" @click="openSheet('withdraw')">提现</button>
        </div>
        <p v-if="config.demoNote" class="account-demo-note">{{ config.demoNote }}</p>
      </section>

      <button class="payment-task" type="button" @click="openPayment">
        <span class="payment-icon"><van-icon name="bill-o" /></span>
        <span class="payment-copy">
          <small>待支付</small>
          <strong>{{ config.pending.count }}笔 · ¥{{ config.pending.amount }}</strong>
          <em v-if="config.pending.shortage">可用余额不足，还差 ¥{{ config.pending.shortage }}</em>
          <em v-else>可用余额充足</em>
        </span>
        <span class="payment-action">去处理</span>
        <van-icon name="arrow" />
      </button>

      <section ref="flowSection" class="flow-section">
        <div class="section-heading">
          <h2>账户明细</h2>
          <button type="button" @click="notify('月份筛选（原型演示）')">本月<van-icon name="arrow-down" /></button>
        </div>
        <nav class="flow-filters" aria-label="账户明细分类">
          <button
            v-for="item in filters"
            :key="item.key"
            type="button"
            :class="{ active: activeFilter === item.key }"
            @click="activeFilter = item.key"
          >
            {{ item.label }}
          </button>
        </nav>
        <div class="flow-list">
          <button
            v-for="item in filteredFlows"
            :key="item.id"
            type="button"
            class="flow-row"
            @click="openTransaction(item)"
          >
            <span class="flow-icon" :class="item.type"><van-icon :name="item.icon" /></span>
            <span class="flow-copy">
              <strong>
                {{ item.title }}
                <i v-if="item.tag" class="platform-tag">{{ item.tag }}</i>
              </strong>
              <small>{{ item.summary }}</small>
              <em v-if="item.reference">{{ item.reference }} · {{ item.time }}</em>
              <em v-else>{{ item.time }}</em>
            </span>
            <span class="flow-amount">
              <strong :class="{ income: item.amount.startsWith('+') }">{{ item.amount }}</strong>
              <small>{{ item.status }}</small>
            </span>
          </button>
          <p v-if="!filteredFlows.length" class="empty-flow">暂无此类账户明细</p>
        </div>
      </section>
    </main>

    <main v-else-if="view === 'manage'" class="manage-scroll">
      <section class="manage-card">
        <h2>资金账户</h2>
        <div class="manage-row">
          <span><van-icon :name="config.manage.fundAccount.icon || 'manager-o'" /></span>
          <div><strong>{{ config.manage.fundAccount.name }}</strong><small>{{ config.manage.fundAccount.sub }}</small></div>
          <em>{{ config.manage.fundAccount.status }}</em>
        </div>
        <div class="manage-row">
          <span><van-icon :name="config.manage.phone.icon || 'phone-o'" /></span>
          <div><strong>安全手机号</strong><small>{{ config.manage.phone.value }}</small></div>
        </div>
      </section>

      <section class="manage-card">
        <h2>收款与支付</h2>
        <button type="button" class="manage-row clickable" @click="view = 'cards'">
          <span><van-icon name="card" /></span>
          <div><strong>银行卡</strong><small>{{ bankSummary }}</small></div>
          <em>{{ cards.length ? '已绑定' : '未绑定' }}</em>
          <van-icon name="arrow" />
        </button>
        <button type="button" class="manage-row clickable" @click="openSheet('password')">
          <span><van-icon :name="config.manage.password.icon || 'shield-o'" /></span>
          <div><strong>{{ config.manage.password.name }}</strong><small>{{ config.manage.password.sub }}</small></div>
          <em>{{ config.manage.password.status }}</em>
          <van-icon name="arrow" />
        </button>
      </section>

      <p class="manage-note">{{ config.manage.note }}</p>
    </main>

    <main v-else class="manage-scroll">
      <section class="manage-card">
        <h2>已绑定银行卡</h2>
        <article v-for="card in cards" :key="card.id" class="bank-item">
          <span class="bank-icon"><van-icon name="card" /></span>
          <div class="bank-info">
            <strong>{{ card.bankName }}<i v-if="card.isDefault" class="default-tag">默认</i></strong>
            <small>{{ card.type }} · 尾号{{ card.tail }}</small>
            <small>{{ card.accountName }}</small>
          </div>
          <button type="button" class="bank-manage" @click="openCardActions(card)">管理</button>
        </article>
        <p v-if="!cards.length" class="empty-flow">暂未绑定银行卡，绑定后即可提现。</p>
      </section>
      <button class="bind-card-button" type="button" @click="openBindSheet">添加银行卡</button>
      <p class="manage-note">{{ config.bankNote }}</p>
    </main>

    <div v-if="sheet" class="sheet-mask" @click.self="closeSheet">
      <section class="account-sheet">
        <header>
          <h2>{{ sheetTitle }}</h2>
          <button type="button" aria-label="关闭" @click="closeSheet">×</button>
        </header>

        <template v-if="sheet === 'recharge'">
          <label class="amount-input"><span>充值金额</span><b>¥</b><input v-model="operationAmount" inputmode="decimal" placeholder="请输入金额" /></label>
          <div class="quick-amounts">
            <button v-for="value in quickAmounts" :key="value" type="button" @click="operationAmount = value">{{ value }}元</button>
          </div>
          <p class="sheet-note">{{ config.notes.recharge }}</p>
          <button class="sheet-primary" type="button" @click="completeOperation('充值')">确认充值</button>
        </template>

        <template v-else-if="sheet === 'withdraw'">
          <div class="sheet-summary"><span>提现至</span><b>{{ defaultCard ? `${defaultCard.bankName} · 尾号${defaultCard.tail}` : '未绑定银行卡' }}</b></div>
          <button class="sheet-link" type="button" @click="goCardsFromWithdraw">{{ defaultCard ? '更换提现卡' : '去绑定银行卡' }}</button>
          <label class="amount-input"><span>提现金额</span><b>¥</b><input v-model="operationAmount" inputmode="decimal" placeholder="不超过可用余额" /></label>
          <p class="sheet-note">{{ config.notes.withdraw }}</p>
          <button class="sheet-primary" type="button" :disabled="!defaultCard" @click="completeOperation('提现申请')">下一步</button>
        </template>

        <template v-else-if="sheet === 'frozen'">
          <div class="frozen-detail">
            <strong>{{ config.frozenDetail.amount }}</strong>
            <span>{{ config.frozenDetail.status }}</span>
          </div>
          <div v-for="row in config.frozenDetail.rows" :key="row.label" class="sheet-summary"><span>{{ row.label }}</span><b>{{ row.value }}</b></div>
          <button class="sheet-secondary" type="button" @click="closeSheet">我知道了</button>
        </template>

        <template v-else-if="sheet === 'bind'">
          <div class="bind-form">
            <label class="bind-field"><span>开户名</span><input :value="config.manage.fundAccount.name" readonly /></label>
            <label class="bind-field"><span>开户银行</span><input v-model="bindForm.bankName" maxlength="20" placeholder="请输入开户银行" /></label>
            <label class="bind-field"><span>银行卡号</span><input v-model="bindForm.cardNo" inputmode="numeric" maxlength="23" placeholder="请输入银行卡号" /></label>
            <label class="bind-field"><span>预留手机号</span><input v-model="bindForm.phone" inputmode="tel" maxlength="11" placeholder="请输入银行预留手机号" /></label>
            <label class="bind-field bind-code"><span>验证码</span><input v-model="bindForm.code" inputmode="numeric" maxlength="6" placeholder="请输入验证码" /><button type="button" :disabled="codeSeconds > 0" @click="sendBindCode">{{ codeSeconds > 0 ? `${codeSeconds}s后重发` : '获取验证码' }}</button></label>
          </div>
          <p class="sheet-note">绑定需通过银行四要素验证；开户名须与当前认证主体一致。</p>
          <button class="sheet-primary" type="button" :disabled="!canBind" @click="confirmBind">确认绑定</button>
        </template>

        <template v-else-if="sheet === 'cardActions' && activeCard">
          <div class="sheet-summary"><span>银行卡</span><b>{{ activeCard.bankName }} · 尾号{{ activeCard.tail }}</b></div>
          <button v-if="!activeCard.isDefault" class="sheet-menu-row" type="button" @click="setDefaultCard(activeCard)"><span>设为默认提现卡</span><van-icon name="arrow" /></button>
          <button class="sheet-menu-row" type="button" :disabled="activeCard.isDefault" @click="unbindCard(activeCard)"><span>解绑银行卡</span><van-icon name="arrow" /></button>
          <p class="sheet-note">{{ activeCard.isDefault ? '默认提现卡不可解绑，请先将其他卡设为默认。' : '解绑后该卡不能继续作为提现到账卡。' }}</p>
        </template>

        <template v-else-if="sheet === 'password'">
          <button class="sheet-menu-row" type="button" @click="completeOperation('修改支付密码')"><span>修改支付密码</span><van-icon name="arrow" /></button>
          <button class="sheet-menu-row" type="button" @click="completeOperation('重置支付密码')"><span>忘记支付密码</span><van-icon name="arrow" /></button>
          <p class="sheet-note">{{ config.notes.password }}</p>
        </template>

        <template v-else-if="activeTransaction">
          <div class="transaction-main">
            <small>{{ activeTransaction.title }}</small>
            <strong>{{ activeTransaction.amount }}</strong>
            <span>{{ activeTransaction.status }}</span>
          </div>
          <template v-if="activeTransaction.chain && activeTransaction.chain.length">
            <section class="payment-chain">
              <template v-for="(row, index) in activeTransaction.chain" :key="index">
                <div class="chain-row">
                  <span class="chain-icon"><van-icon :name="row.icon" /></span>
                  <div><small>{{ row.label }}</small><strong>{{ row.value }}</strong><p v-if="row.sub">{{ row.sub }}</p></div>
                  <em v-if="row.em">{{ row.em }}</em>
                </div>
                <div v-if="index < activeTransaction.chain.length - 1" class="chain-line"></div>
              </template>
            </section>

            <template v-if="activeTransaction.waybills && activeTransaction.waybills.length">
              <button class="waybill-toggle" type="button" @click="showWaybills = !showWaybills">
                <span>关联运单（{{ activeTransaction.waybills.length }}）</span>
                <span>{{ showWaybills ? '收起' : '查看全部' }}<van-icon :name="showWaybills ? 'arrow-up' : 'arrow-down'" /></span>
              </button>
              <div v-if="showWaybills" class="waybill-list">
                <div v-for="waybill in activeTransaction.waybills" :key="waybill.id" class="waybill-row">
                  <div><strong>{{ waybill.id }}</strong><small>{{ waybill.driver }} · {{ waybill.plate }}</small></div>
                  <span>{{ waybill.amount }}</span>
                </div>
              </div>
            </template>

            <template v-if="activeTransaction.invoice">
              <div class="sheet-summary"><span>支付时间</span><b>{{ activeTransaction.time }}</b></div>
              <section class="linked-invoice">
                <div class="linked-invoice-head">
                  <strong>关联发票</strong>
                  <em>{{ activeTransaction.invoice.status }}</em>
                </div>
                <div class="linked-invoice-main">
                  <div>
                    <strong>{{ activeTransaction.invoice.type }}</strong>
                    <small>发票号码 {{ activeTransaction.invoice.no }}</small>
                  </div>
                  <b>{{ activeTransaction.invoice.amount }}</b>
                </div>
                <div class="linked-invoice-meta">
                  <span>{{ activeTransaction.invoice.title }}</span>
                  <time>{{ activeTransaction.invoice.time }}</time>
                </div>
              </section>
            </template>
          </template>
          <template v-else>
            <div class="sheet-summary"><span>业务说明</span><b>{{ activeTransaction.summary }}</b></div>
            <div class="sheet-summary"><span>发生时间</span><b>{{ activeTransaction.time }}</b></div>
            <div class="sheet-summary"><span>关联单号</span><b>{{ activeTransaction.reference }}</b></div>
          </template>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  config: { type: Object, required: true },
  initialView: { type: String, default: 'overview' },
})
const emit = defineEmits(['back', 'open-payment'])

const view = ref('home')
const scrollEl = ref(null)
const flowSection = ref(null)
const activeFilter = ref(props.initialView === 'frozen' ? 'freeze' : 'all')
const sheet = ref('')
const activeTransaction = ref(null)
const showWaybills = ref(false)
const operationAmount = ref('')

const cards = ref((props.config.bankCards || []).map((card) => ({ ...card })))
const activeCard = ref(null)
const bindForm = reactive({ bankName: '', cardNo: '', phone: '', code: '' })
const codeSeconds = ref(0)
let codeTimer = null

const defaultCard = computed(() => cards.value.find((card) => card.isDefault) || cards.value[0] || null)
const bankSummary = computed(() => cards.value.length
  ? `${cards.value.length}张 · 默认 ${defaultCard.value.bankName} 尾号${defaultCard.value.tail}`
  : '未绑定，绑定后即可提现')
const canBind = computed(() => Boolean(
  bindForm.bankName.trim()
  && /^\d{12,23}$/.test(bindForm.cardNo.replace(/\s/g, ''))
  && /^1\d{10}$/.test(bindForm.phone)
  && /^\d{6}$/.test(bindForm.code),
))

const filters = computed(() => props.config.filters)
const quickAmounts = computed(() => props.config.quickAmounts || ['1000', '5000', '10000'])
const filteredFlows = computed(() => activeFilter.value === 'all'
  ? props.config.flows
  : props.config.flows.filter((item) => item.category === activeFilter.value))
const sheetTitle = computed(() => ({
  recharge: '账户充值',
  withdraw: '提现',
  frozen: '冻结明细',
  bind: '添加银行卡',
  cardActions: '银行卡管理',
  password: '支付安全',
  transaction: '资金详情',
}[sheet.value] || ''))

onMounted(async () => {
  if (props.initialView === 'flow' || props.initialView === 'frozen') {
    await nextTick()
    flowSection.value?.scrollIntoView({ block: 'start' })
  }
  if (props.initialView === 'frozen') openSheet('frozen')
})

function back() {
  if (view.value === 'cards') {
    view.value = 'manage'
    return
  }
  if (view.value === 'manage') {
    view.value = 'home'
    return
  }
  emit('back')
}

function openSheet(type) {
  sheet.value = type
  activeTransaction.value = null
  operationAmount.value = ''
}

function openTransaction(item) {
  activeTransaction.value = item
  showWaybills.value = false
  sheet.value = 'transaction'
}

function closeSheet() {
  sheet.value = ''
  activeTransaction.value = null
  activeCard.value = null
  showWaybills.value = false
}

function openCardActions(card) {
  activeCard.value = card
  sheet.value = 'cardActions'
}

function openBindSheet() {
  bindForm.bankName = ''
  bindForm.cardNo = ''
  bindForm.phone = ''
  bindForm.code = ''
  sheet.value = 'bind'
}

function sendBindCode() {
  if (!/^1\d{10}$/.test(bindForm.phone)) {
    showToast('请先输入正确的预留手机号')
    return
  }
  codeSeconds.value = 60
  clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeSeconds.value -= 1
    if (codeSeconds.value <= 0) clearInterval(codeTimer)
  }, 1000)
  showToast('验证码已发送（原型演示）')
}

function confirmBind() {
  const number = bindForm.cardNo.replace(/\s/g, '')
  cards.value.push({
    id: `card-${Date.now()}`,
    bankName: bindForm.bankName.trim(),
    accountName: props.config.manage.fundAccount.name,
    tail: number.slice(-4),
    type: '对公账户',
    isDefault: cards.value.length === 0,
  })
  showToast('银行卡绑定成功（原型演示）')
  closeSheet()
}

function setDefaultCard(card) {
  cards.value.forEach((item) => { item.isDefault = item.id === card.id })
  showToast('已设为默认提现卡')
  closeSheet()
}

function unbindCard(card) {
  if (card.isDefault) {
    showToast('默认提现卡不可解绑')
    return
  }
  cards.value = cards.value.filter((item) => item.id !== card.id)
  showToast('银行卡已解绑（原型演示）')
  closeSheet()
}

function goCardsFromWithdraw() {
  closeSheet()
  view.value = 'cards'
}

onBeforeUnmount(() => clearInterval(codeTimer))

function openPayment() {
  emit('open-payment')
}

function completeOperation(label) {
  showToast(label + '（原型演示）')
  closeSheet()
}

function notify(message) {
  showToast(message)
}
</script>

<style scoped>
.shipper-account-page,
.shipper-account-page * { box-sizing: border-box; }
.shipper-account-page { position: absolute; inset: 0; z-index: 30; overflow: hidden; background: #f4f6fa; color: #333; font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
.account-status-bar { height: 44px; padding: 0 16px 0 22px; display: flex; align-items: center; justify-content: space-between; background: #edf4ff; font-size: 14px; font-weight: 700; }
.account-status-icons { display: flex; align-items: center; gap: 5px; }
.account-battery { position: relative; width: 22px; height: 11px; border: 1.5px solid rgba(38,49,72,.45); border-radius: 2px; }
.account-battery::before { content: ""; position: absolute; inset: 1px; border-radius: 1px; background: #263148; }
.account-battery::after { content: ""; position: absolute; right: -3px; top: 3px; width: 2px; height: 4px; border-radius: 0 2px 2px 0; background: rgba(38,49,72,.45); }
.account-nav { height: 44px; padding: 0 13px; display: grid; align-items: center; grid-template-columns: 78px 1fr 78px; background: #edf4ff; }
.account-nav > button { width: fit-content; height: 32px; padding: 0 4px; border: 0; background: transparent; color: #263148; font-size: 19px; }
.account-nav h1 { margin: 0; font-size: 17px; line-height: 24px; font-weight: 650; text-align: center; }
.account-nav .manage-entry { justify-self: end; color: #52617a; font-size: 12px; }
.account-scroll,
.manage-scroll { position: absolute; inset: 88px 0 0; overflow-x: hidden; overflow-y: auto; padding: 12px 12px 30px; scrollbar-width: none; }
.account-scroll::-webkit-scrollbar,
.manage-scroll::-webkit-scrollbar { display: none; }
.asset-card { padding: 18px 16px 14px; border: 1px solid #e9eef5; border-radius: 14px; background: #fff; box-shadow: 0 2px 8px rgba(50,79,124,.035); }
.balance-row { display: flex; align-items: center; justify-content: space-between; }
.balance-row > div { display: flex; flex-direction: column; gap: 4px; }
.balance-row small { color: #7e8aa0; font-size: 11px; }
.balance-row strong { color: #244eae; font-size: 29px; line-height: 36px; letter-spacing: -.4px; }
.balance-row em { margin-right: 3px; font-size: 14px; font-style: normal; }
.balance-row > .van-icon { color: #9bb7f5; font-size: 35px; }
.frozen-row { width: 100%; min-height: 42px; margin-top: 14px; padding: 10px 0 0; display: grid; align-items: center; grid-template-columns: auto 1fr auto auto; gap: 7px; border: 0; border-top: 1px solid #eef1f5; background: transparent; color: #6f7b90; text-align: left; }
.frozen-row span { font-size: 12px; }
.frozen-row b { color: #303b52; font-size: 14px; }
.frozen-row small { color: #7f8998; font-size: 11px; }
.frozen-row .van-icon { color: #aab4c3; font-size: 12px; }
.asset-actions { margin-top: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.asset-actions button { height: 38px; border: 1px solid #dbe4f5; border-radius: 8px; background: #f6f8fc; color: #3158ad; font-size: 13px; font-weight: 600; }
.asset-actions button.primary { border-color: #3a65ff; background: #3a65ff; color: #fff; }
.account-demo-note { margin-top: 10px; color: #8a93a5; font-size: 10px; line-height: 16px; }
.payment-task { width: 100%; min-height: 76px; margin-top: 10px; padding: 12px; display: flex; align-items: center; border: 1px solid #f0e7da; border-radius: 12px; background: #fff; color: #263148; text-align: left; box-shadow: 0 2px 8px rgba(50,79,124,.03); }
.payment-icon { width: 38px; height: 38px; margin-right: 10px; display: grid; flex: 0 0 auto; border-radius: 10px; background: #fff4e7; color: #e98531; font-size: 20px; place-items: center; }
.payment-copy { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 2px; }
.payment-copy small { color: #80694f; font-size: 12px; }
.payment-copy strong { color: #313b50; font-size: 15px; line-height: 20px; }
.payment-copy em { color: #c96b25; font-size: 11px; font-style: normal; }
.payment-action { margin-left: 6px; color: #3a65ff; font-size: 12px; font-weight: 600; white-space: nowrap; }
.payment-task > .van-icon { margin-left: 3px; color: #a7b0bf; font-size: 12px; }
.flow-section { margin-top: 10px; scroll-margin-top: 10px; }
.section-heading { height: 42px; padding: 0 4px; display: flex; align-items: center; justify-content: space-between; }
.section-heading h2 { margin: 0; font-size: 16px; }
.section-heading button { padding: 5px; display: flex; align-items: center; gap: 3px; border: 0; background: transparent; color: #687385; font-size: 12px; }
.flow-filters { padding: 4px; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #edf0f5; border-radius: 10px; background: #fff; }
.flow-filters button { height: 32px; border: 0; border-radius: 7px; background: transparent; color: #687385; font-size: 12px; }
.flow-filters button.active { background: #edf3ff; color: #3a65ff; font-weight: 650; }
.flow-list { margin-top: 8px; padding: 0 13px; border: 1px solid #edf0f5; border-radius: 12px; background: #fff; }
.flow-row { width: 100%; min-height: 84px; padding: 13px 0; display: flex; align-items: flex-start; border: 0; border-top: 1px solid #eef1f5; background: transparent; color: #333; text-align: left; }
.flow-row:first-child { border-top: 0; }
.flow-icon { width: 35px; height: 35px; margin-right: 10px; display: grid; flex: 0 0 auto; border-radius: 10px; background: #edf3ff; color: #3a65ff; font-size: 18px; place-items: center; }
.flow-icon.income,
.flow-icon.refund,
.flow-icon.unfreeze { background: #eaf8f2; color: #21a374; }
.flow-icon.freeze { background: #fff3e8; color: #ec8231; }
.flow-copy { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 4px; }
.flow-copy strong { color: #333; font-size: 14px; line-height: 20px; font-weight: 500; }
.platform-tag { display: inline-flex; height: 18px; margin-left: 4px; padding: 0 5px; align-items: center; border-radius: 4px; background: #edf3ff; color: #3a65ff; font-size: 10px; font-style: normal; font-weight: 500; vertical-align: 1px; }
.flow-copy small { overflow: hidden; color: #666; font-size: 12px; line-height: 17px; text-overflow: ellipsis; white-space: nowrap; }
.flow-copy em { color: #8a8f99; font-size: 11px; line-height: 16px; font-style: normal; }
.flow-amount { margin-left: 8px; display: flex; align-items: flex-end; flex-direction: column; gap: 5px; }
.flow-amount strong { color: #333; font-size: 15px; white-space: nowrap; }
.flow-amount strong.income { color: #1b9a6c; }
.flow-amount small { color: #777f8d; font-size: 11px; }
.empty-flow { margin: 0; padding: 28px 0; color: #9ba4b2; font-size: 11px; text-align: center; }
.manage-card { margin-bottom: 10px; padding: 0 14px; border: 1px solid #e9edf3; border-radius: 12px; background: #fff; }
.manage-card h2 { margin: 0; padding: 14px 0 7px; color: #687385; font-size: 12px; font-weight: 500; }
.manage-row { width: 100%; min-height: 62px; padding: 10px 0; display: flex; align-items: center; border: 0; border-top: 1px solid #eef1f5; background: transparent; color: #30394e; text-align: left; }
.manage-card h2 + .manage-row { border-top: 0; }
.manage-row > span { width: 34px; height: 34px; margin-right: 10px; display: grid; flex: 0 0 auto; border-radius: 9px; background: #edf3ff; color: #4169c6; font-size: 18px; place-items: center; }
.manage-row > div { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 4px; }
.manage-row strong { color: #333; font-size: 14px; font-weight: 500; }
.manage-row small { color: #777f8d; font-size: 12px; }
.manage-row > em { color: #398562; font-size: 11px; font-style: normal; }
.manage-row > .van-icon { margin-left: 5px; color: #a7b0bf; font-size: 12px; }
.manage-note { margin: 4px 8px 0; color: #777f8d; font-size: 12px; line-height: 18px; }
.sheet-mask { position: absolute; inset: 0; z-index: 50; display: flex; align-items: flex-end; background: rgba(20,25,35,.42); }
.account-sheet { width: 100%; max-height: 90%; overflow-y: auto; padding: 0 18px 20px; border-radius: 16px 16px 0 0; background: #fff; color: #333; scrollbar-width: none; }
.account-sheet::-webkit-scrollbar { display: none; }
.account-sheet header { position: sticky; top: 0; z-index: 2; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; background: #fff; }
.account-sheet h2 { margin: 0; color: #333; font-size: 16px; line-height: 21px; font-weight: 500; }
.account-sheet header button { width: 32px; height: 32px; padding: 0; border: 0; background: transparent; color: #999; font-size: 26px; line-height: 32px; font-weight: 300; }
.amount-input { margin-top: 15px; padding: 12px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border: 1px solid #e7ebf1; border-radius: 10px; }
.amount-input span { grid-column: 1 / -1; margin-bottom: 8px; color: #666; font-size: 12px; }
.amount-input b { font-size: 20px; }
.amount-input input { min-width: 0; padding-left: 6px; border: 0; outline: 0; color: #283248; font-size: 21px; }
.quick-amounts { margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.quick-amounts button { height: 36px; border: 1px solid #dfe6f2; border-radius: 7px; background: #f7f9fc; color: #555f70; font-size: 13px; }
.sheet-note { margin: 14px 2px; color: #777; font-size: 12px; line-height: 18px; }
.sheet-primary,
.sheet-secondary { position: sticky; bottom: 0; z-index: 2; width: 100%; height: 40px; margin-top: 16px; border: 0; border-radius: 8px; background: #3a65ff; color: #fff; box-shadow: 0 -12px 0 4px #fff; font-size: 16px; font-weight: 400; }
.sheet-secondary { border: 1px solid #dce4f2; background: #f5f8fd; color: #3158ad; }
.sheet-summary { min-height: 48px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; gap: 14px; }
.sheet-summary span { color: #777; font-size: 13px; }
.sheet-summary b { max-width: 220px; color: #333; font-size: 13px; font-weight: 500; text-align: right; }
.frozen-detail,
.transaction-main { padding: 18px 0; display: flex; align-items: center; flex-direction: column; gap: 5px; }
.frozen-detail strong,
.transaction-main strong { color: #2f3b51; font-size: 27px; }
.frozen-detail span,
.transaction-main span,
.transaction-main small { color: #777; font-size: 12px; }
.bank-item { min-height: 66px; padding: 10px 0; display: flex; align-items: center; border-top: 1px solid #eef1f5; }
.manage-card h2 + .bank-item { border-top: 0; }
.bank-icon { width: 36px; height: 36px; margin-right: 10px; display: grid; flex: 0 0 auto; border-radius: 10px; background: #edf3ff; color: #4169c6; font-size: 18px; place-items: center; }
.bank-info { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; }
.bank-info strong { color: #333; font-size: 14px; font-weight: 500; }
.bank-info small { color: #7b8494; font-size: 11px; line-height: 16px; }
.default-tag { display: inline-flex; height: 17px; margin-left: 5px; padding: 0 5px; align-items: center; border-radius: 4px; background: #edf3ff; color: #3a65ff; font-size: 10px; font-style: normal; font-weight: 500; vertical-align: 1px; }
.bank-manage { margin-left: 8px; padding: 4px; border: 0; background: transparent; color: #3a65ff; font-size: 12px; white-space: nowrap; }
.bind-card-button { width: 100%; height: 42px; margin-top: 10px; border: 1px solid #3a65ff; border-radius: 10px; background: #fff; color: #3a65ff; font-size: 14px; font-weight: 600; }
.bind-form { margin-top: 14px; }
.bind-field { display: flex; min-height: 50px; align-items: center; border-bottom: 1px solid #eef1f5; gap: 10px; }
.bind-field span { width: 74px; flex: 0 0 auto; color: #666; font-size: 13px; }
.bind-field input { min-width: 0; flex: 1; padding: 10px 0; border: 0; outline: 0; color: #283248; font-size: 14px; background: transparent; }
.bind-field input[readonly] { color: #8a93a5; }
.bind-field.bind-code button { flex: 0 0 auto; padding: 4px 2px; border: 0; background: transparent; color: #3a65ff; font-size: 12px; }
.bind-field.bind-code button:disabled { color: #9aa3b3; }
.sheet-link { margin: 4px 0 0 auto; padding: 2px 0; display: block; border: 0; background: transparent; color: #3a65ff; font-size: 12px; }
.sheet-primary:disabled,
.sheet-menu-row:disabled { opacity: .45; cursor: not-allowed; }
.sheet-menu-row { width: 100%; height: 52px; padding: 0 2px; display: flex; align-items: center; justify-content: space-between; border: 0; border-bottom: 1px solid #eee; background: transparent; color: #333; font-size: 14px; }
.payment-chain { margin: 0 0 12px; padding: 14px; border: 1px solid #e3e9f4; border-radius: 10px; background: #f8faff; }
.chain-row { min-height: 48px; display: flex; align-items: center; }
.chain-icon { width: 32px; height: 32px; margin-right: 10px; display: grid; flex: 0 0 auto; border-radius: 9px; background: #eaf1ff; color: #3a65ff; font-size: 17px; place-items: center; }
.chain-row > div { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 2px; }
.chain-row small { color: #888; font-size: 11px; line-height: 16px; }
.chain-row strong { overflow: hidden; color: #333; font-size: 14px; line-height: 20px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.chain-row p { margin: 0; color: #707784; font-size: 11px; line-height: 16px; }
.chain-row em { margin-left: 8px; color: #3a65ff; font-size: 11px; font-style: normal; white-space: nowrap; }
.chain-line { width: 1px; height: 12px; margin: 1px 0 1px 15px; background: #cbd9f4; }
.waybill-toggle { width: 100%; height: 46px; padding: 0 2px; display: flex; align-items: center; justify-content: space-between; border: 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; background: transparent; color: #333; font-size: 13px; }
.waybill-toggle > span:last-child { display: flex; align-items: center; gap: 3px; color: #3a65ff; font-size: 12px; }
.waybill-list { padding: 2px 0 7px; }
.waybill-row { min-height: 54px; padding: 8px 2px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; }
.waybill-row > div { display: flex; flex-direction: column; gap: 3px; }
.waybill-row strong { color: #333; font-size: 12px; font-weight: 500; }
.waybill-row small { color: #777; font-size: 11px; }
.waybill-row > span { color: #333; font-size: 13px; font-weight: 600; }
.linked-invoice { margin-top: 14px; padding: 14px; border: 1px solid #e2e9f6; border-radius: 10px; background: #f8faff; }
.linked-invoice-head { display: flex; align-items: center; justify-content: space-between; }
.linked-invoice-head strong { color: #333; font-size: 14px; font-weight: 500; }
.linked-invoice-head em { padding: 2px 7px; border-radius: 9px; background: #e8f7ef; color: #23865f; font-size: 11px; font-style: normal; }
.linked-invoice-main { margin-top: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.linked-invoice-main > div { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.linked-invoice-main strong { color: #333; font-size: 13px; font-weight: 500; }
.linked-invoice-main small { overflow: hidden; color: #777; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.linked-invoice-main > b { color: #315ec5; font-size: 14px; white-space: nowrap; }
.linked-invoice-meta { margin-top: 11px; padding-top: 10px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e7ebf2; gap: 12px; color: #777; font-size: 11px; }
.linked-invoice-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.linked-invoice-meta time { flex: 0 0 auto; }
</style>
