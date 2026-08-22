import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { annotationRelativePath } from './annotation-paths.mjs'

export class AnnotationSaveError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'AnnotationSaveError'
    this.code = code
    this.status = status
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function atomicWrite(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

export function createAnnotationSaveService({ projectRoot }) {
  const publicRoot = path.resolve(projectRoot, 'public')

  return {
    async save(data) {
      let relativePath
      try {
        relativePath = annotationRelativePath({ versionId: data?.versionId, pageKey: data?.page })
      } catch {
        throw new AnnotationSaveError('INVALID_ANNOTATION_PATH', '标注路径无效')
      }

      if (data?.versionId) {
        const versionPath = path.join(publicRoot, 'review-data', 'versions', String(data.versionId), 'version.json')
        const version = await readJson(versionPath)
        if (!version) throw new AnnotationSaveError('VERSION_NOT_FOUND', '研发版本不存在', 404)
        if (!version.pages?.some(item => item.pageKey === data.page)) {
          throw new AnnotationSaveError('ANNOTATION_PAGE_NOT_ALLOWED', '页面未纳入当前版本', 403)
        }
      }

      const filePath = path.resolve(publicRoot, relativePath)
      if (!filePath.startsWith(`${publicRoot}${path.sep}`)) {
        throw new AnnotationSaveError('INVALID_ANNOTATION_PATH', '标注路径无效')
      }
      const payload = {
        ...data,
        page: String(data.page),
        ...(data.versionId ? { versionId: String(data.versionId) } : {}),
      }
      await atomicWrite(filePath, payload)
      return { file: relativePath }
    },
  }
}
