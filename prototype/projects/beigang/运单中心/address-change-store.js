/**
 * 运单中心 —— 地址变更统一数据源（单一事实来源）
 * 列表、发起弹窗、运单详情共用同一张运单、同一条变更记录，保证联动一致。
 *
 * 业务边界（北港水运 PRD）：
 * - 系统内统一由合同承运商发起；托运企业不作为系统流转节点。
 * - 地址 + 托运企业运输单价为同一次原子变更：一起提交、一起生效、任一拒绝均不生效。
 * - 直接指派船东：发起 → 待船东确认 → 生效/拒绝。
 * - 委外实际承运商：发起 → 待实际承运商确认 → 待船东确认 → 生效/拒绝；实际承运商拒绝即终态。
 * - 一张运单同时最多一条处理中申请；历史记录只放终态（已生效/已拒绝/已撤回）。
 */
import { reactive, computed } from 'vue'

/* ==================== 状态枚举 ==================== */

/* 允许发起地址变更的运单主状态：已接单、运输中、有异常 */
export const ADDRESS_CHANGE_ALLOWED_STATUS = ['accepted', 'running', 'abnormal']

/* 处理中（非终态）变更状态 */
export const PROCESSING_STATUS = ['pendingActualCarrier', 'pendingShipowner']

/* 地址变更状态枚举与徽标样式（已删除旧 pendingCarrier 链路；用户可见文案用「待处理」） */
export const addressChangeStatusMeta = {
  pendingActualCarrier: { label: '待实际承运商处理', tone: 'orange' },
  pendingShipowner: { label: '待船东处理', tone: 'blue' },
  effective: { label: '已生效', tone: 'green' },
  rejected: { label: '已拒绝', tone: 'red' },
  withdrawn: { label: '已撤回', tone: 'gray' },
}

/* 按视角取状态文案：实际承运商视角下「待实际承运商处理」显示为「待处理」 */
export function statusLabelFor(status, perspective) {
  if (status === 'pendingActualCarrier' && perspective === 'actualCarrier') return '待处理'
  return addressChangeStatusMeta[status]?.label || status
}

/* 运输组织方式 */
export const ORG_MODE = {
  direct: '直接指派船东',
  outsource: '委外实际承运商',
}

/* 下游价格场景化命名：直接指派→船东运费；委外→承运商运输费用 */
export function downstreamTitle(orgMode) {
  return orgMode === 'direct' ? '船东运费' : '承运商运输费用'
}

/* ==================== 统一运单 + 变更数据源 ==================== */

/*
 * 每张运单：
 * - 主数据（运单号/状态/车辆/路线/价格/运输组织方式/当前执行船东）
 * - currentChange：处理中变更（同时最多一条，null 表示无）
 * - changeHistory：终态历史（已生效/已拒绝/已撤回，按时间倒序）
 *
 * orgMode 决定链路：direct=普通运单 tab（直接指派船东）；outsource=委外运单 tab。
 * kindTab 对应：normal/platform → 普通；outsourced → 委外。
 */
