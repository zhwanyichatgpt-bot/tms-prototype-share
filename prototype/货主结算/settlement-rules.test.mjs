import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDetailQuantitySnapshot,
  buildPlanQuantitySummary,
  formatLocalDate,
  validateAdjustmentItems,
} from './settlement-rules.mjs'

test('结算日期默认使用本地当天日期', () => {
  assert.equal(formatLocalDate(new Date(2026, 6, 13)), '2026-07-13')
})

test('整票数量摘要按货品逐行展示，不合并为无来源总数', () => {
  const plan = {
    settlementType: 'whole',
    billingCondition: '按重量',
    cargoItems: [
      { name: '机械设备', transportTotal: 30, unsettledQty: 20 },
      { name: '木材', transportTotal: 15, unsettledQty: 10 },
    ],
  }

  assert.equal(buildPlanQuantitySummary(plan, 'total'), '机械设备 30吨 / 木材 15吨')
  assert.equal(buildPlanQuantitySummary(plan, 'unsettled'), '机械设备 20吨 / 木材 10吨')
})

test('分段异构数量摘要按路段和量纲展示，禁止把吨与箱直接相加', () => {
  const plan = {
    settlementType: 'segment',
    subPlans: [
      {
        seq: 1,
        billingCondition: '按重量',
        lineItems: [{ name: '电子产品', transportTotal: 30, unsettledQty: 25 }],
      },
      {
        seq: 2,
        billingCondition: '按集装箱',
        lineItems: [
          { name: '20GP', transportTotal: 10, unsettledQty: 8 },
          { name: '40HQ', transportTotal: 5, unsettledQty: 5 },
        ],
      },
    ],
  }

  assert.equal(buildPlanQuantitySummary(plan, 'total'), '路段1：电子产品 30吨 / 路段2：20GP 10箱、40HQ 5箱')
  assert.equal(buildPlanQuantitySummary(plan, 'unsettled'), '路段1：电子产品 25吨 / 路段2：20GP 8箱、40HQ 5箱')
})

test('详情页已结算量包含本次结算量，未结算量展示结算后的剩余量', () => {
  assert.deepEqual(buildDetailQuantitySnapshot(100, 30, 20), {
    settledQty: 50,
    unsettledQty: 50,
  })
})

test('补贴扣减项目要求名称非空且金额大于0', () => {
  assert.deepEqual(validateAdjustmentItems([{ name: '', amount: 100 }]), {
    valid: false,
    message: '第1行项目名称不能为空',
  })
  assert.deepEqual(validateAdjustmentItems([{ name: '装车补贴', amount: 0 }]), {
    valid: false,
    message: '第1行金额必须大于0',
  })
  assert.deepEqual(validateAdjustmentItems([{ name: '装车补贴', amount: 100 }]), {
    valid: true,
    total: 100,
  })
})
