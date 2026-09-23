import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { groupProductPages, pageProductLabel } from './product-catalog.mjs'
import { loadPreviousPaths } from './migration-paths.mjs'

test('目录按产品和端分类且页面只出现一次', () => {
  const pages = [
    { key: 'a', productId: 'lianyun', platform: 'web' },
    { key: 'b', productId: 'zhiyun', platform: 'web' },
    { key: 'c', productId: null, operationAppId: 'shipowner', platform: 'mobile' },
    { key: 'd', productId: 'lianyun', platform: 'mobile' },
  ]
  const groups = groupProductPages(pages)
  assert.equal(groups.length, 4)
  assert.deepEqual(groups.flatMap(group => group.pages.map(page => page.key)), ['a', 'b', 'c', 'd'])
  assert.equal(pageProductLabel(pages[2]), '至简船东 · 移动端')
})

test('无迁移映射的旧项目继续正常使用', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tms-mapping-'))
  try { assert.equal((await loadPreviousPaths(root)).size, 0) }
  finally { await rm(root, { recursive: true, force: true }) }
})

test('迁移映射只接收明确的安全移动路径，不接受目录穿越', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tms-mapping-'))
  try {
    const folder = path.join(root, 'migration/2026-09-12-产品架构整理')
    await mkdir(folder, { recursive: true })
    await writeFile(path.join(folder, 'path-map.json'), JSON.stringify({ files: [
      { kind: 'move', oldPath: 'prd/旧.md', newPath: 'prd/common/products/lianyun/旧.md' },
      { kind: 'move', oldPath: '../私有.md', newPath: 'prd/无效.md' },
      { kind: 'reference', oldPath: 'src/App.vue', newPath: 'src/App.vue' },
    ] }))
    assert.deepEqual([...await loadPreviousPaths(root)], [['prd/common/products/lianyun/旧.md', 'prd/旧.md']])
  } finally { await rm(root, { recursive: true, force: true }) }
})
