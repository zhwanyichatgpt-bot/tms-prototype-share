<template>
  <div class="mine-page">
    <div class="mine-scroll">
      <section class="mine-hero">
        <div class="ios-status-bar">
          <span class="status-time">9:41</span>
          <div class="status-icons">
            <svg aria-hidden="true" width="18" height="12" viewBox="0 0 18 12" fill="none">
              <rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor" />
              <rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor" />
              <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="currentColor" />
              <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
            </svg>
            <svg aria-hidden="true" width="17" height="12" viewBox="0 0 17 12" fill="none">
              <path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="currentColor" />
              <path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="currentColor" />
              <path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="currentColor" />
            </svg>
            <span class="battery"><i></i></span>
          </div>
        </div>

        <div class="mine-nav">
          <h1>个人中心</h1>
        </div>

        <div class="profile-card">
          <img
            class="profile-avatar"
            src="/zhiyun-mobile-assets/mine/avatar.png"
            alt=""
          />
          <div class="profile-copy">
            <div class="profile-name-row">
              <strong>{{ profile.name }}</strong>
              <img
                class="cert-badge"
                src="/zhiyun-mobile-assets/mine/cert-badge.png"
                alt="已认证"
              />
            </div>
            <p>{{ profile.company }}</p>
          </div>
          <van-icon name="arrow" class="profile-arrow" />
        </div>
      </section>

      <main class="mine-content">
        <section class="panel account-panel">
          <div class="panel-heading account-heading" @click="openAccount('overview')">
            <div>
              <span class="eyebrow">资金一眼看清</span>
              <h2>我的账户</h2>
            </div>
            <button class="text-button" type="button" @click.stop="openAccount('flow')">
              账户明细
              <van-icon name="arrow" />
            </button>
          </div>

          <div class="account-grid">
            <button
              v-for="item in accountItems"
              :key="item.key"
              class="account-item"
              type="button"
              @click="onAccountItem(item)"
            >
              <strong>
                <span class="currency">¥</span>{{ item.value }}
              </strong>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </section>

        <section class="panel invoice-panel">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">结算完成即可申请</span>
              <h2>我的发票</h2>
            </div>
            <button class="text-button" type="button" @click="openInvoice">
              开票记录
              <van-icon name="arrow" />
            </button>
          </div>

          <button class="invoice-main" type="button" @click="openInvoice">
            <div class="invoice-amount">
              <span>可开票金额</span>
              <strong><small>¥</small>{{ invoiceSummary.amount }}</strong>
            </div>
            <span class="invoice-action">去开票</span>
          </button>

          <div class="invoice-status">
            <button type="button" @click="openInvoice">
              <strong>{{ invoiceSummary.pendingCount }}</strong>
              <span>待开票结算单</span>
            </button>
            <i></i>
            <button type="button" @click="openInvoice">
              <strong>{{ invoiceSummary.processingCount }}</strong>
              <span>开票中</span>
            </button>
          </div>
        </section>

        <section class="panel apps-panel">
          <div class="panel-heading simple-heading">
            <h2>常用应用</h2>
          </div>
          <div class="app-grid">
            <button
              v-for="item in commonApps"
              :key="item.key"
              class="app-item"
              type="button"
              @click="onApp(item)"
            >
              <span class="app-icon" :class="'tone-' + item.tone">
                <van-icon :name="item.icon" />
                <em v-if="item.badge">{{ item.badge }}</em>
              </span>
              <strong>{{ item.label }}</strong>
              <small>{{ item.summary }}</small>
            </button>
          </div>
        </section>

        <section class="panel basic-panel">
          <button
            v-for="item in basicMenus"
            :key="item.key"
            class="basic-row"
            type="button"
            @click="onBasic(item)"
          >
            <span class="basic-icon">
              <van-icon :name="item.icon" />
            </span>
            <span class="basic-label">{{ item.label }}</span>
            <span v-if="item.status" class="basic-status">{{ item.status }}</span>
            <van-icon name="arrow" class="basic-arrow" />
          </button>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { settlementPage } from './ai-home-data.js'

const emit = defineEmits(['open-invoice', 'open-account', 'open-payment'])

const profile = {
  name: '张明',
  company: '福建飞航娱乐有限公司',
}

const accountItems = [
  { key: 'balance', label: '可用余额', value: '20,680.00' },
  { key: 'frozen', label: '冻结金额', value: '5,000.00' },
  { key: 'pending', label: '待支付', value: settlementPage.paymentSummary.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) },
]

