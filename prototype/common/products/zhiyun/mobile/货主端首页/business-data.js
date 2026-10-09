export const businessPeriodOptions = [
  { key: 'month', label: '本月', range: '09.01—09.28', previous: '8月同期' },
  { key: 'quarter', label: '近3月', range: '07.01—09.28', previous: '4—6月同期' },
  { key: 'year', label: '今年', range: '01.01—09.28', previous: '去年同期' },
]

// 独立场景数据：汇总、对比图、差额清单均从同一份记录计算，不接生产接口。
const lanes = [
  { id: 'l1', route: '福州 → 天津', cargo: '煤炭', vehicle: '自卸车', current: 146, august: 139, quarter: 138, year: 134, previousYear: 130 },
  { id: 'l2', route: '福州 → 厦门', cargo: '砂石', vehicle: '自卸车', current: 118, august: 114, quarter: 112, year: 110, previousYear: 108 },
  { id: 'l3', route: '泉州 → 南昌', cargo: '钢材', vehicle: '平板车', current: 96, august: 100, quarter: 101, year: 99, previousYear: 102 },
  { id: 'l4', route: '宁德 → 温州', cargo: '煤炭', vehicle: '自卸车', current: 82, august: 78, quarter: 79, year: 76, previousYear: 74 },
]
const currentCargoes = [
  { id: 'c1', laneId: 'l1', planned: 600, accepted: 520, loaded: 500, delivered: 310, pending: 1, unpaid: 1, deadline: '09-28 12:00', platform: '象奔奔' },
  { id: 'c2', laneId: 'l2', planned: 400, accepted: 330, loaded: 300, delivered: 248, pending: 1, unpaid: 0, deadline: '09-28 14:00', platform: '象奔奔' },
  { id: 'c3', laneId: 'l3', planned: 600, accepted: 600, loaded: 570, delivered: 403, pending: 2, unpaid: 1, deadline: '09-29 08:00', platform: '好运联' },
  { id: 'c4', laneId: 'l4', planned: 500, accepted: 500, loaded: 470, delivered: 341, pending: 2, unpaid: 1, deadline: '09-29 10:00', platform: '好运联' },
  { id: 'c5', laneId: 'l1', planned: 200, accepted: 200, loaded: 200, delivered: 186, pending: 1, unpaid: 0, deadline: '09-30 08:00', platform: '象奔奔' },
  { id: 'c6', laneId: 'l1', planned: 200, accepted: 200, loaded: 161, delivered: 62, pending: 1, unpaid: 0, deadline: '09-30 10:00', platform: '象奔奔' },
].map((item, index) => ({ ...lanes.find(lane => lane.id === item.laneId), ...item, number: 'HY202609' + String(index + 1).padStart(6, '0'), scope: 'month' }))

function deliveredBills(cargo, count, rate, scope, lateCount = 0) {
  return Array.from({ length: count }, (_, index) => {
    const state = index < (cargo.pending || 0) ? 'pending' : index < (cargo.pending || 0) + (cargo.unpaid || 0) ? 'unpaid' : 'settled'
    const reason = state === 'pending' ? ['卸货凭证待补', '重量差异待核对', '费用待核对'][index % 3] : ''
    return {
      id: cargo.id + '-' + index, number: 'YD' + cargo.number.slice(2) + String(index + 1).padStart(3, '0'),
      cargoId: cargo.id, cargoNo: cargo.number, laneId: cargo.laneId, route: cargo.route, cargo: cargo.cargo,
      platform: cargo.platform || '象奔奔', tons: 31,
      rate: rate + (scope === 'month' ? [-4,-1,1,4][index % 4] : 0),
      amount: 31 * (rate + (scope === 'month' ? [-4,-1,1,4][index % 4] : 0)),
      bucket: index % 4, state, reason, scope,
      subsidy: state === 'settled' && index % 4 === 0 ? 80 : 0,
      deduction: state === 'settled' && index % 5 === 0 ? 30 : 0,
      delivered: true, onTime: index >= lateCount, waitDays: state === 'pending' ? 9 - index : state === 'unpaid' ? 2 : 0,
      confirmedAt: state === 'unpaid' ? '09-26 10:20' : '',
    }
  })
}
const monthBills = currentCargoes.flatMap((cargo, index) => deliveredBills(cargo, cargo.delivered / 31, cargo.current, 'month', index < 2 ? 1 : 0))
function history(scope, counts, rateKey, lateCounts) {
  const sources = lanes.map((lane, index) => ({
    ...lane, id: scope + '-' + lane.id, laneId: lane.id, number: 'HY' + scope + String(index + 1).padStart(3, '0'),
    planned: counts[index] * 31, accepted: counts[index] * 31, loaded: counts[index] * 31, delivered: counts[index] * 31,
    deadline: '已完成', platform: '象奔奔', scope,
  }))
  return { sources, bills: sources.flatMap((source, index) => deliveredBills(source, counts[index], source[rateKey], scope, lateCounts[index])) }
}
const july = history('202607', [32, 18, 20, 10], 'quarter', [1, 1, 1, 0])
const august = history('202608', [40, 20, 25, 15], 'august', [1, 1, 1, 0])
const firstQuarter = history('2026Q1', [120, 60, 70, 50], 'year', [5, 2, 3, 2])
const secondQuarter = history('2026Q2', [120, 60, 70, 50], 'year', [5, 2, 3, 2])
const previousYear = history('2025', [312, 156, 182, 130], 'previousYear', [12, 6, 7, 5])

