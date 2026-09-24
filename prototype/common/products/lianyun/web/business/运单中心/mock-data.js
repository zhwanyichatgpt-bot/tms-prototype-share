/**
 * 通用运单中心 Mock 数据。
 * 公路、水路、铁路运单相互独立，只共用查询、状态和列表框架。
 */

export const waybillTypes = [
  {
    key: 'truck', label: '汽运运单',
    stats: [
      { key: 'recheck', label: '待复核', count: 107 },
      { key: 'settle', label: '待结算', count: 34 },
      { key: 'abnormal', label: '异常单', count: 7 },
    ],
  },
  {
    key: 'water', label: '水运运单',
    stats: [
      { key: 'recheck', label: '待复核', count: 17 },
      { key: 'settle', label: '待结算', count: 12 },
      { key: 'abnormal', label: '异常单', count: 1 },
    ],
  },
  {
    key: 'rail', label: '铁路运单',
    stats: [{ key: 'paid', label: '已打款', count: 21 }],
  },
]

export const transportModeMeta = {
  truck: {
    resourceLabel: '车辆', routeLabel: '装卸货信息',
    filterLabel: '车牌号', filterPlaceholder: '请输入车牌号',
  },
  water: {
    resourceLabel: '船舶', routeLabel: '装卸港信息',
    filterLabel: '船名/船号', filterPlaceholder: '请输入船名或船号',
  },
  rail: {
    resourceLabel: '班列/车皮', routeLabel: '发到站信息',
    filterLabel: '车次/车皮号', filterPlaceholder: '请输入车次或车皮号',
  },
}

export const waybillKindTabs = [
  { key: 'normal', label: '普通运单' },
  { key: 'platform', label: '平台运单' },
  { key: 'outsourced', label: '委外运单' },
]

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

export const statusTone = {
  settle: 'blue', recheck: 'purple', accepted: 'cyan', running: 'green',
  done: 'gray', abnormal: 'red', void: 'gray',
}

export const sourceTone = {
  内部调度: 'green', 自主接单: 'purple', 平台派单: 'purple', 委外承运: 'gray',
}

const actions = ['详情', '运单复核', '标记异常']
const stop = (name, time) => ({ name, time })
const row = (key, seq, transportMode, kindTab, waybillNo, acceptTime, status, statusLabel, bizType, source, primary, secondary, startName, startTime, endName, endTime) => ({
  key, seq, transportMode, kindTab, waybillNo, acceptTime, status, statusLabel, bizType, source,
  resource: { primary, secondary },
  stops: [stop(startName, startTime), stop(endName, endTime)],
  actions,
})

