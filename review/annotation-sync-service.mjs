import { loadPreviousPaths } from './migration-paths.mjs'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { createAnnotationSaveService } from './annotation-save-service.mjs'
import { createCodexAnnotationSyncRunner } from './annotation-sync-runner.mjs'
import { pageCatalog as defaultPageCatalog } from './page-catalog.mjs'
import { ReviewValidationError, assertSafeSegment } from './version-model.mjs'

const execFileAsync = promisify(execFile)
const SYNC_ACTIONS = new Set(['update', 'add', 'merge', 'delete'])

function fail(code, message, status = 400) {
  throw new ReviewValidationError(code, message, status)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeRelativePath(value) {
  const normalized = String(value || '').replaceAll('\\', '/').replace(/^\.\//, '')
  if (!normalized || normalized.startsWith('/') || normalized.includes('../')) {
    fail('ANNOTATION_SYNC_INVALID_PATH', '同步证据路径无效')
  }
  return normalized
}

function matchesConfiguredPath(file, configuredPath) {
  const target = normalizeRelativePath(configuredPath)
  return target.endsWith('/') ? file.startsWith(target) : file === target
}

function stableHash(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
}

async function pathExists(target) {
  try {
    await readFile(target)
    return true
  } catch (error) {
    if (error?.code === 'EISDIR') return true
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function readJson(target, notFoundMessage) {
  let text
  try {
    text = await readFile(target, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') fail('ANNOTATION_SYNC_NOT_FOUND', notFoundMessage, 404)
    throw error
  }
  try {
    return JSON.parse(text)
  } catch {
    fail('ANNOTATION_SYNC_INVALID_DATA', `${notFoundMessage}的数据格式无效`)
  }
}

async function writeJsonAtomic(target, payload) {
  await mkdir(path.dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
}

async function defaultListChangedFiles(projectRoot) {
  const commands = [
    ['-c', 'core.quotepath=false', 'diff', '--name-only', '--relative', 'HEAD'],
    ['-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard'],
  ]
  const results = await Promise.all(commands.map(async args => {
    try {
      const { stdout } = await execFileAsync('git', args, { cwd: projectRoot, maxBuffer: 1024 * 1024 })
      return stdout.split(/\r?\n/).filter(Boolean)
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }
  }))
  return [...new Set(results.flat().map(normalizeRelativePath))].sort()
}

function extractSourcePaths(source) {
  const text = String(source || '')
  const matches = text.matchAll(/(?:prd|context|discussions)\/[\p{L}\p{N}_./（）()\-]+?\.md/gu)
  return [...new Set([...matches].map(match => normalizeRelativePath(match[0])))]
}

async function listFilesRecursively(projectRoot, configuredPath) {
  const relative = normalizeRelativePath(configuredPath)
  const absolute = path.join(projectRoot, relative)
  if (!relative.endsWith('/')) return await pathExists(absolute) ? [relative] : []
  try {
    const entries = await readdir(absolute, { recursive: true, withFileTypes: true })
    return entries
      .filter(entry => entry.isFile())
      .map(entry => normalizeRelativePath(path.relative(projectRoot, path.join(entry.parentPath, entry.name))))
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

async function hashFiles(projectRoot, files) {
  const entries = await Promise.all([...new Set(files)].sort().map(async file => {
    try {
      return [file, stableHash(await readFile(path.join(projectRoot, file)))]
    } catch (error) {
      if (error?.code === 'ENOENT') return [file, null]
      throw error
    }
  }))
  return Object.fromEntries(entries)
}

async function readTextFiles(projectRoot, files) {
  const entries = await Promise.all([...new Set(files)].sort().map(async file => {
    try {
      return [file, await readFile(path.join(projectRoot, file), 'utf8')]
    } catch (error) {
      if (error?.code === 'ENOENT') return [file, null]
      throw error
    }
  }))
  return Object.fromEntries(entries)
}

async function readGitHeadFiles(projectRoot, files) {
  const previousPaths = await loadPreviousPaths(projectRoot)
  const entries = await Promise.all(files.map(async file => {
    const candidates = [...new Set([file, previousPaths.get(file)].filter(Boolean))]
    for (const candidate of candidates) {
      try {
        const { stdout } = await execFileAsync('git', ['-c', 'core.quotepath=false', 'show', `HEAD:${candidate}`], {
          cwd: projectRoot,
          maxBuffer: 4 * 1024 * 1024,
        })
        return [file, stdout]
      } catch {
        // 当前路径尚未进入 Git 时尝试迁移前路径；两者均不存在才视为新增。
      }
    }
    return [file, null]
  }))
  return Object.fromEntries(entries)
}

function validateAnnotation(annotation, expectedId = null) {
  if (!annotation || typeof annotation !== 'object') {
    fail('ANNOTATION_SYNC_INVALID_CANDIDATE', '同步候选必须包含完整标注内容')
  }
  const id = String(annotation.id || '').trim()
  if (!id || !String(annotation.title || '').trim() || !String(annotation.content || '').trim()) {
    fail('ANNOTATION_SYNC_INVALID_CANDIDATE', '同步候选必须包含 id、标题和内容')
  }
  if (expectedId && id !== expectedId) {
    fail('ANNOTATION_SYNC_INVALID_CANDIDATE', '修改候选不能变更原标注 ID')
  }
  return clone(annotation)
}

export function createAnnotationSyncService({
  projectRoot,
  pageCatalog = defaultPageCatalog,
  listChangedFiles = () => defaultListChangedFiles(projectRoot),
  generateCandidates,
  now = () => new Date().toISOString(),
} = {}) {
  const catalog = new Map(pageCatalog.map(page => [page.key, page]))
  const syncRoot = path.join(projectRoot, '.annotation-sync')
  const statePath = versionId => path.join(syncRoot, 'state', `${assertSafeSegment(versionId)}.json`)
  const versionRoot = versionId => path.join(projectRoot, 'public', 'review-data', 'versions', assertSafeSegment(versionId))
  const saveService = createAnnotationSaveService({ projectRoot })
  const candidateGenerator = generateCandidates || createCodexAnnotationSyncRunner({ projectRoot })

  async function loadContext(versionId) {
    const safeVersionId = assertSafeSegment(versionId)
    const root = versionRoot(safeVersionId)
    const version = await readJson(path.join(root, 'version.json'), '研发版本不存在')
    const allowedPages = new Set((version.pages || []).map(page => page.pageKey))
    const documents = new Map()
    for (const pageKey of allowedPages) {
      const annotationFile = path.join(root, 'annotations', `${assertSafeSegment(pageKey)}.json`)
      const document = await readJson(annotationFile, `页面 ${pageKey} 的版本标注不存在`)
      documents.set(pageKey, document)
    }
    return { versionId: safeVersionId, version, allowedPages, documents }
  }

  async function readOptionalJson(target) {
    try {
      return JSON.parse(await readFile(target, 'utf8'))
    } catch (error) {
      if (error?.code === 'ENOENT') return null
      if (error instanceof SyntaxError) fail('ANNOTATION_SYNC_INVALID_DATA', '标注同步状态格式无效')
      throw error
    }
  }

  async function evidenceFilesFor(context) {
    const configured = []
    const sourceFiles = []
    for (const [pageKey, document] of context.documents) {
      const page = catalog.get(pageKey)
      for (const item of page?.sourcePaths || []) configured.push(item)
      for (const item of page?.evidencePaths || []) configured.push(item)
      for (const annotation of document.annotations || []) {
        sourceFiles.push(...extractSourcePaths(annotation.source))
      }
    }
    const expanded = (await Promise.all(configured.map(item => listFilesRecursively(projectRoot, item)))).flat()
    return [...new Set([...expanded, ...sourceFiles])].sort()
  }

  async function relevantChanges(context) {
    const evidenceFiles = await evidenceFilesFor(context)
    const state = await readOptionalJson(statePath(context.versionId))
    if (state?.hashes && typeof state.hashes === 'object') {
      const allFiles = [...new Set([...evidenceFiles, ...Object.keys(state.hashes)])]
      const currentHashes = await hashFiles(projectRoot, allFiles)
      const changed = Object.keys(currentHashes).filter(file => currentHashes[file] !== state.hashes[file])
      return {
        changedFiles: changed.sort(),
        evidenceFiles,
        currentHashes,
        currentContents: await readTextFiles(projectRoot, allFiles),
        previousContents: state.contents || {},
      }
    }

    const workingChanges = (await listChangedFiles()).map(normalizeRelativePath)
    const relevant = workingChanges.filter(file => {
      if (evidenceFiles.includes(file)) return true
      for (const pageKey of context.allowedPages) {
        const page = catalog.get(pageKey)
        if ([...(page?.sourcePaths || []), ...(page?.evidencePaths || [])].some(item => matchesConfiguredPath(file, item))) return true
      }
      return false
    })
    const changedFiles = [...new Set(relevant)].sort()
    return {
      changedFiles,
      evidenceFiles,
      currentHashes: await hashFiles(projectRoot, evidenceFiles),
      currentContents: await readTextFiles(projectRoot, evidenceFiles),
      previousContents: await readGitHeadFiles(projectRoot, changedFiles),
    }
  }

  function validateActions(context, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      fail('ANNOTATION_SYNC_EMPTY_ACTIONS', '同步动作不能为空')
    }
    const existingByPage = new Map([...context.documents].map(([pageKey, document]) => [
      pageKey,
      new Map((document.annotations || []).map(item => [item.id, item])),
    ]))
    const touched = new Set()
    const addedIds = new Set()
    return entries.map(raw => {
      const action = String(raw?.action || '')
      const pageKey = String(raw?.pageKey || '')
      if (!SYNC_ACTIONS.has(action)) fail('ANNOTATION_SYNC_INVALID_ACTION', '同步动作无效')
      if (!context.allowedPages.has(pageKey)) fail('ANNOTATION_SYNC_PAGE_NOT_ALLOWED', `页面 ${pageKey} 不属于当前版本`)
      const existing = existingByPage.get(pageKey)
      const reason = String(raw?.reason || '').trim()
      if (!reason) fail('ANNOTATION_SYNC_REASON_REQUIRED', '每个同步候选必须说明变化原因')

      if (action === 'add') {
        const candidate = validateAnnotation(raw.annotation)
        if (existing.has(candidate.id) || addedIds.has(`${pageKey}:${candidate.id}`)) {
          fail('ANNOTATION_SYNC_DUPLICATE_ID', `标注 ${candidate.id} 已存在`)
        }
        addedIds.add(`${pageKey}:${candidate.id}`)
        return { action, pageKey, reason, annotation: candidate }
      }

      if (action === 'merge') {
        const sourceIds = [...new Set((raw.sourceIds || []).map(String))]
        if (sourceIds.length < 2 || sourceIds.some(id => !existing.has(id))) {
          fail('ANNOTATION_SYNC_INVALID_MERGE', '合并候选必须引用至少两个当前页面已有标注')
        }
        for (const id of sourceIds) {
          const key = `${pageKey}:${id}`
          if (touched.has(key)) fail('ANNOTATION_SYNC_DUPLICATE_TARGET', `标注 ${id} 被重复处理`)
          touched.add(key)
        }
        return { action, pageKey, sourceIds, reason, annotation: validateAnnotation(raw.annotation) }
      }

      const annotationId = String(raw?.annotationId || '')
      if (!existing.has(annotationId)) fail('ANNOTATION_SYNC_TARGET_NOT_FOUND', `标注 ${annotationId} 不存在`)
      const key = `${pageKey}:${annotationId}`
      if (touched.has(key)) fail('ANNOTATION_SYNC_DUPLICATE_TARGET', `标注 ${annotationId} 被重复处理`)
      touched.add(key)
      return {
        action,
        pageKey,
        annotationId,
        reason,
        ...(action === 'update' ? { annotation: validateAnnotation(raw.annotation, annotationId) } : {}),
      }
    })
  }

  function normalizeConflicts(context, conflicts) {
    return (Array.isArray(conflicts) ? conflicts : []).map(item => {
      const pageKey = String(item?.pageKey || '')
      if (!context.allowedPages.has(pageKey)) {
        fail('ANNOTATION_SYNC_PAGE_NOT_ALLOWED', `冲突页面 ${pageKey} 不属于当前版本`)
      }
      const reason = String(item?.reason || '').trim()
      const prdRule = String(item?.prdRule || '').trim()
      const prototypeRule = String(item?.prototypeRule || '').trim()
      if (!reason || !prdRule || !prototypeRule) {
        fail('ANNOTATION_SYNC_INVALID_CONFLICT', '真实冲突必须明确 PRD 口径、原型口径和冲突原因')
      }
      return {
        pageKey,
        annotationId: item?.annotationId ? String(item.annotationId) : null,
        prdRule,
        prototypeRule,
        reason,
      }
    })
  }

  function describeActions(context, actions) {
    return actions.map(action => {
      const document = context.documents.get(action.pageKey)
      const currentById = new Map((document.annotations || []).map(item => [item.id, item]))
      if (action.action === 'add') {
        return {
          action: 'add',
          pageKey: action.pageKey,
          annotationId: action.annotation.id,
          title: action.annotation.title,
          before: null,
          after: action.annotation.content,
          reason: action.reason,
        }
      }
      if (action.action === 'merge') {
        return {
          action: 'merge',
          pageKey: action.pageKey,
          annotationId: action.annotation.id,
          title: action.annotation.title,
          before: action.sourceIds.map(id => currentById.get(id)?.content || '').filter(Boolean).join('\n\n'),
          after: action.annotation.content,
          reason: action.reason,
        }
      }
      const current = currentById.get(action.annotationId)
      return {
        action: action.action,
        pageKey: action.pageKey,
        annotationId: action.annotationId,
        title: action.annotation?.title || current?.title || action.annotationId,
        before: current?.content || null,
        after: action.annotation?.content || null,
        reason: action.reason,
      }
    })
  }

  async function applyActions(context, actions) {
    const byPage = new Map()
    for (const action of actions) {
      if (!byPage.has(action.pageKey)) byPage.set(action.pageKey, [])
      byPage.get(action.pageKey).push(action)
    }
    for (const [pageKey, pageActions] of byPage) {
      const document = clone(context.documents.get(pageKey))
      for (const action of pageActions) {
        if (action.action === 'update') {
          const index = document.annotations.findIndex(item => item.id === action.annotationId)
          document.annotations.splice(index, 1, clone(action.annotation))
        } else if (action.action === 'add') {
          document.annotations.push(clone(action.annotation))
        } else if (action.action === 'delete') {
          document.annotations = document.annotations.filter(item => item.id !== action.annotationId)
        } else if (action.action === 'merge') {
          const indexes = action.sourceIds.map(id => document.annotations.findIndex(item => item.id === id))
          const insertAt = Math.min(...indexes)
          document.annotations = document.annotations.filter(item => !action.sourceIds.includes(item.id))
          document.annotations.splice(insertAt, 0, clone(action.annotation))
        }
      }
      document.updatedAt = now().slice(0, 10)
      await saveService.save(document)
    }
    return byPage.size
  }

  async function saveSyncState(context) {
    const refreshed = await loadContext(context.versionId)
    const evidenceFiles = await evidenceFilesFor(refreshed)
    await writeJsonAtomic(statePath(refreshed.versionId), {
      versionId: refreshed.versionId,
      syncedAt: now(),
      hashes: await hashFiles(projectRoot, evidenceFiles),
      contents: await readTextFiles(projectRoot, evidenceFiles),
    })
  }

  async function run(versionId) {
    const context = await loadContext(versionId)
    const changes = await relevantChanges(context)
    if (changes.changedFiles.length === 0) {
      return { versionId: context.versionId, status: 'no_changes', changedFiles: [], changes: [], conflicts: [] }
    }

    const generated = await candidateGenerator({
      versionId: context.versionId,
      version: clone(context.version),
      changedFiles: changes.changedFiles,
      fileChanges: changes.changedFiles.map(file => ({
        path: file,
        before: changes.previousContents[file] ?? null,
        after: changes.currentContents[file] ?? null,
      })),
      annotationFiles: [...context.documents.keys()].map(pageKey => ({
        pageKey,
        path: path.relative(projectRoot, path.join(versionRoot(context.versionId), 'annotations', `${pageKey}.json`)).replaceAll('\\', '/'),
      })),
    })
    const conflicts = normalizeConflicts(context, generated?.conflicts)
    if (conflicts.length > 0) {
      return {
        versionId: context.versionId,
        status: 'conflict',
        changedFiles: changes.changedFiles,
        changes: [],
        conflicts,
      }
    }

    const rawActions = Array.isArray(generated?.actions) ? generated.actions : []
    const actions = rawActions.length > 0 ? validateActions(context, rawActions) : []
    const descriptions = describeActions(context, actions)
    const updatedPages = await applyActions(context, actions)
    await saveSyncState(context)
    return {
      versionId: context.versionId,
      status: actions.length > 0 ? 'synced' : 'no_changes',
      changedFiles: changes.changedFiles,
      changes: descriptions,
      conflicts: [],
      updatedPages,
    }
  }

  return { run }
}
