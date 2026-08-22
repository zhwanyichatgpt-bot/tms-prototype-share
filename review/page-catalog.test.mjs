import assert from 'node:assert/strict'
import test from 'node:test'

import { pageCatalog } from './page-catalog.mjs'
import { pages } from '../src/page-registry.js'

test('页面注册表与版本归属目录一一对应', () => {
  assert.deepEqual(
    pages.map(page => page.key).sort(),
    pageCatalog.map(page => page.key).sort(),
  )
  assert.equal(pages.find(page => page.key === 'waybillManage').scope, 'common')
  const beigangPage = pages.find(page => page.key === 'transportPlan')
  assert.equal(beigangPage.scope, 'project')
  assert.equal(beigangPage.projectId, 'beigang')

  const guanglinPage = pages.find(page => page.key === 'inquiryShipper')
  assert.equal(guanglinPage.scope, 'project')
  assert.equal(guanglinPage.projectId, 'guanglin')
})

test('每个原型都有可供产品选择时识别的需求和用途备注', () => {
  for (const page of pages) {
    assert.ok(page.requirement?.trim(), `${page.key} 缺少对应需求`)
    assert.ok(page.remark?.trim(), `${page.key} 缺少用途备注`)
  }
})
