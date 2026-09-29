import { markRaw } from 'vue'
import { pageCatalog } from '../review/page-catalog.mjs'

const rawPageDefinitions = [
  { key: 'inquiryHall', name: '货源大厅', module: '门户端 · 货源大厅', icon: '🏷️', status: 'ready', channel: 'portal', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/portal/货源大厅/App.vue') },
  { key: 'waybillQuote', name: '承运商报价', module: '门户端 · 承运商报价', icon: '💰', status: 'ready', channel: 'portal', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/portal/承运商报价/App.vue') },
  { key: 'waybillManage', name: '托运单管理', module: '业务端 · 列表 + 创建', icon: '📦', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/托运单管理/App.vue') },
  { key: 'waybillDetail', name: '托运单详情', module: '托运单管理 · 待执行详情', icon: '📄', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillManage', load: () => import('../prototype/common/products/lianyun/web/business/托运单管理/详情/App.vue') },
  { key: 'multimodalManage', name: '联运计划管理', module: '业务端 · 联运计划管理', icon: '📋', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/联运计划管理/App.vue') },
  { key: 'multimodalCreate', name: '创建联运计划', module: '联运计划管理 · 创建联运计划', icon: '🚢', status: 'ready', channel: 'business', platform: 'web', parentKey: 'multimodalManage', load: () => import('../prototype/common/products/lianyun/web/business/联运计划管理/创建联运计划/App.vue') },
  { key: 'shipperSettlement', name: '货主结算', module: '业务端 · 货主结算', icon: '🧾', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/货主结算/App.vue') },
  { key: 'containerPlan', name: '集装箱计划创建', module: '业务端 · 集装箱计划创建', icon: '🚂', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/集装箱计划创建/App.vue') },
  { key: 'transportChannel', name: '运输通道管理', module: '业务端 · 运输通道管理', icon: '🛣️', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/运输通道管理/App.vue') },
  { key: 'transportTask', name: '运输任务', module: '业务端 · 运输任务流转', icon: '🚚', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/运输任务/App.vue') },
  { key: 'waybillCenter', name: '运单中心', module: '业务端 · 运单中心', icon: '🧾', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/App.vue') },
  { key: 'roadContainerWaybillSupplement', name: '公路运单补录', module: '运单中心 · 公路补录', icon: '➕', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/公路集装箱补录/App.vue') },
  { key: 'roadBatchWaybillSupplement', name: '公路批量补录', module: '运单中心 · 公路批量补录', icon: '📚', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/公路批量补录/App.vue') },
  { key: 'waterContainerWaybillSupplement', name: '水路集装箱运单补录', module: '运单中心 · 水路集装箱补录', icon: '🚢', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/水路集装箱补录/App.vue') },
  { key: 'railContainerWaybillSupplement', name: '铁路集装箱运单补录', module: '运单中心 · 铁路集装箱补录', icon: '🚂', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/铁路集装箱补录/App.vue') },
  { key: 'waybillCenterDetail', name: '运单详情', module: '运单中心 · 运单详情', icon: '📄', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/products/lianyun/web/business/运单中心/详情/App.vue') },
  // 北港水运1.0.3.4
  { key: 'transportPlan', name: '水运计划', module: '水运计划 · 列表', icon: '🚢', status: 'ready', platform: 'web', load: () => import('../prototype/projects/beigang/products/lianyun/web/运输计划/App.vue') },
  { key: 'waybillCenterBeigang', name: '北港运单中心', module: '北港项目 · 运单中心（含地址及运输单价变更）', icon: '🚚', status: 'ready', platform: 'web', load: () => import('../prototype/projects/beigang/products/lianyun/web/运单中心/App.vue') },
  { key: 'waybillCenterDetailBeigang', name: '北港运单详情', module: '北港运单中心 · 运单详情', icon: '📄', status: 'ready', platform: 'web', parentKey: 'waybillCenterBeigang', load: () => import('../prototype/projects/beigang/products/lianyun/web/运单中心/详情/App.vue') },
  { key: 'shipownerMobileHome', name: '承运商企业移动端', module: '移动端 H5 · 货源/运力大厅 + 竞价详情', icon: '📱', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/products/lianyun/mobile/ShipownerHome.vue') },
  { key: 'cargoBiddingDetail', name: '货源竞价详情页', module: '移动端 H5 · 货源竞价详情', icon: '📄', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/products/lianyun/mobile/CargoBiddingDetail.vue') },
  { key: 'biddingQuotePage', name: '移动端报价填写页', module: '移动端 H5 · 参与竞价报价表单', icon: '📝', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/products/lianyun/mobile/BiddingQuotePage.vue') },
  { key: 'shipownerWaybill', name: '船东移动端', module: '移动端 H5 · 运单列表 + 运单详情', icon: '🚢', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/operation-apps/shipowner/mobile/ShipownerApp.vue') },
  // 至简联运移动端
  { key: 'lianyunShipperHome', name: '联运货主端首页', module: '移动端 H5 · 首页与五栏导航', icon: '🚢', status: 'ready', platform: 'mobile', load: () => import('../prototype/common/products/lianyun/mobile/货主端首页/App.vue') },
  // 至简智运移动端
  { key: 'zhiyunShipperHome', name: '智运货主端首页', module: '移动端 H5 · 找运力首页', icon: '🚛', status: 'ready', platform: 'mobile', load: () => import('../prototype/common/products/zhiyun/mobile/货主端首页/App.vue') },
  // 共用司机移动端
  { key: 'driverHome', name: '至简司机首页', module: '移动端 H5 · 附近货源与接单入口', icon: '🚚', status: 'ready', platform: 'mobile', load: () => import('../prototype/common/operation-apps/driver/mobile/司机首页/App.vue') },
  // 项目定制
  { key: 'inquiryShipper', name: '货源询价（广林三端）', platform: 'web', module: '广林项目 · 货主/无车承运人/承运商', icon: '📮', status: 'ready', load: () => import('../prototype/projects/guanglin/products/lianyun/web/广林询价三端/App.vue') },
]

const pageIdentityByKey = new Map(pageCatalog.map(identity => [identity.key, identity]))
const pageDefinitions = rawPageDefinitions.map(definition => {
  const identity = pageIdentityByKey.get(definition.key)
  if (!identity) throw new Error(`页面 ${definition.key} 缺少版本归属信息`)
  return { ...identity, ...definition }
})

export const pages = pageDefinitions.map(({ load, ...page }) => page)

export const pageLoaders = Object.fromEntries(
  pageDefinitions.map(({ key, load }) => [
    key,
    () => load().then(module => markRaw(module.default)),
  ]),
)
