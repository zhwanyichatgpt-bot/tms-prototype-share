import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createReviewStore } from './review-store.mjs'

const NOW = '2026-08-22T08:00:00.000Z'
const PAGE_CATALOG = [
  { key: 'waybillManage', scope: 'common', projectId: null },
  { key: 'transportPlan', scope: 'project', projectId: 'beigang' },
  { key: 'inquiryShipper', scope: 'project', projectId: 'guanglin' },
]

async function setupStore() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-review-store-'))
  const dataDir = path.join(tempRoot, 'public', 'review-data')
  const store = createReviewStore({ dataDir, pageCatalog: PAGE_CATALOG, now: () => NOW })
  await store.initialize()
  return { store, dataDir }
}

test('初始化数据目录并创建项目，重复项目被拒绝', async () => {
  const { store, dataDir } = await setupStore()
  const project = await store.createProject({ id: 'beigang', name: '北港水运', status: 'active' })
  assert.equal(project.id, 'beigang')

  const saved = JSON.parse(await readFile(path.join(dataDir, 'projects.json'), 'utf8'))
  assert.deepEqual(saved.projects.map(item => item.id), ['beigang'])
  await assert.rejects(
    () => store.createProject({ id: 'beigang', name: '重复项目', status: 'active' }),
    error => error.code === 'PROJECT_EXISTS' && error.status === 409,
  )
})

test('定制版本必须引用已存在且启用的项目', async () => {
  const { store } = await setupStore()
  await assert.rejects(
    () => store.createVersion({
      name: '北港 1.0.4',
      scope: 'project',
      projectId: 'beigang',
      targetReleaseDate: '2026-09-10',
      pages: [{ pageKey: 'transportPlan', order: 1 }],
    }),
    error => error.code === 'PROJECT_NOT_FOUND',
  )

  await store.createProject({ id: 'beigang', name: '北港水运', status: 'archived' })
  await assert.rejects(
    () => store.createVersion({
      name: '北港 1.0.4',
      scope: 'project',
      projectId: 'beigang',
      pages: [{ pageKey: 'transportPlan', order: 1 }],
    }),
    error => error.code === 'PROJECT_INACTIVE',
  )
})

test('创建版本会同时写入索引、版本详情和空修改记录', async () => {
  const { store, dataDir } = await setupStore()
  const version = await store.createVersion({
    name: '通用能力 8 月交付',
    scope: 'common',
    targetReleaseDate: '2026-09-15',
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  })

  const versionDir = path.join(dataDir, 'versions', version.id)
  const [index, detail, changes] = await Promise.all([
    readFile(path.join(dataDir, 'index.json'), 'utf8').then(JSON.parse),
    readFile(path.join(versionDir, 'version.json'), 'utf8').then(JSON.parse),
    readFile(path.join(versionDir, 'changes.json'), 'utf8').then(JSON.parse),
  ])
  assert.equal(index.versions[0].id, version.id)
  assert.equal(detail.revision, 'pending')
  assert.deepEqual(changes, { versionId: version.id, revisions: [] })
  assert.equal((await stat(path.join(versionDir, 'annotations'))).isDirectory(), true)
})

test('发布研发地址写入 R0，后续修订写入 R1 且按倒序保存', async () => {
  const { store } = await setupStore()
  const draft = await store.createVersion({
    name: '通用能力 8 月交付',
    scope: 'common',
    targetReleaseDate: '2026-09-15',
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  })

  const r0 = await store.publishVersion(draft.id)
  assert.equal(r0.version.revision, 'R0')
  assert.deepEqual(r0.changes.revisions.map(item => item.revision), ['R0'])

  const r1 = await store.createRevision(draft.id, {
    reason: '评审后调整上线时间',
    patch: { targetReleaseDate: '2026-09-20' },
    items: [{
      type: 'release_date',
      pageKeys: ['waybillManage'],
      before: '2026-09-15',
      after: '2026-09-20',
      devImpact: '同步调整提测排期',
    }],
  })
  assert.equal(r1.version.revision, 'R1')
  assert.deepEqual(r1.changes.revisions.map(item => item.revision), ['R1', 'R0'])
})

test('标记完成不冻结版本，仍可发布和记录变更', async () => {
  const { store } = await setupStore()
  const draft = await store.createVersion({
    name: '通用能力 8 月交付',
    scope: 'common',
    targetReleaseDate: '2026-09-15',
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  })
  await store.publishVersion(draft.id)
  const completed = await store.completeVersion(draft.id)
  assert.equal(completed.version.status, 'completed')
  const revision = await store.createRevision(draft.id, {
    reason: '完成后补充说明',
    items: [{ type: 'rule', pageKeys: ['waybillManage'], before: 'A', after: 'B', devImpact: '按 B 执行' }],
  })
  assert.equal(revision.version.revision, 'R1')
  const republished = await store.publishVersion(draft.id)
  assert.equal(republished.version.status, 'completed')
})

test('两个版本使用同一页面时生成独立标注文件且互不覆盖', async () => {
  const { store, dataDir } = await setupStore()
  const sourceDir = path.join(dataDir, '..', 'annotations')
  await mkdir(sourceDir, { recursive: true })
  await writeFile(path.join(sourceDir, 'waybillManage.json'), JSON.stringify({
    page: 'waybillManage', title: '托运单管理', updatedAt: '2026-08-20', annotations: [{ id: 'base' }],
  }), 'utf8')

  const input = {
    name: '通用版本', scope: 'common', targetReleaseDate: '2026-09-15',
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  }
  const first = await store.createVersion(input)
  const second = await store.createVersion({ ...input, name: '通用版本二' })
  const firstFile = path.join(dataDir, 'versions', first.id, 'annotations', 'waybillManage.json')
  const secondFile = path.join(dataDir, 'versions', second.id, 'annotations', 'waybillManage.json')

  await writeFile(firstFile, JSON.stringify({ page: 'waybillManage', annotations: [{ id: 'first-only' }] }), 'utf8')
  const secondData = JSON.parse(await readFile(secondFile, 'utf8'))
  assert.deepEqual(secondData.annotations, [{ id: 'base' }])
})
