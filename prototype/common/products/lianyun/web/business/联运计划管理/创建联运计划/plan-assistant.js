// 本地原型通过明确字段和路线描述验证填单交互。
export const planExample = '帮我创建福建大道成的联运计划，煤炭1000吨，从三明矿区汽运到福州港，再水运到上海港，联系人张伟，电话13800138000，按卸货重量每吨150元，月结。'
export const planStartExample = '帮福建大道成创建一个1000吨煤炭联运计划'

const modeNames = { 公路: '汽运', 汽运: '汽运', 水运: '水运', 铁路: '铁运', 铁运: '铁运' }
const segmentPattern = /从([^，。,；;]+?)(汽运|公路|水运|铁路|铁运)(?:到|至)([^，。,；;]+)/
function makeSegment(from, to, mode, cargo) {
  const cargoItems = cargo ? [{ text: `${cargo.name}丨${cargo.weight}吨` }] : []
  return {
    id: crypto.randomUUID(), name: '', mode: modeNames[mode], cargoType: '散杂货', planName: '', operations: [],
    nodes: ['装', '卸'].map((type, index) => ({ type, address: index ? to : from, isSite: false, workTime: '', contact: '', phone: '', cargoItems: cargoItems.map(item => ({ ...item })) })),
  }
}
export function parsePlanRequest(text, currentCargo = []) {
  const basic = {}, fee = {}, changed = []
  const set = (target, key, value, label) => { if (value !== undefined && value !== '') { target[key] = value; changed.push(label) } }
  const shipper = text.match(/(?:托运企业|货主(?!费用|计费|结算))(?:改为|为|是|[:：])?\s*([^，。,；;\s]+)/)
  if (shipper) set(basic, 'shipper', shipper[1], '托运企业')
  else if (/福建大道成/.test(text)) set(basic, 'shipper', '福建大道成国际联运有限公司', '托运企业')
  else if (/福建万维宇宙/.test(text)) set(basic, 'shipper', '福建万维宇宙科技有限公司', '托运企业')
  const contact = text.match(/联系人(?:改为|为|是|[:：])?\s*([^，。,；;\s\d]{2,8})/)
  if (contact) set(basic, 'contact', contact[1], '联系人')
  const phone = text.match(/(?:电话|手机(?:号)?)(?:改为|为|是|[:：])?\s*(1[3-9]\d{9})(?!\d)/)
  if (phone) set(basic, 'phone', phone[1], '联系电话')
  const name = text.match(/计划名(?:称)?(?:改为|为|是|[:：])\s*([^，。,；;]+)/)
  if (name) set(basic, 'planName', name[1], '计划名称')
  const remark = text.match(/备注(?:改为|为|是|[:：])\s*([^。]+)/)
  if (remark) set(basic, 'remark', remark[1], '备注')
  let cargo
  const goods = text.match(/(煤炭|玉米|小麦|铁矿石|石灰石)\s*([\d,]+(?:\.\d+)?)\s*吨/)
  // 两种语序分别提取，避免把其他费用数值作为货重。
  const before = text.match(/([\d,]+(?:\.\d+)?)\s*吨\s*(煤炭|玉米|小麦|铁矿石|石灰石)/)
  const cargoName = goods?.[1] && /^(煤炭|玉米|小麦|铁矿石|石灰石)$/.test(goods[1]) ? goods[1] : before?.[2]
  const amount = cargoName ? Number((goods?.[2] || before?.[1] || '').replaceAll(',', '')) : 0
  if (cargoName && amount > 0) {
    cargo = { id: crypto.randomUUID(), name: cargoName, weight: amount, volume: '', quantity: '', unitPrice: '', totalPrice: '', package: '', remark: '' }
    changed.push('货品与发货重量')
  } else {
    const weight = text.match(/(?:重量|货重)(?:改为|为|是|[:：])?\s*([\d,]+(?:\.\d+)?)\s*吨/)
    if (weight && currentCargo.length === 1 && Number(weight[1].replaceAll(',', '')) > 0) {
      cargo = { ...currentCargo[0], weight: Number(weight[1].replaceAll(',', '')) }; changed.push('发货重量')
    }
  }
  const price = text.match(/(?:每吨|单价)(?:改为|为|是|[:：])?\s*(\d+(?:\.\d+)?)\s*(?:元)?/)
  if (price) { set(fee, 'unitPrice', price[1], '运输单价'); fee.calcType = '单位计费'; fee.calcRule = '按重量'; fee.calcUnit = '吨' }
  if (/卸货重量/.test(text)) set(fee, 'billingBasis', '卸货重量', '计费依据')
  else if (/装货重量/.test(text)) set(fee, 'billingBasis', '装货重量', '计费依据')
  if (/月结/.test(text)) set(fee, 'payType', '月结', '付款类型')
  else if (/到付/.test(text)) set(fee, 'payType', '到付', '付款类型')
  else if (/预付/.test(text)) set(fee, 'payType', '预付', '付款类型')
  let segments
  const first = text.match(segmentPattern)
  if (first) {
    const activeCargo = cargo || (currentCargo.length === 1 ? currentCargo[0] : null)
    segments = [makeSegment(first[1].trim(), first[3].trim(), first[2], activeCargo)]
    const remaining = text.slice(first.index + first[0].length)
    for (const next of remaining.matchAll(/再(汽运|公路|水运|铁路|铁运)(?:到|至)([^，。,；;]+)/g)) {
      segments.push(makeSegment(segments.at(-1).nodes.at(-1).address, next[2].trim(), next[1], activeCargo))
    }
    segments.forEach((item, index) => { item.name = `路程${index + 1}` })
    changed.push(`${segments.length} 段运输路线`)
    if (!basic.planName && /创建|新建/.test(text)) set(basic, 'planName', `${first[1].trim()}至${segments.at(-1).nodes[1].address}联运计划`, '计划名称')
  }
  return { basic, cargo, fee, segments, changed }
}

