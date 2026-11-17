// 参照集运运单字段构造的本地示例。单号、企业、人员及车辆标识均为模拟值。
const routes = {
  steel: { mode: 'road', prefix: 'QYCG', plan: '热轧卷板运输计划', goods: '热轧卷板（Q355B）', shipper: '示例钢材货主', carrier: '示例公路承运商', from: '马鞍山钢材库', to: '武汉阳逻港', distance: 460.28, price: 150, date: '2026-11-05' },
  coal: { mode: 'road', prefix: 'QYCG', plan: '煤炭汽运计划', goods: '煤炭', shipper: '示例能源货主', carrier: '示例公路承运商', from: '厦门堆场', to: '漳州煤场', distance: 112, price: 131, date: '2026-11-03' },
  lime: { mode: 'road', prefix: 'QYCG', plan: '高钙石运输计划', goods: '高钙石', shipper: '示例建材货主', carrier: '示例建材运输', from: '泉州矿区', to: '厦门港', distance: 142, price: 90, date: '2026-11-02' },
  roadBox: { mode: 'road', prefix: 'QYCG', plan: '集装箱短驳计划', goods: '五金配件', shipper: '示例集装箱货主', carrier: '示例公路承运商', from: '福州物流园', to: '江阴港', distance: 74, price: 800, date: '2026-11-04', unit: '箱' },
  water: { mode: 'water', prefix: 'SYCG', plan: '沿江矿石运输计划', goods: '铁矿石', shipper: '示例矿石货主', carrier: '示例水运承运商', from: '九江港', to: '岳阳城陵矶港', distance: 384, price: 35, date: '2026-10-29' },
  waterBox: { mode: 'water', prefix: 'SYCG', plan: '沿江集装箱运输计划', goods: '工业配件', shipper: '示例集装箱货主', carrier: '示例水运承运商', from: '武汉阳逻港', to: '九江港', distance: 280, price: 600, date: '2026-10-28', unit: '箱' },
  railRoad: { mode: 'multimodal', prefix: 'LYCG', plan: '公铁联运计划', goods: '袋装水泥', shipper: '示例建材货主', carrier: '示例联运承运商', from: '成都铁路港', to: '重庆果园港', distance: 348, price: 60, date: '2026-10-26' },
  railRoadBox: { mode: 'multimodal', prefix: 'LYCG', plan: '集装箱公铁联运计划', goods: '家电配件', shipper: '示例集装箱货主', carrier: '示例联运承运商', from: '成都铁路港', to: '贵阳改貌站', distance: 671, price: 1400, date: '2026-10-24', unit: '箱' },
}

const drivers = ['李师傅', '周师傅', '陈师傅', '林师傅', '赵师傅', '王师傅']
const roundMoney = (value) => Math.round(value * 100) / 100
const dateAfter = (date, days) => {
  const time = new Date(`${date}T00:00:00Z`)
  time.setUTCDate(time.getUTCDate() + days)
  return time.toISOString().slice(0, 10)
}

function createWaybill(sequence, routeKey, loaded, options = {}) {
  const route = routes[routeKey]
  const suffix = String(sequence).padStart(3, '0')
  const id = `YD-MOCK-${suffix}`
  const unload = options.unload ?? loaded
  const unit = route.unit || '吨'
  const baseFreight = roundMoney(loaded * route.price)
  const roadLoss = options.roadLoss ?? 0
  const deduction = options.deduction ?? 0
  const subsidy = options.subsidy ?? 0
  const total = roundMoney(baseFreight - roadLoss - deduction + subsidy)
  const operatorIndex = (sequence - 1) % drivers.length
  const acceptedAt = `${route.date} 09:${String(sequence % 60).padStart(2, '0')}:00`
  const loadedAt = `${dateAfter(route.date, 1)} 10:00:00`
  const unloadedAt = `${dateAfter(route.date, options.taskCount ? 3 : 2)} 16:30:00`
  const settlement = options.payment ? {
    id: `JS-MOCK-${suffix}`,
    status: options.payment,
    accountedAt: `${dateAfter(route.date, 4)} 11:20:00`,
    baseFreight, roadLoss, deduction, subsidy, total,
    paid: options.payment === '已打款' ? total : (options.paid ?? 0),
  } : null
  if (settlement) settlement.unpaid = roundMoney(total - settlement.paid)

  const firstLoad = Math.floor(loaded / (options.taskCount || 1))
  const tasks = Array.from({ length: options.taskCount || 1 }, (_, index) => {
    const amount = index === (options.taskCount || 1) - 1 ? loaded - firstLoad * index : firstLoad
    return {
      id: `${id}-${index + 1}`,
      from: index === 1 ? (routeKey === 'coal' ? '漳州中转堆场' : '马鞍山转运堆场') : route.from,
      to: index === 0 && options.intermediateUnload ? options.intermediateUnload : route.to,
      loaded: amount,
      unloaded: index === 0 ? roundMoney(amount + unload - loaded) : amount,
      loadedAt: index === 1 ? `${dateAfter(route.date, 2)} 10:00:00` : loadedAt,
      unloadedAt: index === 0 && options.intermediateUnload ? `${dateAfter(route.date, 1)} 16:30:00` : unloadedAt,
    }
  })

  return {
    id,
    mode: route.mode,
    kind: route.unit ? 'container' : 'bulk',
    transportType: { road: '普通运输', water: '水路运输', multimodal: '联运运输' }[route.mode],
    planName: route.plan,
    planNo: `${route.prefix}-MOCK-${routeKey.toUpperCase()}`,
    goods: route.goods,
    unit,
    shipper: route.shipper,
    carrier: route.carrier,
    operator: route.mode === 'water' ? `示例船东${operatorIndex + 1}` : `示例${drivers[operatorIndex]}`,
    contact: `000-0000-${String(operatorIndex + 1).padStart(4, '0')}`,
    vehicle: route.mode === 'water' ? `示例货轮${operatorIndex + 1}号` : `闽A·示例0${operatorIndex + 1}`,
    acceptedAt, loadedAt, unloadedAt, loaded, unloaded: unload,
    from: route.from,
    to: route.to,
    distance: route.distance,
    actualDistance: options.actualDistance ?? null,
    unitPrice: route.price,
    receivable: baseFreight,
    payable: baseFreight,
    tasks,
    containerFlow: options.containerFlow,
    settlement,
    expenses: options.expense ? [{ name: '高速通行费', amount: options.expense, at: loadedAt, location: route.from }] : [],
  }
}

