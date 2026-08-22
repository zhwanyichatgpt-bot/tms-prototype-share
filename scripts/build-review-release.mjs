import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'dist')
const reviewDataDir = path.join(outputDir, 'review-data')
const versionsDir = path.join(reviewDataDir, 'versions')

await build({ root: projectRoot, mode: 'production' })

const indexPath = path.join(reviewDataDir, 'index.json')
const index = JSON.parse(await readFile(indexPath, 'utf8'))
const publishedVersions = (index.versions || []).filter(version => version.publishedAt)
const publishedIds = new Set(publishedVersions.map(version => version.id))

for (const entry of await readdir(versionsDir, { withFileTypes: true })) {
  if (entry.isDirectory() && !publishedIds.has(entry.name)) {
    await rm(path.join(versionsDir, entry.name), { recursive: true, force: true })
  }
}

await writeFile(indexPath, `${JSON.stringify({
  ...index,
  versions: publishedVersions,
}, null, 2)}\n`, 'utf8')

console.log(`研发发布包已生成：${outputDir}`)
console.log(`已包含 ${publishedVersions.length} 个已发布版本，未发布版本已从发布包排除。`)
