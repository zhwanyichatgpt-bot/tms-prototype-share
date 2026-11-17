<template>
  <section ref="walletRoot" class="shipper-account-page" :class="{ tint: ['flows', 'records'].includes(view) }"
    :aria-label="titles[view]" :data-annotation-container="sheet ? null : 'modal'" :data-annotation-content="sheet ? null : 'modal'">
    <div class="wallet-status"><span>9:41</span><span aria-hidden="true">▂▄▆　▰</span></div>
    <header class="wallet-nav">
      <button type="button" aria-label="返回" @click="back"><van-icon name="arrow-left" /></button>
      <h1>{{ titles[view] }}</h1>
      <button v-if="view === 'cards'" type="button" class="add-card" @click="openBind"><van-icon name="add-o" />新增</button>
    </header>

    <main :key="view" class="wallet-scroll">
      <template v-if="view === 'wallet'">
        <section class="balance-card" :class="{ 'annot-zhiyunShipperHome-rule-account-two-levels': !sheet }">
          <p>账户总额（元）</p>
          <strong><small>￥</small>{{ money(available + frozen) }}</strong>
          <button class="withdraw-pill" type="button" @click="go('withdraw')">提现</button>
          <div class="balance-parts">
            <button type="button" @click="sheet = 'frozen'">冻结金额 ￥{{ money(frozen) }}</button>
            <span>可用余额 ￥{{ money(available) }}</span>
          </div>
        </section>
        <nav class="wallet-card wallet-menu" aria-label="钱包功能">
          <button v-for="item in menus" :key="item.view" type="button" class="wallet-row" @click="go(item.view)">
            <van-icon :name="item.icon" /><span>{{ item.label }}</span><van-icon name="arrow" />
          </button>
        </nav>
      </template>

      <template v-else-if="view === 'withdraw'">
        <section class="wallet-card destination">
          <p class="muted">到账银行卡</p>
          <button class="wallet-row" type="button" @click="go('cards')">
            <van-icon name="card" />
            <span>{{ selectedCard ? selectedCard.bankName + ' · 尾号' + selectedCard.tail : '尚未添加银行卡，点击前往添加' }}</span>
            <van-icon name="arrow" />
          </button>
        </section>
        <section class="wallet-card withdrawal">
          <label for="wallet-withdraw-amount">提现金额</label>
          <div class="amount-input"><span>￥</span><input id="wallet-withdraw-amount" v-model="amount" inputmode="decimal" autocomplete="off" /><button type="button" @click="amount = available.toFixed(2)">全部提现</button></div>
          <p class="muted">当前账户余额{{ money(available) }}元</p>
          <p v-if="amountError" class="amount-error" role="alert">{{ amountError }}</p>
          <button class="primary" type="button" :disabled="!canWithdraw" @click="submitWithdraw">提现申请</button>
          <button class="record-link" type="button" @click="go('records')">提现记录</button>
        </section>
        <section class="wallet-card rules">
          <h2>提现说明</h2>
          <p>每日最多：1次</p>
          <p>提现时间：工作日 09:00–18:00</p>
          <p>（工作日18点–24点的提现申请第二天处理，非工作日申请相应延迟到工作日处理）</p>
          <p>预计到账：T+1个工作日（遇周末及节假日相应延迟）</p>
          <p>提现手续费：0元</p>
        </section>
      </template>

      <template v-else-if="view === 'cards'">
        <div v-if="!cards.length" class="wallet-empty"><img src="/zhiyun-mobile-assets/invoice/empty-box.png" alt="" /><p>暂无数据~</p></div>
        <section v-for="card in cards" :key="card.id" class="wallet-card bank-card">
          <button type="button" class="wallet-row" @click="chooseCard(card)">
            <van-icon name="card" /><span><strong>{{ card.bankName }}</strong><small>{{ card.accountName }} · 尾号{{ card.tail }}</small></span>
            <van-icon v-if="card.id === selectedCardId" name="checked" />
          </button>
          <div class="card-actions">
            <button v-if="!card.isDefault" type="button" @click="setDefaultCard(card)">设为默认提现卡</button>
            <span v-else>默认提现卡</span>
            <button type="button" :disabled="card.isDefault" @click="unbindCard(card)">解绑</button>
          </div>
        </section>
      </template>

      <section v-else-if="view === 'security'" class="wallet-card wallet-menu security-menu">
        <button class="wallet-row" type="button" @click="openPassword('修改支付密码')"><span>修改支付密码</span><van-icon name="arrow" /></button>
        <button class="wallet-row" type="button" @click="openPassword('忘记支付密码')"><span>忘记支付密码</span><van-icon name="arrow" /></button>
      </section>

      <template v-else-if="view === 'flows' || view === 'records'">
        <div class="date-range">
          <label><input v-model="startDate" type="date" required aria-label="选择开始时间" :max="endDate || undefined" /><span v-if="!startDate">请选择开始时间</span></label>
          <span>到</span>
          <label><input v-model="endDate" type="date" required aria-label="选择结束时间" :min="startDate || undefined" /><span v-if="!endDate">请选择结束时间</span></label>
        </div>
        <p v-if="invalidDateRange" class="amount-error" role="alert">开始时间不能晚于结束时间</p>
        <template v-if="view === 'flows'">
          <div class="flow-tabs" role="tablist" aria-label="收支明细分类">
            <button v-for="tab in flowTabs" :key="tab.key" type="button" role="tab" :aria-selected="flowTab === tab.key" @click="flowTab = tab.key">{{ tab.label }}</button>
          </div>
          <button v-for="row in filteredFlows" :key="row.id" class="wallet-card flow-card" type="button" @click="openTransaction(row)">
            <span class="flow-top"><strong>{{ flowRoute(row) }}</strong><b>{{ row.amount.replace(/^[+-]/, '') }}</b></span>
            <span class="flow-reference">{{ row.reference }}<van-icon name="description-o" /></span>
            <span class="flow-meta"><time>{{ row.time }}</time><span>{{ row.status }}</span></span>
          </button>
          <div v-if="!filteredFlows.length" class="wallet-empty"><img src="/zhiyun-mobile-assets/invoice/empty-box.png" alt="" /><p>暂无{{ flowTab === 'payment' ? '付款' : '充值' }}记录</p></div>
        </template>
        <template v-else>
          <section v-for="row in filteredWithdrawals" :key="row.id" class="wallet-card flow-card">
            <div class="flow-top"><strong>{{ row.bank }}</strong><b>￥{{ money(row.amount) }}</b></div>
            <p class="flow-reference">申请编号 {{ row.id }}</p>
            <div class="flow-meta"><time>{{ row.time }}</time><span>处理中</span></div>
          </section>
          <div v-if="!filteredWithdrawals.length" class="wallet-empty"><img src="/zhiyun-mobile-assets/invoice/empty-box.png" alt="" /><p>暂无数据~</p></div>
        </template>
      </template>

      <section v-else-if="view === 'recharge'" class="wallet-card recharge">
        <p>{{ enterpriseName }}：</p>
        <p>请将需要充值的金额打入到以下监管账户，监管账号受第三方监管，可以确保资金的安全。</p>
        <button type="button" class="primary" @click="copyAccount">复制账号信息</button>
        <p class="muted">长按下方表格中的文字，或点击上方按钮，可将账号信息复制到剪贴板。</p>
        <table aria-label="示例充值账户信息"><tbody>
          <tr v-for="row in rechargeRows" :key="row.label"><th scope="row">{{ row.label }}</th><td>{{ row.value }}</td></tr>
        </tbody></table>
      </section>
    </main>

    <van-popup v-model:show="showSheet" position="bottom" round :teleport="walletRoot" class="wallet-sheet">
      <header><h2>{{ sheetTitle }}</h2><button type="button" aria-label="关闭" @click="sheet = ''"><van-icon name="cross" /></button></header>
      <template v-if="sheet === 'bind'">
        <label class="bind-field">开户名称<span>{{ enterpriseName }}</span></label>
        <label class="bind-field">开户银行<input v-model="bindForm.bankName" placeholder="请输入开户银行" /></label>
        <label class="bind-field">银行卡号<input v-model="bindForm.cardNo" inputmode="numeric" maxlength="23" placeholder="请输入银行卡号" /></label>
        <label class="bind-field">预留手机号<input v-model="bindForm.phone" inputmode="tel" maxlength="11" placeholder="请输入银行预留手机号" /></label>
        <div class="bind-field"><label for="wallet-bank-code">验证码</label><input id="wallet-bank-code" v-model="bindForm.code" inputmode="numeric" maxlength="6" placeholder="请输入验证码" /><button type="button" :disabled="codeSeconds > 0" @click="sendCode">{{ codeSeconds ? codeSeconds + '秒' : '获取验证码' }}</button></div>
        <button class="primary" type="button" :disabled="!canBind" @click="confirmBind">确认添加</button>
      </template>
      <template v-else-if="sheet === 'frozen'">
        <strong class="sheet-amount">￥{{ money(frozen) }}</strong>
        <dl><div v-for="row in config.frozenDetail?.rows || []" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div></dl>
      </template>
      <template v-else-if="sheet === 'transaction' && activeTransaction">
        <section class="annot-zhiyunShipperHome-rule-account-single-waybill-flow" data-annotation-container="drawer" data-annotation-content="drawer">
          <strong class="sheet-amount">{{ activeTransaction.amount }}</strong>
          <dl>
            <div><dt>当前状态</dt><dd>{{ activeTransaction.status }}</dd></div>
            <div><dt>关联单号</dt><dd>{{ activeTransaction.reference }}</dd></div>
            <div v-if="activeTransaction.route"><dt>运输线路</dt><dd>{{ activeTransaction.route }}</dd></div>
            <div v-if="activeTransaction.payee || activeTransaction.summary"><dt>收款方</dt><dd>{{ activeTransaction.payee || activeTransaction.summary }}</dd></div>
            <div v-if="activeTransaction.platform"><dt>承接平台</dt><dd>{{ activeTransaction.platform }}</dd></div>
            <div><dt>交易时间</dt><dd>{{ activeTransaction.time }}</dd></div>
          </dl>
          <template v-if="activeTransaction.invoice"><h3>关联发票</h3><dl>
            <div><dt>发票状态</dt><dd>{{ activeTransaction.invoice.status }}</dd></div>
            <div><dt>发票号码</dt><dd>{{ activeTransaction.invoice.no }}</dd></div>
            <div><dt>发票金额</dt><dd>{{ activeTransaction.invoice.amount }}</dd></div>
          </dl></template>
        </section>
      </template>
      <template v-else-if="sheet === 'password'">
        <p class="security-note">设置、修改或重置支付密码前，需要完成账户身份验证。</p>
        <p class="muted">安全手机号 {{ config.manage?.phone?.value || '未设置' }}</p>
        <button class="primary" type="button" @click="notify('身份验证入口（原型演示）')">验证身份</button>
      </template>
    </van-popup>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  config: { type: Object, required: true },
  initialView: { type: String, default: 'overview' },
})
const emit = defineEmits(['back', 'open-payment'])
const walletRoot = ref(null)
const view = ref(['flow', 'history'].includes(props.initialView) ? 'flows' : 'wallet')
const navigation = ref([])
const sheet = ref(props.initialView === 'frozen' ? 'frozen' : '')
const showSheet = computed({ get: () => Boolean(sheet.value), set: value => { if (!value) sheet.value = '' } })
const titles = {
  wallet: '我的钱包', withdraw: '提交账户提现申请', cards: '银行卡列表',
  security: '支付安全', flows: '收支明细', records: '提现记录', recharge: '充值说明',
}
const menus = [
  { view: 'cards', label: '我的银行卡', icon: 'credit-pay' },
  { view: 'security', label: '支付安全', icon: 'shield-o' },
  { view: 'flows', label: '收支明细', icon: 'balance-list-o' },
  { view: 'withdraw', label: '账户提现', icon: 'cash-back-record' },
  { view: 'records', label: '提现申请记录', icon: 'records-o' },
  { view: 'recharge', label: '充值说明', icon: 'add-o' },
]
const flowTabs = [{ key: 'recharge', label: '充值记录' }, { key: 'payment', label: '付款记录' }]
const flowTab = ref('payment')
const startDate = ref('')
const endDate = ref('')
const invalidDateRange = computed(() => Boolean(startDate.value && endDate.value && startDate.value > endDate.value))
const amount = ref('')
const enterpriseName = computed(() => props.config.manage?.fundAccount?.name || '')
const available = computed(() => parseMoney(props.config.account.balance))
const frozen = computed(() => parseMoney(props.config.account.frozen))
const cards = ref((props.config.bankCards || []).map(card => ({ ...card })))
const selectedCardId = ref(cards.value.find(card => card.isDefault)?.id || cards.value[0]?.id || '')
const selectedCard = computed(() => cards.value.find(card => card.id === selectedCardId.value))
const withdrawals = ref([])
const activeTransaction = ref(null)
const passwordTitle = ref('')
const sheetTitle = computed(() => ({
  bind: '添加银行卡', frozen: '冻结明细', transaction: '资金详情', password: passwordTitle.value,
}[sheet.value] || ''))
const rechargeRows = [
  { label: '开户名称', value: '平台交易资金待清算专户（示例）' },
  { label: '银行卡号', value: '0000 0000 0000' },
  { label: '开户银行', value: '示例银行' },
  { label: '行号', value: '000000000000' },
]
const amountError = computed(() => {
  if (!amount.value) return ''
  if (!/^\d+(\.\d{1,2})?$/.test(amount.value)) return '请输入最多两位小数的金额'
  if (Number(amount.value) <= 0) return '提现金额须大于0'
  if (Number(amount.value) > available.value) return '提现金额不能超过可用余额'
  return ''
})
const canWithdraw = computed(() => Boolean(selectedCard.value && amount.value && !amountError.value))
const filteredFlows = computed(() => (props.config.flows || []).filter(row => {
  const correctType = flowTab.value === 'payment' ? row.category === 'expense' : row.title.includes('充值')
  return correctType && matchesDate(flowDate(row))
}))
const filteredWithdrawals = computed(() => withdrawals.value.filter(row => matchesDate(row.date)))
const bindForm = reactive({ bankName: '', cardNo: '', phone: '', code: '' })
const codeSeconds = ref(0)
let codeTimer
const canBind = computed(() => Boolean(bindForm.bankName.trim()
  && /^\d{12,23}$/.test(bindForm.cardNo.replace(/\s/g, ''))
  && /^1\d{10}$/.test(bindForm.phone)
  && /^\d{6}$/.test(bindForm.code)))

