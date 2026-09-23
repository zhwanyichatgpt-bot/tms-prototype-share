// 至简智运货主端首页 Mock 数据 —— 与设计稿展示内容一致
export const locationBar = {
  city: '榕城·江上图',
}

export const heroSlogans = ['多平台运力', '准时结算', '全程保障']

export const mapCard = {
  tag: '常用装货点',
  address: '福州市·江上图首府叁号',
}

// 小简洞察：蓝色半透明提示条，承载线路+运价趋势+查看方案
export const aiTip = {
  route: '小简洞察 · 你的常跑路线 福州→天津',
  trend: '近7日参考运价 ',
  price: '285–310元/吨',
  trendTail: '，较上周下降3%',
  capacity: '运力较充足 · ',
  action: '查看方案 ›',
}

export const shipForm = {
  loadPoint: '福州市·江上图首府叁号',
  loadHint: '推荐附近装货点，较多运力平台响应快',
  unloadPlaceholder: '您要去哪里卸货',
  settingText: '设置常用',
  submitText: '快速发布',
  quickRoutesLabel: '常用路线：',
  quickRoutes: [
    { id: 'r1', label: '福州→天津', load: '福州市·江上图首府叁号', unload: '天津市·东丽物流园' },
    { id: 'r2', label: '福州→厦门', load: '福州市·江上图首府叁号', unload: '厦门市·海沧港区' },
  ],
}

// 首页只展示货主全部进行中货源的整体概况；单票货源进入二级列表查看。
export const transitSummary = {
  totalCargoes: 12,
  activeVehicles: 46,
  metrics: [
    { key: 'abnormal', label: '异常待关注', value: 2, unit: '票', tone: 'warning' },
    { key: 'loading', label: '今日待装货', value: 3, unit: '票', tone: 'normal' },
    { key: 'arrival', label: '今日预计送达', value: 4, unit: '票', tone: 'normal' },
  ],
  alert: {
    route: '福州 → 天津',
    detail: '1辆车预计延误3小时',
    extra: '另有1票货源存在异常',
    action: '去处理',
  },
}

export const recommendSection = {
  title: '推荐运力',
  subtitle: '根据你的常跑线路和历史货品推荐',
  moreText: '查看更多',
}

// 推荐运力：物流企业 + 零散司机两类主体，大宗批量找车优先看企业运力规模
// 筛选维度：综合推荐（rate 降序，同档企业优先）/ 距离最近（distance 升序）/ 车型（vehicleType 过滤）
// 信任证据：合作过→照片胶囊「合作过 X 次」；未合作→平台统计标签（履约单量/准时率），不写空洞形容词
// 车队详情中的评分、履约和资质信息为原型 Mock；正式接入后由来源平台提供。
export const carriers = [
  {
    id: 'e1',
    kind: 'company',
    name: '福州闽运物流有限公司',
    rate: '96%',
    coop: '合作过 3 次',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    fleet: '共 45 辆车，38 名司机',
    vehicleMix: [{ type: '13米高栏', count: 28 }, { type: '17米平板', count: 17 }],
    vehicle: '13米高栏、17米平板',
    vehicleType: '13米高栏',
    distance: 18,
    route: '福州 → 天津',
    goods: '煤炭、钢材',
    trustTags: ['认证承运商', '可开票'],
    platform: '象奔奔',
    detail: {
      completedOrders: '128', onTimeRate: '96%', positiveReviews: '42次', serviceScore: '4.8',
      certificates: ['平台认证承运商', '企业主体已核验', '道路运输资质', '支持开票'],
    },
  },
  {
    id: 'e2',
    kind: 'company',
    name: '福建盛丰供应链有限公司',
    rate: '94%',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    fleet: '共 120 辆车，96 名司机',
    vehicleMix: [{ type: '17米平板', count: 78 }, { type: '自卸车', count: 42 }],
    vehicle: '17米平板、自卸车',
    vehicleType: '17米平板',
    distance: 31,
    route: '福州 → 天津',
    goods: '煤炭、矿石',
    trustTags: ['履约 340 单', '准时率 97%'],
    platform: '金石智运',
    detail: {
      completedOrders: '340', onTimeRate: '97%', positiveReviews: '86次', serviceScore: '4.9',
      certificates: ['平台认证承运商', '企业主体已核验', '道路运输资质', '支持开票'],
    },
  },
  {
    id: 'c1',
    kind: 'driver',
    driverName: '李师傅',
    name: '李师傅',
    rate: '95%',
    coop: '合作过 6 次',
    vehicle: '13米高栏',
    vehicleType: '13米高栏',
    load: '31 吨',
    trips: 12,
    onTimeRate: '98%',
    distance: 23,
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    route: '福州 → 天津',
    goods: '煤炭、钢材',
    trustTags: ['履约 210 单', '准时率 98%'],
    platform: '象奔奔',
  },
  {
    id: 'c2',
    kind: 'driver',
    driverName: '王师傅',
    name: '王师傅',
    rate: '93%',
    coop: '合作过 3 次',
    vehicle: '13米高栏',
    vehicleType: '13米高栏',
    load: '31 吨',
    trips: 3,
    onTimeRate: '96%',
    distance: 12,
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    route: '福州 → 天津',
    goods: '煤炭、矿石',
    trustTags: ['履约 48 单', '准时率 96%'],
    platform: '金石智运',
  },
  {
    id: 'c3',
    kind: 'driver',
    driverName: '张师傅',
    name: '张师傅',
    rate: '91%',
    coop: '合作过 2 次',
    vehicle: '17米平板',
    vehicleType: '17米平板',
    load: '32 吨',
    trips: 21,
    onTimeRate: '97%',
    distance: 35,
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    route: '福州 → 天津',
    goods: '钢材、设备',
    trustTags: ['履约 356 单', '准时率 97%'],
    platform: '象奔奔',
  },
]

