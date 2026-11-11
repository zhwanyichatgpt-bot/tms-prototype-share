/**
 * 运输结算 AI 工作台 —— Mock 数据
 * 场景：计划创建企业与货主（福建大道成国际联运有限公司）2026-10 公路运输费用结算（演示）
 * 数据形态取自真实对账样本（装货磅单 / 卸货磅单 / 对方对账表 / 路耗扣减），量级做了原型化收敛。
 */

export const SETTLEMENT = {
  no: 'JS2611050016',
  settleObject: '托运方',
  party: '福建大道成国际联运有限公司',
  period: '2026-10-01 ~ 2026-10-31',
  priceUnit: '元/吨',
  totalCount: 713,
  totalWeight: 16513.64,
  totalAmount: 2477046,
}

export const RECON = {
  matched: 713,
  noDiff: 701,
  diff: 12,
  crossPeriod: 193,
  unmatched: 0,
}

/* 允许损耗（吨/车）与货品单价（元/吨），超出部分计路耗 */
export const FREE_LOSS = 0.3
export const GOODS_PRICE = 150

export const DIFF_TYPES = [
  { type: 'weight', label: '重量差', desc: '装货与卸货磅差超出允许范围' },
  { type: 'price', label: '单价差', desc: '对方单价与合同价不一致' },
  { type: 'duplicate', label: '重复记录', desc: '同一车次在对方表中出现两次' },
]

function w(id, date, plate, driver, goods, load, unload, their, price, theirPrice) {
  return { id, date, plate, driver, goods, load, unload, their, price, theirPrice, diffType: 'weight' }
}

function p(id, date, plate, driver, goods, load, unload, price, theirPrice) {
  return { id, date, plate, driver, goods, load, unload, their: unload, price, theirPrice, diffType: 'price' }
}

function ok(id, date, plate, driver, goods, weight) {
  return { id, date, plate, driver, goods, load: weight, unload: weight, their: weight, price: 150, theirPrice: 150, diffType: null }
}

export const WAYBILLS = [
  w('2611051047587630', '10-04', '闽A22Q7L', '蓝霜', '石灰石', 32.1, 31.58, 31.8, 150, 150),
  w('2611051047587642', '10-05', '桂A19935D', '李敏', '石灰石', 31.9, 31.42, 31.75, 150, 150),
  w('2611051047587655', '10-06', '桂A11660D', '梁峙豪', '石灰石', 32.2, 31.86, 32.2, 150, 150),
  w('2611051047587661', '10-07', '桂A08880D', '周子剑', '石灰石', 31.8, 31.3, 31.62, 150, 150),
  w('2611051047587674', '10-08', '桂A06210D', '谭定松', '石灰石', 32.05, 31.72, 31.95, 150, 150),
  w('2611051047587688', '10-09', '桂A05338D', '易伯武', '石灰石', 31.65, 31.28, 31.55, 150, 150),
  w('2611051047587692', '10-10', '桂A16163D', '陈伟源', '石灰石', 32.3, 31.9, 32.12, 150, 150),
  w('2611051047587705', '10-11', '桂A18162D', '巫腾威', '石灰石', 31.75, 31.36, 31.6, 150, 150),
  p('2611051047587712', '10-12', '桂A15016D', '谢汝廷', '石灰石', 32.0, 31.8, 150, 148),
  p('2611051047587724', '10-12', '桂A03551D', '施海辉', '石灰石', 31.88, 31.7, 150, 148),
  p('2611051047587736', '10-13', '桂A15016D', '谢汝廷', '石灰石', 32.15, 31.92, 150, 148),
  {
    id: '2611051047587741', date: '10-13', plate: '桂A11660D', driver: '梁峙豪', goods: '石灰石',
    load: 31.6, unload: 31.6, their: 31.6, price: 150, theirPrice: 150,
    diffType: 'duplicate', duplicateOf: '2611051047587655',
  },
  ok('2611051047587750', '10-13', '桂A17376D', '罗富仁', '石灰石', 31.95),
  ok('2611051047587761', '10-14', '桂A12551D', '陆彪', '石灰石', 32.08),
  ok('2611051047587774', '10-14', '桂A19761D', '甘比龙', '石灰石', 31.7),
  ok('2611051047587788', '10-14', '桂A16617D', '黄才增', '石灰石', 31.82),
].map((row, index) => ({ ...row, planId: row.diffType === 'duplicate' || index < 5 ? 'plan-a' : index < 10 ? 'plan-b' : 'plan-c' }))