function parseMoney(value) {
  return Number(String(value || '0').replace(/[^\d.-]/g, '')) || 0
}
function money(value) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function go(target) {
  navigation.value.push(view.value)
  view.value = target
  startDate.value = ''
  endDate.value = ''
}
function back() {
  if (sheet.value) { sheet.value = ''; return }
  if (navigation.value.length) { view.value = navigation.value.pop(); return }
  emit('back')
}
function flowRoute(row) {
  if (row.route) return row.route
  const consignment = row.chain?.find(item => item.label === '关联托运单')
  return consignment?.value || row.summary || row.title
}
function flowDate(row) {
  if (row.date) return row.date
  const match = row.time?.match(/^(\d{2})-(\d{2})/)
  const year = row.reference?.match(/20\d{2}/)?.[0] || '2026'
  return match ? year + '-' + match[1] + '-' + match[2] : ''
}
function matchesDate(date) {
  if (invalidDateRange.value) return false
  return (!startDate.value || date >= startDate.value) && (!endDate.value || date <= endDate.value)
}
function notify(message) {
  showToast({ message, teleport: walletRoot.value })
}
function chooseCard(card) {
  selectedCardId.value = card.id
  if (navigation.value.at(-1) === 'withdraw') back()
}
function setDefaultCard(card) {
  cards.value.forEach(item => { item.isDefault = item.id === card.id })
  selectedCardId.value = card.id
  notify('已设为默认提现卡')
}
function unbindCard(card) {
  if (card.isDefault) return
  cards.value = cards.value.filter(item => item.id !== card.id)
  if (selectedCardId.value === card.id) selectedCardId.value = cards.value[0]?.id || ''
  notify('银行卡已解绑（原型演示）')
}
function openBind() {
  Object.assign(bindForm, { bankName: '', cardNo: '', phone: '', code: '' })
  sheet.value = 'bind'
}
function sendCode() {
  if (!/^1\d{10}$/.test(bindForm.phone)) { notify('请先输入正确的预留手机号'); return }
  clearInterval(codeTimer)
  codeSeconds.value = 60
  codeTimer = setInterval(() => {
    codeSeconds.value -= 1
    if (codeSeconds.value <= 0) clearInterval(codeTimer)
  }, 1000)
  notify('验证码已发送（原型演示）')
}
function confirmBind() {
  if (!canBind.value) return
  const card = {
    id: 'card-' + Date.now(), bankName: bindForm.bankName.trim(), accountName: enterpriseName.value,
    tail: bindForm.cardNo.replace(/\s/g, '').slice(-4), isDefault: cards.value.length === 0,
  }
  cards.value.push(card)
  selectedCardId.value = card.id
  sheet.value = ''
  notify('银行卡添加成功（原型演示）')
}
function submitWithdraw() {
  if (!canWithdraw.value) return
  const now = new Date()
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
  withdrawals.value.unshift({
    id: 'TX' + Date.now(), date, time: date + ' ' + now.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' }),
    amount: Number(amount.value), bank: selectedCard.value.bankName + ' · 尾号' + selectedCard.value.tail,
  })
  amount.value = ''
  notify('提现申请已提交（原型演示）')
  go('records')
}
function openPassword(title) {
  passwordTitle.value = title
  sheet.value = 'password'
}
function openTransaction(row) {
  activeTransaction.value = row
  sheet.value = 'transaction'
}
async function copyAccount() {
  const text = rechargeRows.map(row => row.label + '：' + row.value).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    notify('账号信息已复制')
  } catch {
    notify('复制失败，请长按表格文字复制')
  }
}
onBeforeUnmount(() => clearInterval(codeTimer))
</script>

