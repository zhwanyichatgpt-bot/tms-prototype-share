/**
 * 至简智运司机端运输闭环 store（reactive 模块级单例）
 *
 * 遵循项目 src/shared/prototype-store.js 的既有约定：
 * 1. 跨页面联动数据放这里，不用 localStorage（刷新即回到初始 mock）
 * 2. 不上 pinia，一个 reactive + 若干 action 足够
 *
 * 闭环状态机（正常链）：
 *   available(可接单) → 接单 → loading(装货中) → transporting(运输中)
 *   → unloading(待确认收货) → accounting(已完成待核算) → pending(待打款) → settled(已入账)
 *
 * 司机可操作的动作边界：
 *   - acceptCargo：货源 → 运单（含重量、车辆）
 *   - submitLoading：上传装货凭证 → 进入运输中
 *   - submitUnloading：上传卸货凭证 → 进入待收货确认
 *   - confirmReceipt：模拟货主确认收货 → 核算 → 待打款（原型内可触发，真实业务由货主侧发起）
 *   - settleWaybill：模拟上游付款 → 入账钱包
 *
 * 货源与关注（详见文件末尾「关注货源」段）：
 *   - 货源时间由 loadOffsetMinutes 相对模块加载时刻推算，原型固定产出有效/即将截止/已过期样本
 *   - 接单截止时间即装货时间，超过装货时间不可接单
 *   - 关注记录独立于货源目录，只存 cargoId + 关注时间 + 字段快照
 */
import { reactive } from 'vue'

