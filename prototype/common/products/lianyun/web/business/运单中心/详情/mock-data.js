/**
 * 运单详情 —— Mock 数据
 * 字段与文案严格对齐设计截图，不得自行优化业务内容。
 */

export const waybillDetail = {
  waybillNo: '2608210951011575',
  status: 'recheck',
  statusLabel: '待复核',
  vehicle: { plate: '闽H66666', driver: '刘乾德', phone: '15060404641' },

  /* 运输路线：装/卸货节点 */
  route: [
    {
      key: 'load', sign: '装', tone: 'blue',
      name: '榕城江上图',
      address: '福建省福州市仓山区城门镇南江滨东大道南侧,福厦高速连接线北侧',
      contact: '曾', phone: '18650480528',
      planTime: '2026-08-24 00:00',
      actualTime: '2026-08-21 09:51',
      actualLabel: '实际装货',
      cargo: [{ type: '其他', name: '硫酸铵', weight: '100吨' }],
      /* 附件照片：装货单 */
      attachments: [
        { key: 'loadBill', label: '装货单', kind: 'bill' },
      ],
    },
    {
      key: 'unload', sign: '卸', tone: 'green',
      name: '十堰货运站',
      address: '湖北省十堰市张湾区十堰大道东十堰东站F1',
      contact: '张三', phone: '13898989898',
      planTime: '2026-08-26 00:00',
      actualTime: '2026-08-21 09:51',
      actualLabel: '实际卸货',
      cargo: [{ type: '其他', name: '硫酸铵', weight: '100吨' }],
      /* 附件照片：卸货单 + 回单 */
      attachments: [
        { key: 'unloadBill', label: '卸货单', kind: 'photo' },
        { key: 'receipt', label: '回单', kind: 'photo' },
      ],
    },
  ],

  /* 地图城市标注点（相对 1000×460 视图坐标，按底图福州市区视野校准） */
  cityMarks: [
    { name: '仓山区', x: 280, y: 330 }, { name: '台江', x: 330, y: 240 },
    { name: '鼓山', x: 700, y: 120 }, { name: '马尾', x: 900, y: 260 },
    { name: '闽侯', x: 90, y: 240 }, { name: '城门', x: 470, y: 370 },
    { name: '三江口', x: 700, y: 330 },
  ],

  /* 地图图例 */
  legends: [
    { key: 'planned', label: '规划路线', checked: true, tone: 'blue' },
    { key: 'beidou', label: '北斗轨迹', checked: false, tone: 'navy' },
    { key: 'device', label: '设备轨迹', checked: false, tone: 'green' },
  ],

  /* 地图底部统计 */
  mapStats: [
    { key: 'estimate', label: '预估距离', value: '1365.25km' },
    { key: 'actual', label: '实际距离', value: '—km' },
    { key: 'loaded', label: '实际装货', value: '100吨' },
    { key: 'unloaded', label: '实际卸货', value: '100吨' },
    { key: 'loss', label: '损耗', value: '0吨' },
  ],

  /* 基础运费 */
  baseFee: {
    billType: '单位计费',
    condition: '重量',
    basis: '装卸货最小重量',
    unitPrice: '101元',
    formula: '装卸货最小重量100.000吨*101.00元/吨=10100.00元',
  },

  /* 在途费用（空态） */
  transitFeeColumns: ['费用名称', '金额 (元)', '费用支出时间', '缴费地点', '关联结算单', '核销状态'],
  transitFees: [],

  /* 其他补贴 */
  subsidies: [],
  subsidyTypes: ['压夜费', '装卸费', '高速费', '燃油补贴', '其他'],
}

// 以下仅为运单详情验证用 Mock；集装箱数据均随运单只读展示。
function makeBoxes(owner, start, count, size, cargo, status, wagon = '') {
  return Array.from({ length: count }, (_, index) => ({
    no: `${owner}${String(start + index).padStart(7, '0')}`,
    size,
    cargo,
    seal: `SL${String(83010 + start + index).padStart(5, '0')}`,
    weight: (size === '40GP' ? 28.5 : 16.8).toFixed(2),
    status,
    wagon: wagon ? `${wagon}${String(Math.floor(index / 2) + 1).padStart(2, '0')}` : '',
  }))
}

