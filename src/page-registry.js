import { markRaw } from 'vue'

const pageDefinitions = [
  // 通用功能 · Web 端
  { key: 'waybillManage', name: '托运单管理', module: '托运单管理 · 列表 + 创建', icon: '📦', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/托运单管理/App.vue') },
  { key: 'waybillQuote', name: '承运商报价', module: '托运单管理 · 报价页', icon: '💰', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/承运商报价/App.vue') },
  { key: 'inquiryHall', name: '货源大厅', module: '托运单管理 · 承运商报价入口', icon: '🏷️', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/询价大厅/App.vue') },
  { key: 'multimodalCreate', name: '创建联运计划', module: '多式联运', icon: '🚢', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/创建联运计划/App.vue') },
  { key: 'multimodalManage', name: '联运计划管理', module: '多式联运', icon: '📋', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/联运计划管理页/App.vue') },
  { key: 'shipperSettlement', name: '货主结算', module: '多式联运', icon: '🧾', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/货主结算/App.vue') },
  { key: 'containerPlan', name: '集装箱计划创建', module: '公路计划', icon: '🚂', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/集装箱运输计划创建/App.vue') },
  { key: 'transportChannel', name: '运输通道管理', module: '运输通道', icon: '🛣️', status: 'ready', category: 'general', platform: 'web', load: () => import('../prototype/运输通道管理/App.vue') },
  // 北港水运1.0.3.4
  { key: 'transportPlan', name: '水运计划', module: '水运计划 · 列表', icon: '🚢', status: 'ready', category: 'beigang', platform: 'web', load: () => import('../prototype/运输计划/App.vue') },
  { key: 'shipownerMobileHome', name: '承运商企业移动端', module: '移动端 H5 · 货源/运力大厅 + 竞价详情', icon: '📱', status: 'ready', category: 'beigang', platform: 'mobile', load: () => import('../prototype/船东移动端/ShipownerHome.vue') },
  { key: 'cargoBiddingDetail', name: '货源竞价详情页', module: '移动端 H5 · 货源竞价详情', icon: '📄', status: 'ready', category: 'beigang', platform: 'mobile', load: () => import('../prototype/船东移动端/CargoBiddingDetail.vue') },
  { key: 'biddingQuotePage', name: '移动端报价填写页', module: '移动端 H5 · 参与竞价报价表单', icon: '📝', status: 'ready', category: 'beigang', platform: 'mobile', load: () => import('../prototype/船东移动端/BiddingQuotePage.vue') },
  // 项目定制
  { key: 'inquiryShipper', name: '货源询价（广林三端）', module: '广林项目定制 · 货主/无车承运人/承运商', icon: '📮', status: 'ready', category: 'custom', load: () => import('../prototype/广林询价三端/App.vue') },
]

export const pages = pageDefinitions.map(({ load, ...page }) => page)

export const pageLoaders = Object.fromEntries(
  pageDefinitions.map(({ key, load }) => [
    key,
    () => load().then(module => markRaw(module.default)),
  ]),
)
