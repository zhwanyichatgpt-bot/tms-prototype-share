import { reactive } from 'vue'

// 收藏仅保存当前浏览器中的对象标识，不生成订单或向服务企业发送信息。
const storageKey = 'lianyun-platform-favorites-v1'
const normalize = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && id.length > 0))].slice(0, 500) : []
let initial = {}
try { initial = JSON.parse(localStorage.getItem(storageKey) || '{}') || {} }
catch { /* 损坏或不可读的记录按空收藏处理。 */ }
export const favoriteStore = reactive({ services: normalize(initial.services), providers: normalize(initial.providers), storageError: false })
export function isFavorite(kind, id) {
  return ['services', 'providers'].includes(kind) && favoriteStore[kind].includes(id)
}
export function toggleFavorite(kind, id) {
  if (!['services', 'providers'].includes(kind) || typeof id !== 'string' || !id) return false
  const saved = !isFavorite(kind, id)
  favoriteStore[kind] = saved ? [id, ...favoriteStore[kind]] : favoriteStore[kind].filter(item => item !== id)
  try {
    localStorage.setItem(storageKey, JSON.stringify({ services: favoriteStore.services, providers: favoriteStore.providers }))
    favoriteStore.storageError = false
  } catch { favoriteStore.storageError = true }
  return saved
}