const invoiceSummary = {
  amount: '4,254.23',
  pendingCount: 10,
  processingCount: 1,
}

const commonApps = [
  {
    key: 'address',
    label: '地址簿',
    summary: '6 个地址',
    icon: 'location-o',
    tone: 'blue',
  },
  {
    key: 'capacity',
    label: '收藏运力',
    summary: '15 个收藏',
    icon: 'logistics',
    tone: 'green',
  },
  {
    key: 'contract',
    label: '合同管理',
    summary: '1 份待签',
    icon: 'description',
    tone: 'orange',
    badge: '1',
  },
  {
    key: 'claim',
    label: '理赔申诉',
    summary: '1 项处理中',
    icon: 'shield-o',
    tone: 'purple',
    badge: '1',
  },
]

const basicMenus = [
  { key: 'cert', label: '认证信息', icon: 'idcard', status: '已认证' },
  { key: 'enterprise', label: '企业资料', icon: 'shop-o' },
  { key: 'rules', label: '平台规则', icon: 'records-o' },
  { key: 'service', label: '联系客服', icon: 'service-o' },
  { key: 'feedback', label: '意见反馈', icon: 'edit' },
  { key: 'setting', label: '设置', icon: 'setting-o' },
]

const notify = (label) => {
  if (window.sharedStorage?.toast) {
    window.sharedStorage.toast(label + '（原型演示）')
  }
}

const openInvoice = () => {
  emit('open-invoice')
}

const openAccount = (view = 'overview') => {
  emit('open-account', view)
}

const onAccountItem = (item) => {
  if (item.key === 'pending') {
    emit('open-payment')
    return
  }
  openAccount(item.key === 'frozen' ? 'frozen' : 'overview')
}

const onApp = (item) => {
  notify(item.label)
}

const onBasic = (item) => {
  notify(item.label)
}
</script>

<style scoped>
.mine-page {
  width: 100%;
  height: 100%;
  background: #f4f7fc;
  color: #18213a;
  overflow: hidden;
}

.mine-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 118px;
  box-sizing: border-box;
  scrollbar-width: none;
}

.mine-scroll::-webkit-scrollbar {
  display: none;
}

.mine-hero {
  position: relative;
  height: 204px;
  background:
    linear-gradient(180deg, rgba(225, 239, 255, 0.12), #edf5ff 89%),
    url('/zhiyun-mobile-assets/mine/header-bg.png') center top / 100% auto no-repeat;
}

.ios-status-bar {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  color: #18213a;
  font-size: 14px;
  font-weight: 700;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 15px;
}

.signal {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 11px;
}

.signal i {
  display: block;
  width: 3px;
  border-radius: 2px;
  background: #18213a;
}

.signal i:nth-child(1) { height: 4px; }
.signal i:nth-child(2) { height: 6px; }
.signal i:nth-child(3) { height: 8px; }
.signal i:nth-child(4) { height: 10px; }

.battery {
  position: relative;
  display: block;
  width: 21px;
  height: 10px;
  border: 1px solid rgba(24, 33, 58, 0.55);
  border-radius: 3px;
  padding: 1px;
  box-sizing: border-box;
}

.battery::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 3px;
  width: 2px;
  height: 4px;
  border-radius: 0 2px 2px 0;
  background: rgba(24, 33, 58, 0.55);
}

.battery i {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 1px;
  background: #18213a;
}

.mine-nav {
  height: 44px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
}

.mine-nav h1 {
  margin: 0;
  font-size: 18px;
  line-height: 25px;
  font-weight: 600;
}

.profile-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  height: 94px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid #eef2f8;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(50, 79, 124, 0.05);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  flex: none;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(40, 93, 173, 0.15);
}

