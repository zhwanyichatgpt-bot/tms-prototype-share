export const mapPoints = [
  { id: 'map-1', x: 22, y: 35, count: 8 },
  { id: 'map-2', x: 35, y: 47, count: 8 },
  { id: 'map-3', x: 46, y: 39, count: 8 },
  { id: 'map-4', x: 55, y: 53, count: 8 },
  { id: 'map-5', x: 66, y: 43, count: 8 },
  { id: 'map-6', x: 76, y: 57, count: 8 },
  { id: 'map-7', x: 45, y: 65, count: 8 },
  { id: 'map-8', x: 58, y: 70, count: 8 },
  { id: 'map-9', x: 84, y: 68, count: 8 },
]

export const bottomTabs = [
  { key: 'home', label: '首页', icon: '/zhiyun-mobile-assets/icons/tab-home.svg' },
  { key: 'run', label: '跑货', icon: '/zhiyun-mobile-assets/icons/tab-news.svg' },
  { key: 'assistant', label: '小简AI', icon: '/zhiyun-mobile-assets/icons/tab-cat-ai.png' },
  { key: 'order', label: '运单', icon: '/zhiyun-mobile-assets/icons/tab-app.svg' },
  { key: 'mine', label: '我的', icon: '/zhiyun-mobile-assets/icons/tab-mine.svg' },
]

// 司机端跑货、运单页 Mock 数据。字段与状态均使用公路整车运输语义。
// driverName 是承运司机本人，跑货页卡片底栏与设计稿的「船东 测试船主」位对应。
export const roadWaybills = [
  {
    id: 'road-001', waybillNo: 'ZY2026091700186', status: 'transporting', statusText: '运输中',
    cargoName: '矿粉', cargoWeight: '32吨', origin: '福州马尾 · 罗星工业园', destination: '厦门同安 · 城南物流园',
    freightAmount: '4,680', timeLabel: '预计送达', timeValue: '今天 18:30', plateNo: '闽A·8K62Q',
    driverName: '张建国', canVoucher: true,
  },
  {
    id: 'road-002', waybillNo: 'ZY2026091700172', status: 'loading', statusText: '装货中',
    cargoName: '建筑钢材', cargoWeight: '28吨', origin: '福州长乐 · 松下港区', destination: '泉州晋江 · 安海建材城',
    freightAmount: '3,960', timeLabel: '计划发车', timeValue: '今天 11:20', plateNo: '闽A·3M51P',
    driverName: '张建国', canVoucher: true,
  },
  {
    id: 'road-003', waybillNo: 'ZY2026091600935', status: 'delivered', statusText: '已送达',
    cargoName: '玻璃', cargoWeight: '29吨', origin: '福州长乐 · 闽江口工业区', destination: '泉州石狮 · 祥芝物流园',
    freightAmount: '3,580', timeLabel: '实际送达', timeValue: '昨天 16:48', plateNo: '闽A·6V27N',
    driverName: '张建国', canVoucher: true,
  },
  {
    id: 'road-004', waybillNo: 'ZY2026091600811', status: 'delivered', statusText: '已送达',
    cargoName: '粮食', cargoWeight: '30吨', origin: '福州仓山 · 盖山粮库', destination: '莆田涵江 · 三江口仓储区',
    freightAmount: '2,760', timeLabel: '实际送达', timeValue: '昨天 10:12', plateNo: '闽A·1J95R',
    driverName: '张建国', canVoucher: false,
  },
  {
    id: 'road-005', waybillNo: 'ZY2026091500649', status: 'cancelled', statusText: '已取消',
    cargoName: '木材', cargoWeight: '26吨', origin: '福州闽侯 · 青口物流园', destination: '南平延平 · 工业路货场',
    freightAmount: '3,240', timeLabel: '取消时间', timeValue: '09月15日 14:05', plateNo: '闽A·9C83L',
    driverName: '张建国', canVoucher: false,
  },
]

export const runningWaybills = roadWaybills.filter((item) => ['transporting', 'loading'].includes(item.status))

// 司机端“我的”页 Mock 数据：账户仅展示已入账资金、提现与流水，不承载运单结算动作。
export const driverProfile = {
  name: '张建国',
  avatar: '/zhiyun-mobile-assets/mine/avatar.png',
  plateNo: '闽A·8K62Q',
  vehicleType: '9.6米厢式货车',
  tags: ['已实名', '已认证'],
}

export const driverAccount = {
  balance: '12,680.00',
  // 仅统计本月实际进入钱包的资金，不包含仍处于运单结算过程中的金额。
  monthIncome: '16,980',
  monthWithdrawal: '5,000',
  withdrawing: '2,000',
  // 已完成运单收入 18,420 - 本月实际入账 16,980。
  pendingEntry: '1,440',
}

