import assert from 'node:assert/strict'
import test from 'node:test'

import {
  REQUIREMENT_CATALOG_KEY,
  resolveVersionWorkbench,
} from '../src/review/version-workbench.mjs'

const CATALOG = [
  { key: 'waybillManage', name: '托运单管理' },
  { key: 'multimodalManage', name: '联运计划管理' },
  { key: 'transportPlan', name: '水运计划' },
]

const VERSION = {
  id: 'TMS-COMMON-202608-01',
  pages: [
    { pageKey: 'multimodalManage', order: 2 },
    { pageKey: 'waybillManage', order: 1 },
  ],
}

test('版本工作台目录只包含当前版本页面并保持交付顺序', () => {
  const context = resolveVersionWorkbench(VERSION, 'multimodalManage', CATALOG)
  assert.deepEqual(context.pages.map(page => page.key), ['waybillManage', 'multimodalManage'])
  assert.deepEqual(context.directoryItems.map(item => item.key), [
    REQUIREMENT_CATALOG_KEY,
    'waybillManage',
    'multimodalManage',
  ])
  assert.equal(context.activePage.key, 'multimodalManage')
})

test('版本根地址默认打开需求目录且与原型页面直接并列', () => {
  const context = resolveVersionWorkbench(VERSION, undefined, CATALOG)

  assert.equal(context.activeKey, REQUIREMENT_CATALOG_KEY)
  assert.equal(context.activePage, null)
  assert.deepEqual(context.directoryItems.map(item => ({ key: item.key, name: item.name })), [
    { key: REQUIREMENT_CATALOG_KEY, name: '需求目录' },
    { key: 'waybillManage', name: '托运单管理' },
    { key: 'multimodalManage', name: '联运计划管理' },
  ])
})

test('版本工作台拒绝进入未纳入版本的页面', () => {
  assert.throws(
    () => resolveVersionWorkbench(VERSION, 'transportPlan', CATALOG),
    error => error.code === 'PAGE_NOT_IN_VERSION',
  )
  assert.throws(
    () => resolveVersionWorkbench(VERSION, 'missing', CATALOG),
    error => error.code === 'PAGE_NOT_IN_VERSION',
  )
})
