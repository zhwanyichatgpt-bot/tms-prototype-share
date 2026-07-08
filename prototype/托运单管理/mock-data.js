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

// 示例托运单列表（初始 mock）
export const sampleWaybillList = [
  {
    id: 'TY20260612001',
    businessType: '散杂货',
    publishMode: '公开托运单/竞价',
    transportMode: '多式联运',
    shipperCompany: '安徽宿迁农业科技有限公司',
    contactName: '张经理',
    contactPhone: '138****5678',
    status: '竞价中',
    publishTime: '2026-06-12 10:30',
    cargoCount: 2,
    totalWeight: 50,
    route: '安徽宿迁 -> 浙江金华',
  },
]
