import type { AnnotationItem, AnnotationContainer } from './types'

type Layer = { kind: AnnotationContainer; root: Element | null }
export type Point = { x: number; y: number }
export type Badge = { item: AnnotationItem; origin: Point }
const modal = '[data-annotation-container="modal"], .el-overlay-dialog, .el-overlay-message-box, .ant-modal-wrap, .van-dialog, .t-dialog__wrap, .n-modal-container, dialog[open]'
const drawer = '[data-annotation-container="drawer"], .el-drawer, .ant-drawer-content-wrapper, .van-popup--left, .van-popup--right, .van-popup--top, .van-popup--bottom, .t-drawer, .n-drawer'
const layers = modal + ', ' + drawer

function isVisible(el: Element) {
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return false
  if (el.checkVisibility) return el.checkVisibility({visibilityProperty: true, opacityProperty: true})
  return getComputedStyle(el).visibility !== 'hidden'
}

function stackOrder(el: Element) {
  const levels: number[] = []
  for (let node: Element | null = el; node; node = node.parentElement) {
    const z = getComputedStyle(node).zIndex
    if (z !== 'auto') levels.unshift(Number(z) || 0)
  }
  return levels
}

export function currentLayer(): Layer {
  let root: Element | null = null
  let order: number[] = []
  for (const el of document.querySelectorAll(layers)) {
    if (!isVisible(el)) continue
    const candidate = stackOrder(el)
    let difference = 0
    for (let i = 0; !difference && i < Math.max(candidate.length, order.length); i++) {
      difference = (candidate[i] || 0) - (order[i] || 0)
    }
    if (difference >= 0) { root = el; order = candidate }
  }
  return {root, kind: root ? (root.matches(drawer) ? 'drawer' : 'modal') : 'page'}
}

function findHost(selector: string, root: Element) {
  if (!selector) return null
  try {
    const matches = root.matches(selector) ? [root] : Array.from(root.querySelectorAll(selector))
    const visible = matches.filter(isVisible)
    return visible.length === 1 ? visible[0] : null
  } catch { return null }
}

export function visibleBadges(items: AnnotationItem[], layer: Layer, editing: boolean): Badge[] {
  const root = layer.root || document.querySelector('.prototype-workbench-canvas')
  if (!root) return []
  const candidates = items.filter(item => (item.container || 'page') === layer.kind)
  const knownGroups = new Set<string>()
  const activeGroups = new Set<string>()
  const origins = new Map<string, Point>()
  const stacks = new Map<Element, number>()
  for (const item of candidates) {
    if (item.type !== 'selector') continue
    if (item.group) knownGroups.add(item.group)
    const host = findHost(item.selector, root)
    if (!host) continue
    if (item.group) activeGroups.add(item.group)
    const r = host.getBoundingClientRect()
    const stack = stacks.get(host) || 0
    stacks.set(host, stack + 1)
    if (item.anchorPoint) {
      origins.set(item.id, {x: r.left + r.width * item.anchorPoint.x - 9, y: r.top + r.height * item.anchorPoint.y - 9})
    } else {
      const right = r.width < 180 && r.right + 23 < innerWidth
      origins.set(item.id, {x: right ? r.right + 5 : Math.max(4, r.left - 23), y: r.top + 2 + stack * 20})
    }
  }
  const result: Badge[] = []
  for (const item of candidates) {
    if (item.type === 'position') {
      if (item.group && knownGroups.has(item.group) && !activeGroups.has(item.group)) continue
      if (!editing && !item.position.x && !item.position.y) continue
      result.push({item, origin: {x: -9, y: -9}})
    } else {
      const origin = origins.get(item.id)
      if (origin) result.push({item, origin})
    }
  }
  return result
}