// 货源发布方：自营货源与第三方平台货源在司机端统一展示，
// 但第三方货源需回传运单、凭证与结算状态（真实落地的外部依赖，原型内先按同构处理）。
//
// 首页列表与地图找货共用这一份数据：mapLeft / mapTop 是气泡在底图上的百分比坐标，
// 排列沿用设计基准图的分布。地图气泡、悬浮卡、详情页三处都按 id 取同一条记录，
// 不要再引入独立的点位数组或按下标与列表做映射（下标映射一旦两边条数不等就会错位）。
//
// 目录必须是 reactive：接单后要把货源 status 置为 taken 使其离开可接机会池，
// 若用普通数组，派生列表不会重新求值，已接单的货源仍会留在首页与地图上。
export const cargoSourceCatalog = reactive([
  {
    id: 'cargo-1',
    cargoNo: 'GH202609170001',
    mapLeft: 33,
    mapTop: 23,
    recommendation: '100%推荐',
    loadOffsetMinutes: 2700,
    durationMinutes: 360,
    remainingWeight: 18,
    status: 'normal',
    loadAddress: '闽侯县·青口建材园',
    loadShort: '福州闽侯',
    loadDetail: '闽侯青口建材园 3 号门',
    loadDistance: '1.2km',
    unloadAddress: '厦门市·海沧港区堆场',
    unloadShort: '厦门海沧',
    unloadDetail: '海沧港区堆场 B 区',
    unloadDistance: '286km',
    routeDistance: '286公里',
    estimateText: '预计 8 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '有回城', '水泥-32吨'],
    cargoCategory: '建材',
    cargoName: '水泥',
    pricingRule: '按吨',
    pricePerTon: 145,
    needWeight: '32',
    estimateFreight: '4,640',
    requirement: '水泥从福州闽侯装车至厦门海沧，需盖篷布，证照齐全车辆优先。',
    publisher: '福州闽通建材物流有限公司',
    contact: '陈经理',
    contactPhone: '188****3211',
    publisherTags: ['平台认证', '信用良好', '发货12次'],
    platform: '象奔奔',
    points: '9',
    listedAt: '2026-09-18 07:52:05',
  },
  {
    id: 'cargo-2',
    cargoNo: 'GH202609170002',
    mapLeft: 59,
    mapTop: 19,
    recommendation: '100%推荐',
    loadOffsetMinutes: 1350,
    durationMinutes: 390,
    remainingWeight: 28,
    status: 'normal',
    loadAddress: '长乐区·松下港煤场',
    loadShort: '福州长乐',
    loadDetail: '松下港煤场 1 号堆场',
    loadDistance: '3.8km',
    unloadAddress: '泉州晋江·安海能源仓',
    unloadShort: '泉州晋江',
    unloadDetail: '安海能源仓卸货区',
    unloadDistance: '174km',
    routeDistance: '174公里',
    estimateText: '预计 5 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '有回城', '煤炭-28吨'],
    cargoCategory: '煤炭及制品',
    cargoName: '煤',
    pricingRule: '按吨',
    pricePerTon: 350,
    needWeight: '28',
    estimateFreight: '9,800',
    requirement: '煤炭从福州长乐装车至泉州晋江，需盖篷布防止抛洒，证照齐全车辆优先。',
    publisher: '长乐兴港供应链有限公司',
    contact: '林经理',
    contactPhone: '139****6620',
    publisherTags: ['平台认证', '信用良好', '发货38次'],
    platform: '象奔奔',
    points: '12',
    listedAt: '2026-09-18 07:49:37',
  },
  {
    id: 'cargo-3',
    cargoNo: 'GH202609170003',
    mapLeft: 55,
    mapTop: 29,
    recommendation: '95%推荐',
    loadOffsetMinutes: 2760,
    durationMinutes: 360,
    remainingWeight: 30,
    status: 'normal',
    loadAddress: '鼓楼区·洪山砂石集散中心',
    loadShort: '福州鼓楼',
    loadDetail: '洪山砂石集散中心东区',
    loadDistance: '5.4km',
    unloadAddress: '厦门集美·杏林搅拌站',
    unloadShort: '厦门集美',
    unloadDetail: '杏林搅拌站料场',
    unloadDistance: '279km',
    routeDistance: '279公里',
    estimateText: '预计 8 小时到达',
    tags: ['平台·象奔奔', '需回单', '当日装卸', '砂石-30吨'],
    cargoCategory: '建材',
    cargoName: '砂石',
    pricingRule: '按吨',
    pricePerTon: 92,
    needWeight: '30',
    estimateFreight: '2,760',
    requirement: '砂石从福州鼓楼装车至厦门集美，需回单，当日完成装卸。',
    publisher: '福州宏基砂石贸易有限公司',
    contact: '黄经理',
    contactPhone: '137****9915',
    publisherTags: ['平台认证', '信用良好', '发货9次'],
    platform: '象奔奔',
    points: '6',
    listedAt: '2026-09-18 07:47:28',
  },
  {
    id: 'cargo-4',
    cargoNo: 'GH202609170004',
    mapLeft: 40,
    mapTop: 33,
    recommendation: '100%推荐',
    loadOffsetMinutes: 150,
    durationMinutes: 240,
    remainingWeight: 35,
    status: 'normal',
    loadAddress: '仓山区·城门钢材市场',
    loadShort: '福州仓山',
    loadDetail: '城门钢材市场 C 区',
    loadDistance: '2.6km',
    unloadAddress: '莆田秀屿·临港工业园',
    unloadShort: '莆田秀屿',
    unloadDetail: '临港工业园 2 号库',
    unloadDistance: '121km',
    routeDistance: '121公里',
    estimateText: '预计 4 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '短驳', '钢材-35吨'],
    cargoCategory: '钢材',
    cargoName: '钢材',
    pricingRule: '按吨',
    pricePerTon: 410,
    needWeight: '35',
    estimateFreight: '14,350',
    requirement: '钢材从福州仓山装车至莆田秀屿，需垫木方固定，证照齐全车辆优先。',
    publisher: '福建闽钢物流有限公司',
    contact: '吴经理',
    contactPhone: '135****2288',
    publisherTags: ['认证承运商', '可开票', '发货56次'],
    platform: '象奔奔',
    points: '15',
    listedAt: '2026-09-18 07:44:51',
  },
  {
    id: 'cargo-5',
    cargoNo: 'GH202609170005',
    mapLeft: 47,
    mapTop: 33,
    recommendation: '100%推荐',
    loadOffsetMinutes: 900,
    durationMinutes: 420,
    remainingWeight: 32,
    status: 'normal',
    loadAddress: '马尾区·罗星工业园',
    loadShort: '福州马尾',
    loadDetail: '罗星工业园 5 号厂房',
    loadDistance: '6.1km',
    unloadAddress: '厦门同安·城南物流园',
    unloadShort: '厦门同安',
    unloadDetail: '城南物流园 A 栋',
    unloadDistance: '268km',
    routeDistance: '268公里',
    estimateText: '预计 7 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '有回城', '矿粉-32吨'],
    cargoCategory: '矿建材料',
    cargoName: '矿粉',
    pricingRule: '按吨',
    pricePerTon: 128,
    needWeight: '32',
    estimateFreight: '4,096',
    requirement: '矿粉从福州马尾装车至厦门同安，需盖篷布，装货地限高 4.2 米。',
    publisher: '福州捷运物流有限公司',
    contact: '郑经理',
    contactPhone: '136****7702',
    publisherTags: ['平台认证', '信用良好', '发货21次'],
    platform: '金石智运',
    points: '11',
    listedAt: '2026-09-18 07:42:13',
  },
  {
    id: 'cargo-6',
    cargoNo: 'GH202609170006',
    mapLeft: 57,
    mapTop: 36,
    recommendation: '90%推荐',
    loadOffsetMinutes: 90,
    durationMinutes: 360,
    remainingWeight: 26,
    status: 'normal',
    loadAddress: '晋安区·鼓山木材市场',
    loadShort: '福州晋安',
    loadDetail: '鼓山木材市场北区',
    loadDistance: '4.3km',
    unloadAddress: '泉州惠安·黄塘木业园',
    unloadShort: '泉州惠安',
    unloadDetail: '黄塘木业园 3 号仓',
    unloadDistance: '156km',
    routeDistance: '156公里',
    estimateText: '预计 5 小时到达',
    tags: ['平台·象奔奔', '需回单', '可议价', '木材-26吨'],
    cargoCategory: '木材',
    cargoName: '木材',
    pricingRule: '按吨',
    pricePerTon: 285,
    needWeight: '26',
    estimateFreight: '7,410',
    requirement: '木材从福州晋安装车至泉州惠安，需回单，装货时注意防雨。',
    publisher: '晋安顺发木材经营部',
    contact: '张经理',
    contactPhone: '138****4417',
    publisherTags: ['平台认证', '信用良好', '发货7次'],
    platform: '象奔奔',
    points: '8',
    listedAt: '2026-09-18 07:40:02',
  },
  {
    id: 'cargo-7',
    cargoNo: 'GH202609170007',
    mapLeft: 45,
    mapTop: 41,
    recommendation: '100%推荐',
    loadOffsetMinutes: 300,
    durationMinutes: 420,
    remainingWeight: 33,
    status: 'normal',
    loadAddress: '仓山区·盖山粮库',
    loadShort: '福州仓山',
    loadDetail: '盖山粮库 2 号仓',
    loadDistance: '3.1km',
    unloadAddress: '厦门翔安·马巷粮食中转仓',
    unloadShort: '厦门翔安',
    unloadDetail: '马巷粮食中转仓',
    unloadDistance: '251km',
    routeDistance: '251公里',
    estimateText: '预计 7 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '夜间装卸', '粮食-33吨'],
    cargoCategory: '农副产品',
    cargoName: '粮食',
    pricingRule: '按吨',
    pricePerTon: 196,
    needWeight: '33',
    estimateFreight: '6,468',
    requirement: '粮食从福州仓山装车至厦门翔安，车厢需清洁干燥，夜间装卸。',
    publisher: '福建中粮储运有限公司',
    contact: '刘经理',
    contactPhone: '133****5561',
    publisherTags: ['认证承运商', '可开票', '发货64次'],
    platform: '象奔奔',
    points: '13',
    listedAt: '2026-09-18 07:38:36',
  },
  {
    id: 'cargo-8',
    cargoNo: 'GH202609170008',
    mapLeft: 38,
    mapTop: 61,
    recommendation: '85%推荐',
    loadOffsetMinutes: 420,
    durationMinutes: 360,
    remainingWeight: 0,
    status: 'full',
    loadAddress: '闽清县·白中化工园',
    loadShort: '福州闽清',
    loadDetail: '白中化工园西区',
    loadDistance: '8.7km',
    unloadAddress: '南平建阳·童游农资仓',
    unloadShort: '南平建阳',
    unloadDetail: '童游农资仓 A 库',
    unloadDistance: '198km',
    routeDistance: '198公里',
    estimateText: '预计 6 小时到达',
    tags: ['平台·象奔奔', '需回单', '有回城', '化肥-24吨'],
    cargoCategory: '化工原料',
    cargoName: '化肥',
    pricingRule: '按吨',
    pricePerTon: 205,
    needWeight: '24',
    estimateFreight: '4,920',
    requirement: '化肥从福州闽清装车至南平建阳，需回单，避免与食品类货物混装。',
    publisher: '闽清农资配送有限公司',
    contact: '陈经理',
    contactPhone: '189****3320',
    publisherTags: ['平台认证', '信用良好', '发货16次'],
    platform: '象奔奔',
    points: '7',
    listedAt: '2026-09-18 07:34:55',
  },
  {
    id: 'cargo-9',
    cargoNo: 'GH202609170009',
    mapLeft: 20,
    mapTop: 38,
    recommendation: '95%推荐',
    loadOffsetMinutes: 1050,
    durationMinutes: 360,
    remainingWeight: 30,
    status: 'normal',
    loadAddress: '福清市·江阴港化工码头',
    loadShort: '福清江阴',
    loadDetail: '江阴港化工码头 2 号泊位',
    loadDistance: '4.9km',
    unloadAddress: '三明沙县·金沙工业园',
    unloadShort: '三明沙县',
    unloadDetail: '金沙工业园 B 区仓',
    unloadDistance: '211km',
    routeDistance: '211公里',
    estimateText: '预计 6 小时到达',
    tags: ['平台·象奔奔', '需回单', '有回城', '工业盐-30吨'],
    cargoCategory: '化工原料',
    cargoName: '工业盐',
    pricingRule: '按吨',
    pricePerTon: 168,
    needWeight: '30',
    estimateFreight: '5,040',
    requirement: '工业盐从福清江阴装车至三明沙县，需回单，车厢需防潮防雨。',
    publisher: '福清盐业化工有限公司',
    contact: '庄经理',
    contactPhone: '137****8804',
    publisherTags: ['平台认证', '信用良好', '发货14次'],
    platform: '象奔奔',
    points: '9',
    listedAt: '2026-09-18 07:32:10',
  },
  {
    id: 'cargo-10',
    cargoNo: 'GH202609170010',
    mapLeft: 67,
    mapTop: 44,
    recommendation: '90%推荐',
    loadOffsetMinutes: 1500,
    durationMinutes: 300,
    remainingWeight: 29,
    status: 'cancelled',
    loadAddress: '长乐区·金峰玻璃产业园',
    loadShort: '福州长乐',
    loadDetail: '金峰玻璃产业园 4 号仓',
    loadDistance: '5.8km',
    unloadAddress: '泉州石狮·蚶江建材城',
    unloadShort: '泉州石狮',
    unloadDetail: '蚶江建材城东区',
    unloadDistance: '189km',
    routeDistance: '189公里',
    estimateText: '预计 5 小时到达',
    tags: ['平台·象奔奔', '易碎品', '需回单', '玻璃-29吨'],
    cargoCategory: '建材',
    cargoName: '玻璃',
    pricingRule: '按吨',
    pricePerTon: 230,
    needWeight: '29',
    estimateFreight: '6,670',
    requirement: '玻璃从福州长乐装车至泉州石狮，需木架固定防震，禁止叠压。',
    publisher: '长乐明辉玻璃制品有限公司',
    contact: '高经理',
    contactPhone: '135****6673',
    publisherTags: ['平台认证', '可开票', '发货27次'],
    platform: '象奔奔',
    points: '10',
    listedAt: '2026-09-18 07:28:47',
  },
  {
    id: 'cargo-11',
    cargoNo: 'GH202609170011',
    mapLeft: 21,
    mapTop: 50,
    recommendation: '85%推荐',
    loadOffsetMinutes: 1620,
    durationMinutes: 420,
    remainingWeight: 31,
    status: 'normal',
    loadAddress: '闽侯县·青口石料场',
    loadShort: '闽侯青口',
    loadDetail: '青口石料场北堆场',
    loadDistance: '1.6km',
    unloadAddress: '漳州龙文·蓝田开发区',
    unloadShort: '漳州龙文',
    unloadDetail: '蓝田开发区 6 号地块',
    unloadDistance: '318km',
    routeDistance: '318公里',
    estimateText: '预计 9 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '当日装卸', '石灰石-31吨'],
    cargoCategory: '矿建材料',
    cargoName: '石灰石',
    pricingRule: '按吨',
    pricePerTon: 118,
    needWeight: '31',
    estimateFreight: '3,658',
    requirement: '石灰石从闽侯青口装车至漳州龙文，卸货地限高 4.5 米，需盖篷布。',
    publisher: '闽侯青口石料有限公司',
    contact: '方经理',
    contactPhone: '139****2246',
    publisherTags: ['平台认证', '信用良好', '发货31次'],
    platform: '金石智运',
    points: '6',
    listedAt: '2026-09-18 07:26:33',
  },
  {
    id: 'cargo-12',
    cargoNo: 'GH202609170012',
    mapLeft: 72,
    mapTop: 72,
    recommendation: '95%推荐',
    loadOffsetMinutes: 1770,
    durationMinutes: 330,
    remainingWeight: 27,
    status: 'offline',
    loadAddress: '连江县·可门陶瓷工业园',
    loadShort: '福州连江',
    loadDetail: '可门陶瓷工业园 1 号库',
    loadDistance: '6.4km',
    unloadAddress: '泉州南安·水头石材城',
    unloadShort: '泉州南安',
    unloadDetail: '水头石材城 C 区',
    unloadDistance: '143km',
    routeDistance: '143公里',
    estimateText: '预计 4 小时到达',
    tags: ['平台·象奔奔', '易碎品', '短驳', '瓷砖-27吨'],
    cargoCategory: '建材',
    cargoName: '瓷砖',
    pricingRule: '按吨',
    pricePerTon: 260,
    needWeight: '27',
    estimateFreight: '7,020',
    requirement: '瓷砖从福州连江装车至泉州南安，需垫纸板防碰角，禁止叠压重货。',
    publisher: '连江粤陶建材有限公司',
    contact: '许经理',
    contactPhone: '133****7718',
    publisherTags: ['平台认证', '可开票', '发货42次'],
    platform: '象奔奔',
    points: '12',
    listedAt: '2026-09-18 07:22:19',
  },
  {
    id: 'cargo-13',
    cargoNo: 'GH202609170013',
    mapLeft: 39,
    mapTop: 77,
    recommendation: '90%推荐',
    loadOffsetMinutes: -300,
    durationMinutes: 330,
    remainingWeight: 25,
    status: 'normal',
    loadAddress: '福清市·龙田饲料厂',
    loadShort: '福清龙田',
    loadDetail: '龙田饲料厂成品仓',
    loadDistance: '3.7km',
    unloadAddress: '宁德蕉城·三都澳码头仓',
    unloadShort: '宁德蕉城',
    unloadDetail: '三都澳码头中转仓',
    unloadDistance: '116km',
    routeDistance: '116公里',
    estimateText: '预计 4 小时到达',
    tags: ['平台·象奔奔', '货源稳定', '夜间装卸', '饲料-25吨'],
    cargoCategory: '农副产品',
    cargoName: '饲料',
    pricingRule: '按吨',
    pricePerTon: 182,
    needWeight: '25',
    estimateFreight: '4,550',
    requirement: '饲料从福清龙田装车至宁德蕉城，车厢需清洁无异味，夜间装卸。',
    publisher: '福清龙田饲料有限公司',
    contact: '薛经理',
    contactPhone: '138****9035',
    publisherTags: ['平台认证', '信用良好', '发货23次'],
    platform: '象奔奔',
    points: '8',
    listedAt: '2026-09-18 07:18:41',
  },
])