export const waybillRows = [
  row('truck-1', 1, 'truck', 'normal', '2609231533298948', '2026-09-23 15:33:27', 'accepted', '已接单', '集装箱', '内部调度', '闽H66666', '主驾 刘乾德', '扬子江路', '2026-09-23 15:33:27', '南京邮港货运代理有限公司', '2026-09-23 15:33:27'),
  row('truck-2', 2, 'truck', 'normal', '2609231524586168', '2026-09-23 15:24:55', 'settle', '待结算', '集装箱', '内部调度', '闽D77777', '主驾 刘乾德', '扬子江路', '2026-09-23 15:26:15', '南京邮港货运代理有限公司', '2026-09-23 15:26:35'),
  row('truck-3', 3, 'truck', 'normal', '2609231428023445', '2026-09-23 14:23:42', 'settle', '待结算', '散杂货', '内部调度', '鄂W12345', '主驾 陈威', '平顶山煤炭储配基地', '2026-09-23 14:23:42', '周口港中心港区', '2026-09-23 14:23:43'),
  row('truck-4', 4, 'truck', 'normal', '2609231412334377', '2026-09-23 14:12:31', 'settle', '待结算', '散杂货', '内部调度', '闽D77777', '主驾 李明杰', '平顶山煤炭储配基地', '2026-09-23 14:13:41', '周口港中心港区', '2026-09-23 14:14:21'),
  row('truck-5', 5, 'truck', 'normal', '2609231134546003', '2026-09-23 11:34:51', 'settle', '待结算', '集装箱', '内部调度', '闽H66666', '主驾 刘乾德', '扬子江路', '2026-09-23 11:35:10', '南京邮港货运代理有限公司', '2026-09-23 11:35:35'),
  row('truck-platform', 1, 'truck', 'platform', '2609231011224501', '2026-09-23 10:11:22', 'running', '运输中', '散杂货', '平台派单', '皖A90876', '主驾 王强', '合肥物流园', '2026-09-23 10:30:00', '芜湖港', '2026-09-23 13:30:00'),
  row('truck-outsourced', 1, 'truck', 'outsourced', '2609230912007712', '2026-09-23 09:12:00', 'accepted', '已接单', '集装箱', '委外承运', '苏A55678', '主驾 周磊', '南京港', '2026-09-23 09:30:00', '苏州工业园', '2026-09-23 12:30:00'),

  row('water-1', 1, 'water', 'normal', 'SW2609230018', '2026-09-23 09:18:12', 'running', '运输中', '散杂货', '内部调度', '华航668', '船长 张海峰', '武汉阳逻港', '2026-09-23 10:00:00', '南京龙潭港', '2026-09-26 16:00:00'),
  row('water-2', 2, 'water', 'normal', 'SW2609230019', '2026-09-23 10:08:34', 'recheck', '待复核', '集装箱', '自主接单', '江海联运12', '船长 李建国', '宜昌白洋港', '2026-09-23 12:00:00', '上海外高桥港', '2026-09-28 08:00:00'),
  row('water-3', 3, 'water', 'normal', 'SW2609230022', '2026-09-23 10:42:16', 'accepted', '已接单', '散杂货', '内部调度', '长航兴盛', '船长 周江涛', '荆州港', '2026-09-24 08:00:00', '南通港', '2026-09-29 14:00:00'),
  row('water-platform', 1, 'water', 'platform', 'SW2609230026', '2026-09-23 11:28:20', 'accepted', '已接单', '散杂货', '平台派单', '华顺018', '船长 赵军', '九江港', '2026-09-23 18:00:00', '太仓港', '2026-09-27 09:00:00'),
  row('water-outsourced', 1, 'water', 'outsourced', 'SW2609230031', '2026-09-23 13:02:11', 'settle', '待结算', '集装箱', '委外承运', '海盛008', '船长 孙伟', '芜湖港', '2026-09-23 19:00:00', '上海港', '2026-09-27 12:00:00'),

  row('rail-1', 1, 'rail', 'normal', 'TL2609230066', '2026-09-23 08:36:20', 'running', '运输中', '集装箱', '内部调度', 'X8026 / P64-18620', '40HQ × 20', '武汉吴家山站', '2026-09-23 12:00:00', '成都城厢站', '2026-09-25 08:00:00'),
  row('rail-2', 2, 'rail', 'normal', 'TL2609230067', '2026-09-23 09:12:45', 'recheck', '待复核', '散杂货', '自主接单', 'K1088 / C70-57210', '敞车 × 12', '郑州圃田站', '2026-09-23 15:00:00', '西安新筑站', '2026-09-24 20:00:00'),
  row('rail-3', 3, 'rail', 'normal', 'TL2609230070', '2026-09-23 10:03:18', 'accepted', '已接单', '集装箱', '内部调度', 'X8088 / P70-20816', '40HQ × 18', '重庆团结村站', '2026-09-24 06:00:00', '成都国际铁路港', '2026-09-24 15:00:00'),
  row('rail-platform', 1, 'rail', 'platform', 'TL2609230071', '2026-09-23 10:42:16', 'accepted', '已接单', '集装箱', '平台派单', 'X8096 / P70-20918', '40HQ × 16', '重庆团结村站', '2026-09-24 07:00:00', '成都国际铁路港', '2026-09-24 16:00:00'),
  row('rail-outsourced', 1, 'rail', 'outsourced', 'TL2609230078', '2026-09-23 12:16:08', 'settle', '待结算', '散杂货', '委外承运', 'K5210 / C70-68109', '棚车 × 10', '长沙北站', '2026-09-24 09:00:00', '广州大朗站', '2026-09-25 11:00:00'),
]

export const paginationMetaByMode = {
  truck: { totalText: '共 75 条', pageSizeText: '10条/页', pageCount: 8, current: 1 },
  water: { totalText: '共 30 条', pageSizeText: '10条/页', pageCount: 3, current: 1 },
  rail: { totalText: '共 21 条', pageSizeText: '10条/页', pageCount: 3, current: 1 },
}
