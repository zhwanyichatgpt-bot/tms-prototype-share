import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { recordVersionChange } from './change-recorder.mjs'
import { pageCatalog } from './page-catalog.mjs'
import { createReviewStore } from './review-store.mjs'

test('自动记录服务为已交付版本生成下一次变更', async t => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-change-recorder-'))
  const dataDir = path.join(projectRoot, 'public', 'review-data')
  t.after(() => rm(projectRoot, { recursive: true, force: true }))

  const store = createReviewStore({
    dataDir,
    pageCatalog,
    now: () => '2026-08-22T10:00:00.000Z',
  })
  await store.initialize()
  const version = await store.createVersion({
    name: '通用交付版本',
    scope: 'common',
    targetReleaseDate: '2026-09-15',
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  })
  await store.publishVersion(version.id)

  const result = await recordVersionChange({
    projectRoot,
    versionId: version.id,
    payload: {
      reason: '评审后调整列表规则',
      items: [{
        type: 'rule',
        pageKeys: ['waybillManage'],
        before: '列表默认显示全部数据',
        after: '列表默认显示当前企业数据',
        devImpact: '同步检查筛选条件和空状态',
      }],
    },
    now: () => '2026-08-22T11:00:00.000Z',
  })

  assert.equal(result.version.revision, 'R1')
  assert.equal(result.changes.revisions[0].reason, '评审后调整列表规则')
})