// 司机可选择承运的车辆（可任选，不限当前绑定车辆）
export const driverVehicles = [
  { id: 'v-1', plateNo: '闽A·8K62Q', vehicleType: '13米高栏', loadCapacity: '35吨', isDefault: true, certText: '证照齐全' },
  { id: 'v-2', plateNo: '闽A·3M51P', vehicleType: '9.6米厢式', loadCapacity: '18吨', isDefault: false, certText: '证照齐全' },
  { id: 'v-3', plateNo: '闽A·6V27N', vehicleType: '17米平板', loadCapacity: '40吨', isDefault: false, certText: '证照齐全' },
]

// 运单状态字典：文案与色值统一在此定义，页面不各自硬编码
export const waybillStatusMeta = {
  loading: { text: '装货中', tone: 'loading' },
  transporting: { text: '运输中', tone: 'transporting' },
  unloading: { text: '待收货确认', tone: 'unloading' },
  accounting: { text: '待核算', tone: 'accounting' },
  pending: { text: '待打款', tone: 'pending' },
  settled: { text: '已入账', tone: 'settled' },
  cancelled: { text: '已取消', tone: 'cancelled' },
}

function nowStamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function todayLabel() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(now.getMonth() + 1)}月${pad(now.getDate())}日`
}

// 运单号流水：ZY + 日期 + 4 位顺序号
let waybillSeq = 186
function nextWaybillNo() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  waybillSeq += 1
  return `ZY${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${String(waybillSeq).padStart(4, '0')}`
}

export const driverFlowStore = reactive({
  // 已接运单（含闭环各阶段）
  waybills: [],
  // 当前正在查看的运单
  activeWaybill: null,
  // 本次会话已入账金额累计（驱动“我的-本月入账”与钱包流水联动）
  sessionIncome: 0,
  // 钱包流水增量（运费入账记录）
  sessionFlows: [],
})

// ============ 闭环动作 ============

/**
 * 抢单直连：货源 → 运单
 * 司机手填接单重量，车辆可任选；生成运单后直接进入装货中。
 */
export function acceptCargo(cargo, { acceptWeight, vehicleId, remark }) {
  const vehicle = driverVehicles.find((v) => v.id === vehicleId) || driverVehicles[0]
  const weightNum = Number(acceptWeight) || Number(cargo.needWeight) || 0
  const freight = Math.round(weightNum * cargo.pricePerTon)
  const waybill = {
    id: `wb-${Date.now()}`,
    waybillNo: nextWaybillNo(),
    cargoNo: cargo.cargoNo,
    status: 'loading',
    cargoName: cargo.cargoName,
    cargoCategory: cargo.cargoCategory,
    cargoWeight: `${weightNum}吨`,
    acceptWeight: String(weightNum),
    origin: `${cargo.loadShort} · ${cargo.loadDetail}`,
    originShort: cargo.loadShort,
    destination: `${cargo.unloadShort} · ${cargo.unloadDetail}`,
    destinationShort: cargo.unloadShort,
    routeDistance: cargo.routeDistance,
    freightAmount: String(freight),
    quotePerTon: cargo.pricePerTon,
    plateNo: vehicle.plateNo,
    vehicleType: vehicle.vehicleType,
    // 跑货页卡片底栏展示承运司机，与静态运单的 driverName 保持同一字段
    driverName: '张建国',
    publisher: cargo.publisher,
    contact: cargo.contact,
    contactPhone: cargo.contactPhone,
    platform: cargo.platform,
    acceptTime: nowStamp(),
    acceptRemark: remark || '',
    loadVoucher: [],
    unloadVoucher: [],
    // 时间文案
    timeLabel: '计划发车',
    timeValue: cargoTimeText(cargo, 'load'),
    // 装货 / 卸货回填
    loadTime: '',
    loadWeight: '',
    loadRemark: '',
    unloadTime: '',
    unloadWeight: '',
    unloadRemark: '',
    accountingTime: '',
    payerName: cargo.publisher,
  }
  driverFlowStore.waybills.unshift(waybill)
  driverFlowStore.activeWaybill = waybill
  // 接单后货源离开可接机会池，同时清掉关注记录：
  // 同一业务不得同时出现在「关注货源」和「已接运单」中。
  cargo.status = 'taken'
  unfollowCargo(cargo.id)
  return waybill
}

function findWaybill(id) {
  return driverFlowStore.waybills.find((w) => w.id === id)
}

/** 提交装货：上传装货凭证 → 进入运输中 */
export function submitLoading(id, { loadTime, loadWeight, vouchers, remark }) {
  const wb = findWaybill(id)
  if (!wb) return null
  wb.loadTime = loadTime
  wb.loadWeight = loadWeight
  wb.loadRemark = remark
  wb.loadVoucher = vouchers
  wb.status = 'transporting'
  wb.timeLabel = '预计送达'
  wb.timeValue = wb.timeValue || '今天 18:30'
  return wb
}

/** 提交卸货：上传卸货凭证 → 进入待收货确认 */
export function submitUnloading(id, { unloadTime, unloadWeight, vouchers, remark }) {
  const wb = findWaybill(id)
  if (!wb) return null
  wb.unloadTime = unloadTime
  wb.unloadWeight = unloadWeight
  wb.unloadRemark = remark
  wb.unloadVoucher = vouchers
  wb.status = 'unloading'
  wb.timeLabel = '送达时间'
  wb.timeValue = unloadTime
  return wb
}

/**
 * 货主确认收货 → 按实际卸货量核算运费 → 待打款
 * 真实业务由货主侧发起，原型内提供入口以便闭环可走通。
 */
export function confirmReceipt(id) {
  const wb = findWaybill(id)
  if (!wb) return null
  const settledWeight = Number(wb.unloadWeight) || Number(wb.acceptWeight) || 0
  wb.freightAmount = String(Math.round(settledWeight * wb.quotePerTon))
  wb.status = 'accounting'
  wb.accountingTime = nowStamp()
  return wb
}

/** 平台核算完成 → 待打款（运费已核算，等待上游付款） */
export function finishAccounting(id) {
  const wb = findWaybill(id)
  if (!wb) return null
  wb.status = 'pending'
  wb.paymentStatus = '待打款'
  return wb
}

/** 上游付款 → 运费入账钱包，同时写入钱包流水 */
export function settleWaybill(id) {
  const wb = findWaybill(id)
  if (!wb) return null
  wb.status = 'settled'
  wb.settledTime = nowStamp()
  wb.timeLabel = '入账时间'
  wb.timeValue = wb.settledTime
  const amount = Number(wb.freightAmount) || 0
  driverFlowStore.sessionIncome += amount
  driverFlowStore.sessionFlows.unshift({
    id: `flow-session-${wb.id}`,
    type: 'income',
    title: '运费入账',
    summary: `${wb.originShort} → ${wb.destinationShort}`,
    reference: wb.waybillNo,
    time: wb.settledTime.slice(-5),
    amount: `+${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    status: '已入账',
    date: todayLabel(),
  })
  return wb
}

