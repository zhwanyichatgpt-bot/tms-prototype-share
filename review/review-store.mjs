import { mkdir, open, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  ReviewValidationError,
  assertSafeSegment,
  createReviewVersion,
  createRevisionBatch,
  markVersionCompleted,
  publishReviewVersion,
  updateDraftVersion,
} from './version-model.mjs'

const SCHEMA_VERSION = 1

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    if (error instanceof SyntaxError) {
      throw new ReviewValidationError('INVALID_REVIEW_DATA', '评审数据文件格式错误', 500)
    }
    throw error
  }
}

async function atomicWriteJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

async function writeJsonIfMissing(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true })
  try {
    const handle = await open(filePath, 'wx')
    await handle.writeFile(`${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await handle.close()
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error
  }
}

function versionSummary(version) {
  return {
    id: version.id,
    name: version.name,
    scope: version.scope,
    projectId: version.projectId,
    baseVersionId: version.baseVersionId,
    targetReleaseDate: version.targetReleaseDate,
    status: version.status,
    revision: version.revision,
    publishedAt: version.publishedAt || null,
    lastPublishedAt: version.lastPublishedAt || null,
    completedAt: version.completedAt || null,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  }
}

function sortVersionSummaries(versions) {
  return [...versions].sort((left, right) => {
    const timeOrder = String(right.updatedAt).localeCompare(String(left.updatedAt))
    return timeOrder || String(right.id).localeCompare(String(left.id))
  })
}

function normalizeProject(input, timestamp) {
  const id = String(input?.id || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) {
    throw new ReviewValidationError('INVALID_PROJECT_ID', '项目 ID 只允许小写英文、数字、下划线和连字符')
  }
  const name = String(input?.name || '').trim()
  if (!name) throw new ReviewValidationError('INVALID_PROJECT', '项目名称不能为空')
  const status = input?.status || 'active'
  if (!['active', 'archived'].includes(status)) {
    throw new ReviewValidationError('INVALID_PROJECT_STATUS', '项目状态必须为 active 或 archived')
  }
  return { id, name, status, createdAt: timestamp, updatedAt: timestamp }
}

export function createReviewStore({ dataDir, pageCatalog = [], now = () => new Date().toISOString() }) {
  const root = path.resolve(dataDir)
  const projectsFile = path.join(root, 'projects.json')
  const indexFile = path.join(root, 'index.json')
  const versionsDir = path.join(root, 'versions')
  const legacyAnnotationsDir = path.join(root, '..', 'annotations')
  let writeQueue = Promise.resolve()

  function serializeWrite(task) {
    const result = writeQueue.then(task)
    writeQueue = result.catch(() => undefined)
    return result
  }

  function versionDir(versionId) {
    return path.join(versionsDir, assertSafeSegment(versionId))
  }

  async function readProjects() {
    return readJson(projectsFile, { schemaVersion: SCHEMA_VERSION, projects: [], updatedAt: null })
  }

  async function readIndex() {
    return readJson(indexFile, { schemaVersion: SCHEMA_VERSION, versions: [], updatedAt: null })
  }

  async function readVersion(versionId) {
    const version = await readJson(path.join(versionDir(versionId), 'version.json'), null)
    if (!version) throw new ReviewValidationError('VERSION_NOT_FOUND', '研发版本不存在', 404)
    return version
  }

  async function readChanges(versionId) {
    return readJson(path.join(versionDir(versionId), 'changes.json'), { versionId, revisions: [] })
  }

  async function writeVersionBundle(version, changes) {
    const directory = versionDir(version.id)
    const annotationsDir = path.join(directory, 'annotations')
    await mkdir(annotationsDir, { recursive: true })
    for (const entry of version.pages || []) {
      const source = await readJson(path.join(legacyAnnotationsDir, `${entry.pageKey}.json`), null)
      await writeJsonIfMissing(path.join(annotationsDir, `${entry.pageKey}.json`), {
        versionId: version.id,
        page: entry.pageKey,
        title: source?.title || entry.pageKey,
        updatedAt: version.updatedAt.slice(0, 10),
        annotations: source?.annotations || [],
      })
    }
    await atomicWriteJson(path.join(directory, 'version.json'), version)
    await atomicWriteJson(path.join(directory, 'changes.json'), changes)

    const index = await readIndex()
    const summaries = index.versions.filter(item => item.id !== version.id)
    summaries.push(versionSummary(version))
    await atomicWriteJson(indexFile, {
      schemaVersion: SCHEMA_VERSION,
      versions: sortVersionSummaries(summaries),
      updatedAt: version.updatedAt,
    })
  }

  async function ensureProjectForVersion(input) {
    if (input.scope !== 'project') return
    const projectId = String(input.projectId || '').toLowerCase()
    const projects = await readProjects()
    const project = projects.projects.find(item => item.id === projectId)
    if (!project) throw new ReviewValidationError('PROJECT_NOT_FOUND', '所属项目不存在', 404)
    if (project.status !== 'active') {
      throw new ReviewValidationError('PROJECT_INACTIVE', '所属项目已停用，不能创建版本', 409)
    }
  }

  return {
    async initialize() {
      return serializeWrite(async () => {
        const timestamp = now()
        await mkdir(versionsDir, { recursive: true })
        await writeJsonIfMissing(projectsFile, {
          schemaVersion: SCHEMA_VERSION,
          projects: [],
          updatedAt: timestamp,
        })
        await writeJsonIfMissing(indexFile, {
          schemaVersion: SCHEMA_VERSION,
          versions: [],
          updatedAt: timestamp,
        })
      })
    },

    async listProjects() {
      return readProjects()
    },

    async listVersions() {
      return readIndex()
    },

    async getVersionBundle(versionId) {
      const version = await readVersion(versionId)
      const changes = await readChanges(versionId)
      return { version, changes }
    },

    async createProject(input) {
      return serializeWrite(async () => {
        const timestamp = now()
        const project = normalizeProject(input, timestamp)
        const data = await readProjects()
        if (data.projects.some(item => item.id === project.id)) {
          throw new ReviewValidationError('PROJECT_EXISTS', '项目 ID 已存在', 409)
        }
        data.projects.push(project)
        data.projects.sort((left, right) => left.id.localeCompare(right.id))
        data.updatedAt = timestamp
        await atomicWriteJson(projectsFile, data)
        return project
      })
    },

    async createVersion(input) {
      return serializeWrite(async () => {
        await ensureProjectForVersion(input)
        const index = await readIndex()
        const version = createReviewVersion(input, {
          existingIds: index.versions.map(item => item.id),
          pageCatalog,
          now: now(),
        })
        await writeVersionBundle(version, { versionId: version.id, revisions: [] })
        return version
      })
    },

    async updateVersion(versionId, patch) {
      return serializeWrite(async () => {
        const version = await readVersion(versionId)
        const next = updateDraftVersion(version, patch, pageCatalog, now())
        await ensureProjectForVersion(next)
        const changes = await readChanges(versionId)
        await writeVersionBundle(next, changes)
        return next
      })
    },

    async publishVersion(versionId) {
      return serializeWrite(async () => {
        const version = await readVersion(versionId)
        const result = publishReviewVersion(version, now())
        const changes = await readChanges(versionId)
        if (result.revisionBatch) changes.revisions.unshift(result.revisionBatch)
        await writeVersionBundle(result.version, changes)
        return { version: result.version, changes }
      })
    },

    async completeVersion(versionId) {
      return serializeWrite(async () => {
        const version = await readVersion(versionId)
        const next = markVersionCompleted(version, now())
        const changes = await readChanges(versionId)
        await writeVersionBundle(next, changes)
        return { version: next, changes }
      })
    },

    async createRevision(versionId, payload) {
      return serializeWrite(async () => {
        const version = await readVersion(versionId)
        const result = createRevisionBatch(version, payload, pageCatalog, now())
        const changes = await readChanges(versionId)
        changes.revisions.unshift(result.revisionBatch)
        await writeVersionBundle(result.version, changes)
        return { version: result.version, changes }
      })
    },
  }
}
