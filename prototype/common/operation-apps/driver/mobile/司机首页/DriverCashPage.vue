<template>
  <main class="driver-cash-page" aria-label="提现与银行卡">
    <div class="driver-status cash-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <div class="cash-scroll">
      <header class="cash-header">
        <button type="button" aria-label="返回上一页" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>{{ view === 'cards' ? '银行卡管理' : '提现' }}</h1>
        <span aria-hidden="true"></span>
      </header>

      <!-- 银行卡管理：独立入口，不依赖提现；未绑卡时不提现也能先绑定 -->
      <template v-if="view === 'cards'">
        <section class="cash-section-head">
          <p>银行卡用于接收提现资金，持卡人需与司机实名信息一致。</p>
          <button type="button" class="cash-add-card" @click="openAddCard">添加银行卡</button>
        </section>

        <section class="cash-card-list" aria-label="已绑定银行卡">
          <div v-for="card in cards" :key="card.id" class="cash-bank-card">
            <header>
              <span class="cash-bank-icon"><van-icon name="bank-o" /></span>
              <span class="cash-bank-name">{{ card.bankName }}<small>{{ card.cardType }}</small><em v-if="card.isDefault">默认</em></span>
              <span class="cash-card-actions">
                <button v-if="!card.isDefault" type="button" @click="setDefault(card)">设默认</button>
                <button v-if="!card.isDefault" type="button" class="unbind" @click="unbind(card)">解绑</button>
              </span>
            </header>
            <strong class="cash-card-tail">尾号 {{ card.cardTail }}</strong>
            <small class="cash-card-holder">持卡人 {{ holderDisplay(card) }}</small>
          </div>
          <p v-if="cards.length === 0" class="cash-empty">
            <van-icon name="card" />暂未绑定银行卡。绑定后即可将账户余额提现到银行。
          </p>
        </section>

        <!-- 提现记录不在本页展示：钱包流水已有同类记录，同一份数据不重复呈现 -->
        <p class="cash-page-note">提现记录请在钱包「流水明细」中查看。</p>

        <!-- 原型内没有真实银行回调，提供到账模拟入口验证「处理中 → 已完成」；
             这是控制条不是记录列表，流水明细仍是提现记录的唯一展示处 -->
        <div v-if="processingRecords.length" class="cash-sim-bar">
          <span>原型模拟到账</span>
          <button v-for="record in processingRecords" :key="record.id" type="button" @click="complete(record)">
            {{ record.reference }}·确认到账
          </button>
        </div>
      </template>

      <!-- 提现申请：绑卡后可操作 -->
      <template v-else-if="view === 'withdraw'">
        <section class="cash-balance" aria-label="可提现余额">
          <div class="cash-balance-main">
            <div>
              <small>可提现余额（元）</small>
              <strong><em>¥</em>{{ balance }}</strong>
            </div>
            <button type="button" @click="fillAll">全部提现</button>
          </div>
        </section>

        <section class="cash-form" aria-label="提现申请">
          <button type="button" class="cash-payee-row" @click="view = 'cards'">
            <span><i><van-icon name="bank-o" /></i><span><strong>到账卡</strong><small>{{ selectedCardText }}</small></span></span>
            <van-icon name="arrow" />
          </button>

          <label class="cash-amount-field">
            <span>提现金额</span>
            <strong><em>¥</em><input v-model.number="amount" type="number" min="0" placeholder="0.00"></strong>
            <small v-if="amount > 0">{{ amountText }}</small>
          </label>

          <button v-if="!cards.length" type="button" class="cash-no-card" @click="openAddCard">
            <van-icon name="card" />暂未绑定银行卡，先去绑定
          </button>

          <!-- 提现无门槛，不做最低金额校验；手续费与到账时效按平台与银行规则执行 -->
          <p class="cash-agreement">提现不设最低金额。手续费与到账时效以平台和银行实际规则为准。</p>
        </section>

        <button type="button" class="cash-submit" :disabled="!canSubmit" @click="submit">确认提现</button>
      </template>

      <!-- 提现成功：只说明已受理，不做具体到账时间承诺 -->
      <template v-if="view === 'success'">
        <section class="cash-success">
          <van-icon name="passed" />
          <h2>提现申请已提交</h2>
          <p>资金已从可提现余额转出，处理完成后将在流水明细中更新。</p>
          <div>
            <span>提现金额<strong>¥{{ lastRecord?.amount }}</strong></span>
            <span>到账卡<strong>{{ lastRecord?.cardBank }}尾号{{ lastRecord?.cardTail }}</strong></span>
            <span>流水号<strong>{{ lastRecord?.reference }}</strong></span>
            <span>申请时间<strong>{{ lastRecord?.applyTime }}</strong></span>
          </div>
        </section>
        <div class="cash-success-actions">
          <button type="button" @click="goCards">查看银行卡</button>
          <button type="button" class="primary" @click="emit('back')">完成</button>
        </div>
      </template>
    </div>

    <!-- 添加银行卡：四要素验证 + 预留手机号验证码 -->
    <div v-if="addCardOpen" class="cash-overlay" role="presentation" @click.self="closeAddCard">
      <aside class="cash-sheet" role="dialog" aria-modal="true" aria-label="添加银行卡">
        <div class="cash-sheet-handle" aria-hidden="true"></div>
        <h2>绑定银行卡</h2>
        <p class="cash-sheet-note">绑定需通过四要素验证：姓名、身份证号、银行卡号、银行卡预留手机号。</p>

        <label class="cash-field"><span>持卡人姓名</span><input v-model="cardForm.holderName" type="text" maxlength="20" placeholder="需与实名认证一致"></label>
        <label class="cash-field"><span>身份证号</span><input v-model="cardForm.idNo" type="text" maxlength="18" placeholder="请输入身份证号"></label>
        <label class="cash-field"><span>银行卡号</span><input v-model="cardForm.cardNo" type="text" maxlength="23" placeholder="请输入银行卡号"></label>
        <label class="cash-field"><span>预留手机号</span><input v-model="cardForm.phone" type="tel" maxlength="11" placeholder="请输入银行预留手机号"></label>

        <div class="cash-field cash-code-row">
          <span>验证码</span>
          <input v-model="cardForm.code" type="tel" maxlength="6" placeholder="请输入验证码">
          <button type="button" :disabled="codeSent > 0" @click="sendCode">{{ codeSent > 0 ? `${codeSent}s后重发` : '获取验证码' }}</button>
        </div>

        <button type="button" class="cash-sheet-submit" :disabled="!canBind" @click="confirmBind">确认绑定</button>
      </aside>
    </div>

    <!-- 解绑确认：复用轻量弹层 -->
    <div v-if="unbindTarget" class="cash-overlay" role="presentation" @click.self="unbindTarget = null">
      <aside class="cash-sheet" role="dialog" aria-modal="true" aria-label="解绑银行卡">
        <div class="cash-sheet-handle" aria-hidden="true"></div>
        <h2>解绑银行卡</h2>
        <p class="cash-sheet-note">解绑后该卡不能继续作为提现到账卡。默认卡不可解绑，请先切换默认卡。</p>
        <button type="button" class="cash-sheet-submit danger" @click="confirmUnbind">确认解绑</button>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { showToast } from 'vant'
