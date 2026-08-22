import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createAnnotationSaveService } from './annotation-save-service.mjs'

async function setupVersion(status = 'in_progress') {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-annotation-save-'))
  const versionId = 'TMS-COMMON-202608-01'
  const versionDir = path.join(projectRoot, 'public', 'review-data', 'versions', versionId)
  await mkdir(path.join(versionDir, 'annotations'), { recursive: true })
  await writeFile(path.join(versionDir, 'version.json'), JSON.stringify({
    id: versionId,
    status,
    pages: [{ pageKey: 'waybillManage', order: 1 }],
  }), 'utf8')
  return { projectRoot, versionId, versionDir, service: createAnnotationSaveService({ projectRoot }) }
}

test('版本标注保存到独立版本目录', async () => {
  const { service, versionId, versionDir } = await setupVersion()
  await service.save({ versionId, page: 'waybillManage', title: '托运单管理', annotations: [] })
  const saved = JSON.parse(await readFile(path.join(versionDir, 'annotations', 'waybillManage.json'), 'utf8'))
  assert.equal(saved.versionId, versionId)
  assert.equal(saved.page, 'waybillManage')
})

test('标注保存拒绝版本外页面，已完成版本仍可继续修改', async () => {
  const active = await setupVersion()
  await assert.rejects(
    () => active.service.save({ versionId: active.versionId, page: 'transportPlan', annotations: [] }),
    error => error.code === 'ANNOTATION_PAGE_NOT_ALLOWED',
  )

  const completed = await setupVersion('completed')
  await assert.doesNotReject(
    () => completed.service.save({ versionId: completed.versionId, page: 'waybillManage', annotations: [] }),
  )
})

test('旧兼容页仍可保存公共标注', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-annotation-legacy-'))
  const service = createAnnotationSaveService({ projectRoot })
  await service.save({ page: 'waybillManage', title: '托运单管理', annotations: [] })
  const saved = JSON.parse(await readFile(path.join(projectRoot, 'public', 'annotations', 'waybillManage.json'), 'utf8'))
  assert.equal(saved.page, 'waybillManage')
})
