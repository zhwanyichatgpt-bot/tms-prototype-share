import { reactive } from 'vue'
import { conversationStorageKey } from '../../../../../shared/web/ai-document-analysis/document-analysis.js'
import { refreshSupplementExample } from './supplement-flow.js'

// 业务页与悬浮对话使用同一个会话对象，刷新后从原有对话存储恢复。
const sessions = new Map()
const filesInMemory = new Map()
let database
function fileDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('tms-ai-supplement-files', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('files')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return database
}

export async function retainSupplementFiles(files) {
  return Promise.all(files.map(async item => {
    const file = item.file || item
    const id = item.id || crypto.randomUUID()
    if (file instanceof Blob) {
      filesInMemory.set(id, file)
      try {
        const db = await fileDatabase()
        await new Promise((resolve, reject) => {
          const tx = db.transaction('files', 'readwrite')
          tx.objectStore('files').put(file, id)
          tx.oncomplete = resolve
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(tx.error)
        })
      } catch { /* 浏览器禁止持久存储时，本次页面跳转仍保留附件原件。 */ }
    }
    return { id, name: item.name || file.name, size: file.size || item.size || 0 }
  }))
}

export async function supplementFile(id) {
  if (filesInMemory.has(id)) return filesInMemory.get(id)
  try {
    const db = await fileDatabase()
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch { return null }
}

export function saveSupplementSession(session) {
  sessions.set(session.id, session)
  try {
    const saved = JSON.parse(localStorage.getItem(conversationStorageKey) || 'null') || { version: 1, sessions: [] }
    saved.sessions = saved.sessions || []
    const index = saved.sessions.findIndex(item => item.id === session.id)
    const snapshot = JSON.parse(JSON.stringify(session))
    if (index < 0) saved.sessions.unshift(snapshot)
    else saved.sessions[index] = snapshot
    localStorage.setItem(conversationStorageKey, JSON.stringify(saved))
    return true
  } catch { return false }
}

export function loadSupplementSession(id) {
  if (typeof id !== 'string') return null
  if (sessions.has(id)) return sessions.get(id)
  try {
    const saved = JSON.parse(localStorage.getItem(conversationStorageKey) || 'null')
    const session = saved?.sessions?.find(item => item.id === id && item.supplement?.loaded)
    if (!session?.supplement?.groups?.some(group => group.matched)) return null
    refreshSupplementExample(session.supplement, session.messages)
    const current = reactive(session)
    sessions.set(id, current)
    return current
  } catch { return null }
}
