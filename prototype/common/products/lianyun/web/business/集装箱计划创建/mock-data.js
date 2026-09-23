/**
 * 集装箱运输计划创建页 Mock 数据
 * 从功能记录仓 HTML 内联版迁移（保留全部字段值）
 */

// 关联托运单选项（抽屉内列表）
export const orderDrawerOrders = [
  { id: 'TY20260326001', route: '上海→昆山', shipperCompany: '上海港物流有限公司', contactName: '王晓峰', contactPhone: '13917220018' },
  { id: 'TY20260326002', route: '太仓→杭州', shipperCompany: '杭州跨境运输公司', contactName: '李娜', contactPhone: '13805710022' },
]

// 托运企业
export const companies = ['上海港物流有限公司', '杭州跨境运输公司', '福州江远跨境运输有限公司']

// 地址库（addressId → address）
export const addresses = [
  { id: 'addr-1', name: '外高桥空箱堆场 / 上海浦东新区港华路 96 号' },
  { id: 'addr-2', name: '昆山制造工厂 / 江苏昆山晨丰路 288 号' },
  { id: 'addr-3', name: '太仓港重箱场站 / 江苏太仓港港北路 9 号' },
  { id: 'addr-4', name: '洋山港集装箱码头 / 上海浦东新区芦潮港' },
  { id: 'addr-5', name: '杭州萧山物流园 / 浙江杭州萧山区鸿达路 18 号' },
]

// 箱型
export const containerTypes = [
  { value: 'gp', label: '普柜' },
  { value: 'hq', label: '高柜' },
  { value: 'rf', label: '冷藏' },
  { value: 'ot', label: '开顶' },
]

// 尺寸
export const containerSizes = ['20尺', '40尺', '45尺']

// 节点类型（手动可选；pickupBridge 仅系统生成）
export const nodeTypes = [
  { value: 'pickupEmpty', label: '提空' },
  { value: 'pickupLoaded', label: '提重' },
  { value: 'load', label: '装货' },
  { value: 'unload', label: '卸货' },
  { value: 'returnLoaded', label: '还重' },
  { value: 'returnEmpty', label: '还空' },
  // pickupBridge 不在手动选项里
]
export const nodeTypeLabel = {
  pickupEmpty: '提空', pickupLoaded: '提重', load: '装货', unload: '卸货',
  returnLoaded: '还重', returnEmpty: '还空', pickupBridge: '提挂',
}

// 起始/终止节点类型
export const START_TYPES = ['pickupEmpty', 'pickupLoaded']
export const END_TYPES = ['returnEmpty', 'returnLoaded']

// 流转规则：从前一节点类型推出允许的后续类型
export const allowedNextTypesFromNode = {
  pickupEmpty: ['load', 'returnEmpty'],
  pickupLoaded: ['unload', 'returnLoaded'],
  load: ['unload', 'returnLoaded'],         // 甩挂时为空（承接型提挂接走）
  unload: ['load', 'returnEmpty'],          // 甩挂时为空
  returnLoaded: [],
  returnEmpty: [],
}

// 集装箱来源
export const containerSourceOptions = [
  { value: 'shipperOwned', label: '货主自有' },
  { value: 'logisticsProvided', label: '物流提供' },
]

// 运输路线模板
export const routeTemplateOptions = [
  { value: 'pickupEmpty-returnLoaded', label: '提空还重' },
  { value: 'pickupLoaded-returnEmpty', label: '提重还空' },
  { value: 'pickupEmpty-returnEmpty', label: '提空还空' },
  { value: 'pickupLoaded-returnLoaded', label: '提重还重' },
  { value: 'custom', label: '自定义' },
]

// 计费规则
export const feeRules = [
  { value: 'byBox', label: '按集装箱' },
  { value: 'byDistance', label: '按里程' },
  { value: 'byTruck', label: '按车' },
]

export const feeTax = [
  { value: 'included', label: '含税' },
  { value: 'excluded', label: '不含税' },
]

export const distanceBasis = [
  { value: 'plan', label: '按计划里程' },
  { value: 'actual', label: '按实际结算' },
]

