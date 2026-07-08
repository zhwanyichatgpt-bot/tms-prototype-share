/**
 * 创建联运计划 Mock 数据（迁移自主仓 multimodal/create-plan）
 */

// 运输方式（路段级）
export const transportModes = ['公路', '铁路', '水路']

// 运输类型（carryForm）
export const carryForms = ['散货运输', '集装箱运输']

// 包装类型
export const packageTypes = ['散装', '袋装', '箱装', '桶装']

// 货品单位
export const cargoUnits = ['吨', '件', '车']

// 配载方式
export const stowageModes = ['按重量', '按体积', '按数量']

// 结算方式
export const settlementModes = ['整票结算', '分段结算']

// 计费条件
export const billingConditions = ['按重量', '按体积', '按数量', '按集装箱']

// 计费依据（仅散杂货）
export const billingBases = ['按装货口径', '按卸货口径']

// 单价单位
export const priceUnits = ['元/吨', '元/方', '元/车', '元/箱', '元/公里']

// 是否含税
export const taxOptions = ['是', '否']

// 付款方式
export const paymentTypes = ['预付', '到付', '月结']

// 支付方式
export const paymentMethods = ['银行转账', '线上支付', '承兑汇票']

// 计费规则（货品计量）
export const calcRules = ['按重量', '按体积', '按车次', '按集装箱', '按里程']

// 计量单位
export const measureUnits = ['吨', '方', '车', '箱', '公里']

// 默认联运计划数据（手工创建模式）
export const defaultPlan = {
  planName: '上海-成都多式联运计划',
  shipperCompany: '华东贸易有限公司',
  contactName: '张经理',
  contactPhone: '13900001111',
  remark: '',
  waybillOrder: null, // 关联托运单
  confirmedQuote: null, // 关联报价
  cargoItems: [
    { id: 'c1', cargoName: '机械设备', packageType: '散装', weight: 50, volume: 80, quantity: 1, unit: '吨', loadPoint: '上海浦东', unloadPoint: '成都龙泉驿' },
  ],
  stowageMode: '按重量',
  routeSegments: [
    {
      id: 'seg1', seq: 1,
      transportMode: '公路', carryForm: '散货运输',
      from: '上海浦东', to: '南京',
      loadWorkTime: '', unloadWorkTime: '', duration: '待确认',
      locked: false, subPlan: null,
      cargoItems: [{ cargoName: '机械设备', weight: 50 }],
    },
    {
      id: 'seg2', seq: 2,
      transportMode: '铁路', carryForm: '散货运输',
      from: '南京', to: '成都',
      loadWorkTime: '', unloadWorkTime: '', duration: '待确认',
      locked: false, subPlan: null,
      cargoItems: [{ cargoName: '机械设备', weight: 50 }],
    },
  ],
  feeConfig: {
    enabled: true,
    settlementMode: '整票结算',
    includeTax: '是',
    paymentType: '月结',
    paymentMethod: '银行转账',
    calcRule: '按重量',
    measureUnit: '吨',
    billingBasis: '装货重量',
    unitPrice: 100,
    lossRule: '不启用',
    segmentRules: [], // 分段时各段规则
  },
  extraFeeRows: [],
  subPlanStatus: { created: 0 },
}

// 可选托运单（关联托运单抽屉）
export const selectableWaybills = [
  {
    id: 'TY20260701001', shipperCompany: '华东贸易有限公司', businessType: '散杂货',
    mainTransportMode: '多式联运', status: '待执行',
    contactName: '张经理', contactPhone: '13900001111',
    cargoItems: [
      { id: 'c1', cargoName: '机械设备', packageType: '散装', weight: 50, volume: 80, quantity: 1, unit: '吨', loadPoint: '上海浦东', unloadPoint: '成都龙泉驿' },
    ],
    loadNodes: [{ name: '上海浦东' }],
    unloadNodes: [{ name: '成都龙泉驿' }],
  },
  {
    id: 'TY20260701002', shipperCompany: '西南物流有限公司', businessType: '集装箱',
    mainTransportMode: '多式联运', status: '待执行',
    contactName: '李经理', contactPhone: '13800002222',
    cargoItems: [
      { id: 'c1', cargoName: '电子配件', packageType: '箱装', weight: 25, quantity: 5, unit: '箱', loadPoint: '广州', unloadPoint: '成都' },
    ],
    containerBoxes: [{ id: 'b1', containerType: '20GP', quantity: 5, cargoName: '电子配件' }],
    containerNodes: [{ nodeType: '装货', name: '广州' }, { nodeType: '卸货', name: '成都' }],
  },
]

// 子计划类型映射
export const subPlanTypeMap = {
  公路: '公路子计划',
  铁路: '铁路子计划',
  水路: '水路子计划',
}

// 子计划状态选项
export const subPlanStatusOptions = ['草稿', '待确认', '已确认', '执行中', '已完成']
