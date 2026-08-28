/**
 * 托运单管理页面 Mock 数据（从主仓 waybill/manage 迁移，1:1 保留）
 * 数据内容不变，仅迁移载体
 */

// 业务类型选项
export const businessTypeOptions = ['散杂货', '集装箱']

// 运输方式选项
export const transportModeOptions = ['公路运输', '铁路运输', '水路运输', '多式联运']

// 税务要求选项
export const taxRequirementOptions = [
  '增值税专用发票，税率13%',
  '增值税专用发票，税率9%',
  '增值税专用发票，税率6%',
  '增值税普通发票',
  '不开票',
]

// 付款方式选项
export const paymentMethodOptions = ['月结', '现结', '预付', '货到付款']

// 计费条件选项（统一口径：原 billingModeOptions，对齐业务规则）
export const billingModeOptions = ['按重量', '按体积', '按数量']

// 货品选项
export const goodsOptions = ['玉米', '小麦', '钢材卷板', '水泥熟料', '煤炭', '矿粉']

// 包装选项
export const packageOptions = ['散装', '袋装', '吨包', '托盘', '裸装']

// 可见范围选项
export const visibilityScopeOptions = ['全平台可见', '指定平台可见', '指定承运商']

// 状态页签选项
export const waybillStatusTabs = [
  { label: '全部', value: '全部' },
  { label: '草稿', value: '草稿' },
  { label: '待审核', value: '待审核' },
  { label: '待确定', value: '待确定' },
  { label: '竞价中', value: '竞价中' },
  { label: '待执行', value: '待执行' },
  { label: '执行中', value: '执行中' },
  { label: '已完成', value: '已完成' },
  { label: '已取消/终止', value: '已取消/终止' },
]

// 示例托运单列表（初始 mock）
export const sampleWaybillList = [
  {
    id: 'TY20260711004',
    businessType: '集装箱',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '集装箱运输',
    modeTag: '竞价',
    transportMode: '水路运输',
    shipperCompany: '-',
    contactName: '张经理',
    contactPhone: '138****5678',
    status: '竞价中',
    countdownType: '距离竞价结束',
    countdownDays: '36',
    countdownHours: '03',
    countdownMinutes: '37',
    countdownSeconds: '06',
    cargoName: '钢材',
    cargoQtyStr: '100 吨',
    cargoIndex: 1,
    expectedPrice: '400~1200元/箱',
    billingTag: '箱',
    requirementText: '-',
    route: '福建省-福州市 -> 湖北省-武汉市',
    loadCity: '福建省-福州市',
    loadPoint: '马尾港',
    loadTime: '2026-09-23 00:00:00',
    unloadCity: '湖北省-武汉市',
    unloadPoint: '阳逻港',
    unloadTime: '2026-10-01 00:00:00',
    nodeCount: 2,
  },
  {
    id: 'TY20260711003',
    businessType: '集装箱',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '集装箱运输',
    modeTag: '竞价',
    transportMode: '铁路运输',
    shipperCompany: '-',
    contactName: '李主管',
    contactPhone: '139****1234',
    status: '竞价中',
    countdownType: '距离竞价结束',
    countdownDays: '14',
    countdownHours: '03',
    countdownMinutes: '37',
    countdownSeconds: '06',
    cargoName: '硫酸铵',
    cargoQtyStr: '73.5 吨',
    cargoIndex: 1,
    expectedPrice: '300~800元/箱',
    billingTag: '箱',
    requirementText: '-',
    route: '山西省-大同市 -> 山东省-临沂市',
    loadCity: '山西省-大同市',
    loadPoint: '大同市云冈区驳运集装箱中心',
    loadTime: '2026-09-14 00:00:00',
    unloadCity: '山东省-临沂市',
    unloadPoint: '临沂港集装箱场站',
    unloadTime: '2026-10-01 00:00:00',
    nodeCount: 2,
  },
  {
    id: 'TY20260711002',
    businessType: '散杂货',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '散杂货运输',
    modeTag: '竞价',
    transportMode: '公路运输',
    shipperCompany: '-',
    contactName: '王工',
    contactPhone: '137****9876',
    status: '竞价中',
    countdownType: '距离竞价结束',
    countdownDays: '14',
    countdownHours: '03',
    countdownMinutes: '38',
    countdownSeconds: '05',
    cargoName: '焦煤',
    cargoQtyStr: '624 吨',
    cargoIndex: 1,
    expectedPrice: '80~110元/吨',
    billingTag: '重量',
    requirementText: '-',
    route: '河南省-焦作市 -> 山东省-临沂市',
    loadCity: '河南省-焦作市',
    loadPoint: '焦煤能源机电设备管理中心九里山仓库',
    loadTime: '2026-09-01 10:39:06',
    unloadCity: '山东省-临沂市',
    unloadPoint: '建材化工商贸园 12 号仓',
    unloadTime: '2026-09-30 14:00:00',
    nodeCount: 2,
  },
  {
    id: 'TY20260711001',
    businessType: '散杂货',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '散杂货运输',
    modeTag: '竞价',
    transportMode: '水路运输',
    shipperCompany: '-',
    contactName: '陈经理',
    contactPhone: '136****5566',
    status: '竞价中',
    countdownType: '距离竞价结束',
    countdownDays: '36',
    countdownHours: '03',
    countdownMinutes: '37',
    countdownSeconds: '06',
    cargoName: '动力煤',
    cargoQtyStr: '1000 吨',
    cargoIndex: 1,
    expectedPrice: '30~80元/吨',
    billingTag: '重量',
    requirementText: '-',
    route: '福建省-福州市 -> 福建省-泉州市',
    loadCity: '福建省-福州市',
    loadPoint: '连江县',
    loadTime: '2026-09-25 00:00:00',
    unloadCity: '福建省-泉州市',
    unloadPoint: '晋江市',
    unloadTime: '2026-10-01 00:00:00',
    nodeCount: 3,
  },
  {
    id: 'TY20260702018',
    businessType: '散杂货',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '散杂货运输',
    modeTag: '抢单',
    transportMode: '公路运输',
    shipperCompany: '-',
    contactName: '刘主管',
    contactPhone: '135****7890',
    status: '竞价中',
    countdownType: '距离抢单结束',
    countdownDays: '36',
    countdownHours: '03',
    countdownMinutes: '37',
    countdownSeconds: '06',
    cargoName: '碳砂',
    cargoQtyStr: '10000 件',
    cargoIndex: 1,
    expectedPrice: '34~34元/件',
    billingTag: '数量',
    requirementText: '公开拆分货运数量',
    route: '福建省-福州市 -> 山西省-大同市',
    loadCity: '福建省-福州市',
    loadPoint: '世欧王庄A区',
    loadTime: '2026-09-25 00:00:00',
    unloadCity: '山西省-大同市',
    unloadPoint: '同煤大唐塔山煤矿公司',
    unloadTime: '2026-10-01 00:00:00',
    nodeCount: 2,
  },
]
