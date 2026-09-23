// 北港 · 船东移动端 Mock 数据
// 仅含船东视角的运单与地址变更数据，不含任何上下游价格、合同或船公司内部价格。

// 1. 运单列表 Mock 数据（船东移动端 · 运输 Tab）
// status: sailing(已开航) | arrived(已到港) | cancelled(已取消)
// hasPendingAddressChange: 是否存在待船东处理的地址变更申请（控制提醒条）
export const mockWaybillList = [
  // 已开航 + 存在待处理地址变更 → 显示提醒条
  {
    waybillId: 'WB1001',
    waybillNo: 'C9715157747486741',
    status: 'sailing',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    expectArriveTime: '今天 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: true,
    addressChangeId: 'AC20260826001',
  },
  // 已开航 + 无地址变更 → 原始卡片
  {
    waybillId: 'WB1002',
    waybillNo: 'C9715157747486742',
    status: 'sailing',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    expectArriveTime: '今天 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: false,
    addressChangeId: null,
  },
  // 已到港 → 不显示提醒条
  {
    waybillId: 'WB1003',
    waybillNo: 'C9715157747486743',
    status: 'arrived',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    expectArriveTime: '昨天 18:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: false,
    addressChangeId: null,
  },
  // 已取消 → 显示取消时间，不显示提醒条
  {
    waybillId: 'WB1004',
    waybillNo: 'C9715157747486744',
    status: 'cancelled',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    cancelTime: '前天 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: false,
    addressChangeId: null,
  },
  {
    waybillId: 'WB1005',
    waybillNo: 'C9715157747486745',
    status: 'cancelled',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    cancelTime: '07/01 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: false,
    addressChangeId: null,
  },
]

// 2. 运单详情 Mock 数据（船东移动端 · 运单详情页）
// 基础详情 + 地址变更。地址变更仅记录船东可见信息，不含任何上下游价格/合同。
// addressChange.status: pending(待船东处理) | confirmed(已确认) | rejected(已拒绝) | none(无申请)
export const mockWaybillDetail = {
  waybillId: 'WB1001',
  waybillNo: 'C9715157747486741',
  status: 'sailing',
  statusText: '运输中',
  cargoName: '煤',
  cargoWeight: '1000吨',
  freightAmount: '18100',
  cargoTag: '煤炭及制品',
  freightTag: '运费 150 元/吨',
  gateTag: '需过闸 3 个',
  startTime: '09:24',
  startDate: '04月17日 周五',
  endTime: '09:24',
  endDate: '04月19日 周日',
  durationText: '共 2 天',
  // 装货地（起点，固定）
  originPort: '福州港马尾',
  originAddr: '福建江阴国际集装箱码头',
  // 原卸货地（终点）。地址变更“已确认”后由 currentDest 覆盖为新地址。
  originDestPort: '上海港',
  originDestAddr: '宝山石洞口煤气厂危险品码头1号泊位',
  // 船闸进度
  gates: [
    { status: '进行中', statusCls: 'running', name: '桂平船闸', time: '7/14 09:24', desc: '待闸排队中', extra: '已等待 12 时 30 分', sub: '排 23 号 · 锚位：下锚地' },
    { status: '已过闸', statusCls: 'passed', name: '长洲船闸', time: '7/13 15:30', desc: '已过闸，闸次 CZ-2026030801', extra: '', sub: '' },
    { status: '已过闸', statusCls: 'passed', name: '长洲船闸', time: '7/13 03:00', desc: '已过闸，闸次 CZ-2026030801', extra: '', sub: '' },
  ],
  // 船舶信息
  shipName: '顺利999船的名称',
  shipTonnage: '7460吨',
  shipContact: '船老大（124****4578）',
  shipTags: ['证照齐全', '内河运输', '承运 34 次'],
  shipImage: '/cargo-detail-map.png',
  // 运单信息
  publishTime: '2026-04-17 09:23:49',
  loadVoucher: '/cargo-detail-map.png',
  unloadVoucher: '',

  // 当前生效的卸货地址（默认 = 原地址；确认新地址后更新）
  currentDest: { port: '上海港', addr: '宝山石洞口煤气厂危险品码头1号泊位' },

  // 待船东处理的地址变更申请（进入详情立即强制弹窗）
  // 仅含船东可见字段：原/新地址、变更原因、发起企业、发起时间。无价格/合同。
  addressChange: {
    id: 'AC20260826001',
    status: 'pending', // pending | confirmed | rejected | none
    originAddr: '上海港 · 宝山石洞口煤气厂危险品码头1号泊位',
    newAddr: '上海港 · 外高桥港区集装箱码头3号泊位',
    reason: '原卸货码头泊位检修，需调整至外高桥港区卸货。',
    initiator: '福州港船企业',
    initiateTime: '2026-08-26 10:15:30',
  },

  // 地址变更记录（时间倒序，最新在前）。本期演示用，确认/拒绝后会追加新记录。
  addressChangeRecords: [
    {
      id: 'AC20260820002',
      seq: 2,
      result: 'withdrawn', // confirmed | rejected | withdrawn
      resultText: '已撤回',
      originAddr: '上海港 · 宝山石洞口煤气厂危险品码头1号泊位',
      newAddr: '上海港 · 罗泾港区散货码头2号泊位',
      reason: '临时调整卸货泊位。',
      initiator: '福州港船企业',
      initiateTime: '2026-08-20 14:02:11',
      handleResult: '',
      handleTime: '',
      rejectReason: '',
      withdrawTime: '2026-08-20 16:40:05',
    },
    {
      id: 'AC20260812001',
      seq: 1,
      result: 'confirmed',
      resultText: '已确认',
      originAddr: '上海港 · 外高桥港区集装箱码头5号泊位',
      newAddr: '上海港 · 宝山石洞口煤气厂危险品码头1号泊位',
      reason: '按货主要求调整至当前泊位。',
      initiator: '福州港船企业',
      initiateTime: '2026-08-12 09:20:48',
      handleResult: '已确认',
      handleTime: '2026-08-12 11:05:22',
      rejectReason: '',
      withdrawTime: '',
    },
  ],
}

// 3. 跑货（运输跟踪）Mock 数据 —— 我已接的运输任务
// status: arrived(已到港) | sailing(运输中) | accepted(已接单)
export const mockRunCargoList = [
  {
    id: 'RC1001',
    waybillNo: 'C9715157747486741',
    status: 'arrived',
    statusText: '已到港',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    arriveLabel: '实际到港',
    arriveTime: '昨天 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: true,
    addressChangeId: 'AC20260826001',
  },
  {
    id: 'RC1002',
    waybillNo: 'C9715157747486742',
    status: 'arrived',
    statusText: '已到港',
    cargoName: '玉米',
    cargoWeight: '10.23kg',
    origin: '福州市·马尾港',
    destination: '无锡市·舟山港',
    freightAmount: '500.00',
    arriveLabel: '实际到港',
    arriveTime: '昨天 12:00',
    shipownerName: '测试船主',
    hasPendingAddressChange: false,
    addressChangeId: null,
  },
]
