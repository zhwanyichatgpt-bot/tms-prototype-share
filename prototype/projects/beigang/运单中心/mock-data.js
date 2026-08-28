/**
 * 运单中心 —— Mock 数据
 * 字段与文案严格对齐当前设计截图（1920 宽画板），不得自行优化业务内容。
 * 所有重复运单行均由数据循环渲染。
 */

/* 左侧运单类型面板 */
export const waybillTypes = [
  {
    key: 'truck', label: '汽运运单', expanded: true,
    stats: [
      { key: 'recheck', label: '待复核', count: 92 },
      { key: 'settle', label: '待结算', count: 26 },
      { key: 'abnormal', label: '异常单', count: 9 },
    ],
  },
  {
    key: 'water', label: '水运运单', expanded: false,
    stats: [
      { key: 'recheck', label: '待复核', count: 9 },
      { key: 'settle', label: '待结算', count: 10 },
      { key: 'abnormal', label: '异常单', count: 1 },
    ],
  },
  {
    key: 'rail', label: '铁路运单', expanded: false,
    stats: [
      { key: 'paid', label: '已打款', count: 16 },
    ],
  },
]

/* 运单类型页签 */
export const waybillKindTabs = [
  { key: 'normal', label: '普通运单' },
  { key: 'platform', label: '平台运单' },
  { key: 'outsourced', label: '委外运单' },
]

/* 状态页签 */
export const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'accepted', label: '已接单' },
  { key: 'running', label: '运输中' },
  { key: 'recheck', label: '待复核' },
  { key: 'settle', label: '待结算' },
  { key: 'done', label: '已完成' },
  { key: 'abnormal', label: '有异常' },
  { key: 'void', label: '已作废' },
]

/* 状态徽标样式映射 */
export const statusTone = {
  settle: 'blue',
  recheck: 'purple',
  accepted: 'cyan',
  running: 'green',
  done: 'gray',
  abnormal: 'red',
  void: 'gray',
}

/* 运单来源标签样式映射 */
export const sourceTone = {
  内部调度: 'green',
  自主接单: 'purple',
}

const makeStop = (name, time) => ({ name, time })


/* ==================== 地址变更（北港水运 PRD） ====================
/* 行数据与地址变更逻辑统一在 address-change-store.js（单一数据源），此处仅 re-export 保持兼容 */
export {
  ADDRESS_CHANGE_ALLOWED_STATUS,
  addressChangeStatusMeta,
  unloadAddressOptions,
  buildWaybillRows,
  getWaybill,
  canInitiate,
  getSnapshot,
  submitChange,
  withdrawChange,
  actualCarrierConfirm,
  actualCarrierReject,
  hasProcessing,
  getChangeData,
  downstreamTitle,
  statusLabelFor,
  ORG_MODE,
  PROCESSING_STATUS,
} from './address-change-store'

/* 分页展示（与设计截图一致） */
export const paginationMeta = {
  totalText: '共 45 条',
  pageSizeText: '10条/页',
  pageCount: 5,
  current: 1,
}
