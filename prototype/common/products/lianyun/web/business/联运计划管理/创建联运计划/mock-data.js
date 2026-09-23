/**
 * 新增联运计划 Mock 数据
 * 依据 Pixso 设计稿（92:1432 新增联运计划）字段重构
 * 注：设计稿中的「智能排线」推荐区按需求不复刻
 */

// 配载方式
export const stowageModes = ['按数量', '按重量', '按体积']

// 运输货种
export const cargoTypes = ['煤炭', '铁矿石', '锂矿石', '化肥', '危险品', '其他']
// 可提供箱型
export const boxTypes = ['20GP', '20HQ', '40GP']
// 通关服务
export const customsServices = ['进口报关', '出口报关']
// 增值服务
export const valueServices = ['定日达', '定时达', '保价服务', '免费到货通知', '代收贷款服务']
// 付款方式
export const payWays = ['现付', '到付', '预付', '月结']

// 货品表格行
export const cargoRows = [
  { id: 'c1', name: '玉米', volume: 100, weight: 50, quantity: 1000, unitPrice: 1000, totalPrice: 10000, package: '-', remark: '备注备注信息备注信息' },
  { id: 'c2', name: '小麦', volume: 100, weight: 50, quantity: 1000, unitPrice: 1000, totalPrice: 10000, package: '-', remark: '-' },
  // 设计稿第三行为编辑态
  { id: 'c3', name: '玉米', volume: 0, weight: 0, quantity: 0, unitPrice: 0, totalPrice: 0, package: '', remark: '', editing: true },
]

// 报价方案（运输通道 / 通道路线）
export const quoteChannels = ['运输通道', '通道路线']

// 右侧运输路线查询 - 路线卡片
export const routeCards = [
  { id: 'r1', from: '福建 福州', to: '福建 厦门', price: '300.00', unit: '/吨', tags: ['汽运', '预付', '集装箱', '运输时长约 2 天'], departLabel: '发车时段', depart: '每日10:00、15:00各一趟', cargoLabel: '运输品类', cargo: '煤炭、沙石' },
  { id: 'r2', from: '福建 福州', to: '福建 厦门', price: '300.00', unit: '/吨', tags: ['汽运', '预付', '集装箱', '运输时长约 2 天'], departLabel: '发车时段', depart: '每日10:00、15:00各一趟', cargoLabel: '运输品类', cargo: '煤炭、沙石' },
  { id: 'r3', from: '福建 福州', to: '福建 厦门', price: '300.00', unit: '/吨', tags: ['汽运', '预付', '集装箱', '运输时长约 2 天'], departLabel: '发车时段', depart: '每日10:00、15:00各一趟', cargoLabel: '运输品类', cargo: '煤炭、沙石' },
  { id: 'r4', from: '福建 福州', to: '福建 厦门', price: '300.00', unit: '/吨', tags: ['汽运', '预付', '集装箱', '运输时长约 2 天'], departLabel: '发车时段', depart: '每日10:00、15:00各一趟', cargoLabel: '运输品类', cargo: '煤炭、沙石' },
  { id: 'r5', from: '福建 福州', to: '福建 厦门', price: '300.00', unit: '/吨', tags: ['汽运', '预付', '集装箱', '运输时长约 2 天'], departLabel: '发车时段', depart: '每日10:00、15:00各一趟', cargoLabel: '运输品类', cargo: '煤炭、沙石' },
]

// 路线组合页签
export const routeCombos = ['铁水', '公铁', '公水', '铁水公', '铁路']

// 路程节点（装/卸）
function routeNode(type, address, cargoItems) {
  return { type, address, isSite: true, workTime: '', contact: '', phone: '', cargoItems }
}
const grainCargo = [
  { text: '粮食丨玉米 | 30吨丨30m³' },
  { text: '粮食丨玉米 | 30吨丨30m³' },
]
const containerCargo = [
  { text: '普通集装箱丨25GP*30' },
  { text: '普通集装箱丨25GP*30' },
]

// 路程段
export const routeSegments = [
  {
    id: 'seg1', name: '路程1', mode: '汽运', cargoType: '散杂货', planName: '福州到上海-9月12日汽运计划',
    nodes: [
      routeNode('装', '富邦总部大楼', grainCargo),
      routeNode('卸', '富邦总部大楼', grainCargo),
    ],
    operations: [
      { id: 'op1', name: '散改集作业', nodes: [routeNode('', '富邦总部大楼', containerCargo), routeNode('', '富邦总部大楼', containerCargo)] },
    ],
  },
  {
    id: 'seg2', name: '路程2', mode: '水运', cargoType: '集装箱', planName: '', createPlan: true, createPlan: true,
    nodes: [
      routeNode('装', '富邦总部大楼', [{ text: '普通集装 | 20GP*30' }, { text: '普通集装 | 20GP*30' }]),
      routeNode('卸', '富邦总部大楼', [{ text: '普通集装 | 20GP*30' }, { text: '普通集装 | 25GP*30' }]),
    ],
    operations: [
      { id: 'op2', name: '集改散作业', nodes: [routeNode('', '富邦总部大楼', grainCargo), routeNode('', '富邦总部大楼', grainCargo)] },
    ],
  },
]

// 费用信息
export const feeConfig = {
  shipperFeeEnabled: true,
  shipperFeeTip: '无上游货主（或为本企业），无需设置货主结算费用',
  calcTypes: ['模板计费', '单位计费'],
  includeTax: ['是', '否'],
  payTypes: ['预付', '到付', '月结'],
  prepayTypes: ['固定金额', '按比例'],
  payMethods: ['银行转账', '线上支付', '承兑汇票'],
  calcRules: ['按里程', '按重量', '按体积'],
  calcUnits: ['吨', '方', '车'],
  billingBasis: ['装卸货最大重量', '装货重量', '卸货重量'],
  lossRules: ['按里程', '按重量差', '按比例'],
  formulaText: '运费计算方式（ 装货重量50吨 *20+ 运输公里10km*10 ）',
  formulaAmount: '0.00',
}

// 其他费用行
export const extraFeeRows = [
  { id: 'e1', name: '拖箱费', amount: '', attachment: true },
  { id: 'e2', name: '装卸费', amount: '', attachment: false },
  { id: 'e3', name: '', amount: '', attachment: false },
]

// 附件
export const attachments = [
  { id: 'a1', name: '文件名称文件名称文件名称文件名称.PDF', progress: null },
  { id: 'a2', name: '文件名称文件.PDF', progress: 40 },
]

export default {
  stowageModes, cargoTypes, boxTypes, customsServices, valueServices, payWays,
  cargoRows, quoteChannels, routeCards, routeCombos, routeSegments,
  feeConfig, extraFeeRows, attachments,
}
