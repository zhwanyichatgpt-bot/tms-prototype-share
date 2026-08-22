import path from 'node:path'

import { pageCatalog as defaultPageCatalog } from './page-catalog.mjs'
import { createReviewStore } from './review-store.mjs'

export async function recordVersionChange({
  projectRoot,
  versionId,
  payload,
  pageCatalog = defaultPageCatalog,
  now = () => new Date().toISOString(),
}) {
  if (!projectRoot) throw new TypeError('projectRoot 不能为空')
  if (!versionId) throw new TypeError('versionId 不能为空')

  const store = createReviewStore({
    dataDir: path.join(path.resolve(projectRoot), 'public', 'review-data'),
    pageCatalog,
    now,
  })
  return store.createRevision(String(versionId), payload)
}