// 钱包流水只记录实际发生的资金变动；待打款运单不计入钱包流水。
export const walletTransactionGroups = [
  {
    date: '09月17日',
    items: [
      { id: 'flow-001', type: 'income', title: '运费入账', summary: '福州长乐 → 泉州晋江', reference: 'ZY2026091600935', time: '16:52', amount: '+3,580.00', status: '已入账' },
      { id: 'flow-002', type: 'withdrawing', title: '提现', summary: '尾号6228储蓄卡', reference: 'TX202609170021', time: '10:18', amount: '-2,000.00', status: '处理中' },
    ],
  },
  {
    date: '09月16日',
    items: [
      { id: 'flow-003', type: 'income', title: '运费入账', summary: '福州仓山 → 莆田涵江', reference: 'ZY2026091600811', time: '10:26', amount: '+2,760.00', status: '已入账' },
      { id: 'flow-004', type: 'withdrawal', title: '提现', summary: '尾号6228储蓄卡', reference: 'TX202609160018', time: '09:40', amount: '-5,000.00', status: '已完成' },
    ],
  },
  {
    date: '09月15日',
    items: [
      { id: 'flow-005', type: 'income', title: '运费入账', summary: '福州马尾 → 厦门同安', reference: 'ZY2026091500746', time: '18:06', amount: '+4,680.00', status: '已入账' },
    ],
  },
]

// 待打款表示运费已核算，但上游企业尚未付款。首版不展示账期、催款或平台协助操作。
export const pendingPaymentWaybills = [
  {
    id: 'pending-001', waybillNo: 'ZY2026091700186', status: 'delivered', statusText: '已送达', paymentStatus: '待打款',
    cargoName: '矿粉', cargoWeight: '32吨', origin: '福州马尾 · 罗星工业园', destination: '厦门同安 · 城南物流园',
    freightAmount: '1,440', accountingTime: '09月17日 14:20', payerName: '福州捷运物流有限公司',
    timeLabel: '核算完成', timeValue: '09月17日 14:20', plateNo: '闽A·8K62Q', canVoucher: false,
  },
]

// 经营收入按本月完成且运费已确认的运单统计；里程来自运输轨迹，空驶率为
// 空驶里程 /（载货里程 + 空驶里程）。原型数据用于验证信息层级，不代表真实结算。
export const driverBusinessOverview = {
  completedIncome: '18,420',
  completedOrders: '18',
  compareRate: '+12.6%',
  frequentRoute: '福州 → 厦门',
  routeOrders: '6',
  metrics: [
    { label: '平均每趟', value: '1,023', unit: '元' },
    { label: '载货里程', value: '3,426', unit: 'km' },
    { label: '空驶里程', value: '652', unit: 'km' },
    { label: '空驶率', value: '16', unit: '%' },
  ],
}

// AI车辆建议仅用于经营辅助判断，不直接替用户做换车决策。
// 能源成本依据当前月均里程和平台油气电账单估算，不含车辆购置、租赁和折旧成本。
export const driverVehicleInsight = {
  fitLabel: '新能源适配度较高',
  cardSummary: '短驳运单占比76%，可进一步测算换车成本',
  title: '你的运营模式可以评估新能源车辆',
  summary: '近90天以福州周边短驳为主，多数运单当日返回固定停车点，里程和补能节奏较适合新能源车辆。',
  evidence: [
    { label: '150km内运单', value: '76%' },
    { label: '当日返程', value: '68%' },
    { label: '日均行驶', value: '136km' },
  ],
  monthlySavings: '1,780',
  costComparison: [
    { label: '当前油车', value: '3,860', ratio: '100%', tone: 'fuel' },
    { label: '新能源估算', value: '2,080', ratio: '54%', tone: 'electric' },
  ],
  costNote: '估算值仅对比能源成本，未计入购车、租赁、保险和折旧。',
  riskTip: '需先确认固定停车点的夜间充电条件，并验证高峰期连续接单时的补能时间。',
}

export const driverTodos = [
  { id: 'todo-license', title: '驾驶证90天后到期', icon: 'idcard', tone: 'warning' },
  { id: 'todo-appeal', title: '1条申诉有新进展', icon: 'chat-o', tone: 'info' },
]

export const driverManagementItems = [
  { key: 'order-setting', label: '接单设置', summary: '可接单 · 接收智能推荐', icon: 'setting-o', tone: 'green' },
  { key: 'qualification', label: '运输资质', summary: '已认证 · 查看证件档案', icon: 'idcard', tone: 'orange' },
  { key: 'credit', label: '信用评价', summary: '4.9分 · 信用良好', icon: 'star-o', tone: 'purple' },
]

// 油气电来自平台能源账户实付订单，ETC来自已同步的通行账单；未绑定时应显示绑定空状态。
export const driverOperatingServices = [
  { key: 'energy', label: '油气电', metricLabel: '本月消费', value: '¥3,860', summary: '已优惠 ¥286 · 附近3站', icon: 'fire-o', tone: 'energy' },
  { key: 'etc', label: 'ETC服务', metricLabel: '本月通行', value: '¥1,260', summary: '待出账 ¥320', icon: 'debit-pay', tone: 'etc' },
]

export const driverSupportItems = [
  { key: 'agreement', label: '合同与协议', icon: 'description' },
  { key: 'security', label: '安全中心', icon: 'shield-o' },
  { key: 'rules', label: '平台规则', icon: 'records-o' },
  { key: 'service', label: '联系客服', icon: 'service-o' },
  { key: 'feedback', label: '意见反馈', icon: 'edit' },
  { key: 'setting', label: '设置', icon: 'setting-o' },
]
