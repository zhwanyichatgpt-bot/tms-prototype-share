const QUANTITY_UNITS = {
  按重量: '吨',
  按体积: 'm³',
  按数量: '件',
  按集装箱: '箱',
}

export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function quantityUnit(condition) {
  return QUANTITY_UNITS[condition] || ''
}

function formatQuantityItem(item, field, unit) {
  const value = item[field] ?? 0
  return `${item.name} ${value}${unit}`
}

export function buildPlanQuantitySummary(plan, mode) {
  const field = mode === 'unsettled' ? 'unsettledQty' : 'transportTotal'
  if (plan.settlementType === 'whole') {
    const unit = quantityUnit(plan.billingCondition)
    return (plan.cargoItems || []).map(item => formatQuantityItem(item, field, unit)).join(' / ') || '-'
  }

  const segmentField = mode === 'unsettled' ? 'unsettledQty' : 'transportTotal'
  return (plan.subPlans || []).map(sub => {
    const unit = quantityUnit(sub.billingCondition)
    const rows = (sub.lineItems || []).map(item => formatQuantityItem(item, segmentField, unit)).join('、')
    return `路段${sub.seq}：${rows || '-'}`
  }).join(' / ') || '-'
}

export function buildDetailQuantitySnapshot(transportTotal, settledBeforeQty, currentSettleQty) {
  const settledQty = settledBeforeQty + currentSettleQty
  return {
    settledQty,
    unsettledQty: transportTotal - settledQty,
  }
}

export function validateAdjustmentItems(items) {
  let total = 0
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    if (!String(item.name || '').trim()) {
      return { valid: false, message: `第${index + 1}行项目名称不能为空` }
    }
    if (!Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) {
      return { valid: false, message: `第${index + 1}行金额必须大于0` }
    }
    total += Number(item.amount)
  }
  return { valid: true, total }
}
