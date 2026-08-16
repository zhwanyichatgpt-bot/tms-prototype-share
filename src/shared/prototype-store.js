/**
 * 原型页面间共享数据 store（reactive 模块级单例）
 *
 * 设计原则：
 * 1. 跨页面联动数据放这里（如托运单创建→列表回写、联运创建→管理回写）
 * 2. 不用 localStorage：原型验证场景下"刷新=回到初始 mock 状态"更干净
 * 3. 不上 pinia：一个 reactive + 几个 setter 足够，避免过度工程化
 *
 * 使用方式：
 *   import { prototypeStore, addWaybill } from '@/shared/prototype-store'
 *   addWaybill(newWaybill)  // 创建页调用
 *   prototypeStore.waybills // 列表页读取
 */
import { reactive } from 'vue'

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const initialPage = urlParams ? (urlParams.get('page') || 'home') : 'home';

// 初始 mock 数据（空数组，由各页面的 mock-data.js 在创建时注入或留空）
export const prototypeStore = reactive({
  // 托运单列表（托运单创建页写入，托运单管理列表页读取）
  waybills: [],
  // 当前选中的托运单（详情/报价/计划创建承接用）
  currentWaybill: null,
  // 联运计划列表（联运创建页写入，联运管理页读取）
  multimodalPlans: [],
  // 当前选中的联运计划
  currentPlan: null,
  // 报价列表（承运商报价页写入）
  quotes: [],
  // 当前导航到的页面 key（用于总入口高亮）
  currentPage: initialPage,
})

// ============ 托运单 ============
export function addWaybill(waybill) {
  prototypeStore.waybills.push(waybill)
}

export function setWaybills(list) {
  prototypeStore.waybills.splice(0, prototypeStore.waybills.length, ...list)
}

export function setCurrentWaybill(waybill) {
  prototypeStore.currentWaybill = waybill
}

// ============ 联运计划 ============
export function addMultimodalPlan(plan) {
  prototypeStore.multimodalPlans.push(plan)
}

export function setMultimodalPlans(list) {
  prototypeStore.multimodalPlans.splice(0, prototypeStore.multimodalPlans.length, ...list)
}

export function setCurrentPlan(plan) {
  prototypeStore.currentPlan = plan
}

// ============ 报价 ============
export function addQuote(quote) {
  prototypeStore.quotes.push(quote)
}

// ============ 通用 ============
export function setCurrentPage(key) {
  prototypeStore.currentPage = key
}

/**
 * 重置全部 store 到初始空状态
 * 用途：原型验证时主动清空脏数据
 */
export function resetStore() {
  prototypeStore.waybills.splice(0)
  prototypeStore.currentWaybill = null
  prototypeStore.multimodalPlans.splice(0)
  prototypeStore.currentPlan = null
  prototypeStore.quotes.splice(0)
  prototypeStore.currentPage = 'home'
}
