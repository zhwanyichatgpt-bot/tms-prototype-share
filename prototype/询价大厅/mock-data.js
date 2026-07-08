/**
 * 询价大厅（货源大厅）页面 Mock 数据
 * 从主仓 waybill/hall 迁移，1:1 保留数据结构
 */

// 运输方式选项
export const transportModeOptions = ['公路', '铁路', '水路']

// 运输类型选项
export const carryFormOptions = ['散货运输', '集装箱运输']

// 报价模式选项
export const quoteModeOptions = ['整段报价', '分段报价']

// 计费依据选项（统一口径，原 billingBasisOptions）
export const billingBasisOptions = ['按装货口径', '按卸货口径']

// 计费条件选项（统一口径，原 billingDimensionOptions）
export const billingDimensionOptions = ['按重量', '按体积', '按车', '按集装箱']

// 示例路线节点
export const routeNodes = [
  { id: 'addr-load-1', name: '安徽宿迁一号装货点', type: '装' },
  { id: 'addr-load-2', name: '安徽宿迁二号装货点', type: '装' },
  { id: 'addr-transit-1', name: '宿迁铁路货运站', type: '中转' },
  { id: 'addr-transit-2', name: '金华铁路到达站', type: '中转' },
  { id: 'addr-unload-1', name: '浙江金华一号卸货点', type: '卸' },
  { id: 'addr-unload-2', name: '浙江金华二号卸货点', type: '卸' },
]

// 示例承运商地址
export const carrierAddressOptions = [
  { id: 'carrier-1', name: '宿迁集散中心', type: 'carrier' },
  { id: 'carrier-2', name: '金华配送中心', type: 'carrier' },
]

// Demo 货源数据（共享 store 无数据时降级使用）
export const demoWaybills = [
  {
    id: 'TY2435678904',
    businessType: '散杂货',
    transportMode: '公路运输',
    shipperCompany: '福州港务集团',
    contactName: '李明',
    contactPhone: '13966668888',
    status: '竞价中',
    expectedPrice: 35,
    billingBasis: '按重量',
    taxRequirement: '增值税专用发票，税率13%',
    paymentMethod: '月结',
    loadNodes: [{ name: '福建 福州' }],
    unloadNodes: [{ name: '福建 厦门' }],
    cargoItems: [{ cargoName: '煤炭', weight: 50, quantity: 200, unit: '方', package: '无包装', loadNodeName: '福建 福州' }],
    publishTime: '2026-07-05 10:00:30',
  },
  {
    id: 'TY2435678905',
    businessType: '集装箱',
    transportMode: '水路运输',
    shipperCompany: '厦门港口物流有限公司',
    contactName: '王强',
    contactPhone: '13800008888',
    status: '竞价中',
    expectedPrice: 35,
    billingBasis: '按集装箱',
    taxRequirement: '增值税专用发票，税率9%',
    paymentMethod: '月结',
    loadNodes: [{ name: '福建 福州' }],
    unloadNodes: [{ name: '福建 厦门' }],
    cargoItems: [{ cargoName: '粮食', weight: 50, quantity: 1, unit: '箱', package: '20GP', loadNodeName: '福建 福州' }],
    publishTime: '2026-07-05 10:00:30',
  },
  {
    id: 'TY2435678906',
    businessType: '散杂货',
    transportMode: '多式联运',
    shipperCompany: '厦门港口物流有限公司',
    contactName: '陈林',
    contactPhone: '13700008888',
    status: '竞价中',
    expectedPrice: 35,
    billingBasis: '按重量',
    taxRequirement: '增值税专用发票，税率13%',
    paymentMethod: '到付',
    loadNodes: [{ name: '福建 福州' }],
    unloadNodes: [{ name: '福建 厦门' }],
    cargoItems: [{ cargoName: '玉米', weight: 50, quantity: 50, unit: '吨', package: '散装', loadNodeName: '福建 福州' }],
    publishTime: '2026-07-05 10:00:30',
  },
]