/** 重置闭环数据，便于重复演示 */
export function resetDriverFlow() {
  driverFlowStore.waybills.splice(0)
  driverFlowStore.activeWaybill = null
  driverFlowStore.sessionIncome = 0
  driverFlowStore.sessionFlows.splice(0)
  waybillSeq = 186
}

// 派生：待打款运单（运费已核算、上游未付款）
export function pendingWaybills() {
  return driverFlowStore.waybills.filter((w) => w.status === 'pending')
}

// ============ 关注货源 ============
// 关注是司机的「待决策跟进清单」：不等于接单、锁货、预约装货或履约承诺。
// 接单后货源从关注列表移除并进入运单链路；关注阶段不承担履约责任，不发送装货时间提醒。
//
// 装货时间由 loadOffsetMinutes 相对时间基准推算，不写死中文文案：
// 这样原型在任何时刻打开，都固定存在「正常有效 / 即将截止 / 已过期」三类样本，
// 演示结果不随时间漂移。loadAt 同时是接单截止时间——超过装货时间即不可接单。

// 时间基准固定为模块加载时刻，页面内所有相对时间共用同一基准，
// 避免「关注快照」与「当前值」因求值时刻不同而产生虚假变化点。
const timeBase = Date.now()

export function cargoLoadAt(cargo) {
  return new Date(timeBase + (cargo.loadOffsetMinutes || 0) * 60000)
}