.profile-copy {
  min-width: 0;
  margin-left: 13px;
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.profile-name-row strong {
  font-size: 18px;
  line-height: 25px;
  font-weight: 650;
}

.cert-badge {
  width: 44px;
  height: 18px;
  object-fit: contain;
}

.profile-copy p {
  margin: 6px 0 0;
  color: #69758f;
  font-size: 12px;
  line-height: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-arrow {
  margin-left: 8px;
  color: #9ba8bd;
  font-size: 15px;
}

.mine-content {
  padding: 0 12px 18px;
}

.panel {
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid #edf1f6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(50, 79, 124, 0.035);
}

.panel-heading {
  min-height: 57px;
  padding: 12px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.panel-heading h2 {
  margin: 2px 0 0;
  font-size: 16px;
  line-height: 22px;
  font-weight: 650;
}

.eyebrow {
  color: #8c98ad;
  font-size: 10px;
  line-height: 14px;
}

button {
  border: 0;
  font: inherit;
}

.text-button {
  padding: 8px 0 8px 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  color: #75829a;
  background: transparent;
  font-size: 12px;
}

.text-button .van-icon {
  font-size: 13px;
}

.account-panel {
  background: #fff;
}

.account-heading {
  cursor: pointer;
}

.account-grid {
  padding: 4px 6px 15px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.account-item {
  position: relative;
  min-width: 0;
  padding: 6px 4px;
  background: transparent;
  text-align: center;
}

.account-item + .account-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 1px;
  height: 34px;
  background: #edf1f7;
}

.account-item strong {
  display: block;
  color: #18213a;
  font-size: 17px;
  line-height: 23px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.account-item .currency {
  margin-right: 2px;
  font-size: 11px;
  font-weight: 600;
}

.account-item > span {
  display: block;
  margin-top: 5px;
  color: #7c879b;
  font-size: 11px;
}

.invoice-panel {
  background: #fff;
}

.invoice-main {
  width: calc(100% - 28px);
  margin: 1px 14px 0;
  padding: 11px 12px 13px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-radius: 11px;
  background: #f1f6ff;
  text-align: left;
}

.invoice-amount > span {
  display: block;
  margin-bottom: 3px;
  color: #6d7b94;
  font-size: 11px;
}

.invoice-amount strong {
  color: #244eae;
  font-size: 25px;
  line-height: 30px;
  font-weight: 750;
  letter-spacing: -0.4px;
}

.invoice-amount small {
  margin-right: 3px;
  font-size: 13px;
}

.invoice-action {
  min-width: 65px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #2f5ee9);
  box-shadow: 0 5px 12px rgba(47, 94, 233, 0.22);
  font-size: 12px;
  font-weight: 600;
}

.invoice-status {
  padding: 13px 20px 15px;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;
}

.invoice-status button {
  padding: 0;
  background: transparent;
  text-align: center;
}

.invoice-status strong {
  display: block;
  color: #25314c;
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}

.invoice-status span {
  display: block;
  margin-top: 3px;
  color: #7c879b;
  font-size: 11px;
}

.invoice-status i {
  width: 1px;
  height: 28px;
  background: #edf1f7;
}

.simple-heading {
  min-height: 44px;
  padding-top: 13px;
  padding-bottom: 5px;
}

.simple-heading h2 {
  margin: 0;
}

.app-grid {
  padding: 5px 8px 15px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.app-item {
  min-width: 0;
  padding: 5px 1px 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  background: transparent;
  text-align: center;
}

.app-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 21px;
}

.app-icon em {
  position: absolute;
  right: -3px;
  top: -4px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  box-sizing: border-box;
  border: 2px solid #fff;
  border-radius: 8px;
  color: #fff;
  background: #ff603e;
  font-size: 9px;
  font-style: normal;
  line-height: 11px;
}

.tone-blue {
  color: #3970ed;
  background: #edf4ff;
}

.tone-green {
  color: #24a875;
  background: #eaf9f3;
}

.tone-orange {
  color: #ed8738;
  background: #fff3e9;
}

.tone-purple {
  color: #7a63dd;
  background: #f1edff;
}

.app-item strong {
  margin-top: 8px;
  color: #29344d;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
}

.app-item small {
  margin-top: 2px;
  color: #9aa5b7;
  font-size: 9px;
  line-height: 13px;
  white-space: nowrap;
}

.basic-panel {
  padding-left: 14px;
}

.basic-row {
  width: 100%;
  height: 49px;
  padding: 0 14px 0 0;
  display: flex;
  align-items: center;
  background: transparent;
  text-align: left;
}

.basic-row + .basic-row {
  border-top: 1px solid #f0f3f7;
}

.basic-icon {
  width: 29px;
  height: 29px;
  margin-right: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: #5374b9;
  background: #f1f5fc;
  font-size: 17px;
}

.basic-label {
  flex: 1;
  color: #303a51;
  font-size: 14px;
}

.basic-status {
  margin-right: 7px;
  color: #8090aa;
  font-size: 11px;
}

.basic-arrow {
  color: #b2bccb;
  font-size: 13px;
}
</style>
