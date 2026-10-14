// 承运商报价的本地验证模型。方案、常用地址和联系人为验证数据，不接生产接口。
// 整票/分段均可用于多式联运；此处采用本轮确认口径，优先于旧 PRD 的分段限定。
export const transportModes = ['公路', '铁路', '水路', '多式联运']
export const deliveries = ['门到门', '门到站', '站到站', '站到门']
export const valueServices = ['代收货款服务', '保价服务', '免费到通知', '定日达', '定时达', 'GPS跟踪']
export const billingOptions = ['按重量', '按体积', '按数量', '按车']
const modeLabels = { road: '公路', rail: '铁路', water: '水路', multi: '多式联运' }
export const copy = value => JSON.parse(JSON.stringify(value))
export const money = value => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const positive = value => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 100000000
const priceValid = value => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100000000 && Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.00001
const round = value => Math.round((value + Number.EPSILON) * 100) / 100
const address = (id, name) => ({ id, name, type: '中转', common: true })
export const commonAddresses = [address('common-sh-rail', '上海铁路货运站'), address('common-wh-port', '武汉港'), address('common-nj-rail', '南京铁路场站'), address('common-sh-port', '上海港'), address('common-gz-rail', '广州铁路场站'), address('common-cq-rail', '重庆铁路场站'), address('common-hz-transfer', '湖州中转中心')]

