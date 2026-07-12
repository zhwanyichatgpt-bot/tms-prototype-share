/**
 * 创建联运计划 Mock 数据
 * 1:1 迁移自主仓 multimodal/create-plan/current/src/mock-data.js
 * 场景：玉米 30吨 + 小麦 20吨，安徽宿迁 → 浙江金华，5 段公路/铁路/公路混合（演示执行段聚合）
 * PRD 补充：货品项加 unitPrice（货品单价）；其他费用加 feeType/pricingMode/price/basis 字段
 */

// 默认托运单（手工创建 / 无上游确认报价时使用）
export const defaultWaybillOrder = {
  id: 'TY20250612001',
  shipperCompany: '华东农业贸易有限公司',
  contactName: '张经理',
  contactPhone: '138****6789',
  remark: '请优先安排铁路运输，注意防潮',
  cargoItems: [
    {
      id: 'C1',
      cargoName: '玉米',
      packageType: '散装',
      weight: 30,
      volume: 42,
      quantity: 30,
      unit: '吨',
      unitPrice: 120, // PRD 7.2 货品单价
      loadPointId: 'LP-001',
      loadPoint: '安徽宿迁一号装货点',
      loadAddress: '安徽省宿迁市宿城区工业路188号',
      unloadPointId: 'UP-001',
      unloadPoint: '浙江金华一号卸货点',
      unloadAddress: '浙江省金华市婺城区物流大道66号',
    },
    {
      id: 'C2',
      cargoName: '小麦',
      packageType: '散装',
      weight: 20,
      volume: 28,
      quantity: 20,
      unit: '吨',
      unitPrice: 150, // PRD 7.2 货品单价
      loadPointId: 'LP-002',
      loadPoint: '安徽宿迁二号装货点',
      loadAddress: '安徽省宿迁市泗阳县开发区北路88号',
      unloadPointId: 'UP-002',
      unloadPoint: '浙江金华二号卸货点',
      unloadAddress: '浙江省金华市义乌市货运西路128号',
    },
  ],
}

// 默认确认报价（shared 模式下带入）
export const defaultConfirmedQuote = {
  id: 'BJ20250612001',
  quoteMode: '分段报价',
  billingCondition: '重量',
  billingBasis: '按装货重量',
  totalAmount: 6800,
  transportAmount: 6200,
  extraAmount: 600,
}

// 默认报价小段（5 段公路/铁路/公路混合，演示连续相同运输方式聚合）
export const defaultRouteSegments = [
  {
    id: 'seg-001',
    seq: 1,
    transportMode: '公路',
    carryForm: '散货运输',
    fromId: 'LP-001',
    from: '安徽宿迁一号装货点',
    fromAddress: '安徽省宿迁市宿城区工业路188号',
    toId: 'LP-002',
    to: '安徽宿迁二号装货点',
    toAddress: '安徽省宿迁市泗阳县开发区北路88号',
    duration: '2小时',
    locked: true,
    cargoItems: [
      { cargoId: 'C1', cargoName: '玉米', packageType: '散装', quantity: 30, unit: '吨' },
    ],
  },
  {
    id: 'seg-002',
    seq: 2,
    transportMode: '公路',
    carryForm: '散货运输',
    fromId: 'LP-002',
    from: '安徽宿迁二号装货点',
    fromAddress: '安徽省宿迁市泗阳县开发区北路88号',
    toId: 'ST-001',
    to: '宿迁铁路货运站',
    toAddress: '江苏省宿迁市宿城区铁路货场路',
    duration: '1小时',
    locked: true,
    cargoItems: [
      { cargoId: 'C1', cargoName: '玉米', packageType: '散装', quantity: 30, unit: '吨' },
      { cargoId: 'C2', cargoName: '小麦', packageType: '散装', quantity: 20, unit: '吨' },
    ],
  },
  {
    id: 'seg-003',
    seq: 3,
    transportMode: '铁路',
    carryForm: '集装箱运输',
    fromId: 'ST-001',
    from: '宿迁铁路货运站',
    fromAddress: '江苏省宿迁市宿城区铁路货场路',
    toId: 'ST-002',
    to: '金华铁路到达站',
    toAddress: '浙江省金华市金东区铁路货运中心',
    duration: '18小时',
    locked: true,
    cargoItems: [
      { cargoId: 'C1', cargoName: '玉米', packageType: '散装', quantity: 30, unit: '吨' },
      { cargoId: 'C2', cargoName: '小麦', packageType: '散装', quantity: 20, unit: '吨' },
    ],
  },
  {
    id: 'seg-004',
    seq: 4,
    transportMode: '公路',
    carryForm: '散货运输',
    fromId: 'ST-002',
    from: '金华铁路到达站',
    fromAddress: '浙江省金华市金东区铁路货运中心',
    toId: 'UP-001',
    to: '浙江金华一号卸货点',
    toAddress: '浙江省金华市婺城区物流大道66号',
    duration: '1小时',
    locked: true,
    cargoItems: [
      { cargoId: 'C1', cargoName: '玉米', packageType: '散装', quantity: 30, unit: '吨' },
      { cargoId: 'C2', cargoName: '小麦', packageType: '散装', quantity: 20, unit: '吨' },
    ],
  },
  {
    id: 'seg-005',
    seq: 5,
    transportMode: '公路',
    carryForm: '散货运输',
    fromId: 'UP-001',
    from: '浙江金华一号卸货点',
    fromAddress: '浙江省金华市婺城区物流大道66号',
    toId: 'UP-002',
    to: '浙江金华二号卸货点',
    toAddress: '浙江省金华市义乌市货运西路128号',
    duration: '1小时',
    locked: true,
    cargoItems: [
      { cargoId: 'C2', cargoName: '小麦', packageType: '散装', quantity: 20, unit: '吨' },
    ],
  },
]

// 默认报价侧费用摘要
export const defaultFeeInfo = {
  quoteMode: '分段报价',
  billingCondition: '重量',
  billingBasis: '按装货重量',
  transportTotal: 15100,
  extraTotal: 400,
  totalAmount: 15500,
}

// 子计划类型映射
export const subPlanTypeMap = {
  公路: '公路子计划',
  铁路: '铁路子计划',
  水路: '水路子计划',
}

// 子计划状态选项
export const subPlanStatusOptions = ['草稿', '待确认', '已确认', '执行中', '已完成']
