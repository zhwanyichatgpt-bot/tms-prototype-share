// 智运 AI 首页与运单分析的演示数据：从运单列表映射，保持单号、路线与状态同源。
import { waybillList } from './mock-data.js'

const stateByStatus = {
  已装货: 'running',
  在途: 'running',
  已送达: 'completed',
  已取消: 'cancelled',
}

export const aiBills = waybillList.slice(0, 6).map(bill => ({
  id: bill.number,
  name: bill.cargo,
  status: bill.status,
  state: stateByStatus[bill.status] || 'pending',
  origin: bill.loadCity,
  destination: bill.unloadCity,
  datetime: bill.acceptTime.slice(0, 16),
  date: bill.acceptTime.slice(0, 10),
  cargo: bill.cargo,
  weight: `${bill.tons} 吨`,
  platform: bill.platform,
}))

// 演示单据均落在 2026 年 4 月，默认筛选与数据保持一致。
export const aiDefaultRange = { start: '2026-04-01', end: '2026-04-30' }

// 历史记录为演示分组；点击后统一打开全部演示运单分析。
export const aiHistoryGroups = [
  {
    key: 'pinned',
    label: '置顶',
    items: [
      { id: 'history-pinned-1', title: '上月运输情况分析', pinned: true, active: true },
      { id: 'history-pinned-2', title: '本月运单消息分析最长到这...', pinned: true },
    ],
  },
  {
    key: 'week',
    label: '本周',
    items: [
      { id: 'history-week-1', title: '运单数据核对' },
      { id: 'history-week-2', title: '企业经营分析' },
      { id: 'history-week-3', title: '本月运单消息分析最长最长到这......' },
      { id: 'history-week-4', title: '企业经营分析......' },
      { id: 'history-week-5', title: '运单数据核对' },
    ],
  },
  {
    key: 'month',
    label: '本月',
    items: [
      { id: 'history-month-1', title: '企业经营分析......' },
      { id: 'history-month-2', title: '企业经营分析......' },
      { id: 'history-month-3', title: '本月运单消息分析最长最长到这.....' },
      { id: 'history-month-4', title: '运单数据核对......' },
      { id: 'history-month-5', title: '本月运单消息分析最长最长到这.....' },
    ],
  },
]
