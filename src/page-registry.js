import { markRaw } from 'vue'
import { pageCatalog } from '../review/page-catalog.mjs'

const rawPageDefinitions = [
  { key: 'inquiryHall', name: '货源大厅', module: '门户端 · 货源大厅', icon: '🏷️', status: 'ready', channel: 'portal', platform: 'web', load: () => import('../prototype/common/portal/货源大厅/App.vue') },
  { key: 'waybillQuote', name: '承运商报价', module: '门户端 · 承运商报价', icon: '💰', status: 'ready', channel: 'portal', platform: 'web', load: () => import('../prototype/common/portal/承运商报价/App.vue') },
  { key: 'waybillManage', name: '托运单管理', module: '业务端 · 列表 + 创建', icon: '📦', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/托运单管理/App.vue') },
  { key: 'waybillDetail', name: '托运单详情', module: '托运单管理 · 待执行详情', icon: '📄', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillManage', load: () => import('../prototype/common/business/web/托运单管理/详情/App.vue') },
  { key: 'multimodalManage', name: '联运计划管理', module: '业务端 · 联运计划管理', icon: '📋', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/联运计划管理/App.vue') },
  { key: 'multimodalCreate', name: '创建联运计划', module: '联运计划管理 · 创建联运计划', icon: '🚢', status: 'ready', channel: 'business', platform: 'web', parentKey: 'multimodalManage', load: () => import('../prototype/common/business/web/联运计划管理/创建联运计划/App.vue') },
  { key: 'shipperSettlement', name: '货主结算', module: '业务端 · 货主结算', icon: '🧾', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/货主结算/App.vue') },
  { key: 'containerPlan', name: '集装箱计划创建', module: '业务端 · 集装箱计划创建', icon: '🚂', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/集装箱计划创建/App.vue') },
  { key: 'transportChannel', name: '运输通道管理', module: '业务端 · 运输通道管理', icon: '🛣️', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/运输通道管理/App.vue') },
  { key: 'transportTask', name: '运输任务', module: '业务端 · 运输任务流转', icon: '🚚', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/运输任务/App.vue') },
  { key: 'waybillCenter', name: '运单中心', module: '业务端 · 运单中心', icon: '🧾', status: 'ready', channel: 'business', platform: 'web', load: () => import('../prototype/common/business/web/运单中心/App.vue') },
  { key: 'waybillCenterDetail', name: '运单详情', module: '运单中心 · 运单详情', icon: '📄', status: 'ready', channel: 'business', platform: 'web', parentKey: 'waybillCenter', load: () => import('../prototype/common/business/web/运单中心/详情/App.vue') },
  // 北港水运1.0.3.4
  { key: 'transportPlan', name: '水运计划', module: '水运计划 · 列表', icon: '🚢', status: 'ready', platform: 'web', load: () => import('../prototype/projects/beigang/运输计划/App.vue') },
  { key: 'waybillCenterBeigang', name: '北港运单中心', module: '北港项目 · 运单中心（含地址及运输单价变更）', icon: '🚚', status: 'ready', platform: 'web', load: () => import('../prototype/projects/beigang/运单中心/App.vue') },
  { key: 'waybillCenterDetailBeigang', name: '北港运单详情', module: '北港运单中心 · 运单详情', icon: '📄', status: 'ready', platform: 'web', parentKey: 'waybillCenterBeigang', load: () => import('../prototype/projects/beigang/运单中心/详情/App.vue') },
  { key: 'shipownerMobileHome', name: '承运商企业移动端', module: '移动端 H5 · 货源/运力大厅 + 竞价详情', icon: '📱', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/企业移动端/ShipownerHome.vue') },
  { key: 'cargoBiddingDetail', name: '货源竞价详情页', module: '移动端 H5 · 货源竞价详情', icon: '📄', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/企业移动端/CargoBiddingDetail.vue') },
  { key: 'biddingQuotePage', name: '移动端报价填写页', module: '移动端 H5 · 参与竞价报价表单', icon: '📝', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/企业移动端/BiddingQuotePage.vue') },
  { key: 'shipownerWaybill', name: '船东移动端', module: '移动端 H5 · 运单列表 + 运单详情', icon: '🚢', status: 'ready', platform: 'mobile', load: () => import('../prototype/projects/beigang/船东/ShipownerApp.vue') },
  // 项目定制
  { key: 'inquiryShipper', name: '货源询价（广林三端）', module: '广林项目 · 货主/无车承运人/承运商', icon: '📮', status: 'ready', load: () => import('../prototype/projects/guanglin/广林询价三端/App.vue') },
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
