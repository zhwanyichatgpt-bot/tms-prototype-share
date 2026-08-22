import path from 'node:path'

import { pageCatalog as defaultPageCatalog } from './review/page-catalog.mjs'
import { createReviewStore } from './review/review-store.mjs'
import { ReviewValidationError, assertSafeSegment } from './review/version-model.mjs'

const API_PREFIX = '/__review_admin__'
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req, maxBodyBytes) {
  const declaredLength = Number(req.headers['content-length'] || 0)
  if (declaredLength > maxBodyBytes) {
    throw new ReviewValidationError('REQUEST_TOO_LARGE', '请求体过大', 413)
  }

  const chunks = []
  let totalBytes = 0
  let tooLarge = false
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBodyBytes) {
      tooLarge = true
      continue
    }
    chunks.push(buffer)
  }
  if (tooLarge) throw new ReviewValidationError('REQUEST_TOO_LARGE', '请求体过大', 413)

  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new ReviewValidationError('INVALID_JSON', '请求体必须是有效 JSON')
  }
}

function decodeVersionId(rawSegment) {
  try {
    return assertSafeSegment(decodeURIComponent(rawSegment))
  } catch (error) {
    if (error instanceof URIError) {
      throw new ReviewValidationError('INVALID_PATH_SEGMENT', '版本路径无效')
    }
    throw error
  }
}

function routeFor(req) {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname
  if (pathname !== API_PREFIX && !pathname.startsWith(`${API_PREFIX}/`)) return null
  const segments = pathname.slice(API_PREFIX.length).split('/').filter(Boolean)

  if (segments.length === 1 && segments[0] === 'projects') {
    return { action: 'createProject', method: 'POST' }
  }
  if (segments.length === 1 && segments[0] === 'versions') {
    return { action: 'createVersion', method: 'POST' }
  }
  if (segments.length === 2 && segments[0] === 'versions') {
    return { action: 'updateVersion', method: 'PUT', versionId: decodeVersionId(segments[1]) }
  }
  if (segments.length === 3 && segments[0] === 'versions' && segments[2] === 'revisions') {
    return { action: 'createRevision', method: 'POST', versionId: decodeVersionId(segments[1]) }
  }
  if (segments.length === 3 && segments[0] === 'versions' && segments[2] === 'publish') {
    return { action: 'publishVersion', method: 'POST', versionId: decodeVersionId(segments[1]) }
  }
  if (segments.length === 3 && segments[0] === 'versions' && segments[2] === 'complete') {
    return { action: 'completeVersion', method: 'POST', versionId: decodeVersionId(segments[1]) }
  }
  return { action: 'notFound', method: null }
}

export function createReviewAdminMiddleware({
  projectRoot,
  pageCatalog = defaultPageCatalog,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  now = () => new Date().toISOString(),
}) {
  const store = createReviewStore({
    dataDir: path.join(projectRoot, 'public', 'review-data'),
    pageCatalog,
    now,
  })
  const ready = store.initialize()

  return function reviewAdminMiddleware(req, res, next) {
    let route
    try {
      route = routeFor(req)
    } catch (error) {
      const status = error instanceof ReviewValidationError ? error.status : 400
      return sendJson(res, status, {
        ok: false,
        code: error.code || 'INVALID_REQUEST',
        error: error.message || '请求无效',
      })
    }
    if (!route) return next()
    if (route.action === 'notFound') {
      return sendJson(res, 404, { ok: false, code: 'API_NOT_FOUND', error: '接口不存在' })
    }
    if (req.method !== route.method) {
      res.setHeader('Allow', route.method)
      return sendJson(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', error: '请求方法不允许' })
    }

    ;(async () => {
      await ready
      const body = await readJsonBody(req, maxBodyBytes)
      let data
      let status = 200
      if (route.action === 'createProject') {
        data = await store.createProject(body)
        status = 201
      } else if (route.action === 'createVersion') {
        data = await store.createVersion(body)
        status = 201
      } else if (route.action === 'updateVersion') {
        data = await store.updateVersion(route.versionId, body)
      } else if (route.action === 'createRevision') {
        data = await store.createRevision(route.versionId, body)
        status = 201
      } else if (route.action === 'publishVersion') {
        data = await store.publishVersion(route.versionId)
      } else if (route.action === 'completeVersion') {
        data = await store.completeVersion(route.versionId)
      }
      sendJson(res, status, { ok: true, data })
    })().catch(error => {
      const known = error instanceof ReviewValidationError
      if (!known) console.error('[review-admin] 本地版本写入失败:', error)
      sendJson(res, known ? error.status : 500, {
        ok: false,
        code: known ? error.code : 'INTERNAL_ERROR',
        error: known ? error.message : '本地版本写入失败',
      })
    })
  }
}

export function reviewAdminPlugin() {
  let projectRoot = ''
  return {
    name: 'vite-plugin-review-admin',
    configResolved(config) {
      projectRoot = config.root
    },
    configureServer(server) {
      server.middlewares.use(createReviewAdminMiddleware({ projectRoot }))
    },
  }
}
