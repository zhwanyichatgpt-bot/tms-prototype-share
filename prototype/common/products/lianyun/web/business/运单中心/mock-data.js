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

/* 运单列表行（静态样例；北港定制“卸货地址及运输单价变更”场景见 prototype/projects/beigang/products/lianyun/web/运单中心/） */
export const waybillRows = [
  {
    key: 'wb-0', seq: 1, kindTab: 'normal',
    waybillNo: '2608261030128866', acceptTime: '2026-08-26 10:30:12',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽H66666', driver: '刘乾德', phone: '15060404641' },
    stops: [makeStop('榕城江上图', '2026-08-26 08:15:33'), makeStop('十堰货运站', '2026-08-28 18:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-00', seq: 2, kindTab: 'normal',
    waybillNo: '2608250915337712', acceptTime: '2026-08-25 09:15:44',
    status: 'accepted', statusLabel: '已接单',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽A23888', driver: '陈国强', phone: '13800000002' },
    stops: [makeStop('福州保税港', '2026-08-27 08:00:00'), makeStop('武汉阳逻港', '2026-08-30 14:00:00')],
    waypoints: 3, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-20', seq: 3, kindTab: 'normal',
    waybillNo: '2608260915556677', acceptTime: '2026-08-26 09:15:55',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂D55566', driver: '周江涛', phone: '13800000008' },
    stops: [makeStop('榕城江上图', '2026-08-26 08:00:00'), makeStop('荆州港盐卡港区', '2026-08-29 10:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-10', seq: 1, kindTab: 'outsourced',
    waybillNo: '2608260811223344', acceptTime: '2026-08-26 08:11:22',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂A66688', driver: '王远航', phone: '13800000003' },
    stops: [makeStop('榕城江上图', '2026-08-26 07:30:00'), makeStop('宜昌东站物流园', '2026-08-29 12:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-11', seq: 2, kindTab: 'outsourced',
    waybillNo: '2608251615445566', acceptTime: '2026-08-25 16:15:44',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂B12345', driver: '李汉江', phone: '13800000004' },
    stops: [makeStop('福州保税港', '2026-08-25 17:00:00'), makeStop('黄石新港物流园', '2026-08-28 10:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-12', seq: 3, kindTab: 'outsourced',
    waybillNo: '2608241012778899', acceptTime: '2026-08-24 10:12:33',
    status: 'accepted', statusLabel: '已接单',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂C98765', driver: '赵长江', phone: '13800000005' },
    stops: [makeStop('榕城江上图', '2026-08-24 11:00:00'), makeStop('荆州港盐卡港区', '2026-08-27 09:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-13', seq: 4, kindTab: 'normal',
    waybillNo: '2608230911112233', acceptTime: '2026-08-23 09:11:11',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽H88888', driver: '孙建军', phone: '13800000006' },
    stops: [makeStop('福州保税港', '2026-08-23 10:00:00'), makeStop('十堰货运站', '2026-08-26 15:00:00')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
  {
    key: 'wb-3', seq: 5, kindTab: 'normal',
    waybillNo: '2608201749228558', acceptTime: '2026-08-20 17:49:21',
    status: 'recheck', statusLabel: '待复核',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽A13195', driver: '赖师傅', phone: '13800000007' },
    stops: [makeStop('天洋广场C馆(天洋广场店)', '2026-08-20 17:50:46'), makeStop('连江县', '2026-08-20 17:51:18')],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    actions: ['详情', '运单复核', '标记异常'],
  },
]

/* 分页展示（与设计截图一致） */
export const paginationMeta = {
  totalText: '共 45 条',
  pageSizeText: '10条/页',
  pageCount: 5,
  current: 1,
}
