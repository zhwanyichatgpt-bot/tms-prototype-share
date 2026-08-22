import assert from 'node:assert/strict'
import test from 'node:test'

import { createReviewDataClient } from '../src/review/review-data-client.mjs'

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('读取版本详情时只请求当前版本和对应修改记录', async () => {
  const calls = []
  const client = createReviewDataClient({
    cacheKey: () => 100,
    fetchImpl: async (url) => {
      calls.push(url)
      if (url.includes('version.json')) return jsonResponse({ id: 'TMS-COMMON-202608-01' })
      return jsonResponse({ versionId: 'TMS-COMMON-202608-01', revisions: [] })
    },
  })

  const bundle = await client.getVersionBundle('TMS-COMMON-202608-01')
  assert.equal(bundle.version.id, 'TMS-COMMON-202608-01')
  assert.deepEqual(calls, [
    '/review-data/versions/TMS-COMMON-202608-01/version.json?t=100',
    '/review-data/versions/TMS-COMMON-202608-01/changes.json?t=100',
  ])
})

test('管理写操作使用本地开发接口并发送 JSON', async () => {
  const calls = []
  const client = createReviewDataClient({
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return jsonResponse({ ok: true, data: { id: 'TMS-COMMON-202608-01' } }, 201)
    },
  })

  await client.createVersion({ name: '通用版本', scope: 'common' })
  assert.equal(calls[0].url, '/__review_admin__/versions')
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: '通用版本', scope: 'common' })
})

test('读取失败和管理接口错误都转换为可展示错误', async () => {
  const readClient = createReviewDataClient({
    fetchImpl: async () => jsonResponse({}, 404),
  })
  await assert.rejects(
    () => readClient.getVersionBundle('TMS-COMMON-202608-99'),
    error => error.message === '研发版本不存在或尚未发布',
  )

  const writeClient = createReviewDataClient({
    fetchImpl: async () => jsonResponse({ ok: false, error: '版本已经标记完成' }, 409),
  })
  await assert.rejects(
    () => writeClient.completeVersion('TMS-COMMON-202608-01'),
    error => error.message === '版本已经标记完成',
  )
})
