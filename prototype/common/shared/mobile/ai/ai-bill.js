// AI 单据分析的通用状态口径：产品数据只需提供 state，展示与统计统一在这里处理。
const toneByState = {
  pending: 'pending',
  running: 'running',
  completed: 'completed',
  done: 'done',
  cancelled: 'done',
}

export const billTone = bill => bill?.tone || toneByState[bill?.state] || 'done'

export const isPendingBill = bill => bill?.state === 'pending' || bill?.state === 'running'

export const isCompletedBill = bill => bill?.state === 'completed' || bill?.state === 'done'

export function analyseBillSet(bills = []) {
  return {
    total: bills.length,
    pending: bills.filter(isPendingBill).length,
    completed: bills.filter(isCompletedBill).length,
  }
}
