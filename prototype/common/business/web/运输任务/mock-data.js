/**
 * 运输任务 —— Mock 数据
 * 字段与文案严格对齐当前验收页面（Pixso 1920×1364 原型），不得自行优化业务内容。
 * 所有重复卡片/子任务均由数据循环渲染。
 */

export const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待执行' },
  { key: 'running', label: '运输中' },
  { key: 'done', label: '已完成' },
  { key: 'paused', label: '已暂停' },
  { key: 'stopped', label: '已终止' },
  { key: 'void', label: '已作废' },
]

/** 筛选区可用项（设计稿展开项） */
export const filterOptions = {
  dispatch: ['内部调度', '委外调度'],
  transport: ['公路运输', '水路运输', '铁路运输', '空运'],
  load: ['一装一卸', '多装多卸', '拼车', '拼船', '整船整箱', '拼船整箱', '散杂货', '集装箱'],
}

/** 策略：折叠卡页签、承运/托运企业、进度、途经点 共用展开卡展示值（设计稿重复） */
const SHARED_HEAD = {
  progressText: '50% | 75箱',
  carrier: '承运企业名称名称名称名称名称',
  carrierTag: '承运',
  shipper: '托运企业名称名称名称名称名称',
  shipperTag: '托运',
  waypointLabel: '途经点',
  waypointCount: '2000',
}

/** 子任务明细（展开任务 01-05） */
const subtaskDetail = {
  taskTimeStart: '2024-12-14 11:00',
  taskTimeEnd: '2024-12-24 11:00',
  dispatchProgress: '50%',
  transportProgress: '50%',
  driverTaskCount: '0',
  waybillCount: '5',
}

const makeSubtask = (seq, status, overrides = {}) => ({
  seq: String(seq).padStart(2, '0'),
  waybillNo: '20151111212112',
  time: '2024-12-13 14:52:11',
  org: '运输一部',
  person: '张三',
  status,
  actions: overrides.actions ?? ['车辆指派', '任务码', '详情'],
  detail: {
    firstField: { label: '任务集装箱', value: '20GP*15+45HGQ*10=25' },
    ...subtaskDetail,
    cost: '按装货数量计费 15元/吨',
    costTag: '单位计费',
    ...overrides.detail,
  },
})

const defaultSummary = [
  { label: '货物', value: '200吨 | 100m³ | 100件' },
  { label: '集装箱', value: '20GP*4 | 45HG*10' },
  { label: '运输单价', value: '100元/吨' },
  { label: '基础运费', value: '10,000元' },
  { label: '调度员', value: '王同学' },
  { label: '指派时间', value: '2025-02-10 10:10' },
  { label: '备注', value: '备注信息备注信息备注信息' },
]

const defaultSubtasks = [
  makeSubtask(1, '待执行'),
  makeSubtask(2, '运输中', { detail: { firstField: { label: '任务散货量', value: '100件+100吨+体积100m³=300' }, cost: 'xxxxxxxx计费模板', costTag: '模版计费' } }),
  makeSubtask(3, '已完成', { actions: ['详情'], detail: { firstField: { label: '任务货量', value: '100件+100吨+体积100m³=300' }, cost: 'xxxxxxxx计费模板', costTag: '模版计费' } }),
  makeSubtask(4, '已暂停', { actions: ['详情'], detail: { firstField: { label: '任务货量', value: '100件+100吨+体积100m³=300' }, cost: 'xxxxxxxx计费模板', costTag: '模版计费' } }),
  makeSubtask(5, '已作废', { actions: ['详情', '删除'], detail: { cost: 'xxxxxxxx计费模板', costTag: '模版计费' } }),
]

export const initialTasks = [
  {
    key: 'task-1',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'todo',
    tags: {
      schedule: '委外调度',
      transports: ['公路运输', '水路运输'],
      loads: ['拼船整箱', '集装箱'],
    },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: true,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-2',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'running',
    tags: { schedule: '内部调度', transports: ['公路运输'], loads: ['一装一卸', '整船整箱', '散杂货', '拼车'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-3',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'todo',
    tags: { schedule: '内部调度', transports: ['水路运输'], loads: ['多装多卸'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-4',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'done',
    tags: { schedule: '委外调度', transports: ['水路运输'], loads: ['多装多卸'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-5',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'paused',
    tags: { schedule: '委外调度', transports: ['水路运输'], loads: ['多装多卸'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-6',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'stopped',
    tags: { schedule: '委外调度', transports: ['水路运输'], loads: ['多装多卸'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
  {
    key: 'task-7',
    id: 'YSRW1231321',
    dispatchText: '关联调度记录 6546546546454',
    status: 'void',
    tags: { schedule: '委外调度', transports: ['水路运输'], loads: ['整船整箱'] },
    ...SHARED_HEAD,
    summary: defaultSummary,
    expanded: false,
    subtasks: defaultSubtasks,
  },
]

export const expandedTask = initialTasks[0]
export const collapsedTasks = initialTasks.slice(1)

/** 分页展示（与验收页面一致） */
export const paginationMeta = {
  totalText: '共4433条',
  pageSizeText: '10条/页',
  pageCount: 6,
  current: 2,
}

/** 途经点弹层数据 */
export const waypointOverlay = [
  {
    title: '富邦总部大楼', sign: '装', tone: 'blue',
    time: '2023-12-14  00：00',
    address: '福建省福州市仓山区南社二路与南江滨西大道交叉口西南角',
  },
  {
    title: '富邦总部大楼', sign: '装', tone: 'blue',
    time: '2023-12-14  00：00',
    address: '福建省福州市仓山区南社二路与南江滨西大道交叉口西南角',
  },
  {
    title: '富邦总部大楼', sign: '卸', tone: 'green',
    time: '2023-12-14  00：00',
    address: '福建省福州市仓山区南社二路与南江滨西大道交叉口西南角',
  },
]
