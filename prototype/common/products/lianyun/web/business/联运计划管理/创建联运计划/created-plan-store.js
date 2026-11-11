const storageKey = versionId => `tms-ai-created-plans:${versionId || 'prototype'}`
export function loadCreatedPlans(versionId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(versionId)) || '[]')
    return Array.isArray(saved) ? saved.filter(item => item.id && item.progress && Array.isArray(item.segments)) : []
  } catch { return [] }
}
export function saveCreatedPlan(snapshot, versionId) {
  const { basic, cargo, segments, fee } = snapshot
  const modes = [...new Set(segments.map(segment => segment.mode))]
  const modeLabels = { 汽运: '公', 水运: '水', 铁运: '铁' }
  const cargoText = cargo.map(row => `${row.name} ${row.weight}吨`).join('、')
  const plan = {
    id: `LY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title: basic.planName,
    combineTag: modes.map(mode => modeLabels[mode] || mode).join('') + '联运', changeTag: '—', status: '待审批',
    progress: { percent: 0, legs: segments.map(segment => segment.mode) },
    loadAddr: { alias: segments[0].nodes[0].address, time: segments[0].nodes[0].workTime || '待安排' },
    unloadAddr: { alias: segments.at(-1).nodes.at(-1).address, time: segments.at(-1).nodes.at(-1).workTime || '待安排' },
    settleStatus: '未结算', carrier: { logoText: '—', name: '待确定承运企业' },
    waybillName: basic.waybillNo || '未关联托运单', cargo: cargoText, containers: '—',
    unitPrice: fee.unitPrice === '' ? '待配置' : `${fee.unitPrice}元/吨`, baseFreight: '待核算',
    creator: '当前用户', createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    segments: segments.map(segment => ({ ...segment, status: '待执行', nodes: segment.nodes.map(node => ({ type: node.type, city: node.address, address: node.address, timeLabel: node.type === '装' ? '装货时间' : '卸货时间', time: node.workTime || '待安排', cargo: cargoText })) })),
    snapshot: JSON.parse(JSON.stringify(snapshot)), expanded: false,
  }
  localStorage.setItem(storageKey(versionId), JSON.stringify([plan, ...loadCreatedPlans(versionId)]))
  return plan
}
