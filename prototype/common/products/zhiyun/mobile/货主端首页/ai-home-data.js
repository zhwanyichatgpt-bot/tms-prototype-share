export const aiBrief = {
  updatedAt: '6月16日 10:30',
  summary: '你有3项运输计划正在执行，其中1项需要关注，1项需要你决定。',
}

export const planForecast = {
  route: '福州 → 天津',
  loadAddress: '福州市·江上图首府叁号',
  unloadAddress: '天津市·东丽物流园',
  goods: '煤炭',
  quantity: '1,100吨',
  accepted: '1,000吨',
  remaining: '100吨',
  deadline: '6月18日18:00',
  conclusion: '当前剩余货量需要扩大平台发布范围，已接单运输保持不变。',
  currentPlatforms: ['金石智运'],
  suggestedPlatforms: ['象奔奔', '至简智运'],
  unitPrice: '单价不变',
  vehicleGap: 4,
  vehicleCapacity: 25,
  matchedVehicleCount: 7,
  inviteVehicleCount: 5,
  expectedAcceptCount: 4,
  expectedCompleteAt: '17:10',
  assistantConclusion: '建议先不加价',
  vehicleEvidence: '推荐依据来自装货点附近匹配车辆、常跑路线、常运货品和司机当前可接单状态。',
  scenarioNote: '所有平台运力和费用均为模拟情景，不代表平台真实能力。',
  /* 建议依据：解释剩余货量为什么接不完，是调整页“为什么”的证据 */
  adjustReason: {
    hangDays: 2,
    originStats: { platform: '金石智运', idleCount: 3, avgAccept: '45分钟' },
    summary: '按当前节奏，剩余100吨预计难以及时接完。',
  },
  /* 可选新增平台：参考价来自本线路近7日同条件成交；预计接单按近7日统计估算 */
  evidenceUpdatedAt: '6月18日 10:00',
}

/* 小简缺车调度二级页：全部为原型 Mock，用于验证对话式分析、策略切换与执行进展 */
export const dispatchSuggestion = {
  updatedAt: '15:20',
  checkedCount: 48,
  availableCount: 7,
  screening: [
    { count: 48, label: '共检查', tone: 'base' },
    { count: 23, label: '无法按时到场', tone: 'muted' },
    { count: 12, label: '车型不符', tone: 'muted' },
    { count: 6, label: '当前运价接受概率低', tone: 'muted' },
    { count: 7, label: '最终可用', tone: 'primary' },
  ],
  candidates: [
    { id: 'yongsheng-1', driver: '郑师傅', plate: '闽A·6K32', team: '永盛车队', capacity: 25, tag: '常用运力', tagTone: 'blue', partner: true, meta: '近30天承运5次｜平均6分钟响应｜距装货点26km' },
    { id: 'yongsheng-2', driver: '王师傅', plate: '闽A·2P85', team: '永盛车队', capacity: 25, tag: '常用运力', tagTone: 'blue', partner: true, meta: '近30天承运3次｜当前空车18km｜预计16:10到场' },
    { id: 'chen', driver: '陈师傅', plate: '闽A·3X26', team: '长期合作司机', capacity: 25, tag: '高匹配', tagTone: 'green', partner: true, meta: '当前空车12km｜本线路6次｜预计16:05到场' },
    { id: 'lin', driver: '林师傅', plate: '闽A·8P17', team: '历史合作司机', capacity: 25, tag: '合作过', tagTone: 'blue', partner: true, meta: '15:45可调｜同类货物3次｜接受当前运价' },
    { id: 'zhou', driver: '周师傅', plate: '闽A·5N20', team: '至简平台候选', capacity: 25, tag: '拒单备选', tagTone: 'gray', partner: false, meta: '附近9km｜车型匹配｜预计10分钟响应' },
    { id: 'wu', driver: '吴师傅', plate: '闽A·7M16', team: '象奔奔', capacity: 25, tag: '平台运力', tagTone: 'orange', partner: false, meta: '附近14km｜本线路2次｜预计8分钟响应' },
    { id: 'fang', driver: '方师傅', plate: '闽A·1Q69', team: '至简智运', capacity: 25, tag: '平台运力', tagTone: 'orange', partner: false, meta: '当前空车20km｜车型匹配｜预计16:20到场' },
    { id: 'jiang', driver: '江师傅', plate: '闽A·9H52', team: '象奔奔', capacity: 25, tag: '平台运力', tagTone: 'orange', partner: false, meta: '15:50可调｜同类货物4次｜预计12分钟响应' },
  ],
  strategies: [
    { id: 'balanced', name: '推荐组合', action: '4辆合作车＋1辆拒单备选', eta: '17:10', cost: '增加0～800元', risk: '兼顾完成时间与成本', candidateIds: ['yongsheng-1', 'yongsheng-2', 'chen', 'lin', 'zhou'] },
    { id: 'fastest', name: '最快补齐', action: '同时邀请8辆＋增加2个平台', eta: '16:40', cost: '增加约1,200元', risk: '完成更快，但邀请范围更大', candidateIds: ['yongsheng-1', 'yongsheng-2', 'chen', 'lin', 'zhou', 'wu', 'fang', 'jiang'] },
    { id: 'lowestCost', name: '成本优先', action: '只邀请4辆常用合作运力', eta: '17:40', cost: '不增加费用', risk: '可能接近18:00才补齐', candidateIds: ['yongsheng-1', 'yongsheng-2', 'chen', 'lin'] },
  ],
}

