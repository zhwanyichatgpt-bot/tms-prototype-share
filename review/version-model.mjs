export const VERSION_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
})

export const VERSION_STATUS_LABELS = Object.freeze({
  in_progress: '进行中',
  completed: '已完成',
})

const VERSION_PATCH_FIELDS = new Set([
  'name',
  'baseVersionId',
  'targetReleaseDate',
  'pages',
])

export class ReviewValidationError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'ReviewValidationError'
    this.code = code
    this.status = status
  }
}

function fail(code, message, status) {
  throw new ReviewValidationError(code, message, status)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, field, code = 'INVALID_VERSION') {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) fail(code, `${field}不能为空`)
  return text
}

function normalizeOptionalText(value) {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim() || null
}

function validateScope(scope, projectId) {
  if (scope !== 'common' && scope !== 'project') {
    fail('INVALID_SCOPE', '需求归属必须为 common 或 project')
  }

  if (scope === 'common' && projectId) {
    fail('INVALID_PROJECT_CONTEXT', '通用版本不能绑定定制项目')
  }

  if (scope === 'project' && !projectId) {
    fail('PROJECT_REQUIRED', '定制版本必须指定所属项目')
  }
}

function validateDate(value, field, { allowEmpty = true } = {}) {
  if (!value && allowEmpty) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    fail('INVALID_DATE', `${field}必须使用 YYYY-MM-DD 格式`)
  }
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail('INVALID_DATE', `${field}不是有效日期`)
  }
  return value
}

function validateTimestamp(value) {
  const parsed = new Date(value)
  if (!value || Number.isNaN(parsed.getTime())) {
    fail('INVALID_TIMESTAMP', '时间信息无效')
  }
  return parsed.toISOString()
}

export function assertSafeSegment(value) {
  const segment = String(value || '')
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(segment)) {
    fail('INVALID_PATH_SEGMENT', '路径标识只允许英文、数字、下划线和连字符')
  }
  return segment
}

export function generateVersionId({ scope, projectId = null, existingIds = [], now = new Date().toISOString() }) {
  validateScope(scope, projectId)
  const timestamp = validateTimestamp(now)
  const yearMonth = timestamp.slice(0, 7).replace('-', '')
  const owner = scope === 'common' ? 'COMMON' : assertSafeSegment(projectId).toUpperCase()
  const prefix = `TMS-${owner}-${yearMonth}-`
  const sequence = existingIds.reduce((highest, id) => {
    if (!String(id).startsWith(prefix)) return highest
    const value = Number(String(id).slice(prefix.length))
    return Number.isInteger(value) ? Math.max(highest, value) : highest
  }, 0) + 1

  return `${prefix}${String(sequence).padStart(2, '0')}`
}

export function validateVersionPages(version, pageCatalog) {
  validateScope(version.scope, version.projectId)
  const pages = Array.isArray(version.pages) ? version.pages : []
  const catalog = new Map((Array.isArray(pageCatalog) ? pageCatalog : []).map(page => [page.key, page]))
  const pageKeys = new Set()
  const orders = new Set()

  for (const entry of pages) {
    const pageKey = requiredText(entry?.pageKey, 'pageKey', 'INVALID_PAGE_ENTRY')
    const order = Number(entry?.order)
    if (!Number.isInteger(order) || order < 1) {
      fail('INVALID_PAGE_ORDER', `页面 ${pageKey} 的顺序必须为正整数`)
    }
    if (pageKeys.has(pageKey)) fail('DUPLICATE_PAGE', `页面 ${pageKey} 不能重复选择`)
    if (orders.has(order)) fail('DUPLICATE_PAGE_ORDER', `页面顺序 ${order} 不能重复`)
    pageKeys.add(pageKey)
    orders.add(order)

    const page = catalog.get(pageKey)
    if (!page) fail('PAGE_NOT_FOUND', `页面 ${pageKey} 不在原型注册表中`)

  }

  return pages.map(entry => ({ pageKey: String(entry.pageKey), order: Number(entry.order) }))
}

function normalizeVersionInput(input, pageCatalog) {
  const scope = input?.scope
  const projectId = normalizeOptionalText(input?.projectId)
  validateScope(scope, projectId)
  const version = {
    name: requiredText(input?.name, '版本名称'),
    scope,
    projectId: scope === 'common' ? null : assertSafeSegment(projectId).toLowerCase(),
    baseVersionId: normalizeOptionalText(input?.baseVersionId),
    targetReleaseDate: validateDate(input?.targetReleaseDate, '计划上线日期'),
    pages: Array.isArray(input?.pages) ? clone(input.pages) : [],
  }
  version.pages = validateVersionPages(version, pageCatalog)
  return version
}

