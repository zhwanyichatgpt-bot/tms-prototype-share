import assert from 'node:assert/strict'
import test from 'node:test'

import { annotationLoadUrl, annotationRelativePath } from './annotation-paths.mjs'

test('版本标注路径按 versionId/pageKey 隔离', () => {
  assert.equal(
    annotationRelativePath({ versionId: 'TMS-COMMON-202608-01', pageKey: 'waybillManage' }),
    'review-data/versions/TMS-COMMON-202608-01/annotations/waybillManage.json',
  )
  assert.equal(
    annotationLoadUrl({ baseUrl: '/tms/', versionId: 'TMS-COMMON-202608-01', pageKey: 'waybillManage' }),
    '/tms/review-data/versions/TMS-COMMON-202608-01/annotations/waybillManage.json',
  )
})

test('旧直达页继续使用公共标注路径', () => {
  assert.equal(annotationRelativePath({ pageKey: 'waybillManage' }), 'annotations/waybillManage.json')
})

test('标注路径拒绝目录穿越和非法标识', () => {
  assert.throws(() => annotationRelativePath({ versionId: '../bad', pageKey: 'waybillManage' }), /路径标识/)
  assert.throws(() => annotationRelativePath({ versionId: 'TMS-COMMON-202608-01', pageKey: 'a/b' }), /路径标识/)
})
