import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

import { createAnnotationSyncService } from './annotation-sync-service.mjs'

const execFileAsync = promisify(execFile)

const VERSION_ID = 'TMS-BEIGANG-202608-01'
const OTHER_VERSION_ID = 'TMS-BEIGANG-202608-02'
const PAGE_CATALOG = [{
  key: 'shipownerMobileHome',
  scope: 'project',
  projectId: 'beigang',
  sourcePaths: ['prototype/projects/beigang/企业移动端/'],
  evidencePaths: ['prd/projects/beigang/承运管理_PRD_v1.md'],
}]

function annotation(overrides = {}) {
  return {
    id: 'annot-quote-rule',
    type: 'selector',
    selector: '.annot-quote-rule',
    position: { x: 0, y: 0 },
    title: '报价规则',
    content: '旧规则',
    category: 'rule',
    source: 'prd/projects/beigang/承运管理_PRD_v1.md 5.3',
    container: 'page',
    group: 'quote',
    createdAt: '2026-08-21',
    ...overrides,
  }
}

async function setup() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-annotation-sync-'))
  for (const versionId of [VERSION_ID, OTHER_VERSION_ID]) {
    const versionDir = path.join(projectRoot, 'public', 'review-data', 'versions', versionId)
    await mkdir(path.join(versionDir, 'annotations'), { recursive: true })
    await writeFile(path.join(versionDir, 'version.json'), JSON.stringify({
      id: versionId,
      scope: 'project',
      projectId: 'beigang',
      pages: [{ pageKey: 'shipownerMobileHome', order: 1 }],
    }), 'utf8')
    await writeFile(path.join(versionDir, 'annotations', 'shipownerMobileHome.json'), JSON.stringify({
      versionId,
      page: 'shipownerMobileHome',
      title: '承运商企业移动端',
      annotations: [annotation()],
    }), 'utf8')
  }
  await mkdir(path.join(projectRoot, 'prd', 'projects', 'beigang'), { recursive: true })
  await mkdir(path.join(projectRoot, 'prototype', '企业移动端'), { recursive: true })
  await writeFile(path.join(projectRoot, 'prd', 'projects', 'beigang', '承运管理_PRD_v1.md'), '# 新规则', 'utf8')
  await writeFile(path.join(projectRoot, 'prototype', '企业移动端', 'ShipownerHome.vue'), '<template />', 'utf8')
  const service = createAnnotationSyncService({
    projectRoot,
    pageCatalog: PAGE_CATALOG,
    listChangedFiles: async () => ['prd/projects/beigang/承运管理_PRD_v1.md'],
    now: () => '2026-08-22T12:00:00.000Z',
  })
  return { projectRoot, service }
}

test('默认 Git 变更检测可以识别中文 PRD 路径', async () => {
  const { projectRoot } = await setup()
  await execFileAsync('git', ['init'], { cwd: projectRoot })
  await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: projectRoot })
  await execFileAsync('git', ['config', 'user.name', 'Test'], { cwd: projectRoot })
  await execFileAsync('git', ['add', '.'], { cwd: projectRoot })
  await execFileAsync('git', ['commit', '-m', 'baseline'], { cwd: projectRoot })
  await writeFile(path.join(projectRoot, 'prd', 'projects', 'beigang', '承运管理_PRD_v1.md'), '# 修改后的规则', 'utf8')

  const generatorCalls = []
  const service = createAnnotationSyncService({
    projectRoot,
    pageCatalog: PAGE_CATALOG,
    generateCandidates: async input => {
      generatorCalls.push(input)
      return { actions: [], conflicts: [] }
    },
  })
  const result = await service.run(VERSION_ID)
  assert.deepEqual(result.changedFiles, ['prd/projects/beigang/承运管理_PRD_v1.md'])
  assert.equal(result.status, 'no_changes')
  assert.equal(generatorCalls.length, 1)
})

test('点击同步只应用 AI 判定需要变化的标注，不审查或改写其他标注', async () => {
  const { projectRoot } = await setup()
  const annotationPath = path.join(
    projectRoot, 'public', 'review-data', 'versions', VERSION_ID, 'annotations', 'shipownerMobileHome.json',
  )
  const document = JSON.parse(await readFile(annotationPath, 'utf8'))
  document.annotations.push(annotation({
    id: 'annot-unrelated',
    selector: '.annot-unrelated',
    title: '无关规则',
    content: '不应被检查或修改',
  }))
  await writeFile(annotationPath, JSON.stringify(document), 'utf8')
  const generatorCalls = []
  const service = createAnnotationSyncService({
    projectRoot,
    pageCatalog: PAGE_CATALOG,
    listChangedFiles: async () => ['prd/projects/beigang/承运管理_PRD_v1.md'],
    generateCandidates: async input => {
      generatorCalls.push(input)
      return {
        actions: [{
          action: 'update',
          pageKey: 'shipownerMobileHome',
          annotationId: 'annot-quote-rule',
          reason: '本次 PRD 修改了报价规则',
          annotation: annotation({ content: '仅更新本次命中的报价规则' }),
        }],
        conflicts: [],
      }
    },
  })

  const result = await service.run(VERSION_ID)
  assert.equal(result.status, 'synced')
  assert.equal(result.changes.length, 1)
  assert.equal(result.changes[0].annotationId, 'annot-quote-rule')
  assert.deepEqual(generatorCalls[0].changedFiles, ['prd/projects/beigang/承运管理_PRD_v1.md'])

  const saved = JSON.parse(await readFile(annotationPath, 'utf8'))
  assert.equal(saved.annotations.find(item => item.id === 'annot-quote-rule').content, '仅更新本次命中的报价规则')
  assert.equal(saved.annotations.find(item => item.id === 'annot-unrelated').content, '不应被检查或修改')

  const other = JSON.parse(await readFile(path.join(
    projectRoot, 'public', 'review-data', 'versions', OTHER_VERSION_ID, 'annotations', 'shipownerMobileHome.json',
  ), 'utf8'))
  assert.equal(other.annotations[0].content, '旧规则')

  const second = await service.run(VERSION_ID)
  assert.equal(second.status, 'no_changes')
  assert.equal(generatorCalls.length, 1)
})

test('真实规则冲突返回具体两边口径且不写标注', async () => {
  const { projectRoot } = await setup()
  const service = createAnnotationSyncService({
    projectRoot,
    pageCatalog: PAGE_CATALOG,
    listChangedFiles: async () => ['prototype/projects/beigang/企业移动端/ShipownerHome.vue'],
    generateCandidates: async () => ({
      actions: [],
      conflicts: [{
        pageKey: 'shipownerMobileHome',
        annotationId: 'annot-quote-rule',
        prdRule: '按船报价不展示计费依据',
        prototypeRule: '页面仍要求选择计费依据',
        reason: 'PRD 与原型的必填规则不一致',
      }],
    }),
  })

  const result = await service.run(VERSION_ID)
  assert.equal(result.status, 'conflict')
  assert.deepEqual(result.conflicts[0], {
    pageKey: 'shipownerMobileHome',
    annotationId: 'annot-quote-rule',
    prdRule: '按船报价不展示计费依据',
    prototypeRule: '页面仍要求选择计费依据',
    reason: 'PRD 与原型的必填规则不一致',
  })
  const saved = JSON.parse(await readFile(path.join(
    projectRoot, 'public', 'review-data', 'versions', VERSION_ID, 'annotations', 'shipownerMobileHome.json',
  ), 'utf8'))
  assert.equal(saved.annotations[0].content, '旧规则')
})
