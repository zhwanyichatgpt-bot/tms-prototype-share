import { reactive, toRaw } from 'vue'

// 原文件存入浏览器数据库，模板目录只保存可匹配的业务信息。
export const settlementTemplates = reactive([])
const sample = {
  id: 'statement-example', name: '福建大道成运输对账单（示例）', version: 'V1.0',
  party: '福建大道成国际联运有限公司', direction: '托运方', enabled: true, example: true,
  fileName: '运输对账单_示例模板.xlsx', url: '/ai-workbench-assets/templates/settlement-statement-example.xlsx',
}
const database = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('tms-settlement-templates', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('templates', { keyPath: 'id' })
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(new Error('无法打开本地模板库，请检查浏览器存储设置。'))
})
async function store(action, value) {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('templates', action === 'getAll' ? 'readonly' : 'readwrite')
      const request = tx.objectStore('templates')[action](...(value ? [value] : []))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(new Error('模板保存失败，请检查浏览器可用空间。'))
      tx.onabort = () => reject(new Error('模板保存未完成，请重试。'))
    })
  } finally { db.close() }
}
export const templatesReady = (async () => {
  try {
    const saved = await store('getAll')
    const savedSample = saved.find(item => item.id === sample.id)
    settlementTemplates.push({ ...sample, enabled: savedSample?.enabled ?? true }, ...saved.filter(item => item.id !== sample.id))
  } catch { settlementTemplates.push({ ...sample }) }
})()