export function quoteSource(cargo) {
  if (cargo.quoteSource) return copy(cargo.quoteSource)
  const isContainer = cargo.businessType === '集装箱'
  const nodes = [cargo.origin, cargo.destination].map((place, index) => ({ id: `${cargo.id}-${index ? 'unload' : 'load'}`, city: place.city, name: `${place.city}·${place.district}${place.name || ''}`, address: place.address, type: index ? '卸货' : '装货', common: false }))
  const packaging = cargo.requirements?.find(row => row[0] === '货物包装')?.[1] || ''
  const quantity = Number(cargo.quantity.match(/[\d.]+/)?.[0]) || 0
  const unit = cargo.quantity.match(/吨|立方米|件|车/)?.[0] || ''
  const dimension = { 吨: '按重量', 立方米: '按体积', 件: '按数量', 车: '按车' }[unit] || '按重量'
  const boxes = [...cargo.quantity.matchAll(/(\d+)×(20|40|45)(GP|HQ|HC)/g)].map((match, index) => ({ id: `${cargo.id}-box-${index}`, size: match[2], boxType: match[3], cargoName: cargo.goods, quantity: Number(match[1]) }))
  return { id: cargo.id, isContainer, nodes, availableModes: cargo.mode === 'multi' ? [...transportModes] : [modeLabels[cargo.mode] || '公路'], preferredMode: modeLabels[cargo.mode] || '公路', dimension, flows: isContainer ? [] : [{ id: `${cargo.id}-flow-1`, from: nodes[0].id, to: nodes[1].id, cargoName: cargo.goods, packaging, quantity, unit, dimension }], boxes }
}
export function nodeLabel(source, id) {
  const node = [...source.nodes, ...commonAddresses].find(item => item.id === id)
  return node ? `${node.common ? '' : node.type + '｜'}${node.name}` : '请选择地点'
}
export function routeNodes(form) {
  return form.segments.length ? [form.segments[0].from, ...form.segments.map(leg => leg.to)] : []
}
export function routeErrors(source, form) {
  const errors = []
  const nodes = routeNodes(form)
  const validIds = new Set([...source.nodes, ...commonAddresses].map(node => node.id))
  if (!form.segments.length) errors.push('请添加运输路段')
  form.segments.forEach((leg, index) => {
    if (!validIds.has(leg.from) || !validIds.has(leg.to)) errors.push(`路段${index + 1}请选择起终点`)
    if (leg.from && leg.from === leg.to) errors.push(`路段${index + 1}起终点不能相同`)
    if (!['公路', '铁路', '水路'].includes(leg.mode)) errors.push(`路段${index + 1}请选择运输方式`)
    if (index && leg.from !== form.segments[index - 1].to) errors.push(`路段${index + 1}与上一段不连续`)
  })
  source.nodes.forEach(node => { if (!nodes.includes(node.id)) errors.push(`缺少${node.type}节点：${node.name}`) })
  if (source.isContainer) {
    let previous = -1
    for (const node of source.nodes) {
      const position = nodes.indexOf(node.id)
      if (position !== -1 && position <= previous) errors.push(`集装箱节点顺序错误：${node.type}｜${node.name}`)
      if (position !== -1) previous = position
    }
  } else {
    source.flows.forEach(flow => {
      const from = nodes.indexOf(flow.from), to = nodes.indexOf(flow.to)
      if (from !== -1 && to !== -1 && from >= to) errors.push(`${flow.cargoName}装货点必须位于卸货点之前`)
    })
  }
  return [...new Set(errors)]
}
export function carriedFlows(source, form, index) {
  if (source.isContainer) return []
  const nodes = routeNodes(form)
  return source.flows.filter(flow => {
    const from = nodes.indexOf(flow.from), to = nodes.indexOf(flow.to)
    return from !== -1 && from <= index && (to === -1 || index < to)
  })
}
export function flowSummary(source, form, index) {
  if (source.isContainer) return source.boxes.map(box => `${box.cargoName}·${box.quantity}×${box.size}${box.boxType}`).join('；')
  return carriedFlows(source, form, index).map(flow => `${flow.cargoName}${flow.packaging ? '·' + flow.packaging : ''}·${flow.quantity}${flow.unit}`).join('；')
}
export function newFee(source, carryForm = source.isContainer ? '集装箱运输' : '散货运输') {
  return { carryForm, billingDimension: carryForm === '集装箱运输' ? '按集装箱' : source.dimension, billingBasis: '按装货口径', unitPrice: '', boxes: copy(source.boxes).map(box => ({ ...box, unitPrice: '' })), extraFees: [] }
}
export function newLeg(source, from, to, mode = '公路') {
  return { id: 'leg-' + crypto.randomUUID(), from, to, mode, duration: '', ...newFee(source) }
}
export function createQuoteForm(source, mode = source.preferredMode) {
  let nodes = source.nodes.map(node => node.id)
  if (mode === '多式联运' && nodes.length === 2) nodes = [nodes[0], ...(source.isContainer ? ['common-cq-rail','common-gz-rail'] : ['common-sh-rail','common-wh-port']), nodes[1]]
  const segments = nodes.slice(0, -1).map((from, i) => newLeg(source, from, nodes[i + 1], mode === '多式联运' ? (i === 1 ? '铁路' : '公路') : mode))
  return { transportMode: mode, quoteMode: mode === '多式联运' ? '分段报价' : '整票报价', schemeId: '', schemeName: '', segments, whole: newFee(source), delivery: [], valueAdd: [], outline: '', company: '顺达物流有限公司', contactName: '张经理', contactPhone: '13800001234' }
}
export function feeQuantity(source, form, fee, index = null) {
  const flows = index == null ? source.flows : carriedFlows(source, form, index)
  const values = flows.filter(flow => flow.dimension === fee.billingDimension)
  if (!values.length || values.length !== flows.length) return { quantity: null, unit: '', label: '托运单未提供该计费条件的货量' }
  // 按卸货口径存在独立数量时使用对应值，未录入时沿用托运单发布量。
  const quantity = values.reduce((sum, flow) => sum + Number(fee.billingBasis === '按卸货口径' ? (flow.unloadQuantity ?? flow.quantity) : flow.quantity), 0)
  return { quantity, unit: values[0].unit, label: `${quantity}${values[0].unit}` }
}
export function transportAmount(source, form, fee, index = null) {
  if (fee.carryForm === '集装箱运输') return round(fee.boxes.reduce((sum, box) => sum + Number(box.quantity || 0) * Number(box.unitPrice || 0), 0))
  const quantity = feeQuantity(source, form, fee, index).quantity
  return round(Number(quantity || 0) * Number(fee.unitPrice || 0))
}
export function extraAmount(extra) { return round(Number(extra.base || 0) * Number(extra.unitPrice || 0)) * (extra.type === '减项' ? -1 : 1) }
export function totals(source, form) {
  const fees = form.quoteMode === '整票报价' ? [form.whole] : form.segments
  const transport = round(fees.reduce((sum, fee, index) => sum + transportAmount(source, form, fee, form.quoteMode === '整票报价' ? null : index), 0))
  const extras = fees.flatMap(fee => fee.extraFees)
  const additions = round(extras.filter(extra => extra.type !== '减项').reduce((sum, extra) => sum + extraAmount(extra), 0))
  const deductions = round(-extras.filter(extra => extra.type === '减项').reduce((sum, extra) => sum + extraAmount(extra), 0))
  return { transport, additions, deductions, extra: round(additions - deductions), total: round(transport + additions - deductions) }
}
export function feeErrors(source, form) {
  const errors = {}
  const fees = form.quoteMode === '整票报价' ? [form.whole] : form.segments
  fees.forEach((fee, index) => {
    const key = form.quoteMode === '整票报价' ? 'whole' : fee.id
    if (fee.carryForm === '集装箱运输') {
      if (!fee.boxes.length) errors[key] = '请补充箱型价格明细'
      else if (fee.boxes.some(box => !box.boxType || !box.size || !box.cargoName?.trim() || !positive(box.quantity) || !Number.isInteger(Number(box.quantity)) || !priceValid(box.unitPrice))) errors[key] = '请填写完整箱型、货品、整数箱数及有效单价（最多两位小数）'
    } else {
      if (!fee.billingBasis) errors[key] = '请选择计费依据'
      else if (feeQuantity(source, form, fee, form.quoteMode === '整票报价' ? null : index).quantity == null) errors[key] = '托运单未提供该计费条件的货量，请选择已有货量的计费条件'
      else if (!priceValid(fee.unitPrice)) errors[key] = '请填写有效运输单价（最多两位小数）'
    }
    if (fee.extraFees.some(extra => !['增项', '减项'].includes(extra.type) || !extra.name?.trim() || !positive(extra.base) || !priceValid(extra.unitPrice))) errors[key] = '请完整填写其他费用的类型、名称、基数和单价'
    const amount = transportAmount(source, form, fee, form.quoteMode === '整票报价' ? null : index) + fee.extraFees.reduce((sum, extra) => sum + extraAmount(extra), 0)
    if (amount < 0) errors[key] = '减项费用不能超过对应运输费与增项费用之和'
  })
  if (!form.delivery.length || form.delivery.some(value => !deliveries.includes(value))) errors.delivery = '请选择至少一种配送方式'
  if (!form.outline.trim() || form.outline.length > 500) errors.outline = '请填写方案概述，最多500字'
  if (!form.contactName.trim()) errors.contactName = '请填写联系人'
  if (!/^[\d+\-()\s]{6,25}$/.test(form.contactPhone)) errors.contactPhone = '请填写有效联系电话'
  const total = totals(source, form).total
  if (!Number.isFinite(total) || total <= 0 || total > 100000000) errors.total = '报价合计须大于0且不超过1亿元'
  return errors
}
export function validateSnapshot(snapshot) {
  try {
    const { source, form } = snapshot
    return snapshot.version === 2 && source.id && source.nodes.length && source.availableModes.includes(form.transportMode) && ['整票报价', '分段报价'].includes(form.quoteMode) && (form.transportMode === '多式联运' || form.quoteMode === '整票报价') && !routeErrors(source, form).length && !Object.keys(feeErrors(source, form)).length
  } catch { return false }
}