const paid = { payment: '已打款' }
const unpaid = { payment: '未打款' }

export const settlementWaybills = [
  createWaybill(1, 'steel', 5),
  createWaybill(2, 'steel', 10),
  createWaybill(3, 'steel', 10, { unload: 9.9 }),
  createWaybill(4, 'steel', 11),
  createWaybill(5, 'steel', 22, { unload: 22.01 }),
  createWaybill(6, 'steel', 48, { unload: 47.8, taskCount: 2, intermediateUnload: '武汉中转仓', expense: 120 }),
  createWaybill(7, 'coal', 33, { unload: 32, taskCount: 2 }),
  createWaybill(8, 'coal', 26, { taskCount: 3, intermediateUnload: '漳州转运仓' }),
  createWaybill(9, 'lime', 55, { actualDistance: 148 }),
  createWaybill(10, 'lime', 31, { unload: 30.95 }),
  createWaybill(11, 'coal', 29),
  createWaybill(12, 'lime', 27),
  createWaybill(13, 'roadBox', 2, { containerFlow: 'pickup-unload-return' }),
  createWaybill(14, 'roadBox', 1, { containerFlow: 'pickup-return' }),
  createWaybill(15, 'water', 320, { unload: 318 }),
  createWaybill(16, 'water', 440),
  createWaybill(17, 'waterBox', 12),
  createWaybill(18, 'railRoad', 84, { unload: 83.5 }),
  createWaybill(19, 'railRoadBox', 3),
  createWaybill(20, 'roadBox', 2, { containerFlow: 'pickup-load-unload-return' }),
  createWaybill(21, 'steel', 100, unpaid),
  createWaybill(22, 'steel', 37, { ...paid, unload: 36.9, roadLoss: 15, actualDistance: 467.2 }),
  createWaybill(23, 'coal', 28, { payment: '部分打款', paid: 2000, unload: 27.8, roadLoss: 26.2, deduction: 40, subsidy: 120, expense: 120 }),
  createWaybill(24, 'coal', 100, { ...paid, subsidy: 109, expense: 109 }),
  createWaybill(25, 'lime', 55, paid),
  createWaybill(26, 'lime', 32, unpaid),
  createWaybill(27, 'lime', 27.5, { ...paid, deduction: 35 }),
  createWaybill(28, 'coal', 33, paid),
  createWaybill(29, 'steel', 46, { ...paid, unload: 45.85, roadLoss: 22.5 }),
  createWaybill(30, 'steel', 38, unpaid),
  createWaybill(31, 'lime', 30, paid),
  createWaybill(32, 'roadBox', 2, { ...paid, subsidy: 80 }),
  createWaybill(33, 'roadBox', 1, unpaid),
  createWaybill(34, 'water', 375, { ...paid, unload: 374.5, roadLoss: 17.5 }),
  createWaybill(35, 'waterBox', 16, unpaid),
  createWaybill(36, 'railRoad', 90, { ...paid, expense: 240, subsidy: 240 }),
  createWaybill(37, 'railRoadBox', 4, unpaid),
]

export const waybillNumber = (value) => value == null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
