import assert from 'node:assert/strict'
import test from 'node:test'

import {
  openPrototypePage,
  resolvePrototypePageLocation,
} from '../src/review/prototype-navigation.mjs'
import { resolveVersionWorkbench, REQUIREMENT_CATALOG_KEY } from '../src/review/version-workbench.mjs'

const VERSION_ID = 'TMS-BEIGANG-202608-02'

/* 北港1.0.3.5版本页面清单（与 version.json 一致，仅用于测试） */
const BEIGANG_CATALOG = [
  { key: 'waybillCenterBeigang', name: '北港运单中心' },
  { key: 'waybillCenterDetailBeigang', name: '北港运单详情' },
  { key: 'shipownerWaybill', name: '船东移动端' },
  { key: 'transportPlan', name: '水运计划' },
]
const BEIGANG_VERSION = {
  id: VERSION_ID,
  pages: [
    { pageKey: 'waybillCenterBeigang', order: 1 },
    { pageKey: 'waybillCenterDetailBeigang', order: 2 },
    { pageKey: 'shipownerWaybill', order: 3 },
  ],
}

function makeRouterSpy() {
  const calls = []
  return { calls, push: (loc) => { calls.push(loc); return Promise.resolve() } }
}

test('版本环境下：运单中心进入详情使用版本路由并保留 versionId 与 key', () => {
  const router = makeRouterSpy()
  const route = { params: { versionId: VERSION_ID } }
  openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: 'wb-0' })
  assert.deepEqual(router.calls, [{
    name: 'versionPrototype',
    params: { versionId: VERSION_ID, pageKey: 'waybillCenterDetailBeigang' },
    query: { key: 'wb-0' },
  }])
})

test('版本环境下：查看/处理地址变更保留 versionId、key 与 tab', () => {
  const router = makeRouterSpy()
  const route = { params: { versionId: VERSION_ID } }
  openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: 'wb-11', tab: 'addressChange' })
  assert.deepEqual(router.calls, [{
    name: 'versionPrototype',
    params: { versionId: VERSION_ID, pageKey: 'waybillCenterDetailBeigang' },
    query: { key: 'wb-11', tab: 'addressChange' },
  }])
})

test('版本环境下：详情返回列表仍保留同一个 versionId', () => {
  const router = makeRouterSpy()
  const route = { params: { versionId: VERSION_ID } }
  openPrototypePage(router, route, 'waybillCenterBeigang')
  assert.deepEqual(router.calls, [{
    name: 'versionPrototype',
    params: { versionId: VERSION_ID, pageKey: 'waybillCenterBeigang' },
    query: {},
  }])
})

test('普通原型环境下：使用普通页面路由并保留 query', () => {
  const router = makeRouterSpy()
  const route = { params: {} }
  openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: 'wb-0' })
  assert.deepEqual(router.calls, [{
    name: 'waybillCenterDetailBeigang',
    params: {},
    query: { key: 'wb-0' },
  }])

  const back = makeRouterSpy()
  openPrototypePage(back, route, 'waybillCenterBeigang')
  assert.deepEqual(back.calls, [{
    name: 'waybillCenterBeigang',
    params: {},
    query: {},
  }])
})

test('resolvePrototypePageLocation：纯函数与 openPrototypePage 行为一致', () => {
  const versioned = resolvePrototypePageLocation({ versionId: VERSION_ID, pageKey: 'shipownerWaybill', query: { a: 1 } })
  assert.equal(versioned.name, 'versionPrototype')
  assert.equal(versioned.params.versionId, VERSION_ID)
  assert.equal(versioned.params.pageKey, 'shipownerWaybill')
  assert.deepEqual(versioned.query, { a: 1 })

  const plain = resolvePrototypePageLocation({ versionId: undefined, pageKey: 'shipownerWaybill' })
  assert.equal(plain.name, 'shipownerWaybill')
  assert.deepEqual(plain.params, {})
})

test('版本目录只使用当前版本3个页面，不回退到全局注册表', () => {
  const context = resolveVersionWorkbench(BEIGANG_VERSION, 'waybillCenterBeigang', BEIGANG_CATALOG)
  assert.deepEqual(context.pages.map(page => page.key), [
    'waybillCenterBeigang',
    'waybillCenterDetailBeigang',
    'shipownerWaybill',
  ])
  // 目录 = 需求目录 + 本版本3个原型页面，不含 transportPlan 等未纳入页面
  assert.deepEqual(context.directoryItems.map(item => item.key), [
    REQUIREMENT_CATALOG_KEY,
    'waybillCenterBeigang',
    'waybillCenterDetailBeigang',
    'shipownerWaybill',
  ])
})

test('未纳入当前版本的页面不能通过版本路由进入', () => {
  assert.throws(
    () => resolveVersionWorkbench(BEIGANG_VERSION, 'transportPlan', BEIGANG_CATALOG),
    (error) => error.code === 'PAGE_NOT_IN_VERSION',
  )
})
