// 司机端 AI 演示数据：从跑货/运单数据映射，保持运单号、路线、货品与状态同源。
import { roadWaybills } from './mock-data.js'

const stateByStatus = {
  transporting: 'running',
  loading: 'running',
  delivered: 'completed',
  cancelled: 'cancelled',
}

const dateFromWaybillNo = waybillNo => {
  const match = String(waybillNo).match(/^[A-Z]{2}(\d{4})(\d{2})(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

const timeFromLabel = timeValue => String(timeValue)
  .replace(/^(今天|昨天)\s*/, '')
  .replace(/^\d{2}月\d{2}日\s*/, '')

// 首页卡片以城市/区域为主，避免详细园区地址在 269px 卡片内换行。
const routeCity = value => String(value).split(' · ')[0]

export const aiBills = roadWaybills.map(bill => {
  const date = dateFromWaybillNo(bill.waybillNo)
  return {
    id: bill.waybillNo,
    name: bill.cargoName,
    status: bill.statusText,
    state: stateByStatus[bill.status] || 'pending',
    origin: routeCity(bill.origin),
    destination: routeCity(bill.destination),
    datetime: `${date} ${timeFromLabel(bill.timeValue)}`,
    date,
    cargo: bill.cargoName,
    weight: bill.cargoWeight,
  }
})

// 演示运单集中在 2026 年 9 月，默认筛选与数据保持一致。
export const aiDefaultRange = { start: '2026-09-01', end: '2026-09-30' }

// 历史记录为演示分组；点击后统一打开全部演示运单分析。
export const aiHistoryGroups = [
  {
    key: 'pinned',
    label: '置顶',
    items: [
      { id: 'history-pinned-1', title: '上月跑货情况分析', pinned: true, active: true },
      { id: 'history-pinned-2', title: '本月运单消息分析最长到这...', pinned: true },
    ],
  },
  {
    key: 'week',
    label: '本周',
    items: [
      { id: 'history-week-1', title: '运单数据核对' },
      { id: 'history-week-2', title: '本月收入分析' },
      { id: 'history-week-3', title: '本月运单消息分析最长最长到这......' },
      { id: 'history-week-4', title: '收入分析......' },
      { id: 'history-week-5', title: '运单数据核对' },
    ],
  },
  {
    key: 'month',
    label: '本月',
    items: [
      { id: 'history-month-1', title: '跑货分析......' },
      { id: 'history-month-2', title: '收入分析......' },
      { id: 'history-month-3', title: '本月运单消息分析最长最长到这.....' },
      { id: 'history-month-4', title: '运单数据核对......' },
      { id: 'history-month-5', title: '本月运单消息分析最长最长到这.....' },
    ],
  },
]