// 场景初始数据：独立创建
export const scenarioIndependent = {
  mode: 'independent',
  sourceInfo: { sourceType: '独立创建', multimodalPlan: '', segment: '', segmentStart: '', segmentEnd: '' },
  baseInfo: {
    orderRef: '',
    planName: '上海洋山港提空至昆山装货计划',
    shipperCompany: '上海港物流有限公司',
    contactName: '王晓峰',
    contactPhone: '13917220018',
    remark: '',
  },
  routeSkeleton: { containerSource: 'shipperOwned', template: 'pickupEmpty-returnLoaded' },
  nodes: [
    { id: 'n1', type: 'pickupEmpty', addressId: 'addr-1', plannedTime: '2026-04-09 08:30', contactName: '堆场调度', contactPhone: '021-55661234', sling: false, leaveTrailer: false, trailerNo: '' },
    { id: 'n2', type: 'load', addressId: 'addr-2', plannedTime: '2026-04-09 12:00', contactName: '王晓峰', contactPhone: '13917220018', sling: true, leaveTrailer: true, trailerNo: 'TR-沪A3821' },
    { id: 'n3', type: 'returnLoaded', addressId: 'addr-3', plannedTime: '2026-04-10 10:30', contactName: '场站收箱', contactPhone: '0512-53668821', sling: false, leaveTrailer: false, trailerNo: '' },
  ],
  containers: [
    { id: 'c1', containerType: 'gp', containerSize: '20尺', quantity: 5, cargoName: '家用电器', estimatedWeight: 61.5, remark: '' },
    { id: 'c2', containerType: 'hq', containerSize: '40尺', quantity: 3, cargoName: '家用电器', estimatedWeight: 88.2, remark: '' },
  ],
  fees: {
    customer: { enabled: true, rule: 'byBox', tax: 'included', distanceBasis: 'plan', unitPrice: 0, truckCount: 0, boxUnitPrices: { 'gp_20尺': 800, 'hq_40尺': 1500 } },
    carrier: { enabled: true, rule: 'byDistance', tax: 'excluded', distanceBasis: 'plan', unitPrice: 12, truckCount: 0, boxUnitPrices: {} },
  },
  planDistanceKm: 186,
}

// 场景初始数据：联运来源子计划
export const scenarioIntermodal = {
  mode: 'intermodal',
  sourceInfo: { sourceType: '联运创建', multimodalPlan: 'MM20260401088', segment: '公路段·昆山→太仓', segmentStart: '昆山制造工厂', segmentEnd: '太仓港重箱场站' },
  baseInfo: {
    orderRef: '',
    planName: '联运子计划-昆山装货至太仓还重',
    shipperCompany: '上海港物流有限公司',
    contactName: '王晓峰',
    contactPhone: '13917220018',
    remark: '由联运主计划带入',
  },
  routeSkeleton: { containerSource: 'logisticsProvided', template: 'custom' },
  nodes: [
    { id: 'n1', type: 'load', addressId: 'addr-2', plannedTime: '2026-04-09 12:00', contactName: '王晓峰', contactPhone: '13917220018', sling: false, leaveTrailer: false, trailerNo: '' },
    { id: 'n2', type: 'returnLoaded', addressId: 'addr-3', plannedTime: '2026-04-10 10:30', contactName: '场站收箱', contactPhone: '0512-53668821', sling: false, leaveTrailer: false, trailerNo: '' },
  ],
  containers: [
    { id: 'c1', containerType: 'gp', containerSize: '20尺', quantity: 4, cargoName: '家用电器', estimatedWeight: 50.0, remark: '' },
  ],
  fees: {
    customer: { enabled: false, rule: 'byBox', tax: 'included', distanceBasis: 'plan', unitPrice: 0, truckCount: 0, boxUnitPrices: {} },
    carrier: { enabled: true, rule: 'byTruck', tax: 'excluded', distanceBasis: 'plan', unitPrice: 0, truckCount: 4, boxUnitPrices: {} },
  },
  planDistanceKm: 112,
}
