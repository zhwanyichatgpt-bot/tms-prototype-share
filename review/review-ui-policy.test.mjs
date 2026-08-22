import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildReviewPath,
  buildPrototypeCatalogPath,
  buildReviewUrl,
  formatRevisionLabel,
  getRouteDecision,
  prepareReviewPages,
  reviewVisibleStatus,
  sortRevisionBatches,
} from '../src/review/review-ui-policy.mjs'

const PAGE_CATALOG = [
  { key: 'waybillManage', name: '托运单管理', module: '托运单管理', platform: 'web' },
  { key: 'transportPlan', name: '水运计划', module: '水运计划', platform: 'web' },
]

test('开发环境进入管理页，生产环境管理页和旧直达页回到安全入口', () => {
  assert.equal(getRouteDecision('root', true), 'manage')
  assert.equal(getRouteDecision('root', false), 'allow')
  assert.equal(getRouteDecision('manage', true), 'allow')
  assert.equal(getRouteDecision('manage', false), 'root')
  assert.equal(getRouteDecision('legacy', false), 'root')
  assert.equal(getRouteDecision('prototypeCatalog', true), 'allow')
  assert.equal(getRouteDecision('prototypeCatalog', false), 'root')
  assert.equal(getRouteDecision('review', false), 'allow')
})

test('研发原型清单严格按版本页面顺序生成且忽略未纳入页面', () => {
  const pages = prepareReviewPages({
    pages: [
      { pageKey: 'transportPlan', order: 2 },
      { pageKey: 'waybillManage', order: 1 },
    ],
  }, PAGE_CATALOG)

  assert.deepEqual(pages.map(page => page.key), ['waybillManage', 'transportPlan'])
  assert.equal(pages[0].name, '托运单管理')
  assert.deepEqual(prepareReviewPages({ pages: [{ pageKey: 'missing', order: 1 }] }, PAGE_CATALOG), [])
})

test('修改记录按 R2、R1、R0 倒序展示', () => {
  const batches = sortRevisionBatches([
    { revision: 'R0' },
    { revision: 'R2' },
    { revision: 'R1' },
  ])
  assert.deepEqual(batches.map(batch => batch.revision), ['R2', 'R1', 'R0'])
})

test('用户界面使用纯文字描述交付和变更次数', () => {
  assert.equal(formatRevisionLabel('pending'), '尚未交付')
  assert.equal(formatRevisionLabel('R0'), '首次交付')
  assert.equal(formatRevisionLabel('R1'), '第1次变更')
  assert.equal(formatRevisionLabel('R12'), '第12次变更')
})

test('研发页面不展示产品内部完成状态', () => {
  assert.equal(reviewVisibleStatus('in_progress'), '')
  assert.equal(reviewVisibleStatus('completed'), '')
})

test('每个版本自动生成稳定的研发评审地址', () => {
  assert.equal(buildReviewPath('TMS-COMMON-202608-01'), '/review/TMS-COMMON-202608-01')
  assert.equal(buildReviewPath('TMS-BEIGANG-202608-02'), '/review/TMS-BEIGANG-202608-02')
  assert.equal(buildReviewUrl('TMS-COMMON-202608-01', 'https://prototype.example.com/'), 'https://prototype.example.com/review/TMS-COMMON-202608-01')
})

test('产品全部原型入口使用固定的本地管理地址', () => {
  assert.equal(buildPrototypeCatalogPath(), '/manage/prototypes')
})