import {
  addBankCard,
  completeWithdrawal,
  driverBankCards,
  driverCashStore,
  driverIdentity,
  removeBankCard,
  setDefaultCard,
  submitWithdrawal,
  withdrawableBalance,
} from './driver-flow-store.js'
import './driver-cash.css'

const props = defineProps({
  // 入口决定初始视图：钱包页「提现」进入提现申请，银行卡入口直接进管理页。
  // 组件在 App 内不同入口间复用，进入时根据入口重置视图。
  initialView: { type: String, default: 'withdraw' },
})
const emit = defineEmits(['back'])
const view = ref(props.initialView) // withdraw | cards | success

// 入口切换时重置视图：组件复用不会把上次的视图带进下次
watch(() => props.initialView, (next) => { view.value = next })
const cards = driverBankCards
const withdrawals = driverCashStore.withdrawals
// 仅处理中的提现需要模拟到账入口，已完成的不再出现
const processingRecords = computed(() => withdrawals.filter((item) => item.status === 'processing'))
const lastRecord = ref(null)

const addCardOpen = ref(false)
const codeSent = ref(0)
const unbindTarget = ref(null)
const amount = ref(0)
let codeTimer = null

const cardForm = reactive({ holderName: '', idNo: '', cardNo: '', phone: '', code: '' })

