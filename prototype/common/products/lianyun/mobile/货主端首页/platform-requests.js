import { reactive, watch } from 'vue'

// 仅保存本机原型需求，不调用服务商或订单接口。
const storageKey = 'lianyun-platform-requests-v1'
const statuses = ['draft', 'submitted', 'withdrawn']
let initial = []
try {
  const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]')
  if (Array.isArray(parsed)) initial = parsed.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string' && typeof item.title === 'string' && statuses.includes(item.status) && ['offer','node','transport','provider'].includes(item.kind) && typeof item.sourceId === 'string' && Array.isArray(item.history) && item.history.every(event => event && typeof event.title === 'string' && typeof event.time === 'string')).slice(0, 100)
} catch { /* 存储不可用时继续使用当前会话。 */ }
export const requestStore = reactive({ items: initial, storageError: false })
watch(() => requestStore.items, items => {
  try { localStorage.setItem(storageKey, JSON.stringify(items)); requestStore.storageError = false }
  catch { requestStore.storageError = true }
}, { deep: true, flush: 'sync' })
export const requestStatus = { draft: '待确认', submitted: '待回复', withdrawn: '已撤回' }
export function saveServiceRequest(target, text, id) {
  const existing = requestStore.items.find(item => item.id === id)
  if (existing && existing.status !== 'draft') return existing
  const now = new Date().toISOString()
  if (existing) { existing.text = text.trim(); existing.updatedAt = now; return existing }
  const record = { ...target, id: crypto.randomUUID(), text: text.trim(), status: 'draft', updatedAt: now, history: [{ title: '保存需求', time: now }] }
  requestStore.items.unshift(record)
  return record
}
export function changeRequestStatus(record, status) {
  if (!((record.status === 'draft' && status === 'submitted') || (record.status === 'submitted' && status === 'withdrawn') || (record.status === 'withdrawn' && status === 'draft'))) return
  record.status = status
  record.updatedAt = new Date().toISOString()
  record.history.push({ title: { submitted: '确认需求，等待回复', withdrawn: '撤回需求', draft: '重新编辑需求' }[status], time: record.updatedAt })
}