export const riskNotice = {
  route: '福州 → 厦门',
  goods: '煤炭',
  trigger: '超时停留触发提醒',
  confirmation: '疑似',
  progress: '平台运营正在核实，当前仅记录了联系司机的处理进展。',
  impact: '尚未确认货品异常，暂不需要货主决定。',
}

/* 安全进展二级页：与首页风险卡同一事件，日期基准同为 6月18日 */
export const riskEvent = {
  id: 'risk-1',
  route: '福州 → 厦门',
  goods: '煤炭',
  weight: '30吨',
  driver: '陈师傅',
  plate: '闽A·82**',
  confirmation: '疑似',
  needActionText: '平台正在处理，暂不需要你操作。',
  contactPhone: '平台运营值班入口',
  analysisUpdatedAt: '10:48',
  analysis: {
    conclusion: '车辆已恢复行驶，现有材料还不能确认货品安全。',
    points: [
      { title: '轨迹 × 司机反馈', detail: '定位显示车辆已继续行驶；司机称因维修停留，维修原因仍待平台核实。' },
      { title: '现场照片', detail: '现有照片仅展示车辆及篷布外观，无法据此判断货物是否异常。' },
    ],
    nextStep: '核实维修情况，补充可核验货品状态的现场材料，再由运营人员确认风险。',
    responsibleNote: '核查由平台继续跟进，无需你重复发起',
    basis: [
      { label: '关联事件', text: '10:30 超时停留提醒；10:38 司机反馈车辆维修；10:46 平台收到现场照片。' },
      { label: '已验证', text: '定位轨迹显示车辆已在提醒位置后继续行驶。' },
      { label: '未确认', text: '维修原因属司机单方反馈；货品状态暂无可用材料证明。' },
    ],
  },
  location: {
    available: true,
    updatedAt: '10:48',
    stale: false,
    trackNote: '模拟轨迹：提醒位置 → 车辆最新位置，仅展示事件相关片段，不代表实时导航数据。',
  },
  photos: ['/zhiyun-mobile-assets/truck-li-zeyuan.png', '/zhiyun-mobile-assets/truck-li-zeyuan.png'],
  timeline: [
    { time: '10:46', title: '正在核验现场材料', source: '平台运营', detail: '已收到现场照片，正在核查。', photos: true },
    { time: '10:38', title: '司机反馈停留原因', source: '司机反馈', detail: '因车辆维修停留，现已恢复行驶。' },
    { time: '10:34', title: '平台已联系司机', source: '平台运营', detail: '核实停留原因，并要求补充现场照片。' },
    { time: '10:30', title: '触发超时停留提醒', source: '系统记录', detail: '在提醒位置停留超过设定时长。' },
  ],
}

const pendingPayments = [
  { id: 'p1', platform: '金石智运', route: '福州 → 天津', goods: '煤炭', period: '6月1日—6月7日运输结算', waybillCount: 6, payee: '福建某运输公司', amount: 30000 },
  { id: 'p2', platform: '象奔奔', route: '福州 → 厦门', goods: '煤炭', period: '6月8日—6月10日运输结算', waybillCount: 3, payee: '厦门某运输公司', amount: 12600 },
  { id: 'p3', platform: '至简智运', route: '泉州 → 福州', goods: '矿石', period: '6月11日—6月14日运输结算', waybillCount: 4, payee: '泉州某运输公司', amount: 18000 },
]