export const waybillStore = reactive({
  /* ---- 普通运单（直接指派船东） ---- */
  'wb-0': {
    key: 'wb-0', seq: 1, kindTab: 'normal', orgMode: 'direct', perspective: 'contractCarrier',
    waybillNo: '2608261030128866', acceptTime: '2026-08-26 10:30:12',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽H66666', driver: '刘乾德', phone: '15060404641' },
    shipowner: '刘乾德',
    stops: [{ name: '榕城江上图', time: '2026-08-26 08:15:33' }, { name: '十堰货运站', time: '2026-08-28 18:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市仓山区城门镇南江滨东大道南侧,福厦高速连接线北侧（榕城江上图）',
    currentUnloadAddress: '湖北省十堰市张湾区十堰大道东十堰东站F1',
    currentPrice: '101.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '72.00', unit: '元/吨' },
    /* 场景1：直接指派船东，发起后待船东确认 */
    currentChange: {
      id: 'AC20260826002', seq: 2, status: 'pendingShipowner',
      initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-26 11:20:35',
      oldAddress: '湖北省十堰市张湾区十堰大道东十堰东站F1',
      newAddress: '湖北省襄阳市襄州区襄阳北物流园B区12号库',
      oldPrice: '101.00', newPrice: '118.00', priceUnit: '元/吨',
      downstream: { oldPrice: '72.00', newPrice: '85.00', unit: '元/吨' },
      reason: '货主收货仓库搬迁至襄阳，需变更卸货地点；新地址运距增加，客户运输单价同步调整。',
      note: '已与货主线下确认，按新地址执行。',
      timeline: [
        { time: '2026-08-26 11:20:35', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
        { time: '2026-08-26 11:22:10', actor: '至简集运 · 运输部 | 至简', action: '维护船东运费' },
      ],
    },
    /* 场景5：已生效历史（新地址已成为当前有效地址） */
    changeHistory: [
      {
        id: 'AC20260822001', seq: 1, status: 'effective',
        initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-22 14:05:18',
        oldAddress: '湖北省武汉市硚口区汉正街货运市场3号门',
        newAddress: '湖北省十堰市张湾区十堰大道东十堰东站F1',
        oldPrice: '96.00', newPrice: '101.00', priceUnit: '元/吨',
        downstream: { oldPrice: '68.00', newPrice: '72.00', unit: '元/吨' },
        reason: '货主调整收货点为十堰货运站。',
        note: '',
        timeline: [
          { time: '2026-08-22 14:05:18', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
          { time: '2026-08-22 16:02:07', actor: '刘乾德', action: '确认新地址' },
        ],
      },
    ],
  },

  /* 普通运单：已接单、无处理中申请（场景7：可发起） */
  'wb-00': {
    key: 'wb-00', seq: 2, kindTab: 'normal', orgMode: 'direct', perspective: 'contractCarrier',
    waybillNo: '2608250915337712', acceptTime: '2026-08-25 09:15:44',
    status: 'accepted', statusLabel: '已接单',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽A23888', driver: '陈国强', phone: '13800000002' },
    shipowner: '陈国强',
    stops: [{ name: '福州保税港', time: '2026-08-27 08:00:00' }, { name: '武汉阳逻港', time: '2026-08-30 14:00:00' }],
    waypoints: 3, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市马尾区福州保税港A区3号泊位',
    currentUnloadAddress: '湖北省武汉市新洲区武汉阳逻港一期码头',
    currentPrice: '98.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '80.00', unit: '元/吨' },
    currentChange: null,
    changeHistory: [],
  },

  /* ---- 普通运单（被委托：上游合同承运商委托给本企业，本企业为实际承运商） ---- */
  /* 实际承运商视角：隐藏托运企业运输单价，操作为「确认并发送船东/拒绝」 */
  'wb-20': {
    key: 'wb-20', seq: 3, kindTab: 'normal', orgMode: 'outsource', perspective: 'actualCarrier',
    waybillNo: '2608260915556677', acceptTime: '2026-08-26 09:15:55',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂D55566', driver: '周江涛', phone: '13800000008' },
    shipowner: '周江涛',
    /* 上游合同承运商（委托方） */
    upstreamCarrier: '至简集运',
    stops: [{ name: '榕城江上图', time: '2026-08-26 08:00:00' }, { name: '荆州港盐卡港区', time: '2026-08-29 10:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市仓山区城门镇南江滨东大道南侧（榕城江上图）',
    currentUnloadAddress: '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
    /* 实际承运商视角：不展示托运企业运输单价（currentPrice 仅内部存档，页面不渲染） */
    currentPrice: '104.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    /* 本企业承运价格（合同承运商调整给本企业的价格，与本企业相关） */
    downstream: { currentPrice: '86.00', unit: '元/吨' },
    /* 本企业（实际承运商）当前给船东的运输单价：确认地址变更时作为默认值，可改可不改 */
    shipownerPrice: { currentPrice: '78.00', unit: '元/吨' },
    /* 场景：上游合同承运商发起地址变更给本企业，待本企业（实际承运商）确认 */
    currentChange: {
      id: 'AC20260826005', seq: 1, status: 'pendingActualCarrier',
      initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-26 10:05:30',
      oldAddress: '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
      newAddress: '湖北省黄石市黄石港区黄石新港物流园C区8号库',
      oldPrice: '104.00', newPrice: '110.00', priceUnit: '元/吨',
      downstream: { oldPrice: '86.00', newPrice: '91.00', unit: '元/吨' },
      reason: '货主收货仓库调整至黄石新港，需变更卸货地点；新地址运距增加，运输单价同步调整。',
      note: '',
      timeline: [
        { time: '2026-08-26 10:05:30', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
      ],
    },
    changeHistory: [],
  },

  /* ---- 委外运单（委外实际承运商） ---- */
  'wb-10': {
    key: 'wb-10', seq: 1, kindTab: 'outsourced', orgMode: 'outsource', perspective: 'contractCarrier',
    waybillNo: '2608260811223344', acceptTime: '2026-08-26 08:11:22',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂A66688', driver: '王远航', phone: '13800000003' },
    shipowner: '王远航',
    actualCarrier: '荆州顺达物流',
    stops: [{ name: '榕城江上图', time: '2026-08-26 07:30:00' }, { name: '宜昌东站物流园', time: '2026-08-29 12:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市仓山区城门镇南江滨东大道南侧（榕城江上图）',
    currentUnloadAddress: '湖北省宜昌市伍家岗区宜昌东站物流园A区5号库',
    currentPrice: '106.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '88.00', unit: '元/吨' },
    /* 场景2：委外实际承运商，发起后待实际承运商确认 */
    currentChange: {
      id: 'AC20260826003', seq: 1, status: 'pendingActualCarrier',
      initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-26 09:40:12',
      oldAddress: '湖北省宜昌市伍家岗区宜昌东站物流园A区5号库',
      newAddress: '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
      oldPrice: '106.00', newPrice: '112.00', priceUnit: '元/吨',
      downstream: { oldPrice: '88.00', newPrice: '93.00', unit: '元/吨' },
      reason: '货主收货仓库调整至荆州港，需变更卸货地点；新地址运距增加，托运企业运输单价同步调整。',
      note: '',
      timeline: [
        { time: '2026-08-26 09:40:12', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
      ],
    },
    changeHistory: [],
  },

  /* 委外运单：实际承运商已确认，待船东确认（场景3） */
  'wb-11': {
    key: 'wb-11', seq: 2, kindTab: 'outsourced', orgMode: 'outsource', perspective: 'contractCarrier',
    waybillNo: '2608251615445566', acceptTime: '2026-08-25 16:15:44',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂B12345', driver: '李汉江', phone: '13800000004' },
    shipowner: '李汉江',
    actualCarrier: '黄石港联运输',
    stops: [{ name: '福州保税港', time: '2026-08-25 17:00:00' }, { name: '黄石新港物流园', time: '2026-08-28 10:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市马尾区福州保税港A区3号泊位',
    currentUnloadAddress: '湖北省黄石市黄石港区黄石新港物流园C区8号库',
    currentPrice: '99.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '81.00', unit: '元/吨' },
    /* 场景3：实际承运商确认后进入待船东确认 */
    currentChange: {
      id: 'AC20260825004', seq: 1, status: 'pendingShipowner',
      initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-25 17:20:30',
      oldAddress: '湖北省黄石市黄石港区黄石新港物流园C区8号库',
      newAddress: '湖南省岳阳市岳阳楼区城陵矶新港一期码头',
      oldPrice: '99.00', newPrice: '108.00', priceUnit: '元/吨',
      downstream: { oldPrice: '81.00', newPrice: '88.00', unit: '元/吨' },
      reason: '货主调整收货点至城陵矶新港，运距增加，单价同步调整。',
      note: '',
      timeline: [
        { time: '2026-08-25 17:20:30', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
        { time: '2026-08-25 18:05:44', actor: '黄石港联运输', action: '确认并发送船东' },
      ],
    },
    changeHistory: [],
  },

  /* 委外运单：实际承运商拒绝（场景4：已拒绝终态，可重新发起） */
  'wb-12': {
    key: 'wb-12', seq: 3, kindTab: 'outsourced', orgMode: 'outsource', perspective: 'contractCarrier',
    waybillNo: '2608241012778899', acceptTime: '2026-08-24 10:12:33',
    status: 'accepted', statusLabel: '已接单',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '鄂C98765', driver: '赵长江', phone: '13800000005' },
    shipowner: '赵长江',
    actualCarrier: '荆州顺达物流',
    stops: [{ name: '榕城江上图', time: '2026-08-24 11:00:00' }, { name: '荆州港盐卡港区', time: '2026-08-27 09:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市仓山区城门镇南江滨东大道南侧（榕城江上图）',
    currentUnloadAddress: '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
    currentPrice: '103.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '85.00', unit: '元/吨' },
    currentChange: null,
    /* 场景4：实际承运商拒绝后的终态历史，可重新发起 */
    changeHistory: [
      {
        id: 'AC20260824001', seq: 1, status: 'rejected',
        initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-24 11:30:00',
        oldAddress: '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
        newAddress: '湖北省襄阳市襄州区襄阳北物流园B区12号库',
        oldPrice: '103.00', newPrice: '110.00', priceUnit: '元/吨',
        downstream: { oldPrice: '85.00', newPrice: '90.00', unit: '元/吨' },
        reason: '货主拟调整收货点至襄阳。',
        note: '',
        rejectInfo: { by: '实际承运商 · 荆州顺达物流', reason: '车辆档期冲突，无法按新地址执行。', time: '2026-08-24 12:15:20' },
        timeline: [
          { time: '2026-08-24 11:30:00', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
          { time: '2026-08-24 12:15:20', actor: '荆州顺达物流', action: '拒绝' },
        ],
      },
    ],
  },

  /* 普通运单：已撤回历史（场景6） */
  'wb-13': {
    key: 'wb-13', seq: 4, kindTab: 'normal', orgMode: 'direct', perspective: 'contractCarrier',
    waybillNo: '2608230911112233', acceptTime: '2026-08-23 09:11:11',
    status: 'running', statusLabel: '运输中',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽H88888', driver: '孙建军', phone: '13800000006' },
    shipowner: '孙建军',
    stops: [{ name: '福州保税港', time: '2026-08-23 10:00:00' }, { name: '十堰货运站', time: '2026-08-26 15:00:00' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市马尾区福州保税港A区3号泊位',
    currentUnloadAddress: '湖北省十堰市张湾区十堰大道东十堰东站F1',
    currentPrice: '100.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '70.00', unit: '元/吨' },
    currentChange: null,
    /* 场景6：已撤回历史（待船东确认时合同承运商撤回） */
    changeHistory: [
      {
        id: 'AC20260823001', seq: 1, status: 'withdrawn',
        initiator: '至简集运 · 运输部 | 至简', initiateTime: '2026-08-23 10:20:00',
        oldAddress: '湖北省十堰市张湾区十堰大道东十堰东站F1',
        newAddress: '湖北省宜昌市伍家岗区宜昌东站物流园A区5号库',
        oldPrice: '100.00', newPrice: '95.00', priceUnit: '元/吨',
        downstream: { oldPrice: '70.00', newPrice: '66.00', unit: '元/吨' },
        reason: '货主临时变更收货点为宜昌。',
        note: '',
        timeline: [
          { time: '2026-08-23 10:20:00', actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
          { time: '2026-08-23 11:05:00', actor: '至简集运 · 运输部 | 至简', action: '撤回变更' },
        ],
      },
    ],
  },

  /* 待复核运单：不展示发起入口（场景9） */
  'wb-3': {
    key: 'wb-3', seq: 5, kindTab: 'normal', orgMode: 'direct', perspective: 'contractCarrier',
    waybillNo: '2608201749228558', acceptTime: '2026-08-20 17:49:21',
    status: 'recheck', statusLabel: '待复核',
    bizType: '散杂货', source: '内部调度',
    vehicle: { plate: '闽A13195', driver: '赖师傅', phone: '13800000007' },
    shipowner: '赖师傅',
    stops: [{ name: '天洋广场C馆(天洋广场店)', time: '2026-08-20 17:50:46' }, { name: '连江县', time: '2026-08-20 17:51:18' }],
    waypoints: 2, cargoCount: 1,
    dispatcher: '运输部 | 至简',
    cargoName: '硫酸铵',
    loadAddress: '福建省福州市仓山区天洋广场C馆',
    currentUnloadAddress: '福建省福州市连江县',
    currentPrice: '60.00', priceUnit: '元/吨', priceBasis: '单位计费 · 按重量',
    downstream: { currentPrice: '45.00', unit: '元/吨' },
    currentChange: null,
    changeHistory: [],
  },
})

/* ==================== 派生：列表行 ==================== */

/* 列表行：从 store 派生，附加变更状态标识 */
export function buildWaybillRows() {
  return Object.values(waybillStore).map((w) => ({
    key: w.key,
    seq: w.seq,
    kindTab: w.kindTab,
    orgMode: w.orgMode,
    waybillNo: w.waybillNo,
    acceptTime: w.acceptTime,
    status: w.status,
    statusLabel: w.statusLabel,
    bizType: w.bizType,
    source: w.source,
    vehicle: w.vehicle,
    stops: w.stops,
    waypoints: w.waypoints,
    cargoCount: w.cargoCount,
    dispatcher: w.dispatcher,
    actions: ['详情', '运单复核', '标记异常'],
    /* 视角：contractCarrier 合同承运商 / actualCarrier 实际承运商（驱动价格可见性与操作） */
    perspective: w.perspective,
    /* 处理中变更状态（驱动列表标识与“查看变更”） */
    changeStatus: w.currentChange ? w.currentChange.status : null,
  }))
}

/* ==================== 查询与操作 ==================== */

export function getWaybill(key) {
  return waybillStore[key] || null
}

/* 是否允许发起：状态符合 + 无处理中申请 */
export function canInitiate(key) {
  const w = waybillStore[key]
  if (!w) return false
  return ADDRESS_CHANGE_ALLOWED_STATUS.includes(w.status) && !w.currentChange
}

/* 发起弹窗所需的当前运单快照 */
export function getSnapshot(key) {
  const w = waybillStore[key]
  if (!w) return null
  return {
    waybillNo: w.waybillNo,
    statusLabel: w.statusLabel,
    cargoName: w.cargoName,
    loadAddress: w.loadAddress,
    currentUnloadAddress: w.currentUnloadAddress,
    currentPrice: w.currentPrice,
    priceUnit: w.priceUnit,
    priceBasis: w.priceBasis,
    orgMode: w.orgMode,
    downstream: { scene: ORG_MODE[w.orgMode], currentPrice: w.downstream.currentPrice, unit: w.downstream.unit },
  }
}

/* 提交发起：生成处理中记录，状态按运输组织方式分流 */
export function submitChange(key, payload) {
  const w = waybillStore[key]
  if (!w || !canInitiate(key)) return null
  const nextStatus = w.orgMode === 'direct' ? 'pendingShipowner' : 'pendingActualCarrier'
  const nextActor = w.orgMode === 'direct' ? `船东 · ${w.shipowner}` : `实际承运商 · ${w.actualCarrier}`
  const seq = (w.changeHistory.length ? Math.max(...w.changeHistory.map(c => c.seq)) : 0) + 1
  const now = payload.time
  w.currentChange = {
    id: payload.id, seq, status: nextStatus,
    initiator: '至简集运 · 运输部 | 至简', initiateTime: now,
    oldAddress: w.currentUnloadAddress,
    newAddress: payload.newAddress,
    oldPrice: w.currentPrice,
    newPrice: payload.newPrice,
    priceUnit: w.priceUnit,
    downstream: { oldPrice: w.downstream.currentPrice, newPrice: payload.downstreamPrice, unit: w.downstream.unit },
    reason: payload.reason,
    note: payload.note || '',
    timeline: [
      { time: now, actor: '至简集运 · 运输部 | 至简', action: '发起地址及运价变更' },
    ],
  }
  return w.currentChange
}

/* 撤回（船东确认前）：当前有效地址价格不变，申请转入历史 */
export function withdrawChange(key, time) {
  const w = waybillStore[key]
  if (!w || !w.currentChange) return
  const c = w.currentChange
  c.status = 'withdrawn'
  c.timeline.push({ time, actor: '至简集运 · 运输部 | 至简', action: '撤回变更' })
  w.changeHistory.unshift(c)
  w.currentChange = null
}

/* 实际承运商「确认并发送船东」：状态转待船东确认，时间线加确认记录，自动发送当前执行船东；
   可同时提交本企业给船东的运输单价（shipownerPrice，默认沿用本企业原给船东价，可改可不改） */
export function actualCarrierConfirm(key, time, shipownerPrice) {
  const w = waybillStore[key]
  if (!w || !w.currentChange || w.currentChange.status !== 'pendingActualCarrier') return
  const c = w.currentChange
  c.status = 'pendingShipowner'
  /* 记录本企业给船东的单价（委外流程专属）：未填则沿用本企业原给船东价 */
  const soPrice = (shipownerPrice !== undefined && shipownerPrice !== null && String(shipownerPrice).trim() !== '')
    ? String(shipownerPrice).trim()
    : (w.shipownerPrice?.currentPrice || '')
  c.shipownerPrice = {
    oldPrice: w.shipownerPrice?.currentPrice || '',
    newPrice: soPrice,
    unit: w.shipownerPrice?.unit || '元/吨',
  }
  c.timeline.push({ time, actor: w.upstreamCarrier ? '本企业' : w.actualCarrier, action: '确认并发送船东' })
}

/* 实际承运商「拒绝」：必填拒绝原因，状态转已拒绝（终态），不发送船东，申请转入历史 */
export function actualCarrierReject(key, time, reason) {
  const w = waybillStore[key]
  if (!w || !w.currentChange || w.currentChange.status !== 'pendingActualCarrier') return
  const c = w.currentChange
  c.status = 'rejected'
  c.rejectInfo = { by: '本企业', reason, time }
  c.timeline.push({ time, actor: '本企业', action: '拒绝' })
  w.changeHistory.unshift(c)
  w.currentChange = null
}

/* 是否有处理中申请 */
export function hasProcessing(key) {
  return !!(waybillStore[key] && waybillStore[key].currentChange)
}

/* 详情页地址变更页签数据（current + 终态历史） */
export function getChangeData(key) {
  const w = waybillStore[key]
  if (!w) return { current: null, history: [] }
  return computed(() => ({ current: w.currentChange, history: w.changeHistory }))
}

/* 新卸货地址可选项（mock，实际应来自货主收货地址库） */
export const unloadAddressOptions = [
  '湖北省襄阳市襄州区襄阳北物流园B区12号库',
  '湖北省宜昌市伍家岗区宜昌东站物流园A区5号库',
  '湖北省荆州市沙市区荆州港盐卡港区3号泊位',
  '湖北省黄石市黄石港区黄石新港物流园C区8号库',
  '湖南省岳阳市岳阳楼区城陵矶新港一期码头',
]