export function missingPlanFields({ basic, cargo, segments, fee, feeEnabled = true }) {
  const missing = []
  for (const [key, label] of [['planName', '计划名称'], ['shipper', '托运企业'], ['contact', '联系人'], ['phone', '联系电话']]) if (!String(basic[key] || '').trim()) missing.push(label)
  if (basic.phone && !/^1[3-9]\d{9}$/.test(basic.phone)) missing.push('有效的联系电话')
  if (!cargo.length || cargo.some(row => !row.name || !(Number(row.weight) > 0))) missing.push('货品及发货重量')
  if (!segments.length || segments.some(segment => segment.nodes.length < 2 || segment.nodes.some(node => !node.address))) missing.push('完整运输路线')
  if (segments.some((segment, index) => index > 0 && segments[index - 1].nodes.at(-1)?.address !== segment.nodes[0]?.address)) missing.push('前后衔接的中转节点')
  if (feeEnabled && fee.calcType === '单位计费' && (fee.unitPrice === '' || !Number.isFinite(Number(fee.unitPrice)) || Number(fee.unitPrice) < 0)) missing.push('运输单价')
  return missing
}

export function planReviewRows({ basic, cargo, segments, fee, feeEnabled }) {
  return [
    ['托运企业', basic.shipper], ['计划名称', basic.planName],
    ['货品与发货量', cargo.map(row => `${row.name} ${row.weight} 吨`).join('、')],
    ...segments.map((segment, index) => [`路程 ${index + 1} · ${segment.mode}`, segment.nodes.map(node => node.address).join(' → ')]),
    ['联系信息', `${basic.contact} · ${basic.phone}`],
    ['货主费用', feeEnabled ? `${fee.calcType} · ${fee.billingBasis} · ${fee.unitPrice || '待设置'} 元/${fee.calcUnit} · ${fee.payType}` : '暂不配置'],
  ]
}

export function planNextReply(plan, { feeConfirmed, exampleFlow, acknowledgement = '' }) {
  const missing = missingPlanFields(plan)
  const reply = { role: 'assistant', text: acknowledgement, choices: [] }
  const ask = text => { reply.text = [acknowledgement, text].filter(Boolean).join('\n\n'); return reply }
  if (missing.includes('托运企业') || missing.includes('货品及发货重量')) {
    return ask('这份计划由哪家企业托运，运输什么货品、多少吨？例如“托运企业为福建大道成，煤炭1000吨”。')
  }
  if (missing.includes('完整运输路线')) {
    if (exampleFlow) reply.choices = [{ title: '三明矿区 → 福州港 → 上海港', description: '第一段汽运，第二段水运', value: '从三明矿区汽运到福州港，再水运到上海港' }]
    return ask('请补充起运地、中转地、目的地和各段运输方式。我会分别建立路程，并将同一批货物带入各段装卸节点。')
  }
  if (missing.includes('前后衔接的中转节点')) return ask('前一段卸货地与下一段装货地不一致，请核对中转节点，或重新告诉我完整路线。')
  if (missing.includes('计划名称')) return ask('请给这份计划起一个名称，例如“计划名称为三明至上海煤炭联运计划”。')
  if (missing.some(label => ['联系人', '联系电话', '有效的联系电话'].includes(label))) {
    if (exampleFlow) reply.choices = [{ title: '填入联系人示例', description: '张伟 · 13800138000', value: '联系人张伟，电话13800138000' }]
    return ask(`路线已按 ${plan.segments.length} 段衔接。${plan.basic.contact ? `联系人为${plan.basic.contact}，请补充有效的11位手机号。` : '本次计划的联系人和联系电话是什么？'}节点作业联系人可在路线中另行安排。`)
  }
  if (!feeConfirmed || missing.includes('运输单价')) {
    if (exampleFlow) reply.choices.push({ title: '按卸货重量计费，月结', description: '运输单价 150 元/吨', value: '按卸货重量每吨150元，月结' })
    reply.choices.push({ title: '暂不配置货主费用', description: '关闭本页货主费用设置', value: '暂不配置货主费用' })
    return ask('货主运输费用按什么口径计算？请说明计费依据、单价和付款类型；也可以暂不配置货主费用。')
  }
  reply.review = true
  reply.reviewRows = planReviewRows(plan)
  const hasUnscheduledNodes = plan.segments.some(segment => segment.nodes.some(node => !node.workTime || !node.contact || !node.phone))
  return ask(`计划信息已整理完成，请核对下方摘要和当前表单。${plan.feeEnabled ? `本次按${plan.fee.billingBasis}计费，实际运输数据尚未产生，费用待后续核算。` : '本次暂不配置货主费用。'}\n${hasUnscheduledNodes ? '尚未填写的节点作业时间、作业联系人可按调度安排补充。' : ''}确认后可关闭对话框，点击页面底部“提交”。也可以继续告诉我需要修改的内容。`)
}