export function cargoUnloadAt(cargo) {
  return new Date(cargoLoadAt(cargo).getTime() + (cargo.durationMinutes || 0) * 60000)
}

function dayLabel(date) {
  const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const now = new Date()
  if (key(date) === key(now)) return '今天'
  if (key(date) === key(new Date(now.getTime() + 86400000))) return '明天'
  if (key(date) === key(new Date(now.getTime() - 86400000))) return '昨天'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`
}

function clockText(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${dayLabel(date)}${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 货源装货 / 卸货时间展示文案，替代原先写死的中文时间字段 */
export function cargoTimeText(cargo, which = 'load') {
  return clockText(which === 'load' ? cargoLoadAt(cargo) : cargoUnloadAt(cargo))
}

/** 接单截止时间即装货时间：当前时间不早于装货时间即不可接单 */
export function isCargoClosed(cargo) {
  return Date.now() >= cargoLoadAt(cargo).getTime()
}

/** 有效 = 货源状态正常 + 未过装货时间 + 剩余可接货量大于 0 */
export function isCargoActive(cargo) {
  if (!cargo || cargo.status !== 'normal') return false
  if (Number(cargo.remainingWeight || 0) <= 0) return false
  return !isCargoClosed(cargo)
}

/** 临近截止：2 小时内装货，用于有效列表的差异化状态位 */
export function isCargoClosingSoon(cargo) {
  if (!isCargoActive(cargo)) return false
  return cargoLoadAt(cargo).getTime() - Date.now() <= 120 * 60000
}

// 装货时间分档：按自然日归入今天 / 明天 / 后天。较远的货源不单独分档，
// 司机的短期跟进清单里不会关注更远的机会。
export const loadDayOptions = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' },
  { value: 'dayAfter', label: '后天' },
]

export function cargoLoadDay(cargo) {
  const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const loadDate = cargoLoadAt(cargo)
  const now = new Date()
  if (key(loadDate) === key(now)) return 'today'
  if (key(loadDate) === key(new Date(now.getTime() + 86400000))) return 'tomorrow'
  if (key(loadDate) === key(new Date(now.getTime() + 172800000))){
    return 'dayAfter'
  }
  return 'later'
}

// 距离分档按公路运输常规口径：短途 150 公里内、中途 150~250、长途 250 以上
export const distanceOptions = [
  { value: 'all', label: '全部' },
  { value: 'short', label: '短途' },
  { value: 'medium', label: '中途' },
  { value: 'long', label: '长途' },
]

export function cargoDistanceTier(cargo) {
  const matched = String(cargo.routeDistance || '').match(/(\d+(?:\.\d+)?)/)
  const km = matched ? Number(matched[1]) : 0
  if (km <= 150) return 'short'
  if (km <= 250) return 'medium'
  return 'long'
}

/**
 * 关注货源筛选：装货时间 / 距离 两个维度按「与」组合。
 * 已失效是独立的布尔维度，不作为装货时间的一个选项——「已接满 / 已取消 / 已下架」
 * 与装货时间无关，混进时间轴会产生歧义（明天装货但已被取消的货源该归哪一档）。
 *
 * skipLoadDay：查看已失效时传 true。失效货源的装货时间都已过去，
 * 再按「今天/明天」筛必然筛空，因此该维度对失效列表不参与判定。
 */
export function matchesFollowFilter(cargo, filter, { skipLoadDay = false } = {}) {
  const { loadDay, distance } = filter
  if (!skipLoadDay && loadDay !== 'all' && cargoLoadDay(cargo) !== loadDay) return false
  if (distance !== 'all' && cargoDistanceTier(cargo) !== distance) return false
  return true
}

// 失效原因字典：标题 + 说明两行。货主侧行为与自然过期分开表述——
// 「已过装货时间」是司机没赶上，「已接满 / 已取消 / 已下架」是机会没了，不合并成「已失效」。
// 原型按状态优先取原因；真实业务需记录首次失效时点，避免后续原因覆盖首次原因。
export const cargoExpireMeta = {
  full: { title: '已接满', detail: '剩余可接量已降为 0' },
  cancelled: { title: '货源已取消', detail: '货源状态已变更为取消' },
  offline: { title: '已下架', detail: '货源状态已变更为下架' },
  timeout: { title: '已过装货时间', detail: '已超过装货时间，无法继续接单' },
}

export function cargoExpireReason(cargo) {
  if (!cargo) return null
  if (cargo.status === 'cancelled') return cargoExpireMeta.cancelled
  if (cargo.status === 'offline') return cargoExpireMeta.offline
  if (cargo.status === 'full' || Number(cargo.remainingWeight || 0) <= 0) return cargoExpireMeta.full
  if (isCargoClosed(cargo)) return cargoExpireMeta.timeout
  return null
}

/** 附近货源与地图找货共用的可接机会池：过期货源出池，不再展示 */
export function activeCargos() {
  return cargoSourceCatalog.filter(isCargoActive)
}

function findCargo(id) {
  return cargoSourceCatalog.find((cargo) => cargo.id === id) || null
}

// 关注记录只存「货源 id + 关注时间 + 关注时刻字段快照」，不复制整条货源：
// 货源本身仍由 cargoSourceCatalog 单一来源维护，避免两处数据不一致。
export const followStore = reactive({
  records: [],
})

// 变化点比较基线固定为关注时刻快照，永久 diff，不引入未读状态
const followChangeFields = [
  { key: 'pricePerTon', label: '运价', unit: '元/吨' },
  { key: 'loadTime', label: '装货时间' },
  { key: 'remainingWeight', label: '剩余可接量', unit: '吨' },
  { key: 'loadAddress', label: '装货地点' },
  { key: 'unloadAddress', label: '卸货地点' },
]

function buildSnapshot(cargo) {
  return {
    pricePerTon: cargo.pricePerTon,
    loadTime: cargoTimeText(cargo, 'load'),
    remainingWeight: cargo.remainingWeight,
    loadAddress: cargo.loadAddress,
    unloadAddress: cargo.unloadAddress,
  }
}

/** 只返回系统能确认的变化点前后值，不推断变化原因 */
export function cargoChanges(record) {
  const cargo = findCargo(record.cargoId)
  if (!cargo) return []
  const current = buildSnapshot(cargo)
  return followChangeFields
    .filter((field) => String(record.snapshot[field.key]) !== String(current[field.key]))
    .map((field) => ({
      key: field.key,
      label: field.label,
      from: String(record.snapshot[field.key]),
      to: String(current[field.key]),
      unit: field.unit || '',
    }))
}

/** 变化点压成一行：单位只跟在结果值后面出现一次，避免同一条变化里重复两遍 */
export function cargoChangeLine(changes) {
  return changes.map((change) => `${change.label} ${change.from}→${change.to}${change.unit}`).join('　·　')
}

export function isFollowed(cargoId) {
  return followStore.records.some((record) => record.cargoId === cargoId)
}

export function followCargo(cargo) {
  if (!cargo || isFollowed(cargo.id)) return null
  const record = { cargoId: cargo.id, followedAt: nowStamp(), snapshot: buildSnapshot(cargo) }
  followStore.records.unshift(record)
  return record
}

export function unfollowCargo(cargoId) {
  const index = followStore.records.findIndex((record) => record.cargoId === cargoId)
  if (index < 0) return false
  followStore.records.splice(index, 1)
  return true
}

/** 关注时间文案：今天 08:12 关注 */
export function followTimeText(record) {
  const matched = String(record.followedAt || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (!matched) return ''
  return `${dayLabel(new Date(+matched[1], +matched[2] - 1, +matched[3]))} ${matched[4]} 关注`
}

// 运价涨跌方向：与关注时刻快照比较。司机扫卡片时第一眼看运价，
// 方向信号放在运价旁边比埋在变化点文字里更快被读到。
function priceTrendOf(record, cargo) {
  const before = Number(record.snapshot.pricePerTon)
  const after = Number(cargo.pricePerTon)
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === after) return null
  return after > before ? 'up' : 'down'
}

function toFollowItem(cargo, record) {
  const changes = cargoChanges(record)
  return {
    cargo,
    record,
    followLabel: followTimeText(record),
    changes,
    // 运价变化已由运价旁的涨跌箭头表达，有效卡片的变化点行不再重复列出；
    // 只改了运价的货源变化点行为空，不占卡片高度。
    displayChanges: changes.filter((change) => change.key !== 'pricePerTon'),
    priceTrend: priceTrendOf(record, cargo),
    expire: cargoExpireReason(cargo),
    closingSoon: isCargoClosingSoon(cargo),
  }
}

/** 有效关注：按装货时间正序，快到期先看 */
export function followedActive() {
  return followStore.records
    .map((record) => ({ record, cargo: findCargo(record.cargoId) }))
    .filter((item) => item.cargo && isCargoActive(item.cargo))
    .sort((a, b) => cargoLoadAt(a.cargo) - cargoLoadAt(b.cargo))
    .map((item) => toFollowItem(item.cargo, item.record))
}

/** 已失效关注：按装货时间倒序，最近失效的先看 */
export function followedExpired() {
  return followStore.records
    .map((record) => ({ record, cargo: findCargo(record.cargoId) }))
    .filter((item) => item.cargo && !isCargoActive(item.cargo))
    .sort((a, b) => cargoLoadAt(b.cargo) - cargoLoadAt(a.cargo))
    .map((item) => toFollowItem(item.cargo, item.record))
}

function stampBefore(minutes) {
  const pad = (n) => String(n).padStart(2, '0')
  const date = new Date(timeBase - minutes * 60000)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 预置关注记录覆盖全部分支：有效（有变化 / 即将截止 / 无变化）与四种失效原因，
// 页面首次进入即可验证，不需要逐条手工关注。
const presetFollows = [
  // 有效 + 有变化：运价上浮、剩余可接量下降
  { cargoId: 'cargo-1', followedAt: stampBefore(430), overrides: { pricePerTon: 128, remainingWeight: 32 } },
  // 有效 + 有变化：装货时间由 1 小时后延后到 2.5 小时后
  { cargoId: 'cargo-4', followedAt: stampBefore(180), overrides: { loadOffsetMinutes: 60 } },
  { cargoId: 'cargo-9', followedAt: stampBefore(95) },
  { cargoId: 'cargo-11', followedAt: stampBefore(60) },
  // 有效 + 即将截止（90 分钟后装货）
  { cargoId: 'cargo-6', followedAt: stampBefore(40) },
  // 已失效：已接满 / 已取消 / 已下架 / 已过装货时间
  { cargoId: 'cargo-8', followedAt: stampBefore(300) },
  { cargoId: 'cargo-10', followedAt: stampBefore(260) },
  { cargoId: 'cargo-12', followedAt: stampBefore(210) },
  { cargoId: 'cargo-13', followedAt: stampBefore(150) },
]

// ============ 任务指派 ============
// 司机端承接普货既有「指派给司机的运输任务」：任务由调度下发，司机无拒绝权，
// 接单只表示知晓确认并回写调度（调度侧据此区分已确认 / 未确认）。
// 接单后任务离开指派列表，进入跑货装卸货链路。
//
// 与货源卡片的三处有意差异：一对一派单，没有推荐度、没有剩余可接量、不联系货主。
// 计价单位跟随上游任务（按吨 / 按趟 / 按方），页面只展示不换算。
// 多装多卸的装卸顺序以调度推荐顺序为初始值，司机可在详情页调整。
// 装货时间同样由相对偏移推算，保证任何时刻打开都有稳定样本。

export const assignedTaskCatalog = reactive([
  {
    id: 'task-1',
    taskNo: 'ZYP202609230017',
    status: 'pending',
    assignOffsetMinutes: -50,
    dispatcher: '至简智运调度中心',
    dispatcherPhone: '0591-8888 1234',
    routeDistance: '286公里',
    vehicleShort: '13米高栏',
    vehicleRequirement: '13 米高栏，车厢需清洁无油污；到场前 30 分钟联系调度报备。',
    // 调度推荐顺序即数组顺序，司机调整后的顺序另行存放，不改动任务本身
    stops: [
      { id: 'task-1-s1', type: 'load', name: '福州闽侯·青口建材园', detail: '青口建材园 3 号门', distance: '1.2km', planOffsetMinutes: 150, contact: '陈经理', phone: '188****3211' },
      { id: 'task-1-s2', type: 'unload', name: '厦门海沧·港区堆场', detail: '海沧港区堆场 B 区', distance: '286km', planOffsetMinutes: 480, contact: '吴主管', phone: '139****7742' },
    ],
    cargoName: '钢材',
    cargoCategory: '钢材',
    cargoUnit: '吨',
    cargoAmount: 32,
    isContainer: false,
    containers: [],
    containerNote: '',
    pricingRule: '按吨',
    priceUnit: '元/吨',
    unitPrice: 145,
    dispatchRemark: '本单为至简智运自营派单。装货地需过磅后装车，磅单随卸货凭证一并上传。',
  },
  {
    id: 'task-2',
    taskNo: 'ZYP202609230021',
    status: 'pending',
    assignOffsetMinutes: -20,
    dispatcher: '至简智运调度中心',
    dispatcherPhone: '0591-8888 1234',
    routeDistance: '412公里',
    vehicleShort: '9.6米厢式',
    vehicleRequirement: '9.6 米厢式，需带尾板；两装两卸，按推荐顺序依次到场。',
    stops: [
      { id: 'task-2-s1', type: 'load', name: '福州仓山·义序物流园', detail: '义序物流园 C 库 12 号口', distance: '6.4km', planOffsetMinutes: 300, contact: '林主管', phone: '137****2088' },
      { id: 'task-2-s2', type: 'load', name: '福州长乐·金峰仓储中心', detail: '金峰仓储中心 2 号库', distance: '48km', planOffsetMinutes: 375, contact: '郑经理', phone: '135****6619' },
      { id: 'task-2-s3', type: 'unload', name: '莆田涵江·国欢物流园', detail: '国欢物流园 A 区 5 号口', distance: '186km', planOffsetMinutes: 690, contact: '黄主管', phone: '136****4471' },
      { id: 'task-2-s4', type: 'unload', name: '泉州洛江·双阳货运站', detail: '双阳货运站 3 号仓', distance: '178km', planOffsetMinutes: 780, contact: '许经理', phone: '138****9032' },
    ],
    cargoName: '日用百货',
    cargoCategory: '普货',
    cargoUnit: '吨',
    cargoAmount: 18,
    isContainer: false,
    containers: [],
    containerNote: '',
    pricingRule: '按趟',
    priceUnit: '元/趟',
    unitPrice: 4200,
    dispatchRemark: '两装两卸，卸货顺序按推荐顺序执行；如需调整请在本页调整后接单，并同步调度。',
  },
  {
    id: 'task-3',
    taskNo: 'ZYP202609230026',
    status: 'pending',
    assignOffsetMinutes: -8,
    dispatcher: '至简智运调度中心',
    dispatcherPhone: '0591-8888 1234',
    routeDistance: '334公里',
    vehicleShort: '集装箱牵引车',
    vehicleRequirement: '集装箱牵引车，需具备危险品以外的普通箱运输资质；提箱时核对箱况并拍照。',
    stops: [
      { id: 'task-3-s1', type: 'pickup', name: '福州江阴港·空箱堆场', detail: '江阴港区空箱堆场 4 区', distance: '52km', planOffsetMinutes: 240, contact: '堆场调度', phone: '0591-8599 2200', note: '提空箱' },
      { id: 'task-3-s2', type: 'load', name: '福州福清·元洪投资区工厂', detail: '元洪投资区 7 号厂房', distance: '26km', planOffsetMinutes: 330, contact: '何厂长', phone: '139****1180', note: '装货' },
      { id: 'task-3-s3', type: 'unload', name: '泉州石狮·石湖港区堆场', detail: '石湖港区堆场 C 区', distance: '334km', planOffsetMinutes: 720, contact: '港区值班', phone: '0595-8870 3366', note: '卸货' },
      { id: 'task-3-s4', type: 'return', name: '泉州石狮·石湖港还箱点', detail: '石湖港区还箱点 2 号闸口', distance: '2km', planOffsetMinutes: 780, contact: '堆场调度', phone: '0595-8870 3366', note: '还空箱' },
    ],
    cargoName: '服装',
    cargoCategory: '轻工产品',
    cargoUnit: '吨',
    cargoAmount: 28,
    isContainer: true,
    containers: [
      { type: '40尺', count: 2, mode: '重箱' },
    ],
    containerNote: '提空箱与还空箱各一次，箱况照片与铅封号随装卸凭证上传。',
    pricingRule: '按吨',
    priceUnit: '元/吨',
    unitPrice: 168,
    dispatchRemark: '集装箱任务：先在江阴港提空箱，再赴工厂装箱，卸货后还箱。箱号以调度下发的装箱单为准。',
  },
  {
    id: 'task-4',
    taskNo: 'ZYP202609230030',
    status: 'pending',
    assignOffsetMinutes: -5,
    dispatcher: '至简智运调度中心',
    dispatcherPhone: '0591-8888 1234',
    routeDistance: '96公里',
    vehicleShort: '13米高栏',
    vehicleRequirement: '13 米高栏，车厢需平整干燥；散装货物需覆盖篷布。',
    stops: [
      { id: 'task-4-s1', type: 'load', name: '宁德福安·湾坞砂石场', detail: '湾坞砂石场 1 号装载点', distance: '12km', planOffsetMinutes: 90, contact: '场区调度', phone: '138****5520' },
      { id: 'task-4-s2', type: 'unload', name: '宁德蕉城·三都澳码头仓', detail: '三都澳码头中转仓', distance: '96km', planOffsetMinutes: 300, contact: '仓管员', phone: '137****9914' },
    ],
    cargoName: '机制砂',
    cargoCategory: '建材',
    cargoUnit: '方',
    cargoAmount: 45,
    isContainer: false,
    containers: [],
    containerNote: '',
    pricingRule: '按方',
    priceUnit: '元/方',
    unitPrice: 62,
    dispatchRemark: '散装按方计费，以卸货地实测方量为准。',
  },
])

// 司机在详情页调整后的执行顺序：只存任务 id 与停靠点顺序，不改动任务记录本身
const taskExecOrder = reactive({})

function taskStopAt(stop) {
  return new Date(timeBase + (stop.planOffsetMinutes || 0) * 60000)
}

function stampText(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${dayLabel(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 调度推荐顺序；司机调整过则返回调整后的顺序 */
export function taskOrderedStops(task) {
  const order = taskExecOrder[task.id]
  if (!order) return task.stops
  return order.map((id) => task.stops.find((stop) => stop.id === id)).filter(Boolean)
}

export function setTaskExecOrder(taskId, order) {
  taskExecOrder[taskId] = order.slice()
}

/** 清除调整，回到调度推荐顺序 */
export function resetTaskExecOrder(taskId) {
  delete taskExecOrder[taskId]
}

export function taskHasCustomOrder(taskId) {
  return Boolean(taskExecOrder[taskId])
}

function stopsOfType(task, type) {
  return taskOrderedStops(task).filter((stop) => stop.type === type)
}

/** 停靠点类型文案：集装箱任务的提箱 / 还箱不是装卸，必须与装货卸货区分开 */
export function taskStopTypeText(stop) {
  if (!stop) return ''
  if (stop.type === 'pickup') return '提箱'
  if (stop.type === 'return') return '还箱'
  return stop.type === 'load' ? '装货' : '卸货'
}

/**
 * 任务开工时刻 = 执行顺序里的第一个停靠点。
 * 集装箱任务的首个停靠点是提箱而非装货，司机同样必须在此之前到场，
 * 因此排序与卡片展示都取第一个停靠点，而不是第一个装货点——
 * 否则会出现「卡片写 15:30 装货，实际 13:50 就要到港提箱」的误导。
 */
export function taskStartAt(task) {
  const stops = taskOrderedStops(task)
  return stops.length ? taskStopAt(stops[0]) : new Date(timeBase)
}

/** 任务收工时刻 = 执行顺序里的最后一个停靠点（卸货或还箱） */
export function taskEndAt(task) {
  const stops = taskOrderedStops(task)
  return stops.length ? taskStopAt(stops[stops.length - 1]) : taskStartAt(task)
}

/** 卡片与详情顶部展示的起止停靠点，标签随停靠点类型变化 */
export function taskStartStop(task) {
  return taskOrderedStops(task)[0] || null
}

export function taskEndStop(task) {
  const stops = taskOrderedStops(task)
  return stops[stops.length - 1] || null
}

export function taskClock(task, which = 'start') {
  const date = which === 'start' ? taskStartAt(task) : taskEndAt(task)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function taskDayLabel(task, which = 'start') {
  return dayLabel(which === 'start' ? taskStartAt(task) : taskEndAt(task))
}

/** 单个停靠点的计划时间文案，如「今天 14:30」 */
export function taskStopText(stop) {
  return stampText(taskStopAt(stop))
}

/** 指派时间：调度下发时刻，司机据此判断这条任务是不是新派的 */
export function taskAssignText(task) {
  return stampText(new Date(timeBase + (task.assignOffsetMinutes || 0) * 60000))
}

/** 多停靠点时给出徽标：普通多装多卸写「共2装2卸」，
 *  集装箱任务的提箱/还箱不算装卸，改用停靠点总数，避免把提箱算成装货 */
export function taskStopCountText(task) {
  const stops = taskOrderedStops(task)
  if (stops.length <= 2) return ''
  const hasContainerStop = stops.some((stop) => stop.type === 'pickup' || stop.type === 'return')
  if (hasContainerStop) return `共${stops.length}个停靠点`
  const loads = stopsOfType(task, 'load').length
  const unloads = stopsOfType(task, 'unload').length
  return `共${loads}装${unloads}卸`
}

/** 预估运费：按趟只取单价，其余按数量乘单价。接单页试算共用同一口径。 */
export function taskFreight(task, amount) {
  if (task.pricingRule === '按趟') return Math.round(Number(task.unitPrice) || 0)
  return Math.round((Number(amount) || 0) * (Number(task.unitPrice) || 0))
}

/** 指派任务列表：只保留待接收，按装货时间正序（快到期先看）。
 *  集装箱任务的首个停靠点是提箱，排序与卡片展示同取第一个停靠点，避免两者不一致。 */
export function assignedTasks() {
  return assignedTaskCatalog
    .filter((task) => task.status === 'pending')
    .sort((a, b) => taskStartAt(a) - taskStartAt(b))
}

/**
 * 接单：任务 → 运单
 * 接单只表示知晓确认并回写调度，不是拒绝权或改派；
 * 生成运单后任务离开指派列表，进入跑货装卸货链路。
 */
export function acceptTask(task, { acceptWeight, vehicleId, remark }) {
  const vehicle = driverVehicles.find((v) => v.id === vehicleId) || driverVehicles[0]
  const amount = Number(acceptWeight) || Number(task.cargoAmount) || 0
  const freight = taskFreight(task, amount)
  const stops = taskOrderedStops(task)
  const firstStop = stops[0]
  const lastStop = stops[stops.length - 1]
  const waybill = {
    id: `wb-${Date.now()}`,
    waybillNo: nextWaybillNo(),
    cargoNo: task.taskNo,
    status: 'loading',
    cargoName: task.cargoName,
    cargoCategory: task.cargoCategory,
    cargoWeight: `${amount}${task.cargoUnit}`,
    acceptWeight: String(amount),
    cargoUnit: task.cargoUnit,
    origin: `${firstStop.name} · ${firstStop.detail}`,
    originShort: firstStop.name,
    destination: `${lastStop.name} · ${lastStop.detail}`,
    destinationShort: lastStop.name,
    routeDistance: task.routeDistance,
    freightAmount: String(freight),
    quotePerTon: task.unitPrice,
    priceUnit: task.priceUnit,
    plateNo: vehicle.plateNo,
    vehicleType: vehicle.vehicleType,
    // 跑货页卡片底栏展示承运司机，与静态运单的 driverName 保持同一字段
    driverName: '张建国',
    publisher: task.dispatcher,
    contact: task.dispatcher,
    contactPhone: task.dispatcherPhone,
    platform: '至简智运',
    acceptTime: nowStamp(),
    acceptRemark: remark || '',
    loadVoucher: [],
    unloadVoucher: [],
    // 时间标签随首个停靠点类型走：集装箱任务是提箱，写成「计划装货」与时间对不上
    timeLabel: `计划${taskStopTypeText(firstStop)}`,
    timeValue: taskStopText(firstStop),
    // 任务来源与多停靠点：运单详情与跑货页暂按首装末卸展示，明细留待后续页面使用
    taskNo: task.taskNo,
    stops: stops.map((stop) => ({ ...stop, planText: taskStopText(stop) })),
    loadTime: '',
    loadWeight: '',
    loadRemark: '',
    unloadTime: '',
    unloadWeight: '',
    unloadRemark: '',
    accountingTime: '',
    payerName: task.dispatcher,
  }
  driverFlowStore.waybills.unshift(waybill)
  driverFlowStore.activeWaybill = waybill
  // 接单后任务离开待接收列表；同一业务不再出现在「任务指派」中
  task.status = 'accepted'
  return waybill
}

/** 恢复预置关注记录，便于重复演示 */
export function seedFollows() {
  followStore.records.splice(0)
  presetFollows.forEach((preset) => {
    const cargo = findCargo(preset.cargoId)
    if (!cargo) return
    const snapshot = buildSnapshot(cargo)
    Object.entries(preset.overrides || {}).forEach(([key, value]) => {
      // loadOffsetMinutes 是相对时间基准的偏移，换算回快照里的展示文案
      snapshot[key === 'loadOffsetMinutes' ? 'loadTime' : key] = key === 'loadOffsetMinutes'
        ? clockText(new Date(timeBase + value * 60000))
        : value
    })
    followStore.records.push({ cargoId: preset.cargoId, followedAt: preset.followedAt, snapshot })
  })
}

seedFollows()