<style scoped>
.shipper-account-page {
  --blue: #3c60ff;
  --ink: #242b36;
  --muted: #848b98;
  --line: #ededf0;
  position: absolute;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  color: var(--ink);
  background: #f5f5f5;
  font: 14px/1.5 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.shipper-account-page, .shipper-account-page * { box-sizing: border-box; }
.shipper-account-page button, .shipper-account-page input { color: inherit; font: inherit; }
.shipper-account-page button { padding: 0; border: 0; background: none; cursor: pointer; }
.shipper-account-page button:disabled { cursor: default; }
.shipper-account-page button:focus-visible, .shipper-account-page input:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.shipper-account-page h1, .shipper-account-page h2, .shipper-account-page h3, .shipper-account-page p { margin: 0; }
.wallet-status { display: flex; align-items: center; justify-content: space-between; height: 28px; padding: 0 17px; background: white; font-size: 11px; font-weight: 600; }
.wallet-nav { display: flex; gap: 7px; align-items: center; height: 44px; padding: 0 14px; background: white; }
.wallet-nav > button { display: grid; place-items: center; width: 22px; height: 40px; font-size: 18px; }
.wallet-nav h1 { font-size: 17px; line-height: 1.4; font-weight: 600; }
.wallet-nav .add-card { display: flex; gap: 5px; width: auto; margin-left: auto; font-size: 13px; }
.tint { background: linear-gradient(165deg, #e8edf9, #dce5f8 48%, #f5f5f5 100%) top / 100% 164px no-repeat #f5f5f5; }
.tint .wallet-status, .tint .wallet-nav { background: transparent; }
.wallet-scroll { position: absolute; inset: 72px 0 0; overflow: auto; padding: 8px 14px 24px; scrollbar-width: none; }
.wallet-scroll::-webkit-scrollbar { display: none; }
.wallet-card { margin-bottom: 8px; border-radius: 10px; background: #fff; }
.balance-card { position: relative; overflow: hidden; min-height: 132px; padding: 22px; border-radius: 10px; color: #fff; background: linear-gradient(110deg, #5e8dfc, #345af3 75%); }
.balance-card::before { content: ""; position: absolute; top: -50px; right: 95px; width: 38px; height: 250px; transform: rotate(-28deg); background: #203fef27; pointer-events: none; }
.balance-card > * { position: relative; z-index: 1; }
.balance-card p { font-size: 13px; }
.balance-card > strong { display: flex; align-items: baseline; gap: 5px; margin-top: 2px; font-size: 25px; font-weight: 600; }
.balance-card > strong small { font-size: 13px; font-weight: 400; }
.balance-card .withdraw-pill { position: absolute; top: 23px; right: 22px; padding: 5px 19px; border-radius: 30px; background: white; color: var(--blue); font-size: 13px; font-weight: 600; }
.balance-parts { display: flex; justify-content: space-between; gap: 12px; margin-top: 15px; font-size: 11px; }
.balance-parts button { text-align: left; }
.wallet-menu { margin-top: 8px; padding: 0 14px; }
.wallet-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 50px; text-align: left; font-size: 13px !important; }
.wallet-row + .wallet-row { border-top: 1px solid var(--line); }
.wallet-row > span { flex: 1; min-width: 0; }
.wallet-row > .van-icon:first-child { font-size: 17px; }
.wallet-row > .van-icon:last-child { margin-left: auto; color: #606875; font-size: 14px; }
.muted { color: var(--muted); font-size: 12px; }
.destination { padding: 7px 12px; }
.destination .wallet-row { gap: 8px; min-height: 31px; }
.destination .wallet-row > .van-icon:first-child { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: var(--blue); background: #f0f2ff; }
.withdrawal { padding: 15px 12px 8px; }
.withdrawal > label { display: block; font-size: 13px; }
.amount-input { display: flex; align-items: center; gap: 4px; margin-top: 28px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.amount-input > span { font-size: 21px; }
.amount-input input { flex: 1; width: 0; padding: 0 4px; border: 0; background: transparent; font-size: 21px; }
.amount-input button { flex-shrink: 0; color: var(--blue); font-size: 13px; }
.withdrawal > .muted { margin-top: 7px; }
.shipper-account-page .primary { display: block; width: 100%; height: 38px; margin-top: 22px; border-radius: 4px; color: white; background: var(--blue); font-size: 14px; font-weight: 600; }
.shipper-account-page .primary:disabled { background: #d7defd; color: #596a9c; }
.record-link { display: block; width: 100%; min-height: 38px; color: var(--muted) !important; font-size: 13px !important; }
.rules { padding: 12px; color: var(--muted); font-size: 12px; line-height: 1.7; }
.rules h2 { margin-bottom: 5px; color: var(--ink); font-size: 13px; }
.amount-error { margin-top: 8px !important; color: #c54343; font-size: 12px; }
.wallet-empty { position: absolute; top: 50%; left: 50%; width: 150px; transform: translate(-50%, -50%); text-align: center; color: var(--muted); font-size: 12px; }
.wallet-empty img { display: block; width: 72px; height: 66px; margin: 0 auto 14px; object-fit: contain; }
.bank-card { padding: 2px 13px 9px; }
.bank-card .wallet-row { min-height: 66px; }
.bank-card strong, .bank-card small { display: block; }
.bank-card strong { margin-bottom: 5px; font-weight: 500; }
.bank-card small { color: var(--muted); font-size: 11px; }
.card-actions { display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 9px; color: #68768a; font-size: 12px; }
.card-actions button:disabled { opacity: .4; }
.security-menu { margin-top: 0; }
.date-range { display: flex; align-items: center; gap: 9px; color: #626d80; font-size: 12px; }
.date-range label { position: relative; flex: 1; min-width: 0; }
.date-range input { display: block; width: 100%; min-width: 0; height: 36px; border: 0; border-radius: 6px; padding: 0 8px; background: white; font-size: 12px; }
.date-range input:invalid { color: transparent; }
.date-range label > span { position: absolute; inset: 0; display: flex; align-items: center; padding-left: 9px; pointer-events: none; }
.date-range input::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; opacity: 0; cursor: pointer; }
.flow-tabs { display: grid; grid-template-columns: 1fr 1fr; margin: 5px 0 12px; border-bottom: 1px solid #e2e6ef; }
.flow-tabs button { position: relative; min-height: 42px; font-size: 13px; }
.flow-tabs button[aria-selected="true"] { color: var(--blue); font-weight: 600; }
.flow-tabs button[aria-selected="true"]::after { content: ""; position: absolute; bottom: 0; left: calc(50% - 11px); width: 22px; height: 2px; border-radius: 2px; background: var(--blue); }
.shipper-account-page .flow-card { display: block; width: 100%; margin-bottom: 9px; padding: 13px 13px 11px; background: #fff; text-align: left; }
.flow-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.flow-top strong { min-width: 0; font-size: 15px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.flow-top b { flex-shrink: 0; color: var(--blue); font-size: 16px; font-variant-numeric: tabular-nums; }
.flow-reference { display: flex; align-items: center; gap: 5px; min-height: 27px; color: #596378; font-size: 12px; }
.flow-reference .van-icon { font-size: 12px; }
.flow-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; padding-top: 8px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
.flow-meta > span:last-child { color: #297056; }
.date-range ~ section.flow-card { margin-top: 12px; }
.recharge { padding: 13px 14px 16px; color: #536074; font-size: 13px; line-height: 1.65; }
.recharge p + p { margin-top: 8px; }
.recharge .primary { margin-top: 10px; }
.recharge .muted { margin: 6px 0 12px; font-size: 11px; }
.recharge table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; line-height: 1.45; text-align: center; user-select: text; }
.recharge th, .recharge td { padding: 9px 6px; border: 1px solid #e6e7eb; font-weight: 400; overflow-wrap: anywhere; }
.recharge th { width: 32%; background: #fafafa; }
.wallet-sheet { max-height: 85%; padding: 16px 16px 24px; overflow: auto; }
.wallet-sheet > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.wallet-sheet h2 { font-size: 16px; }
.wallet-sheet > header button { width: 32px; height: 32px; }
.bind-field { display: flex; align-items: center; gap: 10px; min-height: 48px; border-bottom: 1px solid var(--line); font-size: 12px; }
.bind-field input { width: 0; flex: 1; min-width: 0; padding: 6px 0; border: 0; }
.bind-field > span { margin-left: auto; }
.bind-field > button { flex-shrink: 0; color: var(--blue); font-size: 12px; }
.sheet-amount { display: block; margin: 12px 0; font-size: 25px; }
.wallet-sheet dl { margin: 0; font-size: 12px; }
.wallet-sheet dl > div { display: flex; gap: 12px; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line); }
.wallet-sheet dt { flex-shrink: 0; color: var(--muted); }
.wallet-sheet dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
.wallet-sheet h3 { margin-top: 15px; font-size: 14px; }
.security-note { margin-bottom: 10px !important; font-size: 13px; }
</style>
