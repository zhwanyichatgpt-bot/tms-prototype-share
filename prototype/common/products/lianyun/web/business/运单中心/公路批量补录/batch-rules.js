/**
 * 公路批量补录校验规则。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 *
 * 规则：箱号必须落在任务候选池内、属于行内所选箱型、且批内不重复；箱型、司机、车牌必填；
 * 作业时间按任务路线派生、全部选填，但填写后须格式正确且按路线顺序递增；重量选填。
 */

const SLOT_LABELS = ['①', '②']

export function normalizeTime(value) {
  const text = String(value ?? '').trim()
  if (!text) return Number.NaN
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[\sT]+(\d{1,2}):(\d{2})$/)
  if (!match) return Number.NaN
  const [, year, month, day, hour, minute] = match
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime()
}

export function boxSlots(row) {
  return (row?.boxes || []).map((box, index) => ({
    index,
    label: SLOT_LABELS[index] || '',
    containerNo: String(box?.containerNo || '').trim(),
  }))
}

export function buildBoxOwners(rows) {
  const owners = new Map()
  rows.forEach(row => {
    boxSlots(row).forEach(slot => {
      if (!slot.containerNo) return
      if (!owners.has(slot.containerNo)) owners.set(slot.containerNo, [])
      owners.get(slot.containerNo).push(row.key)
    })
  })
  return owners
}

/* 箱号 → 所属箱型，用于校验一个车次内箱号与所选箱型一致。 */
export function buildBoxContainerKeyMap(poolBoxes) {
  const map = new Map()
  ;(poolBoxes || []).forEach(box => {
    if (box.containerNo) map.set(box.containerNo, box.containerKey)
  })
  return map
}

/**
 * @param {object} row 车次行
 * @param {object} context
 * @param {Set<string>} context.pool 任务候选箱号
 * @param {Map<string, string>} [context.boxContainerKey] 箱号 → 所属箱型
 * @param {Map<string, string[]>} [context.boxOwners] 批内箱号占用（仅批量场景）
 * @param {Array<{key:string,label:string}>} context.nodeSequence 节点顺序
 * @returns {string[]} 错误文案
 */
export function validateRow(row, context) {
  const { pool, boxOwners, nodeSequence, boxContainerKey } = context
  const errors = []

  const containerKey = String(row.containerKey || '').trim()
  if (!containerKey) errors.push('箱型必填')
  if (!String(row.driver || '').trim()) errors.push('司机必填')
  if (!String(row.plateNo || '').trim()) errors.push('车牌号必填')

  const slots = boxSlots(row)
  const filled = slots.filter(slot => slot.containerNo)
  if (!filled.length) errors.push('至少填写 1 个实际箱号')
  slots.forEach(slot => {
    if (!slot.containerNo) return
    if (pool && !pool.has(slot.containerNo)) errors.push('箱号' + slot.label + '不在任务候选箱池内')
    if (boxContainerKey && containerKey) {
      const ownerKey = boxContainerKey.get(slot.containerNo)
      if (ownerKey && ownerKey !== containerKey) errors.push('箱号' + slot.label + '箱型与本车次所选箱型不一致')
    }
    if (boxOwners && (boxOwners.get(slot.containerNo) || []).length > 1) errors.push('箱号' + slot.label + '在本批次内重复')
  })

  const stamps = (nodeSequence || []).map(node => ({
    label: node.label,
    raw: String(row.times?.[node.key] ?? '').trim(),
    value: normalizeTime(row.times?.[node.key]),
  }))
  /* 时间全部选填；填写后须可解析，并按任务路线顺序递增。 */
  const filledTimes = stamps.filter(item => item.raw)
  filledTimes.forEach(item => {
    if (Number.isNaN(item.value)) errors.push(item.label + '时间格式不正确')
  })
  const validTimes = filledTimes.filter(item => !Number.isNaN(item.value))
  for (let index = 1; index < validTimes.length; index += 1) {
    if (validTimes[index].value < validTimes[index - 1].value) {
      errors.push(validTimes[index].label + '时间早于' + validTimes[index - 1].label + '时间')
    }
  }

  return errors
}

export function buildValidationMap(rows, context) {
  const map = new Map()
  rows.forEach(row => {
    map.set(row.key, validateRow(row, context))
  })
  return map
}
