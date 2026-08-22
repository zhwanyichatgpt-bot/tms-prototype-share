import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ReviewValidationError,
  assertSafeSegment,
  createReviewVersion,
  createRevisionBatch,
  generateVersionId,
  markVersionCompleted,
  publishReviewVersion,
  updateDraftVersion,
  validateVersionPages,
} from './version-model.mjs'

const NOW = '2026-08-22T08:00:00.000Z'
const PAGE_CATALOG = [
  { key: 'waybillManage', scope: 'common', projectId: null },
  { key: 'transportPlan', scope: 'project', projectId: 'beigang' },
  { key: 'inquiryShipper', scope: 'project', projectId: 'guanglin' },
]

const commonDraftInput = {
  name: 'TMS 通用能力 8 月交付',
  scope: 'common',
  projectId: null,
  baseVersionId: null,
  targetReleaseDate: '2026-09-15',
  pages: [{ pageKey: 'waybillManage', order: 1 }],
}

test('版本编号按创建月份和归属自动递增', () => {
  assert.equal(generateVersionId({ scope: 'common', existingIds: [], now: NOW }), 'TMS-COMMON-202608-01')
  assert.equal(
    generateVersionId({
      scope: 'common',
      existingIds: ['TMS-COMMON-202608-01', 'TMS-COMMON-202607-04'],
      now: NOW,
    }),
    'TMS-COMMON-202608-02',
  )
  assert.equal(
    generateVersionId({ scope: 'project', projectId: 'beigang', existingIds: [], now: NOW }),
    'TMS-BEIGANG-202608-01',
  )
})

test('需求归属不限制原型选择范围', () => {
  assert.doesNotThrow(() => validateVersionPages({
    scope: 'common',
    projectId: null,
    pages: [{ pageKey: 'transportPlan', order: 1 }],
  }, PAGE_CATALOG))

  assert.doesNotThrow(() => validateVersionPages({
    scope: 'project',
    projectId: 'beigang',
    pages: [
      { pageKey: 'waybillManage', order: 1 },
      { pageKey: 'transportPlan', order: 2 },
      { pageKey: 'inquiryShipper', order: 3 },
    ],
  }, PAGE_CATALOG))
})

test('页面清单拒绝未知页面、重复页面和重复顺序', () => {
  assert.throws(
    () => validateVersionPages({ scope: 'common', pages: [{ pageKey: 'missing', order: 1 }] }, PAGE_CATALOG),
    error => error.code === 'PAGE_NOT_FOUND',
  )
  assert.throws(
    () => validateVersionPages({
      scope: 'common',
      pages: [
        { pageKey: 'waybillManage', order: 1 },
        { pageKey: 'waybillManage', order: 2 },
      ],
    }, PAGE_CATALOG),
    error => error.code === 'DUPLICATE_PAGE',
  )
  assert.throws(
    () => validateVersionPages({
      scope: 'project',
      projectId: 'beigang',
      pages: [
        { pageKey: 'waybillManage', order: 1 },
        { pageKey: 'transportPlan', order: 1 },
      ],
    }, PAGE_CATALOG),
    error => error.code === 'DUPLICATE_PAGE_ORDER',
  )
})

test('创建版本时修订号为 pending，状态为进行中', () => {
  const version = createReviewVersion(commonDraftInput, {
    existingIds: [],
    pageCatalog: PAGE_CATALOG,
    now: NOW,
  })

  assert.equal(version.id, 'TMS-COMMON-202608-01')
  assert.equal(version.status, 'in_progress')
  assert.equal(version.revision, 'pending')
  assert.equal(version.createdAt, NOW)
  assert.equal(version.updatedAt, NOW)
})

test('首次发布研发地址必须有上线日期和页面，并自动形成 R0', () => {
  const noReleaseDate = createReviewVersion({ ...commonDraftInput, targetReleaseDate: null }, {
    existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW,
  })
  assert.throws(
    () => publishReviewVersion(noReleaseDate, '2026-08-23T08:00:00.000Z'),
    error => error.code === 'RELEASE_DATE_REQUIRED',
  )

  const noPages = createReviewVersion({ ...commonDraftInput, pages: [] }, {
    existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW,
  })
  assert.throws(
    () => publishReviewVersion(noPages, '2026-08-23T08:00:00.000Z'),
    error => error.code === 'VERSION_PAGES_REQUIRED',
  )

  const draft = createReviewVersion(commonDraftInput, { existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW })
  const result = publishReviewVersion(draft, '2026-08-23T08:00:00.000Z')
  assert.equal(result.version.status, 'in_progress')
  assert.equal(result.version.revision, 'R0')
  assert.equal(result.version.publishedAt, '2026-08-23T08:00:00.000Z')
  assert.equal(result.revisionBatch.revision, 'R0')
  assert.equal(result.revisionBatch.items[0].type, 'initial_delivery')
})

test('标记完成只改变完成状态，不冻结版本', () => {
  const draft = createReviewVersion(commonDraftInput, { existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW })
  const completed = markVersionCompleted(draft, '2026-08-23T08:00:00.000Z')
  assert.equal(completed.status, 'completed')
  assert.equal(completed.completedAt, '2026-08-23T08:00:00.000Z')
  assert.doesNotThrow(() => updateDraftVersion(completed, { name: '完成后仍可修改' }, PAGE_CATALOG, NOW))
  assert.throws(
    () => markVersionCompleted(completed, NOW),
    error => error.code === 'VERSION_ALREADY_COMPLETED',
  )
})

test('R0 后影响研发的修改必须通过修订批次并递增到 R1', () => {
  const draft = createReviewVersion(commonDraftInput, { existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW })
  const { version: r0 } = publishReviewVersion(draft, '2026-08-23T08:00:00.000Z')

  assert.throws(
    () => updateDraftVersion(r0, { targetReleaseDate: '2026-09-20' }, PAGE_CATALOG, NOW),
    error => error.code === 'REVISION_REQUIRED',
  )

  const { version: r1, revisionBatch } = createRevisionBatch(r0, {
    reason: '联调后调整上线时间',
    patch: { targetReleaseDate: '2026-09-20' },
    items: [{
      type: 'release_date',
      pageKeys: ['waybillManage'],
      before: '2026-09-15',
      after: '2026-09-20',
      devImpact: '同步调整提测排期',
    }],
  }, PAGE_CATALOG, '2026-08-24T08:00:00.000Z')

  assert.equal(r1.revision, 'R1')
  assert.equal(r1.targetReleaseDate, '2026-09-20')
  assert.equal(revisionBatch.revision, 'R1')
  assert.equal(revisionBatch.reason, '联调后调整上线时间')
})

test('修订批次必须填写原因、修改前后、影响页面和研发注意事项', () => {
  const draft = createReviewVersion(commonDraftInput, { existingIds: [], pageCatalog: PAGE_CATALOG, now: NOW })
  const { version: r0 } = publishReviewVersion(draft, NOW)

  assert.throws(
    () => createRevisionBatch(r0, {
      reason: '',
      patch: {},
      items: [{ type: 'rule', pageKeys: [], before: '', after: '', devImpact: '' }],
    }, PAGE_CATALOG, NOW),
    error => error.code === 'INVALID_REVISION_BATCH',
  )
})

test('路径片段拒绝目录穿越和非法字符', () => {
  assert.equal(assertSafeSegment('TMS-COMMON-202608-01'), 'TMS-COMMON-202608-01')
  assert.throws(() => assertSafeSegment('../versions'), error => error.code === 'INVALID_PATH_SEGMENT')
  assert.throws(() => assertSafeSegment('北港'), error => error.code === 'INVALID_PATH_SEGMENT')
})
