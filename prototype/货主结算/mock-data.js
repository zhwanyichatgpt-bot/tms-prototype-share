/**
 * 货主结算 Mock 数据（迁移自主仓 shipper-settlement）
 * 含：基础数据 + 可选计划池（新增页）+ 详情快照（详情页）
 */

// 结算对象
export const settlementObjects = [
  { id: 'OBJ001', name: '货主结算' },
  { id: 'OBJ002', name: '承运商结算' },
]

// 结算方
export const settlementParties = [
  { id: 'SP001', name: '广林木业有限公司' },
  { id: 'SP002', name: '华东贸易有限公司' },
  { id: 'SP003', name: '西南物流有限公司' },
]

// 计费条件
export const billingConditions = ['按重量', '按体积', '按数量', '按集装箱']

// 计费依据
export const billingBases = ['按装货口径', '按卸货口径']

// ============ 可选计划池（按结算方筛） ============
export const planPool = [
  {
    id: 'LY202606001',
    name: '上海-成都散货联运',
    settlementType: 'whole',
    transportMode: '多式联运',
    shipperCompany: '广林木业有限公司',
    partyId: 'SP001',
    route: '上海 → 成都',
    cargoSummary: '机械设备 30吨 / 木材 20吨',
    billingCondition: '按重量',
    billingBasis: '按装货口径',
    billingUnit: '元/吨',
    unitPrice: 100,
    selectable: true,
    unselectableReason: '',
    cargoItems: [
      { id: 'c1', name: '机械设备', transportTotal: 30, settledQty: 0, unsettledQty: 30 },
      { id: 'c2', name: '木材', transportTotal: 20, settledQty: 0, unsettledQty: 20 },
    ],
  },
  {
    id: 'LY202606002',
    name: '公水公异构分段联运',
    settlementType: 'segment',
    transportMode: '多式联运',
    shipperCompany: '广林木业有限公司',
    partyId: 'SP001',
    route: '苏州 → 广州',
    cargoSummary: '电子产品 30吨',
    selectable: true,
    unselectableReason: '',
    subPlans: [
      {
        seq: 1, transportMode: '公路', from: '苏州', to: '上海港',
        billingCondition: '按重量', billingBasis: '按装货口径', unitPrice: 80, priceUnit: '元/吨',
        confirmTotal: 30, settledQty: 0, unsettledQty: 30, currentSettleQty: 30,
        lineItems: [{ id: 'l1-1', name: '电子产品', confirmTotal: 30, settledQty: 0, unsettledQty: 30, currentSettleQty: 30, unitPrice: null, subsidyAmount: 0, deductionAmount: 0, subsidyItems: [], deductionItems: [] }],
      },
      {
        seq: 2, transportMode: '水路', from: '上海港', to: '广州港',
        billingCondition: '按集装箱', billingBasis: '', unitPrice: 4500, priceUnit: '元/箱',
        confirmTotal: 15, settledQty: 0, unsettledQty: 15, currentSettleQty: 15,
        lineItems: [{ id: 'l2-1', name: '20GP', confirmTotal: 10, settledQty: 0, unsettledQty: 10, currentSettleQty: 10, unitPrice: 4500, subsidyAmount: 0, deductionAmount: 0, subsidyItems: [], deductionItems: [] }, { id: 'l2-2', name: '40HQ', confirmTotal: 5, settledQty: 0, unsettledQty: 5, currentSettleQty: 5, unitPrice: 4800, subsidyAmount: 0, deductionAmount: 0, subsidyItems: [], deductionItems: [] }],
      },
      {
        seq: 3, transportMode: '公路', from: '广州港', to: '广州仓库',
        billingCondition: '按重量', billingBasis: '按卸货口径', unitPrice: 60, priceUnit: '元/吨',
        confirmTotal: 29.5, settledQty: 0, unsettledQty: 29.5, currentSettleQty: 29.5,
        lineItems: [{ id: 'l3-1', name: '电子产品', confirmTotal: 29.5, settledQty: 0, unsettledQty: 29.5, currentSettleQty: 29.5, unitPrice: null, subsidyAmount: 0, deductionAmount: 0, subsidyItems: [], deductionItems: [] }],
      },
    ],
  },
  {
    id: 'LY202606003',
    name: '北京-上海多式联运',
    settlementType: 'whole',
    transportMode: '多式联运',
    shipperCompany: '华东贸易有限公司',
    partyId: 'SP002',
    route: '北京 → 上海',
    cargoSummary: '钢材 100吨',
    billingCondition: '按重量', billingBasis: '按卸货口径', billingUnit: '元/吨',
    unitPrice: 90,
    selectable: true, unselectableReason: '',
    cargoItems: [
      { id: 'c1', name: '钢材', transportTotal: 100, settledQty: 30, unsettledQty: 70 },
    ],
  },
]

