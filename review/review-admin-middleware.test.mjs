import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createReviewAdminMiddleware } from '../viteReviewPlugin.mjs'

const PAGE_CATALOG = [
  { key: 'waybillManage', scope: 'common', projectId: null },
  { key: 'transportPlan', scope: 'project', projectId: 'beigang' },
]

async function startServer(options = {}) {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-review-api-'))
  const middleware = createReviewAdminMiddleware({
    projectRoot,
    pageCatalog: PAGE_CATALOG,
    now: () => '2026-08-22T08:00:00.000Z',
    ...options,
  })
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404
      res.end('not found')
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  }
}

async function request(baseUrl, pathname, { method = 'POST', body } = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('开发接口支持项目、版本、发布、完成标记和修订维护', async t => {
  const server = await startServer()
  t.after(server.close)

  let response = await request(server.baseUrl, '/__review_admin__/projects', {
    body: { id: 'beigang', name: '北港水运', status: 'active' },
  })
  assert.equal(response.status, 201)

  response = await request(server.baseUrl, '/__review_admin__/versions', {
    body: {
      name: '北港 1.0.4',
      scope: 'project',
      projectId: 'beigang',
      targetReleaseDate: '2026-09-15',
      pages: [{ pageKey: 'transportPlan', order: 1 }],
    },
  })
  assert.equal(response.status, 201)
  const created = (await response.json()).data

  response = await request(server.baseUrl, `/__review_admin__/versions/${created.id}`, {
    method: 'PUT',
    body: { name: '北港 1.0.4 研发版' },
  })
  assert.equal(response.status, 200)

  response = await request(server.baseUrl, `/__review_admin__/versions/${created.id}/publish`)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).data.version.revision, 'R0')

  response = await request(server.baseUrl, `/__review_admin__/versions/${created.id}/revisions`, {
    body: {
      reason: '评审后调整说明',
      items: [{
        type: 'rule',
        pageKeys: ['transportPlan'],
        before: '旧规则',
        after: '新规则',
        devImpact: '按新规则实现',
      }],
    },
  })
  assert.equal(response.status, 201)
  assert.equal((await response.json()).data.version.revision, 'R1')

  response = await request(server.baseUrl, `/__review_admin__/versions/${created.id}/complete`)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).data.version.status, 'completed')
})

test('开发接口拒绝非法 JSON、超限请求和危险版本路径', async t => {
  const server = await startServer({ maxBodyBytes: 64 })
  t.after(server.close)

  let response = await request(server.baseUrl, '/__review_admin__/projects', { body: '{bad json' })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'INVALID_JSON')

  response = await request(server.baseUrl, '/__review_admin__/projects', {
    body: { id: 'a', name: 'x'.repeat(100) },
  })
  assert.equal(response.status, 413)
  assert.equal((await response.json()).code, 'REQUEST_TOO_LARGE')

  response = await request(server.baseUrl, '/__review_admin__/versions/bad%2Fid/publish')
  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'INVALID_PATH_SEGMENT')
})

test('接口只接受已声明的路径和方法', async t => {
  const server = await startServer()
  t.after(server.close)

  let response = await request(server.baseUrl, '/__review_admin__/versions', { method: 'GET' })
  assert.equal(response.status, 405)

  response = await request(server.baseUrl, '/__review_admin__/unknown', { body: {} })
  assert.equal(response.status, 404)
})