function routeNode(key, sign, tone, name, address, planTime, actualTime, count, mode) {
  const operation = sign === '装' ? '装' : '卸'
  const evidence = mode === 'water' ? `${operation}船凭证` : mode === 'rail' ? `${operation}车凭证` : `${operation}货凭证`
  return {
    key, sign, tone, name, address, planTime, actualTime,
    planLabel: `计划${operation}${mode === 'water' ? '船' : mode === 'rail' ? '车' : '货'}`,
    actualLabel: `实际${operation}${mode === 'water' ? '船' : mode === 'rail' ? '车' : '货'}`,
    containerCount: count,
    cargo: [],
    attachments: [{ key: `${key}-proof`, label: evidence, kind: 'bill' }],
  }
}

const roadBoxes = makeBoxes('MSCU', 1234567, 2, '20GP', '电子配件', '已交付')
const waterWuhan = makeBoxes('COSU', 3650001, 78, '20GP', '机械设备', '已卸船')
const waterChongqing = makeBoxes('MSCU', 4780001, 40, '40GP', '钢材', '已卸船')
const railXian = makeBoxes('CRSU', 5120001, 12, '40GP', '机械设备', '已卸车', 'P64-')
const railLanzhou = makeBoxes('CRSU', 5130001, 6, '20GP', '电子配件', '已卸车', 'P64-')

const containerDetails = {
  'truck-1': {
    ...waybillDetail,
    waybillNo: '2609231533298948', statusLabel: '已完成',
    vehicle: { plate: '苏A6K528', driver: '张强', phone: '138****8206' },
    route: [
      routeNode('road-load', '装', 'blue', '南京江宁物流仓库', '江苏省南京市江宁区', '2026-09-23 12:00', '2026-09-23 12:35', 2, 'road'),
      routeNode('road-unload', '卸', 'green', '合肥经开区制造基地', '安徽省合肥市经开区', '2026-09-23 20:00', '2026-09-23 20:30', 2, 'road'),
    ],
    containerManifest: {
      mode: 'road', modeName: '公路', groups: [
        { key: 'road-direct', from: '南京江宁物流仓库', to: '合肥经开区制造基地', boxes: roadBoxes },
      ],
    },
  },
  'water-2': {
    ...waybillDetail,
    waybillNo: 'SW2609230019', statusLabel: '已完成',
    resource: { name: '江海通达168', subline: '航次 JHTD-0923' },
    route: [
      routeNode('water-load', '装', 'blue', '南京港', '江苏省南京市龙潭港区', '2026-09-25 08:00', '2026-09-25 09:20', 118, 'water'),
      routeNode('water-unload-wuhan', '卸', 'green', '武汉港', '湖北省武汉市阳逻港区', '2026-09-27 14:00', '2026-09-27 14:25', 78, 'water'),
      routeNode('water-unload-chongqing', '卸', 'green', '重庆港', '重庆市果园港集装箱码头', '2026-09-29 17:00', '2026-09-29 17:40', 40, 'water'),
    ],
    containerManifest: {
      mode: 'water', modeName: '水路', groups: [
        { key: 'water-wuhan', from: '南京港', to: '武汉港', boxes: waterWuhan },
        { key: 'water-chongqing', from: '南京港', to: '重庆港', boxes: waterChongqing },
      ],
    },
  },
  'rail-1': {
    ...waybillDetail,
    waybillNo: 'TL2609230066', statusLabel: '已完成',
    resource: { name: 'X8001 次列车', subline: '车种 P64｜发车车次 X8001' },
    route: [
      routeNode('rail-load', '装', 'blue', '武汉北站', '湖北省武汉市东西湖区', '2026-09-24 09:00', '2026-09-24 09:35', 18, 'rail'),
      routeNode('rail-unload-xian', '卸', 'green', '西安国际港站', '陕西省西安市国际港务区', '2026-09-26 11:00', '2026-09-26 11:28', 12, 'rail'),
      routeNode('rail-unload-lanzhou', '卸', 'green', '兰州东站', '甘肃省兰州市城关区', '2026-09-27 16:00', '2026-09-27 16:20', 6, 'rail'),
    ],
    containerManifest: {
      mode: 'rail', modeName: '铁路', groups: [
        { key: 'rail-xian', from: '武汉北站', to: '西安国际港站', boxes: railXian },
        { key: 'rail-lanzhou', from: '武汉北站', to: '兰州东站', boxes: railLanzhou },
      ],
    },
  },
}

export function getWaybillDetail(key = '') {
  return containerDetails[key] || waybillDetail
}