export function getPlansByParty(partyId) {
  if (!partyId) return planPool
  return planPool.filter(p => p.partyId === partyId)
}

// ============ 详情页快照（已生成的结算单） ============
export const detailSnapshot = {
  settlementNo: 'JS20260701001',
  status: '待打款',
  settlementObject: '货主结算',
  settlementParty: '广林木业有限公司',
  settlementDate: '2026-07-01',
  creator: '财务-张三',
  createTime: '2026-07-01 10:30:00',
  remark: '本月结算',
  feeSummary: { baseFee: 78170, subsidy: 2000, deduction: 1000, total: 79170 },
  plans: [
    {
      id: 'LY202606001', name: '上海-成都散货联运', type: 'whole',
      cargoSummary: '机械设备 30吨 / 木材 20吨', billingCondition: '按重量', billingBasis: '按装货口径',
      baseFee: 5000, subsidy: 0, deduction: 0, checkFee: 5000,
      pricingMethod: 'Σ(各货品本次结算量 × 计划级运输单价)', billingUnit: '元/吨',
      items: [
        { id: 'i1', name: '机械设备', transportTotal: 30, settledQty: 0, unsettledQty: 30, settleQty: 30, unitPrice: 100, baseFee: 3000, subsidy: 0, deduction: 0, checkFee: 3000, subsidyItems: [], deductionItems: [] },
        { id: 'i2', name: '木材', transportTotal: 20, settledQty: 0, unsettledQty: 20, settleQty: 20, unitPrice: 100, baseFee: 2000, subsidy: 0, deduction: 0, checkFee: 2000, subsidyItems: [], deductionItems: [] },
      ],
      subsidyRows: [], deductionRows: [],
    },
    {
      id: 'LY202606002', name: '公水公异构分段联运', type: 'segment',
      cargoSummary: '电子产品 30吨',
      baseFee: 73170, subsidy: 2000, deduction: 1000, checkFee: 74170,
      pricingMethod: '散货按路段单价，集装箱按箱型单价汇总',
      subPlans: [
        {
          seq: 1, transportMode: '公路', from: '苏州', to: '上海港',
          billingCondition: '按重量', billingBasis: '按装货口径', unitPrice: 80, priceUnit: '元/吨',
          lineItems: [{ name: '电子产品', confirmTotal: 30, settledQty: 0, unsettledQty: 30, currentSettleQty: 30, unitPrice: null, lineFee: 2400, subsidy: 1000, deduction: 500, subsidyItems: [{ name: '装车补贴', amount: 1000 }], deductionItems: [{ name: '晚到扣款', amount: 500 }] }],
          subtotal: { lineFee: 2400, subsidy: 1000, deduction: 500, checkFee: 2900 },
        },
        {
          seq: 2, transportMode: '水路', from: '上海港', to: '广州港',
          billingCondition: '按集装箱', billingBasis: '', unitPrice: 4500, priceUnit: '元/箱',
          lineItems: [
            { name: '20GP', confirmTotal: 10, settledQty: 0, unsettledQty: 10, currentSettleQty: 10, unitPrice: 4500, lineFee: 45000, subsidy: 1000, deduction: 500, subsidyItems: [{ name: '港杂补贴', amount: 1000 }], deductionItems: [{ name: '堆存扣款', amount: 500 }] },
            { name: '40HQ', confirmTotal: 5, settledQty: 0, unsettledQty: 5, currentSettleQty: 5, unitPrice: 4800, lineFee: 24000, subsidy: 0, deduction: 0, subsidyItems: [], deductionItems: [] },
          ],
          subtotal: { lineFee: 69000, subsidy: 1000, deduction: 500, checkFee: 69500 },
        },
        {
          seq: 3, transportMode: '公路', from: '广州港', to: '广州仓库',
          billingCondition: '按重量', billingBasis: '按卸货口径', unitPrice: 60, priceUnit: '元/吨',
          lineItems: [{ name: '电子产品', confirmTotal: 29.5, settledQty: 0, unsettledQty: 29.5, currentSettleQty: 29.5, unitPrice: null, lineFee: 1770, subsidy: 0, deduction: 0, subsidyItems: [], deductionItems: [] }],
          subtotal: { lineFee: 1770, subsidy: 0, deduction: 0, checkFee: 1770 },
        },
      ],
      subsidyRows: [
        { segment: '公路段1', name: '电子产品', item: '装车补贴', amount: 1000 },
        { segment: '水路段2', name: '20GP', item: '港杂补贴', amount: 1000 },
      ],
      deductionRows: [
        { segment: '公路段1', name: '电子产品', item: '晚到扣款', amount: 500 },
        { segment: '水路段2', name: '20GP', item: '堆存扣款', amount: 500 },
      ],
    },
  ],
}
