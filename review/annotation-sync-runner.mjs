import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { ReviewValidationError } from './version-model.mjs'

const execFileAsync = promisify(execFile)
const MAX_CODEX_OUTPUT = 5 * 1024 * 1024
const RUN_TIMEOUT_MS = 10 * 60 * 1000

function fail(code, message, status = 500) {
  throw new ReviewValidationError(code, message, status)
}

function safeRunId(versionId) {
  return `${versionId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

async function buildPatch(runDir, index, change) {
  const beforePath = path.join(runDir, `${index}.before`)
  const afterPath = path.join(runDir, `${index}.after`)
  await writeFile(beforePath, change.before || '', 'utf8')
  await writeFile(afterPath, change.after || '', 'utf8')
  try {
    await execFileAsync('git', ['diff', '--no-index', '--no-color', '--unified=3', '--', beforePath, afterPath], {
      maxBuffer: MAX_CODEX_OUTPUT,
    })
    return ''
  } catch (error) {
    if (error?.code !== 1 && error?.exitCode !== 1) throw error
    return String(error.stdout || '')
      .replaceAll(beforePath, `a/${change.path}`)
      .replaceAll(afterPath, `b/${change.path}`)
  }
}

function normalizeOutput(payload) {
  const actions = (payload.actions || []).map(item => {
    let annotation = null
    if (item.annotationJson) {
      try {
        annotation = JSON.parse(item.annotationJson)
      } catch {
        fail('ANNOTATION_SYNC_AGENT_INVALID_OUTPUT', 'AI 返回的标注 JSON 无法解析')
      }
    }
    return {
      action: item.action,
      pageKey: item.pageKey,
      reason: item.reason,
      ...(item.annotationId ? { annotationId: item.annotationId } : {}),
      ...(item.sourceIds?.length ? { sourceIds: item.sourceIds } : {}),
      ...(annotation ? { annotation } : {}),
    }
  })
  return { actions, conflicts: payload.conflicts || [] }
}

export function createCodexAnnotationSyncRunner({
  projectRoot,
  codexCommand = process.env.ANNOTATION_SYNC_CODEX_COMMAND || 'codex',
  execute = execFileAsync,
} = {}) {
  const schemaPath = path.join(projectRoot, 'review', 'annotation-sync-output.schema.json')

  return async function generateCandidates(input) {
    const runDir = path.join(projectRoot, '.annotation-sync', 'runs', safeRunId(input.versionId))
    await mkdir(runDir, { recursive: true })
    const patches = await Promise.all(input.fileChanges.map((change, index) => buildPatch(runDir, index, change)))
    const contextPath = path.join(runDir, 'context.json')
    const outputPath = path.join(runDir, 'result.json')
    await writeFile(contextPath, `${JSON.stringify({
      versionId: input.versionId,
      changedFiles: input.changedFiles,
      patches: input.fileChanges.map((change, index) => ({ path: change.path, patch: patches[index] })),
      annotationFiles: input.annotationFiles,
    }, null, 2)}\n`, 'utf8')

    const prompt = [
      '用户已经在版本管理页点击“同步标注”，明确授权执行本次局部同步。',
      `目标研发版本：${input.versionId}。`,
      `先读取局部差异包：${path.relative(projectRoot, contextPath)}。`,
      '只处理差异包中实际变化的代码片段或需求规则，以及与这些片段直接相关的当前版本标注。',
      '禁止全页、全版本或全仓审查；禁止为了确认“保持”而读取无关标注；输出中不要包含 keep。',
      '需要修改时输出 update/add/merge/delete 动作及完整 annotationJson，但不要直接编辑任何文件。',
      '只有 PRD/业务规则与实际原型目标口径确实不一致时才输出 conflict，并逐项写清 prdRule、prototypeRule 和 reason。',
      '如果本次差异不影响任何标注，返回 no_changes、空 actions 和空 conflicts。',
      '所有页面必须属于 context.json 中的 annotationFiles；不得读取或修改其他版本和 public/annotations。',
      '最终只返回符合指定 JSON Schema 的结果，不要附加解释文字。',
    ].join('\n')

    try {
      await execute(codexCommand, [
        'exec',
        '--ephemeral',
        '--sandbox', 'read-only',
        '--color', 'never',
        '--output-schema', schemaPath,
        '--output-last-message', outputPath,
        '--cd', projectRoot,
        prompt,
      ], {
        cwd: projectRoot,
        timeout: RUN_TIMEOUT_MS,
        maxBuffer: MAX_CODEX_OUTPUT,
      })
    } catch (error) {
      const detail = String(error?.stderr || error?.message || '').trim().split('\n').slice(-1)[0]
      fail('ANNOTATION_SYNC_AGENT_FAILED', detail ? `AI 标注同步失败：${detail}` : 'AI 标注同步失败')
    }

    let payload
    try {
      payload = JSON.parse(await readFile(outputPath, 'utf8'))
    } catch {
      fail('ANNOTATION_SYNC_AGENT_INVALID_OUTPUT', 'AI 未返回有效的标注同步结果')
    }
    return normalizeOutput(payload)
  }
}
