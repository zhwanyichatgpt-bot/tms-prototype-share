import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createCodexAnnotationSyncRunner } from './annotation-sync-runner.mjs'

test('本地 AI 运行器使用只读沙箱和局部差异包，并解析结构化修改动作', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-sync-runner-'))
  await mkdir(path.join(projectRoot, 'review'), { recursive: true })
  await writeFile(path.join(projectRoot, 'review', 'annotation-sync-output.schema.json'), '{}', 'utf8')
  const calls = []
  const runner = createCodexAnnotationSyncRunner({
    projectRoot,
    codexCommand: 'codex-test',
    execute: async (command, args, options) => {
      calls.push({ command, args, options })
      const outputPath = args[args.indexOf('--output-last-message') + 1]
      await writeFile(outputPath, JSON.stringify({
        status: 'synced',
        actions: [{
          action: 'update',
          pageKey: 'shipownerMobileHome',
          annotationId: 'annot-a',
          sourceIds: [],
          reason: '本次规则变化',
          annotationJson: JSON.stringify({ id: 'annot-a', title: '报价规则', content: '新规则' }),
        }],
        conflicts: [],
      }), 'utf8')
    },
  })

  const result = await runner({
    versionId: 'TMS-BEIGANG-202608-01',
    changedFiles: ['prd/projects/beigang/规则.md'],
    fileChanges: [{ path: 'prd/projects/beigang/规则.md', before: '旧规则', after: '新规则' }],
    annotationFiles: [{ pageKey: 'shipownerMobileHome', path: 'public/review-data/version/annotations/a.json' }],
  })

  assert.equal(calls[0].command, 'codex-test')
  assert.ok(calls[0].args.includes('read-only'))
  assert.match(calls[0].args.at(-1), /禁止全页、全版本或全仓审查/)
  assert.equal(result.actions[0].annotation.content, '新规则')
})

test('AI 运行失败转换为可展示错误', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'tms-sync-runner-error-'))
  await mkdir(path.join(projectRoot, 'review'), { recursive: true })
  const runner = createCodexAnnotationSyncRunner({
    projectRoot,
    execute: async () => {
      const error = new Error('failed')
      error.stderr = '模型暂时不可用'
      throw error
    },
  })

  await assert.rejects(
    () => runner({
      versionId: 'TMS-BEIGANG-202608-01',
      changedFiles: ['a.md'],
      fileChanges: [{ path: 'a.md', before: 'a', after: 'b' }],
      annotationFiles: [],
    }),
    error => error.code === 'ANNOTATION_SYNC_AGENT_FAILED' && /模型暂时不可用/.test(error.message),
  )
})
