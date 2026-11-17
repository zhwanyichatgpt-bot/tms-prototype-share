<template>
  <AccountCenterPage
    :config="config"
    :initial-view="initialView"
    @back="$emit('back')"
    @open-payment="$emit('open-payment')"
  />
</template>

<script setup>
import AccountCenterPage from '../../../../shared/mobile/account-center/AccountCenterPage.vue'

defineProps({
  initialView: { type: String, default: 'overview' },
})
defineEmits(['back', 'open-payment'])

const flows = [
  {
    id: 'f1',
    category: 'expense',
    type: 'expense',
    icon: 'balance-list-o',
    title: '运费支付',
    platform: '金石智运',
    payee: '福建某运输公司',
    route: '福州 → 天津 · 煤炭',
    cargoNo: '货源 HY20260901001',
    waybillCount: 1,
    waybills: [
      { id: 'YD20260901001', driver: '李师傅', plate: '闽A·12345', amount: '¥620.00' },
    ],
    summary: '福建某运输公司',
    amount: '-¥620.00',
    status: '支付成功',
    time: '09-18 14:32',
    reference: '运单 YD20260901001',
    invoice: {
      status: '已开票',
      type: '增值税电子普通发票',
      amount: '¥620.00',
      no: '24372000000918003600',
      title: '福建飞航娱乐有限公司',
      time: '09-18 16:08',
    },
  },
  { id: 'f2', category: 'freeze', type: 'freeze', icon: 'lock', title: '资金冻结', summary: '运单付款处理中', amount: '-¥5,000.00', status: '冻结中', time: '09-17 16:20', reference: 'YD20260917002' },
  { id: 'f3', category: 'income', type: 'income', icon: 'plus', title: '账户充值', summary: '企业网银充值', amount: '+¥10,000.00', status: '充值成功', time: '09-16 10:08', reference: 'CZ20260916001' },
  { id: 'f4', category: 'income', type: 'refund', icon: 'replay', title: '运费退款', summary: '付款关闭后退回账户', amount: '+¥680.00', status: '已退回', time: '09-15 18:46', reference: 'TK20260915001' },
  { id: 'f5', category: 'freeze', type: 'unfreeze', icon: 'unlock', title: '资金解冻', summary: '付款申请关闭', amount: '+¥2,000.00', status: '已解冻', time: '09-14 09:25', reference: 'JD20260914001' },
]

const config = {
  account: { balance: '20,680.00', frozen: '5,000.00' },
  flows,
  manage: {
    fundAccount: { name: '福建飞航娱乐有限公司' },
    phone: { value: '138****2039' },
  },
  bankCards: [],
  frozenDetail: {
    amount: '¥5,000.00',
    status: '付款处理中',
    rows: [
      { label: '关联运单', value: 'YD20260917002' },
      { label: '冻结时间', value: '09-17 16:20' },
      { label: '当前说明', value: '等待付款结果更新' },
    ],
  },
}
</script>
