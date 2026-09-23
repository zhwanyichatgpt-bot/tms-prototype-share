/**
 * 联运计划管理页 Mock 数据
 * 依据 Pixso 设计稿（92:829 联运计划）字段重构
 * 状态体系：待审批 / 生效中 / 已暂停 / 已完成 / 已终止 / 已作废
 */

export const statusTabs = [
  { label: '全部', value: '全部' },
  { label: '待审批', value: '待审批' },
  { label: '生效中', value: '生效中' },
  { label: '已暂停', value: '已暂停' },
  { label: '已完成', value: '已完成' },
  { label: '已终止', value: '已终止' },
  { label: '已作废', value: '已作废' },
]

// 装/卸节点行
function node(type, city, address, timeLabel, time, cargo) {
  return { type, city, address, timeLabel, time, cargo }
}

// 路段
function segment(name, mode, cargoType, planName, status, nodes) {
  return { name, mode, cargoType, planName, status, nodes }
}

const defaultNodes = [
  node('装', '辽宁 朝阳', '北京市龙潭镇马架子村幸福路123号', '装货时间', '2025-03-02 08:00', '煤 | 3000吨 | 100m³ | 100件'),
  node('装', '辽宁 朝阳', '北京市龙潭镇马架子村幸福路123号', '装货时间', '2025-03-02 08:00', '煤 | 3000吨 | 100m³ | 100件'),
  node('卸', '辽宁 朝阳', '北京市龙潭镇马架子村幸福路123号', '卸货时间', '2025-03-02 08:00', '煤 | 3000吨 | 100m³ | 100件'),
]

export const plans = [
  {
    id: 'QYCG-2024022801201',
    title: 'QYCG-2024022801201鄂尔多斯远知能源-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '待审批',
    progress: { percent: 40, legs: ['汽运', '水运', '铁运', '汽运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
      segment('路段2', '水运', '集装箱', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
      segment('路段3', '火运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
    ],
  },
  {
    id: 'QYCG-2024022801202',
    title: 'QYCG-2024022801201部尔多斯远知能源有限公司-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '生效中',
    progress: { percent: 40, legs: ['汽运', '水运', '铁运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
      segment('路段2', '水运', '集装箱', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
    ],
  },
  {
    id: 'QYCG-2024022801203',
    title: 'QYCG-2024022801201部尔多斯远知能源有限公司-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '已暂停',
    progress: { percent: 40, legs: ['汽运', '水运', '铁运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '待执行', defaultNodes),
    ],
  },
  {
    id: 'QYCG-2024022801204',
    title: 'QYCG-2024022801201部尔多斯远知能源有限公司-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '已完成',
    progress: { percent: 100, legs: ['汽运', '水运', '铁运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '已完成', defaultNodes),
    ],
  },
  {
    id: 'QYCG-2024022801205',
    title: 'QYCG-2024022801201部尔多斯远知能源有限公司-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '已终止',
    progress: { percent: 40, legs: ['汽运', '水运', '铁运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '已终止', defaultNodes),
    ],
  },
  {
    id: 'QYCG-2024022801206',
    title: 'QYCG-2024022801201部尔多斯远知能源有限公司-福州到上海-9月12日铁水联运',
    combineTag: '公水联运',
    changeTag: '集改散',
    status: '已作废',
    progress: { percent: 0, legs: ['汽运', '水运', '铁运'] },
    loadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    unloadAddr: { alias: '地址别名', time: '2024-12-01 12:00' },
    settleStatus: '未结算',
    carrier: { logoText: '杰顺', name: '福建万维宇宙科技有限公司' },
    waybillName: '关联运单名称...',
    cargo: '3000吨 | 100m³ | 100件',
    containers: '20GP*4 | 45HQ*10',
    unitPrice: '100元/吨',
    baseFreight: '10,000元',
    creator: '花同学',
    createTime: '2024-12-11 12:00:10',
    segments: [
      segment('路段1', '汽运', '散杂货', 'QYCG-2024022801201这里显示计划名称，点击可以跳转', '已作废', defaultNodes),
    ],
  },
]

export const paginationMeta = {
  total: 4433,
  pageSize: 10,
  current: 2,
  pages: 105,
}

export default { statusTabs, plans, paginationMeta }