// 三个计划用于验证先选范围、再核算的交互；重复项属于对方对账表，不作为系统可结算运单。
export const PLANS = [
  { id: 'plan-a', name: '石灰石运输计划一', number: 'QYCG202610001', route: '三明矿区 → 福州大道成堆场' },
  { id: 'plan-b', name: '石灰石运输计划二', number: 'QYCG202610002', route: '三明矿区 → 福州大道成堆场' },
  { id: 'plan-c', name: '石灰石运输计划三', number: 'QYCG202610003', route: '三明矿区 → 福州大道成堆场' },
].map(plan => {
  const rows = WAYBILLS.filter(row => row.planId === plan.id && row.diffType !== 'duplicate')
  return { ...plan, count: rows.length, load: round2(rows.reduce((n, row) => n + row.load, 0)), unload: round2(rows.reduce((n, row) => n + row.unload, 0)) }
})

export function diffCountsFor(planIds) {
  const selected = WAYBILLS.filter(row => planIds.includes(row.planId))
  const weight = selected.filter(row => row.diffType === 'weight').length
  const price = selected.filter(row => row.diffType === 'price').length
  return { weight, price, total: weight + price, duplicate: selected.filter(row => row.diffType === 'duplicate').length }
}

export const CROSS_PERIOD = {
  count: 193,
  amount: 145860,
  note: '属于 10.9-14，上游对账单只结到 10.8，可结转到下期',
}

export function round2(value) {
  return Math.round(value * 100) / 100
}

/* 我方金额 = 卸货吨数 × 单价 */
export function ourAmount(row) {
  return round2(row.unload * row.price)
}

/* 对方金额 = 对方吨数 × 对方单价 */
export function theirAmount(row) {
  return round2(row.their * row.theirPrice)
}

/* 路耗 = 超出允许损耗的部分 × 货品单价 */
export function roadLossFor(row, weight) {
  return round2(Math.max(0, row.load - weight - FREE_LOSS) * GOODS_PRICE)
}

/* 按处置方式取最终金额 */
export function amountFor(row, mode) {
  if (mode === 'theirs') return theirAmount(row)
  if (mode === 'delete') return 0
  return ourAmount(row)
}

export function weightDiff(row) {
  return round2(row.load - row.unload)
}

export function theirWeightDiff(row) {
  return round2(row.load - row.their)
}

/* 差异说明（原型文案，实际由 AI 生成） */
export function adviceFor(row) {
  if (row.diffType === 'price') {
    return `对方单价 ${row.theirPrice} 元/吨，合同价 ${row.price} 元/吨，建议核对合同约定单价`
  }
  if (row.diffType === 'duplicate') {
    return `与运单 ${row.duplicateOf} 车号、日期、重量完全一致，疑似重复计入`
  }
  const diff = weightDiff(row)
  const rate = ((diff / row.load) * 100).toFixed(2)
  const loss = roadLossFor(row, row.unload)
  const tail = loss > 0 ? `，超出允许损耗应扣路耗 ¥${loss.toFixed(2)}` : '，在允许损耗内'
  return `卸货磅单 ${row.unload.toFixed(2)}t，对方 ${row.their.toFixed(2)}t，磅差 ${diff.toFixed(2)}t（${rate}%）${tail}，建议以卸货磅单为准`
}

export function groupRows(type) {
  return WAYBILLS.filter(row => row.diffType === type)
}

/* ===== 创建运输结算单 ===== */

