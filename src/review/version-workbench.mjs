import { prepareReviewPages } from './review-ui-policy.mjs'

export const REQUIREMENT_CATALOG_KEY = 'requirementCatalog'

export class VersionWorkbenchError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'VersionWorkbenchError'
    this.code = code
  }
}

export function resolveVersionWorkbench(version, pageKey, pageCatalog) {
  const pages = prepareReviewPages(version, pageCatalog)
  const directoryItems = [
    { key: REQUIREMENT_CATALOG_KEY, name: '需求目录', type: 'requirement', status: 'ready' },
    ...pages.map(page => ({ ...page, type: 'prototype' })),
  ]
  const activeKey = pageKey || REQUIREMENT_CATALOG_KEY
  const activePage = activeKey === REQUIREMENT_CATALOG_KEY
    ? null
    : pages.find(page => page.key === activeKey)
  if (activeKey !== REQUIREMENT_CATALOG_KEY && !activePage) {
    throw new VersionWorkbenchError('PAGE_NOT_IN_VERSION', '该页面未纳入当前研发版本')
  }
  return { pages, directoryItems, activeKey, activePage }
}
