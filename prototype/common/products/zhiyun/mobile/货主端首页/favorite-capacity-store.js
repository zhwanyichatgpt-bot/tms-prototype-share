import { ref } from 'vue'

import { carriers } from './mock-data.js'
import { favoriteFleets } from './favorite-capacity-data.js'

const SEED_KEY = 'zhiyun:favorite-capacity-seeded'

/* 收藏时间仅用于列表展示，按现有运力补充演示值。 */
const driverFavoriteTimes = {
  c1: '2026-11-05 14:20',
  c2: '2026-11-02 09:15',
  c3: '2026-10-29 18:42',
}

const fleetFavoriteTimes = {
  f1: '2026-10-28 11:05',
  f2: '2026-10-24 16:30',
  f3: '2026-10-20 10:12',
}

export const favoriteCapacityCatalog = [
  ...carriers.map(carrier => ({
    uid: `driver:${carrier.id}`,
    id: carrier.id,
    kind: 'driver',
    carrier,
    favoritedAt: driverFavoriteTimes[carrier.id] || '2026-10-18 09:30',
  })),
  ...favoriteFleets.map(carrier => ({
    uid: `fleet:${carrier.id}`,
    id: carrier.id,
    kind: 'fleet',
    carrier,
    favoritedAt: fleetFavoriteTimes[carrier.id] || '2026-10-18 09:30',
  })),
]

export const favoriteCapacityItems = ref([])

function getStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function favoriteFollowKey(item) {
  const prefix = item.kind === 'fleet' ? 'zhiyun:fleet-follow' : 'zhiyun:driver-follow'
  return `${prefix}:${item.carrier.id}`
}

let seeded = false

/* 与司机/车队详情页共用关注键，保证收藏页与详情页状态一致。 */
export function syncFavoriteCapacity() {
  const store = getStorage()
  if (!store) {
    favoriteCapacityItems.value = [...favoriteCapacityCatalog]
    return
  }
  if (!seeded && store.getItem(SEED_KEY) !== '1') {
    favoriteCapacityCatalog.forEach(item => store.setItem(favoriteFollowKey(item), '1'))
    store.setItem(SEED_KEY, '1')
  }
  seeded = true
  favoriteCapacityItems.value = favoriteCapacityCatalog.filter(item => store.getItem(favoriteFollowKey(item)) === '1')
}

export function removeFavoriteCapacity(uid) {
  const item = favoriteCapacityCatalog.find(entry => entry.uid === uid)
  if (!item) return
  const store = getStorage()
  if (store) store.removeItem(favoriteFollowKey(item))
  syncFavoriteCapacity()
}

syncFavoriteCapacity()