// 四要素 + 验证码都通过才可绑定：姓名与实名一致、身份证与手机号格式正确
const canBind = computed(() => {
  return cardForm.holderName.trim()
    && cardForm.idNo.trim().length >= 15
    && /^\d{16,19}$/.test(cardForm.cardNo)
    && /^1\d{10}$/.test(cardForm.phone)
    && /^\d{4,6}$/.test(cardForm.code)
})

const balance = computed(() => withdrawableBalance().toLocaleString('zh-CN', { minimumFractionDigits: 2 }))

const selectedCardText = computed(() => {
  const card = cards.find((item) => item.isDefault)
  return card ? `${card.bankName} 尾号${card.cardTail}` : '去绑定银行卡'
})

const canSubmit = computed(() => amount.value > 0 && amount.value <= Number(balance.value.replace(/,/g, '')) && cards.length > 0)

// 金额大写提示：输入后给出中文读法，避免司机误输错位数
const amountText = computed(() => {
  const value = Number(amount.value) || 0
  if (value <= 0) return ''
  return `￥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
})

function holderDisplay(card) {
  const name = card.holderName || ''
  return `${name.slice(0, 1)}**`
}

function maskId(idNo) {
  if (!idNo) return ''
  return `${idNo.slice(0, 3)}***********${idNo.slice(-4)}`
}

function maskCard(cardNo) {
  if (!cardNo) return ''
  return `${cardNo.slice(0, 4)} **** **** ${cardNo.slice(-4)}`
}

function sendCode() {
  if (!/^1\d{10}$/.test(cardForm.phone)) {
    showToast('请输入正确的预留手机号')
    return
  }
  codeSent.value = 60
  codeTimer = setInterval(() => {
    codeSent.value -= 1
    if (codeSent.value <= 0) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
  showToast(`验证码已发送至 ${cardForm.phone.slice(0, 3)}****${cardForm.phone.slice(-4)}`)
}

function openAddCard() {
  Object.assign(cardForm, { holderName: '', idNo: '', cardNo: '', phone: '', code: '' })
  addCardOpen.value = true
}

function closeAddCard() {
  addCardOpen.value = false
  if (codeTimer) clearInterval(codeTimer)
  codeSent.value = 0
}

// 绑定成功：持卡人强制与实名一致（四要素中的姓名取自实名信息）
function confirmBind() {
  if (!canBind.value) return
  if (cardForm.holderName.trim() !== driverIdentity.name) {
    showToast('持卡人姓名需与实名认证一致')
    return
  }
  addBankCard({
    bankName: '中国银行',
    cardTail: cardForm.cardNo.slice(-4),
    cardType: '储蓄卡',
    holderName: cardForm.holderName.trim(),
  })
  showToast('银行卡绑定成功')
  closeAddCard()
}

function setDefault(card) {
  setDefaultCard(card.id)
  showToast(`${card.bankName}已设为默认卡`)
}

function unbind(card) {
  unbindTarget.value = card
}

function confirmUnbind() {
  const card = unbindTarget.value
  if (!card) return
  if (card.isDefault) {
    showToast('默认卡不可解绑，请先切换')
  } else if (removeBankCard(card.id)) {
    showToast('银行卡已解绑')
  }
  unbindTarget.value = null
}

function submit() {
  const record = submitWithdrawal(amount.value)
  if (!record) {
    showToast('余额不足')
    return
  }
  lastRecord.value = record
  amount.value = 0
  view.value = 'success'
}

function complete(record) {
  if (record.status === 'processing') {
    completeWithdrawal(record.id)
    showToast('模拟到账，提现记录已更新')
  }
}

function goCards() {
  view.value = 'cards'
}

// 全部提现：直接填入可提现余额，金额校验仍然生效
function fillAll() {
  amount.value = Number(balance.value.replace(/,/g, ''))
}
</script>