export const DIFF_COUNTS = {
  weight: WAYBILLS.filter(row => row.diffType === 'weight').length,
  price: WAYBILLS.filter(row => row.diffType === 'price').length,
  duplicate: WAYBILLS.filter(row => row.diffType === 'duplicate').length,
  total: WAYBILLS.filter(row => row.diffType).length,
}

export function basisLabel(basis) {
  return basis === 'theirs' ? '运输企业回单' : '我方磅单'
}

export function settleWeight(row, basis) {
  return basis === 'theirs' ? row.their : row.unload
}

export function settlePrice(row, basis) {
  return basis === 'theirs' ? row.theirPrice : row.price
}

/* 核算金额 = 计价量 × 单价 − 路耗；重复运单不计入 */
export function settleAmount(row, basis) {
  if (row.diffType === 'duplicate') return 0
  const weight = settleWeight(row, basis)
  return round2(weight * settlePrice(row, basis) - roadLossFor(row, weight))
}

/* 生成结算单草稿：基础信息 + 核算运单 + 合计 */
export function draftFor(basis = 'ours', planIds = PLANS.map(plan => plan.id), compare = false) {
  const rows = WAYBILLS.filter(row => planIds.includes(row.planId) && row.diffType !== 'duplicate').map((row, index) => {
    const weight = settleWeight(row, basis)
    const price = settlePrice(row, basis)
    return {
      id: row.id,
      planId: row.planId,
      planName: PLANS.find(plan => plan.id === row.planId).name,
      planNumber: PLANS.find(plan => plan.id === row.planId).number,
      seq: index + 1,
      plate: row.plate,
      driver: row.driver,
      phone: `138****${String(index + 1).padStart(4, '0')}`,
      goods: row.goods,
      goodsPrice: GOODS_PRICE,
      load: row.load,
      unload: row.unload,
      loadPlace: '三明市 · 石灰石矿区',
      unloadPlace: '福州市 · 大道成堆场',
      weight,
      price,
      basic: round2(weight * price),
      loss: row.diffType === 'duplicate' ? 0 : roadLossFor(row, weight),
      amount: settleAmount(row, basis),
      diffType: row.diffType,
      flag: compare ? (row.diffType === 'weight' ? '重量差' : row.diffType === 'price' ? '单价差' : '') : '',
    }
  })
  const included = rows.filter(row => row.diffType !== 'duplicate')
  const weight = round2(included.reduce((sum, row) => sum + row.weight, 0))
  const loss = round2(included.reduce((sum, row) => sum + row.loss, 0))
  const total = round2(included.reduce((sum, row) => sum + row.amount, 0))
  const totalLoad = round2(included.reduce((sum, row) => sum + row.load, 0))
  const totalUnload = round2(included.reduce((sum, row) => sum + row.unload, 0))
  const totalBasic = round2(included.reduce((sum, row) => sum + row.basic, 0))
  return {
    settleObject: SETTLEMENT.settleObject,
    party: SETTLEMENT.party,
    settleDate: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date()),
    remark: `结算期间 ${SETTLEMENT.period}`,
    basis,
    planIds: [...planIds],
    plans: PLANS.filter(plan => planIds.includes(plan.id)),
    rows,
    totalRows: rows.length,
    count: included.length,
    weight,
    loss,
    total,
    totalLoad,
    totalUnload,
    totalBasic,
  }
}

export const money = value => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const tons = value => `${value.toFixed(2)}t`

export function recalculateDraft(draft) {
  for (const row of draft.rows) {
    const weight = Number.isFinite(Number(row.weight)) ? Number(row.weight) : 0
    const price = Number.isFinite(Number(row.price)) ? Number(row.price) : 0
    row.basic = round2(weight * price)
    row.loss = roadLossFor(row, weight)
    row.amount = round2(row.basic - row.loss)
  }
  const sum = field => round2(draft.rows.reduce((n, row) => n + Number(row[field] || 0), 0))
  Object.assign(draft, { count: draft.rows.length, totalRows: draft.rows.length, weight: sum('weight'), loss: sum('loss'), total: sum('amount'), totalLoad: sum('load'), totalUnload: sum('unload'), totalBasic: sum('basic') })
  return draft
}
