/* 发票管理 Mock 数据 —— 日期基准与结算页一致（6月18日）
   开票粒度：一票货源在每个承接平台各生成一张结算单；按结算单申请开票。
   仅已付款的结算单可申请开票；本轮仅电子发票，不做部分开票。 */

import { reactive } from 'vue'

export const invoiceAsOf = '6月18日'

/* 可开票货源计划：开票从货源进入，带出该货源下各承接平台的结算单 */
export const cargoPlans = [
  {
    id: 'plan-1',
    route: '福州 → 天津',
    goods: '煤炭',
    quantity: '1,100吨',
    loadDate: '6月1日装货',
    unloadDate: '6月7日卸货',
    loadAddress: '福州市·江上图首府叁号',
    unloadAddress: '天津市·东丽物流园',
    paidAmount: 42600,
    paid: true,
    settlements: [
      { id: 'JS202606180001', platform: '金石智运', amount: 30000, period: '6月1日—6月7日', waybillCount: 6 },
      { id: 'JS202606180002', platform: '象奔奔', amount: 12600, period: '6月8日—6月10日', waybillCount: 3 },
    ],
  },
  {
    id: 'plan-2',
    route: '泉州 → 福州',
    goods: '矿石',
    quantity: '124吨',
    loadDate: '6月11日装货',
    unloadDate: '6月14日卸货',
    loadAddress: '泉州市·石湖港区',
    unloadAddress: '福州市·江上图首府叁号',
    paidAmount: 18000,
    paid: true,
    settlements: [
      { id: 'JS202606180003', platform: '至简智运', amount: 18000, period: '6月11日—6月14日', waybillCount: 4 },
    ],
  },
  {
    id: 'plan-3',
    route: '福州 → 厦门',
    goods: '煤炭',
    quantity: '66吨',
    loadDate: '6月15日装货',
    unloadDate: '6月17日卸货',
    loadAddress: '福州市·江上图首府叁号',
    unloadAddress: '厦门市·海沧物流园',
    paidAmount: 0,
    paid: false,
    /* 该货源对应结算单尚未付款：不进入可开票范围，仅用于说明“先款后票” */
    settlements: [],
    blockedNote: '该货源下结算单尚未付款，付款后方可申请开票。',
  },
]

/* 开票申请记录：状态统一为 待开票 → 开票中 → 已开票 / 已驳回 四条同轨状态 */
export const invoiceRecords = [
  {
    id: 'FP202606050001',
    applyNo: '26042314482611001',
    platform: '金石智运',
    route: '福州 → 天津',
    goods: '煤炭',
    amount: 30000,
    titleType: '企业',
    status: '已开票',
    applyTime: '2026-06-05 10:12',
    invoiceNo: '24372000000123456789',
    waybillCount: 6,
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
      { time: '06-05 10:12', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
      { time: '06-05 14:20', title: '平台受理', source: '金石智运', detail: '平台已受理，进入开票处理。' },
      { time: '06-06 09:05', title: '开票完成', source: '金石智运', detail: '电子发票已开具并发送至收票邮箱。' },
    ],
  },
  {
    id: 'FP202606060002',
    applyNo: '26042314482611002',
    platform: '象奔奔',
    route: '福州 → 天津',
    goods: '煤炭',
    amount: 12600,
    titleType: '企业',
    status: '开票中',
    applyTime: '2026-06-06 09:30',
    invoiceNo: '',
    waybillCount: 3,
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
      { time: '06-06 09:30', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
      { time: '06-06 11:02', title: '平台受理', source: '象奔奔', detail: '平台已受理，正在开具发票。' },
    ],
  },
  {
    id: 'FP202606070003',
    applyNo: '26042314482611003',
    platform: '至简智运',
    route: '泉州 → 福州',
    goods: '矿石',
    amount: 18000,
    titleType: '企业',
    status: '待开票',
    applyTime: '2026-06-07 14:05',
    invoiceNo: '',
    waybillCount: 4,
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
      { time: '06-07 14:05', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
    ],
  },
  {
    id: 'FP202606080004',
    applyNo: '26042314482611004',
    platform: '金石智运',
    route: '福州 → 厦门',
    goods: '煤炭',
    amount: 9800,
    titleType: '企业',
    status: '已驳回',
    applyTime: '2026-06-08 16:40',
    invoiceNo: '',
    waybillCount: 2,
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
      { time: '06-08 16:40', title: '提交申请', source: '货主提交', detail: '已提交开票信息，等待平台受理。' },
      { time: '06-09 09:15', title: '平台驳回', source: '金石智运', detail: '纳税人识别号与开票抬头不一致，请核对后重新提交。' },
    ],
  },
]

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

/* 同一次申请只对应一张结算单、一个承接平台，因此只开一张发票 */
export function invoicesForSettlement(settlements) {
  return settlements.length
}

/* 关联运单：公路运输口径（运单号 / 车牌 / 司机 / 货物净重 / 装卸 / 运费 / 打款状态） */
export function waybillsOf(settlementId) {
  const base = [
    { plate: '闽A·8H2**', driver: '陈师傅', goods: '煤炭', weight: '30吨', load: '福州市·江上图首府叁号', unload: '天津市·东丽物流园', time: '06-01 08:20', amount: 5000 },
    { plate: '闽A·6K9**', driver: '林师傅', goods: '煤炭', weight: '31吨', load: '福州市·江上图首府叁号', unload: '天津市·东丽物流园', time: '06-02 07:45', amount: 5000 },
    { plate: '闽C·3D5**', driver: '黄师傅', goods: '煤炭', weight: '29吨', load: '福州市·江上图首府叁号', unload: '天津市·东丽物流园', time: '06-03 09:10', amount: 5000 },
  ]
  const seq = Number.parseInt(settlementId.slice(-3), 10) || 1
  return base.map((item, index) => ({
    ...item,
    id: `YD${settlementId.slice(-6)}${String(index + 1).padStart(2, '0')}`,
    payStatus: '已打款',
    amount: 4200 + ((seq * 7 + index * 13) % 5) * 100,
  }))
}