/* 首页结算提醒与二级页共用同一批数据 */
export const settlementPage = {
  asOfDate: '6月18日',
  paymentSummary: {
    count: pendingPayments.length,
    total: pendingPayments.reduce((sum, item) => sum + item.amount, 0),
  },
  settlementCount: 3,
  /* 待结算：金额未形成的条目不生成数值 */
  settlements: [
    { id: 's1', route: '福州 → 厦门', goods: '煤炭', platform: '金石智运', waybillCount: 2, quantity: '66吨', amount: 19800 },
    { id: 's2', route: '福州 → 天津', goods: '煤炭', platform: '象奔奔', waybillCount: 6, quantity: '186吨', amount: 55800 },
    { id: 's3', route: '泉州 → 福州', goods: '矿石', platform: '至简智运', waybillCount: 4, quantity: '124吨', amount: null },
  ],
  /* 当前只维护待付款记录，不设置付款截止时间或到期分组 */
  payments: pendingPayments,
}

export const settlementItems = [
  { id: 'settle-summary', type: 'settlement', title: `${settlementPage.settlementCount} 项运输待结算`, meta: '福州 → 厦门、福州 → 天津、泉州 → 福州', action: '去结算' },
  { id: 'pay-summary', type: 'payment', title: `${settlementPage.paymentSummary.count} 笔待付款记录`, meta: `合计 ¥${settlementPage.paymentSummary.total.toLocaleString()}`, date: '待办理', action: '查看并付款' },
]

/* 行情页与首页行情卡共用同一批条件；价格为模拟，不构成报价 */
export const marketInsight = {
  route: '福州 → 天津',
  goods: '煤炭',
  vehicle: '13米高栏',
  unit: '元/吨',
  updatedAt: '6月18日 09:30',
  compareText: '车型、装卸要求及费用口径已对齐',
  period: '近7日参考',
  lastDeal: { price: 310, date: '6月5日', status: '已成交', quantity: 500 },
  reference: { min: 290, max: 300, period: '6月12日—18日', label: '近7天参考' },
  sample: { count: 36, sources: ['金石智运', '象奔奔', '至简智运'] },
  defaultQuantity: 500,
  defaultPrice: 300,
  /* 近30天成交价走势：末点为当前；提醒价由货主自己设置，不是系统预测 */
  trend: {
    points: [
      { date: '5月19日', price: 318 },
      { date: '5月26日', price: 315 },
      { date: '6月5日', price: 310, mine: true },
      { date: '6月12日', price: 302 },
      { date: '6月18日', price: 295 },
    ],
    suggestAlert: 280,
    position: '近30天低位',
  },
  /* 同一批平台按该线路成交价不同，价低者默认勾选 */
  platforms: [
    { id: 'zhiyun', name: '象奔奔', price: 290, fleet: '近30天该线路常跑 8 台', recommended: true },
    { id: 'jinshi', name: '金石智运', price: 295, fleet: '近30天该线路常跑 5 台', recommended: true },
    { id: 'haoyun', name: '超好运', price: 300, fleet: '近30天该线路常跑 3 台', recommended: false },
  ],
  analysis: {
    conclusion: '这条线在跌，已到近30天低位',
    detail: '近7天同条件成交参考290–300元/吨，你上次310元/吨发的，偏高10–20元/吨。',
    note: '参考价不保证成交；当前缺少该价格下的接单效率数据，无法判断多久能接单。',
  },
  compareBasis: [
    { label: '比较条件', text: '同货品（煤炭）、同车型（13米高栏）、同计价单位（元/吨），装卸要求与费用口径已对齐。' },
    { label: '样本说明', text: '36笔同条件历史成交记录，统计周期6月12日—18日，来源为金石智运、象奔奔、至简智运。' },
    { label: '使用边界', text: '参考价不保证成交，也不代表按此价格一定可以接单；不自动推荐最低价。' },
    { label: '数据更新', text: '行情数据更新于6月18日 09:30；走势为近30天同条件成交参考。' },
  ],
  pricingNote: '300元/吨可作为本次定价参考；当前缺少该价格下的接单效率数据，无法判断多久能接单。',
  calcNote: '仅按货量×单价测算，实际费用以运输约定及结算为准。',
  platformNote: '平台价格为该线路同条件下的预计总额，按当前货量测算。',
  alertNote: '设置后跌到该价格会提示你，不构成价格预测。',
}

/* 首页行情卡与行情页共用同一测算：历史单价情景 − 当前测算情景 */
export function marketScenario(quantity, price) {
  const historyAmount = quantity * marketInsight.lastDeal.price
  const currentAmount = quantity * price
  const diff = historyAmount - currentAmount
  return {
    historyAmount,
    currentAmount,
    diff,
    diffLabel: diff > 0 ? '测算少支出' : diff < 0 ? '测算多支出' : '无差额',
  }
}
