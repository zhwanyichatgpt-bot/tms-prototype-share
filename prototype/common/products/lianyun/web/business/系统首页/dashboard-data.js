export const tasks = [
  ['司机运输申请（YS20261105001）', '调度一组'],
  ['司机运输申请（YS20261105002）', '调度二组'],
  ['运输竞价（华东煤炭运输）', '运输一组'],
  ['运输调度（集装箱运输计划）', '运输二组'],
]

export const stages = [
  { title: '运输计划', icon: '▤', items: [['竞价中', 7], ['进行中', 312], ['未发布', 13]] },
  { title: '调度计划', icon: '▥', items: [['待指派', 0], ['待审核', 0], ['司机申请', 1]] },
  { title: '运单运输', icon: '▰', items: [['已接单', 0], ['已装货', 8], ['已卸货', 141], ['异常运单', 2]] },
  { title: '运输费用', icon: '¥', items: [['运输核算', 860], ['待复核', 142], ['调度核算', 206], ['运输收付款', 45]] },
]

export const stockCards = [
  { title: '入库作业数据统计', key: 'receiving', kind: 'movement', direction: '入', metrics: ['矿发车数', '矿发吨数', '场收车数', '场收吨数'] },
  { title: '货转作业数据统计', key: 'transfer', kind: 'throughput', lead: '货转吞吐量', prefix: '货转', max: 60, bars: [0, 0, 0, 0, 0, 0, 59, 0, 0, 0, 0, 0] },
  { title: '批次作业数据统计', key: 'batches', kind: 'throughput', lead: '批次吞吐量', prefix: '批次', max: 700, bars: [0, 0, 230, 630, 0, 0, 58, 96, 36, 0, 0, 0], trend: true },
  { title: '作业数据统计', key: 'handling', kind: 'throughput', lead: '日均吞吐量', prefix: '', max: 25000, bars: [0, 0, 0, 0, 0, 0, 5100, 0, 0, 20000, 0, 0], trend: true },
  { title: '出库作业数据统计', key: 'shipping', kind: 'movement', direction: '出', metrics: ['神华外购', '港口', '配货出库', '配送出库'] },
]

export const periods = ['今日', '本月', '本年', '自定义']
export const updateTime = '2026-11-05 20:42:03'
