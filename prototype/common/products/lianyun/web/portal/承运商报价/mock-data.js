/**
 * 承运商报价 Mock 数据（迁移自主仓 carrier-quote）
 * 含散杂货 + 集装箱两套 demo 托运单
 */

export const transportModeOptions = ['公路', '铁路', '水路', '多式联运']
export const carryFormOptions = ['散货运输', '集装箱运输']
export const quoteModeOptions = ['整段报价', '分段报价']
export const billingDimensionOptions = ['按重量', '按体积', '按车', '按集装箱']
export const billingBasisOptions = ['按装货口径', '按卸货口径']
export const segmentBillingOptionsBulk = ['按重量', '按体积', '按车']
export const segmentBillingOptionsContainer = ['按集装箱']
export const paymentMethodOptions = ['月结', '现结', '预付', '货到付款']
export const taxRequirementOptions = ['增值税专用发票，税率13%', '增值税专用发票，税率9%', '增值税普通发票', '不开票']
export const deliveryOptions = ['门到门', '门到站', '站到站', '站到门']
export const valueAddOptions = ['代收货款服务', '保价服务', '免费到通知', '定日达', '定时达', 'GPS跟踪']
export const extraFeeTypeOptions = ['增项', '减项']

// 散杂货 demo 托运单
export const bulkWaybill = {
  id: 'TY20260701001',
  businessType: '散杂货',
  publishMode: '限时竞价',
  quoteDeadline: '2026-07-06 18:00',
  ownerCompany: '广林木业有限公司',
  contactName: '张经理', contactPhone: '13900001111',
  expectedPrice: 100, expectedTotal: 10000,
  paymentMethod: '月结',
  taxRequirement: '增值税专用发票，税率13%',
  transportRequirement: '需防潮',
  availableModes: ['公路', '铁路', '水路', '多式联运'],
  routeTitle: '苏州 → 广州',
  // 装卸点
  loadOrderNodes: [
    { id: 'load1', name: '苏州园区仓库', address: '苏州园区', role: '装' },
  ],
  unloadOrderNodes: [
    { id: 'unload1', name: '广州白云仓', address: '广州白云', role: '卸' },
  ],
  cargoFlows: [
    { cargoName: '板材', packageType: '散装', quantity: 100, unit: '吨', loadPointId: 'load1', unloadPointId: 'unload1' },
  ],
  containerBoxes: [],
  containerNodes: [],
}

// 集装箱 demo 托运单
export const containerWaybill = {
  id: 'TY20260701002',
  businessType: '集装箱',
  publishMode: '限时竞价',
  quoteDeadline: '2026-07-06 18:00',
  ownerCompany: '广林木业有限公司',
  contactName: '李经理', contactPhone: '13800002222',
  expectedPrice: 4500, expectedTotal: 45000,
  paymentMethod: '月结',
  taxRequirement: '增值税专用发票，税率9%',
  transportRequirement: '',
  availableModes: ['公路', '铁路', '水路', '多式联运'],
  routeTitle: '上海 → 武汉',
  containerSource: '货主提供',
  containerBoxes: [
    { boxType: '20GP', size: '20尺', quantity: 5, cargoName: '电子产品', weight: 60 },
    { boxType: '40HQ', size: '40尺', quantity: 3, cargoName: '电子产品', weight: 88 },
  ],
  containerNodes: [
    { id: 'cn1', nodeType: '提空', name: '外高桥堆场', address: '上海外高桥' },
    { id: 'cn2', nodeType: '装货', name: '上海工厂', address: '上海浦东' },
    { id: 'cn3', nodeType: '卸货', name: '武汉仓', address: '武汉东西湖' },
    { id: 'cn4', nodeType: '还空', name: '武汉堆场', address: '武汉阳逻' },
  ],
  cargoFlows: [],
  loadOrderNodes: [], unloadOrderNodes: [],
}

// 承运商常用地址（多式联运中转点）
export const carrierAddressOptions = [
  { id: 'c-addr1', name: '上海铁路货运站', sourceType: 'carrier' },
  { id: 'c-addr2', name: '武汉港', sourceType: 'carrier' },
]