// 个体司机详情（原型 Mock）。
// 承运记录与履约指标正式接入后由运力来源平台提供；「你和 TA 的合作」为本平台独有。
export const driverProfiles = {
  c1: {
    platform: '象奔奔',
    matchNote: '按你的常跑线路与历史货品匹配，不代表服务评价',
    routeNote: '你常跑的线路，路线熟',
    vehicleNote: '整车大宗散货的常用车型',
    goodsNote: '与你常发的货品一致',
    stats: { orders: '210', onTimeRate: '98%', goodRate: '96%', complaints: '0', loss: '0' },
    lastCoop: '2026年8月12日',
  },
  c2: {
    platform: '金石智运',
    matchNote: '按你的常跑线路与历史货品匹配，不代表服务评价',
    routeNote: '跑过这条线，路线不算陌生',
    vehicleNote: '整车大宗散货的常用车型',
    goodsNote: '与你常发的货品一致',
    stats: { orders: '48', onTimeRate: '96%', goodRate: '95%', complaints: '0', loss: '0' },
    lastCoop: '2026年6月3日',
  },
  c3: {
    platform: '象奔奔',
    matchNote: '按你的常跑线路与历史货品匹配，不代表服务评价',
    routeNote: '这条线跑得多，装卸点熟',
    vehicleNote: '平板车，适合钢材与大型设备',
    goodsNote: '你发过钢材，属于同类运输',
    stats: { orders: '356', onTimeRate: '97%', goodRate: '96%', complaints: '1', loss: '0' },
    lastCoop: '2026年7月20日',
  },
}

// 车型筛选可选项
export const vehicleTypes = ['13米高栏', '17米平板']

// 底部 Tab 栏（设计 组合585：首页选中 / 货源 / 小简AI（中央缺口+白猫） / 运单 / 我的）
export const tabBar = [
  { key: 'home', label: '首页', icon: '/zhiyun-mobile-assets/icons/tab-home.svg', active: true },
  { key: 'goods', label: '货源', icon: '/zhiyun-mobile-assets/icons/tab-news.svg', active: false },
  { key: 'order', label: '运单', icon: '/zhiyun-mobile-assets/icons/tab-app.svg', active: false },
  { key: 'mine', label: '我的', icon: '/zhiyun-mobile-assets/icons/tab-mine.svg', active: false },
]

// 中央缺口位：小简AI + 白猫吉祥物
export const aiTab = {
  label: '小简AI',
  cat: '/zhiyun-mobile-assets/icons/tab-cat-ai.png',
}
