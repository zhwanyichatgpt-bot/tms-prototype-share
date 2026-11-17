import { settlementWaybills } from './waybill-mock'

const roundFee = value => Math.round(value * 100) / 100

// 模拟派单方给出的计费依据，同一子单只取一套规则。
const crossPlanWaybill = settlementWaybills.find(row => row.id === 'YD-MOCK-006')
const crossPlanTasks = [
  {
    ...crossPlanWaybill.tasks[0],
    planName: '货源计划甲', planNo: 'HY-MOCK-001', goods: '热轧卷板',
    from: 'A 仓', to: 'C 仓', loaded: 20, unloaded: 20, billingBasis: 'loaded', unitPrice: 30,
  },
  {
    ...crossPlanWaybill.tasks[1],
    planName: '汽运计划乙', planNo: 'QY-MOCK-002', goods: '钢材配件',
    from: 'B 仓', to: 'D 仓', loaded: 15.1, unloaded: 15, billingBasis: 'unloaded', unitPrice: 30,
  },
]

function taskFee(task) {
  const quantity = task.billingBasis === 'loaded' ? task.loaded : task.unloaded
  return roundFee(quantity * task.unitPrice)
}

export const driverPendingWaybills = settlementWaybills
  .filter(row => row.mode === 'road' && !row.settlement)
  .map(row => row.id === crossPlanWaybill.id ? {
    ...row,
    planName: '货源计划甲 / 汽运计划乙',
    planNo: 'HY-MOCK-001 / QY-MOCK-002',
    goods: '热轧卷板 / 钢材配件',
    from: 'A 仓', to: 'D 仓', loaded: 35.1, unloaded: 35,
    billingMode: 'task',
    unitPrice: null,
    payable: roundFee(crossPlanTasks.reduce((sum, task) => sum + taskFee(task), 0)),
    tasks: crossPlanTasks,
    expenses: [],
  } : { ...row, billingMode: 'trip' })

function accountingRow(row, amount, unit) {
  return {
    id: row.id,
    seq: 1,
    goods: row.goods,
    loadPlace: row.from,
    unloadPlace: row.to,
    load: row.loaded,
    unload: row.unloaded,
    unit,
    basic: amount,
    amount,
    loss: 0,
  }
}

export function makeDriverDraft(waybills) {
  const cards = waybills.map(waybill => {
    const taskPricing = waybill.billingMode === 'task'
    const groups = taskPricing ? waybill.tasks.map((task, index) => ({
      id: task.id,
      title: `第 ${index + 1} 段 | ${task.planName} · ${task.planNo}`,
      billingType: '单位计费',
      condition: '重量',
      basis: task.billingBasis === 'loaded' ? '装货重量' : '卸货重量',
      unitPrice: task.unitPrice,
      rows: [accountingRow(task, taskFee(task), waybill.unit)],
    })) : [{
      id: waybill.id,
      title: waybill.planName,
      billingType: '整趟定价',
      condition: '趟次',
      basis: '派单价',
      rows: [accountingRow(waybill, waybill.payable, waybill.unit)],
    }]
    const total = roundFee(groups.flatMap(group => group.rows).reduce((sum, row) => sum + row.amount, 0))
    return {
      id: waybill.id,
      driver: waybill.operator,
      phone: waybill.contact,
      plate: waybill.vehicle,
      taskPricing,
      groups,
      total,
    }
  })
  return {
    settleObject: '司机',
    cards,
    total: roundFee(cards.reduce((sum, card) => sum + card.total, 0)),
  }
}