export const businessExceptionGroups = [
  { key: 'loading', label: '承接与装货' },
  { key: 'transit', label: '在途运输' },
  { key: 'delivery', label: '到货交付' },
  { key: 'voucher', label: '凭证与核对' },
]
const eventSeeds = [
  { id: 'e1', cargoId: 'c1', group: 'loading', type: '车辆到场延迟', fact: '已过约定到场时间2小时，31吨仍待装货。', impact: '本批次装货顺序需重新协调', time: '09-28 07:30', progress: '平台正在协调替补车辆', status: '处理中', overdue: true },
  { id: 'e2', cargoId: 'c2', group: 'loading', type: '装货等待超时', fact: '车辆已到场，排队装货等待超过3小时。', impact: '31吨发车时间后移', time: '09-28 06:20', progress: '装货场已确认优先安排', status: '处理中' },
  { id: 'e3', cargoId: 'c3', group: 'transit', type: '车辆故障', fact: '司机反馈车辆故障，货物尚未完成转运。', impact: '31吨预计晚到4小时', time: '09-28 05:10', progress: '平台已安排转运车辆', status: '处理中' },
  { id: 'e4', cargoId: 'c3', group: 'transit', type: '定位中断', suspected: true, fact: '车辆位置超过2小时未更新，运输状态待核实。', impact: '31吨到货时间待确认', time: '09-28 07:00', progress: '平台正在联系司机核实', status: '待核查' },
  { id: 'e5', cargoId: 'c4', group: 'transit', type: '疑似偏航', suspected: true, fact: '轨迹偏离运输线路，原因尚未确认。', impact: '31吨运输情况需核实', time: '09-28 08:10', progress: '平台核查中，未确认货损', status: '待核查' },
  { id: 'e6', cargoId: 'c4', group: 'delivery', type: '到货超时', fact: '承诺09-28 07:00到货，目前仍未完成送达。', impact: '31吨收货安排受影响', time: '09-28 07:00', progress: '平台反馈预计11:00到货', status: '处理中', overdue: true },
  { id: 'e7', cargoId: 'c5', group: 'voucher', type: '签收重量争议', billId: 'c5-0', fact: '装卸货磅单相差0.8吨，实际结算重量待核对。', impact: '该运单费用暂不能确认', time: '09-27 15:30', progress: '收货方与平台正在复核磅单', status: '待核对' },
  { id: 'e8', cargoId: 'c6', group: 'voucher', type: '卸货凭证缺失', billId: 'c6-0', fact: '货物已送达，但卸货磅单尚未补齐。', impact: '该运单暂不能确认结算', time: '09-27 16:00', progress: '平台已通知司机补交', status: '待补充' },
]
const currentEvents = eventSeeds.map((event, index) => {
  const cargo = currentCargoes.find(item => item.id === event.cargoId)
  const bill = event.billId ? monthBills.find(item => item.id === event.billId) : {
    id: 'active-' + event.id, number: 'YD20260928' + String(index + 1).padStart(3, '0'),
    cargoId: cargo.id, cargoNo: cargo.number, laneId: cargo.laneId, route: cargo.route,
    cargo: cargo.cargo, platform: cargo.platform, tons: 31, rate: cargo.current, state: 'transporting',
    amount: 31 * cargo.current, delivered: false,
  }
  if (event.id === 'e7') bill.reason = '重量差异待核对'
  return { ...event, bill, cargo, tons: bill.tons, owner: cargo.platform + ' · 运营专员',
    timeline: [{ time: event.time, text: event.fact }, { time: '09-28 09:10', text: event.progress }] }
})
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0)
// 平台参考运价与评分为原型场景数据，不表示已接入生产基准或评价算法。
const referenceRates = { l1: 140, l2: 116, l3: 99, l4: 80 }
export const businessScoreDimensions = {
  month: [88,94,94,76,78], quarter: [90,95,96,80,82], year: [92,96,96,83,85],
}
export function getBusinessReport(period) {
  const sources = [...currentCargoes], bills = [...monthBills]
  if (period !== 'month') { sources.push(...july.sources, ...august.sources); bills.push(...july.bills, ...august.bills) }
  if (period === 'year') { sources.push(...firstQuarter.sources, ...secondQuarter.sources); bills.push(...firstQuarter.bills, ...secondQuarter.bills) }
  const previousBills = period === 'month' ? august.bills : period === 'quarter' ? secondQuarter.bills : previousYear.bills
  const settled = bills.filter(item => item.state === 'settled'), pending = bills.filter(item => item.state === 'pending'), unpaid = bills.filter(item => item.state === 'unpaid')
  const routes = lanes.map(lane => {
    const records = settled.filter(item => item.laneId === lane.id)
    const previous = previousBills.filter(item => item.laneId === lane.id && item.state === 'settled')
    const tons = sum(records, 'tons'), previousTons = sum(previous, 'tons')
    const currentRate = sum(records, 'amount') / tons, previousRate = sum(previous, 'amount') / previousTons
    const referenceRate = referenceRates[lane.id] - (period === 'quarter' ? 2 : period === 'year' ? 4 : 0)
    const buckets = period === 'month' ? [0,1,2,3] : period === 'quarter' ? ['202607','202608','month'] : ['2026Q1','2026Q2','202607','202608','month']
    const trend = buckets.map((bucket, index) => {
      const sample = records.filter(item => period === 'month' ? item.bucket === bucket : item.scope === bucket)
      return { label: period === 'month' ? ['1—7日','8—14日','15—21日','22—28日'][index] : ({'2026Q1':'一季度','2026Q2':'二季度','202607':'7月','202608':'8月',month:'9月'})[bucket],
        value: sample.length ? sum(sample,'amount') / sum(sample,'tons') : null,
        reference: referenceRate + (index - (buckets.length-1)/2) * 1.5 }
    }).filter(item => item.value !== null)
    return { ...lane, referenceRate, referenceCount: period === 'month' ? 86 : period === 'quarter' ? 258 : 720,
      deviation: (currentRate/referenceRate-1)*100, trend, records, tons, previousTons, previousCount: previous.length, amount: sum(records, 'amount'),
      currentRate, previousRate, change: (currentRate / previousRate - 1) * 100, extra: (currentRate - previousRate) * tons }
  }).sort((a, b) => b.extra - a.extra)
  // 已超时但尚未送达的一单也进入应送达分母，避免只统计已送达订单造成虚高。
  const dueCount = bills.length + currentEvents.filter(item => item.group === 'delivery' && !item.bill.delivered).length
  const onTimeCount = bills.filter(item => item.onTime).length
  return {
    sources, bills, routes, settled, pending, unpaid, events: currentEvents,
    planned: sum(sources, 'planned'), accepted: sum(sources, 'accepted'), loaded: sum(sources, 'loaded'), delivered: sum(sources, 'delivered'),
    onTimeCount, dueCount, onTimeRate: onTimeCount / dueCount * 100,
    cost: sum(settled, 'amount'), subsidy: sum(settled, 'subsidy'), deduction: sum(settled, 'deduction'), payable: sum(unpaid, 'amount'),
    affectedCargoes: new Set(currentEvents.map(item => item.cargoId)).size,
    affectedTons: sum(currentEvents, 'tons'), overdue: currentEvents.filter(item => item.overdue).length,
  }
}