export const templateFields = [
  ['seq', '序号'], ['planNumber', '计划编号'], ['id', '运单号'], ['plate', '车牌号'], ['driver', '司机'],
  ['goods', '货品'], ['load', '装货量'], ['unload', '卸货量'], ['weight', '计价量'], ['price', '单价'],
  ['basic', '基础运费'], ['loss', '路耗扣减'], ['amount', '核算金额'], ['settleDate', '结算日期'],
]
const aliases = {
  序号: 'seq', 计划编号: 'planNumber', 计划号: 'planNumber', 运单号: 'id', 运单编号: 'id',
  车牌号: 'plate', 车牌: 'plate', 司机: 'driver', 司机姓名: 'driver', 货品: 'goods', 货物: 'goods',
  装货量: 'load', 装货重量: 'load', 卸货量: 'unload', 卸货重量: 'unload', 计价量: 'weight', 计费重量: 'weight',
  单价: 'price', 计费单价: 'price', 基础运费: 'basic', 路耗: 'loss', 路耗扣减: 'loss',
  核算金额: 'amount', 结算金额: 'amount', 核算运费: 'amount', 金额: 'amount', 结算日期: 'settleDate',
}
const textOf = cell => typeof cell.value === 'string' ? cell.value : cell.value?.richText?.map(item => item.text).join('') || ''
const normalize = value => value.replace(/[（(].*?[）)]/g, '').replace(/\s/g, '').replace(/[*＊]/g, '')
async function loadWorkbook(bytes) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  try { await workbook.xlsx.load(bytes) }
  catch { throw new Error('模板无法读取，请确认是有效且未加密的 .xlsx 文件。') }
  return workbook
}
function layoutOf(workbook) {
  const matches = []
  workbook.eachSheet(sheet => {
    if (sheet.rowCount > 500 || sheet.columnCount > 60) throw new Error('模板过大，请使用不超过 500 行、60 列的空白对账模板。')
    sheet.eachRow((row, index) => {
      const columns = []
      row.eachCell((cell, column) => {
        const label = textOf(cell)
        const field = aliases[normalize(label)]
        if (field) columns.push({ column, field, label })
      })
      if (columns.some(item => item.field === 'id') && columns.some(item => item.field === 'amount')) matches.push({ sheet: sheet.name, header: index, columns })
    })
  })
  if (matches.length !== 1) throw new Error('请使用一个明细表头的空白模板，至少包含“运单号”和“核算金额”；可先下载示例模板。')
  const layout = matches[0]
  const sheet = workbook.getWorksheet(layout.sheet)
  const row = sheet.getRow(layout.header + 1)
  if (row.values.some(value => value !== null && value !== undefined && value !== '')) throw new Error('表头下一行需保留为空白明细行，请先移除模板中的历史运单。')
  if (new Set(layout.columns.map(item => item.field)).size !== layout.columns.length) throw new Error('模板中存在重复的明细字段，请核对列标题。')
  const idColumn = layout.columns.find(item => item.field === 'id').column
  workbook.eachSheet(item => item.eachRow((record, index) => record.eachCell(cell => {
    if (cell.isMerged && cell.master.address !== cell.address) return
    if (cell.value?.formula && !(item === sheet && index > layout.header + 1 && /^SUM\([A-Z]+\d+:[A-Z]+\d+\)$/i.test(cell.value.formula))) throw new Error('当前支持空白明细和 SUM 合计的模板；其他计算公式请改为已确认的结算字段后上传。')
    if (item === sheet && index > layout.header + 1 && cell.col === idColumn && cell.value && !cell.isMerged) throw new Error('模板中仍有运单数据，请先清空历史明细，只保留一行空白明细与合计。')
  })))
  // 插入明细不能覆盖合并表头、脚注或历史数据。
  for (const merge of sheet.model.merges || []) {
    const [start, end = start] = merge.split(':').map(address => Number(address.match(/\d+/)[0]))
    if (start <= layout.header + 1 && end >= layout.header + 1) throw new Error('空白明细行不能含合并单元格，请调整模板后上传。')
  }
  return layout
}
export async function inspectTemplate(file) {
  if (!/\.xlsx$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw new Error('请选择 2 MB 以内的 .xlsx 空白模板。')
  return layoutOf(await loadWorkbook(await file.arrayBuffer()))
}
export async function saveTemplate(file, metadata, layout) {
  const entry = { ...metadata, id: 'statement-' + crypto.randomUUID(), enabled: true, example: false, fileName: file.name, blob: file, layout: JSON.parse(JSON.stringify(layout)) }
  await store('put', entry)
  settlementTemplates.push(entry)
  return entry
}
export async function setTemplateEnabled(entry, enabled) {
  const stored = entry.example ? { id: entry.id, enabled } : { ...toRaw(entry), layout: JSON.parse(JSON.stringify(entry.layout)), enabled }
  await store('put', stored)
  entry.enabled = enabled
}
export async function templateBytes(template) {
  if (template.blob) return template.blob.arrayBuffer()
  const response = await fetch(template.url)
  if (!response.ok) throw new Error('模板原文件暂时无法读取，请重试。')
  return response.arrayBuffer()
}
export function matchingTemplates(snapshot) {
  return settlementTemplates.filter(item => item.enabled && item.party === snapshot.party && item.direction === snapshot.settleObject)
}
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = fileName
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
export async function downloadTemplate(template) {
  downloadBlob(new Blob([await templateBytes(template)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), template.fileName)
}
export async function exportStatement(template, snapshot) {
  const workbook = await loadWorkbook(await templateBytes(template))
  const layout = layoutOf(workbook)
  const sheet = workbook.getWorksheet(layout.sheet)
  const first = layout.header + 1
  const extra = snapshot.rows.length - 1
  const styleRow = sheet.getRow(first)
  const styles = Array.from({ length: sheet.columnCount }, (_, i) => structuredClone(styleRow.getCell(i + 1).style))
  const height = styleRow.height
  if (extra > 0) {
    const merges = [...sheet.model.merges]
    merges.forEach(range => sheet.unMergeCells(range))
    sheet.spliceRows(first + 1, 0, ...Array.from({ length: extra }, () => []))
    for (const range of merges) sheet.mergeCells(range.replace(/([A-Z]+)(\d+)/g, (_, col, row) => col + (Number(row) > first ? Number(row) + extra : row)))
  }
  snapshot.rows.forEach((record, index) => {
    const row = sheet.getRow(first + index)
    row.height = height
    styles.forEach((style, i) => { row.getCell(i + 1).style = structuredClone(style) })
    for (const { column, field } of layout.columns) {
      const cell = row.getCell(column)
      cell.value = field === 'seq' ? index + 1 : field === 'settleDate' ? new Date(snapshot.settleDate + 'T00:00:00Z') : record[field] ?? ''
      if (field === 'settleDate') cell.numFmt = 'yyyy-mm-dd'
      if (['load', 'unload', 'weight', 'price', 'basic', 'loss', 'amount'].includes(field)) { cell.numFmt = '#,##0.00'; cell.alignment = { ...cell.alignment, horizontal: 'right' } }
      if (['id', 'planNumber', 'plate'].includes(field)) { cell.numFmt = '@'; cell.alignment = { ...cell.alignment, horizontal: 'left' } }
    }
  })
  // 支持模板原有的明细 SUM 合计，插入行后明确更新范围及缓存值。
  sheet.eachRow((row, index) => {
    if (index < first + snapshot.rows.length) return
    row.eachCell(cell => {
      const match = cell.value?.formula?.match(/^SUM\(([A-Z]+)\d+:([A-Z]+)\d+\)$/i)
      if (!match) return
      if (match[1] !== match[2]) throw new Error('合计公式需要按单列明细求和，请调整模板。')
      const col = sheet.getColumn(match[1]).number
      const result = snapshot.rows.reduce((sum, _, i) => sum + (typeof sheet.getCell(first + i, col).value === 'number' ? sheet.getCell(first + i, col).value : 0), 0)
      cell.value = { formula: `SUM(${match[1]}${first}:${match[1]}${first + snapshot.rows.length - 1})`, result: Math.round(result * 100) / 100 }
    })
  })
  const metadata = { ...snapshot, rows: undefined, plans: undefined }
  workbook.eachSheet(item => item.eachRow(row => row.eachCell(cell => {
    if (cell.isMerged && cell.master.address !== cell.address) return
    const text = textOf(cell)
    if (!text.includes('{{')) return
    const exact = text.match(/^\{\{(\w+)\}\}$/)
    if (exact && Object.hasOwn(metadata, exact[1])) cell.value = metadata[exact[1]] ?? ''
    else cell.value = text.replace(/\{\{(\w+)\}\}/g, (token, key) => Object.hasOwn(metadata, key) ? String(metadata[key] ?? '') : token)
  })))
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return { blob, fileName: `运输对账单_${snapshot.party}_${snapshot.no}.xlsx`, templateName: template.name, version: template.version, example: template.example, count: snapshot.count, total: snapshot.total, no: snapshot.no }
}