export function createReviewVersion(input, { existingIds = [], pageCatalog = [], now = new Date().toISOString() } = {}) {
  const timestamp = validateTimestamp(now)
  const normalized = normalizeVersionInput(input, pageCatalog)
  return {
    id: generateVersionId({
      scope: normalized.scope,
      projectId: normalized.projectId,
      existingIds,
      now: timestamp,
    }),
    ...normalized,
    status: VERSION_STATUS.IN_PROGRESS,
    revision: 'pending',
    publishedAt: null,
    lastPublishedAt: null,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function updateDraftVersion(version, patch, pageCatalog, now = new Date().toISOString()) {
  if (version?.revision !== 'pending') {
    fail('REVISION_REQUIRED', 'R0 后的研发影响修改必须创建修订批次', 409)
  }

  const nextInput = { ...clone(version) }
  for (const [key, value] of Object.entries(patch || {})) {
    if (!VERSION_PATCH_FIELDS.has(key)) fail('INVALID_VERSION_PATCH', `不允许修改字段 ${key}`)
    nextInput[key] = value
  }
  const normalized = normalizeVersionInput(nextInput, pageCatalog)
  return {
    ...clone(version),
    ...normalized,
    updatedAt: validateTimestamp(now),
  }
}

function initialRevision(version, timestamp) {
  return {
    revision: 'R0',
    date: timestamp,
    reason: '首次发布研发地址',
    items: [{
      type: 'initial_delivery',
      pageKeys: version.pages.map(page => page.pageKey),
      before: '未发布研发地址',
      after: `发布 ${version.pages.length} 个原型页面`,
      devImpact: '请以本版本原型和标注作为本次研发依据',
    }],
  }
}

export function publishReviewVersion(version, now = new Date().toISOString()) {
  if (version.publishedAt || version.revision !== 'pending') {
    fail('REVIEW_ADDRESS_ALREADY_PUBLISHED', '研发地址已经生成，可直接复制使用', 409)
  }
  const timestamp = validateTimestamp(now)
  const next = {
    ...clone(version),
    publishedAt: version.publishedAt || timestamp,
    lastPublishedAt: timestamp,
    updatedAt: timestamp,
  }
  let revisionBatch = null

  if (!version.targetReleaseDate) fail('RELEASE_DATE_REQUIRED', '生成研发地址前必须填写计划上线日期')
  if (!Array.isArray(version.pages) || version.pages.length === 0) {
    fail('VERSION_PAGES_REQUIRED', '生成研发地址前必须至少选择一个页面')
  }
  next.revision = 'R0'
  revisionBatch = initialRevision(next, timestamp)

  return { version: next, revisionBatch }
}

export function markVersionCompleted(version, now = new Date().toISOString()) {
  if (version?.status === VERSION_STATUS.COMPLETED) {
    fail('VERSION_ALREADY_COMPLETED', '版本已经标记完成', 409)
  }
  const timestamp = validateTimestamp(now)
  return {
    ...clone(version),
    status: VERSION_STATUS.COMPLETED,
    completedAt: timestamp,
    updatedAt: timestamp,
  }
}

function nextRevision(current) {
  const match = /^R(\d+)$/.exec(String(current || ''))
  if (!match) fail('REVISION_NOT_INITIALIZED', '版本尚未形成 R0，不能创建后续修订', 409)
  return `R${Number(match[1]) + 1}`
}

function validateRevisionItems(items, finalVersion, pageCatalog) {
  if (!Array.isArray(items) || items.length === 0) {
    fail('INVALID_REVISION_BATCH', '修订批次至少包含一个修改项')
  }
  const catalogKeys = new Set(pageCatalog.map(page => page.key))
  return items.map(item => {
    const pageKeys = Array.isArray(item?.pageKeys) ? item.pageKeys : []
    if (
      !String(item?.type || '').trim()
      || pageKeys.length === 0
      || !String(item?.before || '').trim()
      || !String(item?.after || '').trim()
      || !String(item?.devImpact || '').trim()
    ) {
      fail('INVALID_REVISION_BATCH', '每个修改项必须填写类型、影响页面、修改前、修改后和研发注意事项')
    }
    const uniquePageKeys = [...new Set(pageKeys.map(String))]
    if (uniquePageKeys.length !== pageKeys.length || uniquePageKeys.some(key => !catalogKeys.has(key))) {
      fail('INVALID_REVISION_BATCH', '修订批次中的影响页面无效或重复')
    }
    return {
      type: String(item.type).trim(),
      pageKeys: uniquePageKeys,
      before: String(item.before).trim(),
      after: String(item.after).trim(),
      devImpact: String(item.devImpact).trim(),
    }
  })
}

export function createRevisionBatch(version, payload, pageCatalog, now = new Date().toISOString()) {
  if (version?.revision === 'pending') {
    fail('REVISION_NOT_INITIALIZED', '版本尚未形成 R0，不能创建后续修订', 409)
  }

  const reason = requiredText(payload?.reason, '修改原因', 'INVALID_REVISION_BATCH')
  const patch = payload?.patch && typeof payload.patch === 'object' ? payload.patch : {}
  const nextInput = clone(version)
  for (const [key, value] of Object.entries(patch)) {
    if (!VERSION_PATCH_FIELDS.has(key)) fail('INVALID_VERSION_PATCH', `不允许修改字段 ${key}`)
    nextInput[key] = value
  }
  const normalized = normalizeVersionInput(nextInput, pageCatalog)
  const items = validateRevisionItems(payload?.items, normalized, pageCatalog)
  const timestamp = validateTimestamp(now)
  const revision = nextRevision(version.revision)
  const next = {
    ...clone(version),
    ...normalized,
    revision,
    updatedAt: timestamp,
  }
  return {
    version: next,
    revisionBatch: {
      revision,
      date: timestamp,
      reason,
      items,
    },
  }
}
