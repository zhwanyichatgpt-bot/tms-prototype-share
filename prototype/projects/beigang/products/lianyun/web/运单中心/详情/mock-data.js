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

/* ==================== 地址变更（北港水运 PRD） ====================
/* 状态枚举与变更数据统一在 ../address-change-store.js（单一数据源），此处 re-export 保持兼容 */
export { addressChangeStatusMeta } from '../address-change-store'

import { getWaybill } from '../address-change-store'

/*
 * 按运单 key 合成详情数据：以 waybillDetail 为模板（路线/地图/费用布局），
 * 用 store 中该运单的主数据（运单号/状态/卸货地址/单价/车辆）覆盖对应字段，
 * 保证详情页与列表、发起弹窗显示同一张运单。
 */
export function getWaybillDetail(key) {
  const w = getWaybill(key)
  if (!w) return waybillDetail
  /* 实际承运商视角：基础运费按本企业当前有效承运价格（变更未生效时为变更前价格）；
     合同承运商视角：按托运企业运输单价 */
  const isActualCarrier = w.perspective === 'actualCarrier'
  const effectivePrice = isActualCarrier ? w.downstream.currentPrice : w.currentPrice
  const numPrice = Number(effectivePrice)
  return {
    ...waybillDetail,
    waybillNo: w.waybillNo,
    status: w.status,
    statusLabel: w.statusLabel,
    vehicle: { ...w.vehicle },
    route: waybillDetail.route.map((node) =>
      node.key === 'unload'
        ? { ...node, name: w.stops[w.stops.length - 1]?.name || node.name, address: w.currentUnloadAddress }
        : node,
    ),
    baseFee: {
      ...waybillDetail.baseFee,
      unitPrice: `${effectivePrice}元`,
      formula: `装卸货最小重量100.000吨*${numPrice.toFixed(2)}元/吨=${(100 * numPrice).toFixed(2)}元`,
    },
  }
}
