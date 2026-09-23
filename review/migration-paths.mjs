import { readFile } from 'node:fs/promises'
import path from 'node:path'

// 迁移尚未提交时，允许按明确的文件对照读取 Git 中的旧内容。
export async function loadPreviousPaths(projectRoot) {
  try {
    const data = JSON.parse(await readFile(path.join(projectRoot, 'migration/2026-09-12-产品架构整理/path-map.json'), 'utf8'))
    const safe = value => typeof value === 'string' && !path.isAbsolute(value) && !value.split('/').includes('..')
    return new Map((data.files || [])
      .filter(item => item.kind === 'move' && safe(item.oldPath) && safe(item.newPath) && item.oldPath !== item.newPath)
      .map(item => [item.newPath, item.oldPath]))
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }
}
