/* 发票管理原型数据：以运单为唯一开票对象，货源仅作为查找入口。
   已付款且未处于有效开票流程的运单可申请；一张运单对应一张电子发票。 */

import { computed, reactive } from 'vue'
import { cargoList, waybillList } from './mock-data.js'

export const invoiceAsOf = '4月15日'

export const waybillInvoiceAmount = (waybill) => Number(String(waybill.freight).replace(/,/g, '')) + Number(waybill.adjustAmount || 0)

export const canInvoiceWaybill = (waybill, records) => waybill.settleType === 'settled'
  && Boolean(waybill.paidTime)
  && !records.some(record => record.waybillId === waybill.id && record.status !== '已驳回')

/* 货源只用于查找运单；金额和付款资格均从运单主数据取得。 */
export const cargoPlans = computed(() => cargoList
  .filter(cargo => waybillList.some(waybill => waybill.cargoId === cargo.id))
  .map(cargo => {
    const paidWaybills = waybillList.filter(waybill => waybill.cargoId === cargo.id && waybill.settleType === 'settled' && waybill.paidTime)
    return {
      id: cargo.id,
      cargoNo: cargo.cargoNo,
      route: `${cargo.loadCity} → ${cargo.unloadCity}`,
      goods: cargo.cargo,
      quantity: cargo.weight,
      loadDate: cargo.loadDate.split(' ')[0],
      unloadDate: cargo.unloadDate.split(' ')[0],
      loadAddress: `${cargo.loadCity}·${cargo.loadDetail}`,
      unloadAddress: `${cargo.unloadCity}·${cargo.unloadDetail}`,
      paidAmount: paidWaybills.reduce((sum, waybill) => sum + waybillInvoiceAmount(waybill), 0),
      paid: paidWaybills.length > 0,
    }
  }))

/* 演示记录与运单主数据对应；驳回申请可重新提交，但不产生第二张有效发票。 */
export const invoiceRecords = reactive([
  {
    id: 'FP202604140001',
    applyNo: '26042314482611001',
    platform: '金石智运',
    cargoNo: 'HY202604100004',
    waybillId: 'wb6',
    waybillNo: 'YD20260411003',
    plate: '闽B·7T419',
    route: '台州 → 福州',
    goods: '煤炭',
    amount: 3136,
    titleType: '企业',
    status: '已开票',
    applyTime: '2026-04-14 10:12',
    invoiceNo: '24372000000123456789',
    title: {
      name: '福建飞航娱乐有限公司',
      taxNo: '91350100MA2YQK8X3D',
      email: 'caiwu@feihang.com',
      address: '福州市鼓楼区五四路 88 号',
      phone: '0591-8888 6666',
      bank: '中国工商银行股份有限公司福州分行',
      account: '1402 0201 0910 0012 345',
    },
    timeline: [
      { time: '04-14 10:12', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
      { time: '04-14 14:20', title: '平台受理', source: '金石智运', detail: '平台已受理，进入开票处理。' },
      { time: '04-15 09:05', title: '开票完成', source: '金石智运', detail: '电子发票已开具并发送至收票邮箱。' },
    ],
  },
  {
    id: 'FP202604140002',
    applyNo: '26042314482611002',
    platform: '金石智运',
    cargoNo: 'HY202604100004',
    waybillId: 'wb7',
    waybillNo: 'YD20260411004',
    plate: '闽A·6K302',
    route: '台州 → 福州',
    goods: '煤炭',
    amount: 2920,
    titleType: '企业',
    status: '已驳回',
    applyTime: '2026-04-14 16:40',
    invoiceNo: '',
    rejectReason: '纳税人识别号与开票抬头不一致，请核对后重新提交。',
    title: {
      name: '福建飞航娱乐有限公司',
      taxNo: '91350100MA2YQK8X3',
      email: 'caiwu@feihang.com',
      address: '福州市鼓楼区五四路 88 号',
      phone: '0591-8888 6666',
      bank: '中国工商银行股份有限公司福州分行',
      account: '1402 0201 0910 0012 345',
    },
    timeline: [
      { time: '04-14 16:40', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
      { time: '04-15 09:15', title: '平台驳回', source: '金石智运', detail: '纳税人识别号与开票抬头不一致，请核对后重新提交。' },
    ],
  },
])

/* 常用开票抬头：一次维护，后续开票直接选用。
   企业抬头按增值税专用发票口径留存全字段；普票只用名称、税号与收票邮箱。
   模块级 reactive：开票页与抬头维护页共用同一份数据，维护后即时生效。 */
export const invoiceTitles = reactive([
  {
    id: 'T1',
    type: '企业',
    name: '福建飞航娱乐有限公司',
    taxNo: '91350100MA2YQK8X3D',
    email: 'caiwu@feihang.com',
    address: '福州市鼓楼区五四路 88 号',
    phone: '0591-8888 6666',
    bank: '中国工商银行股份有限公司福州分行',
    account: '1402 0201 0910 0012 345',
    isDefault: true,
  },
  {
    id: 'T2',
    type: '企业',
    name: '福建飞航物流有限公司',
    taxNo: '91350100MA2YQK8X9K',
    email: 'fapiao@feihang-logistics.com',
    address: '福州市仓山区金山大道 156 号',
    phone: '0591-8833 2211',
    bank: '中国建设银行股份有限公司福州仓山支行',
    account: '3500 1628 0010 0023 456',
    isDefault: false,
  },
  {
    id: 'T3',
    type: '个人',
    name: '陈志强',
    taxNo: '',
    email: 'chenzq@feihang.com',
    phone: '138 0013 8000',
    address: '',
    bank: '',
    account: '',
    isDefault: false,
  },
])

/* 默认抬头：开票表单进入时自动带出；无默认时取第一条 */
export function defaultTitle() {
  return invoiceTitles.find(item => item.isDefault) || invoiceTitles[0] || null
}

/* 一份抬头按当前票种生成开票信息；普票只带出三项，专票字段留空待补 */
export function titleToForm(title) {
  return title.type === '企业'
    ? {
      company: title.name,
      taxNo: title.taxNo,
      email: title.email,
      address: title.address,
      phone: title.phone,
      bank: title.bank,
      account: title.account,
      personName: '',
      personPhone: '',
    }
    : {
      company: '',
      taxNo: '',
      email: title.email,
      address: '',
      phone: '',
      bank: '',
      account: '',
      personName: title.name,
      personPhone: title.phone,
    }
}

/* 抬头列表里的识别信息：企业显示税号，个人显示联系电话 */
export function titleCaption(title) {
  return title.type === '企业'
    ? `纳税人识别号 ${title.taxNo}`
    : `联系电话 ${title.phone}`
}

/* 开票记录顶部汇总：只统计已开票成功的记录 */
export function invoiceSummary(records) {
  const issued = records.filter(r => r.status === '已开票')
  return {
    totalAmount: issued.reduce((sum, r) => sum + r.amount, 0),
    count: issued.length,
  }
}
