export const STATUS_LABELS = Object.freeze({
  in_progress: '进行中',
  completed: '已完成',
})

export function getRouteDecision(routeKind, isDev) {
  if (routeKind === 'root') return isDev ? 'manage' : 'allow'
  if ((routeKind === 'manage' || routeKind === 'legacy' || routeKind === 'prototypeCatalog') && !isDev) return 'root'
  return 'allow'
}

export function prepareReviewPages(version, pageCatalog) {
  const catalog = new Map((pageCatalog || []).map(page => [page.key, page]))
  return [...(version?.pages || [])]
    .sort((left, right) => left.order - right.order)
    .map(entry => {
      const page = catalog.get(entry.pageKey)
      return page ? { ...page, order: entry.order } : null
    })
    .filter(Boolean)
}

export function sortRevisionBatches(revisions) {
  return [...(revisions || [])].sort((left, right) => {
    const leftNumber = Number(String(left.revision || '').replace(/^R/, ''))
    const rightNumber = Number(String(right.revision || '').replace(/^R/, ''))
    return rightNumber - leftNumber
  })
}

export function formatRevisionLabel(revision) {
  if (!revision || revision === 'pending') return '尚未交付'
  const match = /^R(\d+)$/.exec(String(revision))
  if (!match) return String(revision)
  const revisionNumber = Number(match[1])
  return revisionNumber === 0 ? '首次交付' : `第${revisionNumber}次变更`
}

export function reviewVisibleStatus(status) {
  return ''
}

export function buildReviewPath(versionId) {
  return `/review/${encodeURIComponent(String(versionId))}`
}

export function buildReviewUrl(versionId, origin = '') {
  const path = buildReviewPath(versionId)
  const normalizedOrigin = String(origin || '').trim().replace(/\/$/, '')
  return normalizedOrigin ? `${normalizedOrigin}${path}` : path
}

export function buildPrototypeCatalogPath() {
  return '/manage/prototypes'
}

export function scopeLabel(version, projectMap = new Map()) {
  if (version?.scope === 'common') return '通用'
  return projectMap.get(version?.projectId)?.name || version?.projectId || '定制项目'
}

export function statusTagType(status) {
  return {
    in_progress: 'primary',
    completed: 'success',
  }[status] || 'info'
}