// 本地启用方案母版；引用一次性复制，报价修改不回写母版。
export function availableSchemes(source) {
  const origin = source.nodes[0], end = source.nodes.at(-1)
  const fromCity=origin.city||origin.name.split('·')[0],toCity=end.city||end.name.split('·')[0]
  const channel = `${fromCity} → ${toCity}运输通道`
  return source.availableModes.flatMap(mode => [0, 1, 2, 3].map(variant => {
    const form = createQuoteForm(source, mode)
    if (mode === '多式联运' && source.nodes.length === 2) {
      const middle = source.isContainer ? ['common-cq-rail', 'common-gz-rail'] : variant === 2 ? ['common-sh-port', 'common-gz-rail'] : [variant === 1 ? 'common-nj-rail' : 'common-sh-rail', 'common-wh-port']
      const nodes = [origin.id, ...middle, end.id]
      form.segments = nodes.slice(0, -1).map((id, i) => newLeg(source, id, nodes[i + 1], i === 1 ? (variant === 2 ? '水路' : '铁路') : '公路'))
    }
    form.quoteMode = mode === '多式联运' && variant !== 3 ? '分段报价' : '整票报价'
    form.segments.forEach((leg, i) => {
      leg.duration = `${i === 1 ? 2 : 1}天`
      leg.unitPrice = [80, 60, 70][i % 3]
      leg.boxes.forEach(box => { box.unitPrice = [400, 1100, 250][i % 3] })
    })
    form.whole.unitPrice = mode === '多式联运' ? 210 : 80
    form.whole.boxes.forEach(box => { box.unitPrice = mode === '多式联运' ? 1750 : 400 })
    form.delivery = ['门到门']
    form.valueAdd = variant === 3 ? ['保价服务'] : []
    form.outline = `${mode}承运，覆盖${origin.name}至${end.name}，提供门到门配送${variant === 3 ? '及保价服务' : ''}。`
    const name = `${fromCity}—${toCity}${mode === '多式联运' ? ['公铁联运', '中转联运', '公水联运', '整票联运'][variant] : mode + ['标准', '预约', '直达', '保价'][variant]}方案`
    form.schemeId = `${source.id}-${mode}-${variant}`
    form.schemeName = name
    if (variant === 3) form.whole.extraFees = [{ id: 'standard-insurance', type: '增项', name: '保价服务费', base: 1, unitPrice: 100 }]
    return { id: form.schemeId, name, channel, enabled: true, updatedAt: '2026-10-10', form }
  }))
}
