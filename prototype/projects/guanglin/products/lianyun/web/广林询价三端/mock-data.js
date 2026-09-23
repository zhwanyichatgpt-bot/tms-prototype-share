/**
 * 广林询价三端 Mock 数据（严格按源 page.html DB 结构 1:1 还原）
 * 7 条询价覆盖全状态：草稿/待承接/已发布/待确认/已完成/已拒绝/已取消
 */

export const CONFIG = {
  shipperName: '广西广林木业有限公司',
  carriers: ['顺达物流', '鑫运运输', '广运达物流'],
  nvoccs: ['广林物流', '鑫运物流'],
}

export const CURRENT_CARRIER = '广运达物流'
export const CURRENT_NVOCC = '广林物流'

// 下拉选项
export const typeOptions = ['长协', '零星']
export const loadModeOptions = ['按重量', '按数量', '按体积']
export const unitMap = {
  按重量: ['吨', '千克'],
  按数量: ['件', '箱', '托', '车'],
  按体积: ['立方米'],
}
export const transportOptions = ['汽运', '水运', '铁路']
export const originOptions = ['南宁', '柳州', '桂林', '梧州', '北海', '玉林']
export const destOptions = ['广州', '深圳', '佛山', '中山', '珠海', '江门', '惠州', '肇庆']
export const goodsOptions = ['原木', '板材', '方木', '木片']
export const goodsRecommend = {
  原木: { loadMode: '按重量', unit: '吨' },
  板材: { loadMode: '按重量', unit: '吨' },
  方木: { loadMode: '按数量', unit: '件' },
  木片: { loadMode: '按体积', unit: '立方米' },
}
export const markupModes = ['按比例加价', '按固定金额加价', '直接填写']
export const quoteModeOptions = ['按运输单价报价', '按运输总价报价']

// 货主端状态 tabs
export const shipperStatusTabs = ['全部', '草稿', '待承接', '待报价', '待确认', '已完成', '已拒绝', '已取消']

// 无车承运人端状态 tabs
export const nvoccStatusTabs = ['全部', '待承接', '已承接', '已发布', '待货主确认', '已完成', '已拒绝', '已取消']

// 状态 tag 映射（严格按源 sTag 函数）
const statusTagMap = {
  '草稿': 'neutral', '待承接': 'warning', '已承接': 'processing', '已发布': 'processing',
  '待报价': 'processing', '待确认': 'warning', '待货主确认': 'warning',
  '已完成': 'success', '已拒绝': 'error', '已取消': 'neutral',
  '待处理': 'neutral', '报价中': 'processing', '已确认': 'success',
  '已生成托运单': 'success', '已驳回': 'error',
  '已报价': 'processing', '未入围': 'neutral', '已成交': 'success', '已失效': 'neutral',
  '长协': 'processing', '零星': 'success',
}
export function getStatusTagClass(s) {
  return 'gl-tag-' + (statusTagMap[s] || 'neutral')
}

// 7 条询价数据（严格按源 DB.inquiries）
export const initialInquiries = [
  {
    id: 'HYXJ-2026-0516-001',
    title: '广林2026年5月长协货源询价-第一批',
    type: '长协',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '5月长协线路询价',
    status: '已发布',
    publishTime: '2026-05-15 14:30',
    acceptTime: '2026-05-15 15:00',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      { id: 'R001', origin: '南宁', dest: '广州', goods: '原木', loadMode: '按重量', quantity: 500, unit: '吨', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
      { id: 'R002', origin: '南宁', dest: '深圳', goods: '原木', loadMode: '按重量', quantity: 300, unit: '吨', transport: '汽运', remark: '优先安排', status: '报价中', deadline: '2026-08-22 18:00', publishNote: '请尽快报价', quotes: [] },
      {
        id: 'R003', origin: '柳州', dest: '佛山', goods: '板材', loadMode: '按重量', quantity: 200, unit: '吨', transport: '汽运', remark: '', status: '报价中', deadline: '2026-08-22 18:00', publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 8500, unitPrice: 42.5, remark: '', status: '已报价', time: '2026-05-16 10:15' },
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 9200, unitPrice: 46, remark: '含装卸费', status: '已报价', time: '2026-05-16 11:40' },
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 8200, unitPrice: 41, remark: '', status: '已报价', time: '2026-05-16 15:00' },
        ],
      },
    ],
  },
  {
    id: 'HYXJ-2026-0516-002',
    title: '广林零星货源询价-散货运输',
    type: '零星',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '零星散货询价',
    status: '待确认',
    publishTime: '2026-05-14 10:00',
    acceptTime: '2026-05-14 10:30',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      {
        id: 'R101', origin: '南宁', dest: '珠海', goods: '板材', loadMode: '按重量', quantity: 80, unit: '吨', transport: '汽运', remark: '', status: '报价中', deadline: '2026-08-23 18:00', publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 4200, unitPrice: 52.5, remark: '', status: '已报价', time: '2026-05-15 11:00' },
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 4100, unitPrice: 51.25, remark: '', status: '已报价', time: '2026-05-15 14:00' },
        ],
      },
      { id: 'R102', origin: '梧州', dest: '中山', goods: '原木', loadMode: '按数量', quantity: 120, unit: '件', transport: '汽运', remark: '', status: '报价中', deadline: '2026-08-23 18:00', publishNote: '', quotes: [] },
      {
        id: 'R103', origin: '桂林', dest: '深圳', goods: '板材', loadMode: '按数量', quantity: 60, unit: '件', transport: '汽运', remark: '急件', status: '待货主确认', deadline: '2026-08-22 18:00', publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输单价报价', totalAmount: 3800, unitPrice: 63.33, remark: '', status: '已报价', time: '2026-05-15 14:00' },
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 4000, unitPrice: 66.67, remark: '', status: '已报价', time: '2026-05-15 15:30' },
        ],
        selectedCarrier: '顺达物流', markupMode: '直接填写', markupValue: 0, confirmPrice: 4100, fillNote: '', submitTime: '2026-05-15 16:00',
      },
      {
        id: 'R104', origin: '北海', dest: '佛山', goods: '原木', loadMode: '按重量', quantity: 180, unit: '吨', transport: '汽运', remark: '', status: '已驳回', deadline: '2026-08-24 18:00', publishNote: '',
        quotes: [
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 6800, unitPrice: 37.78, remark: '', status: '已报价', time: '2026-05-16 10:00' },
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 7000, unitPrice: 38.89, remark: '', status: '已报价', time: '2026-05-16 11:30' },
        ],
        selectedCarrier: '鑫运运输', markupMode: '按固定金额加价', markupValue: 500, confirmPrice: 7300, fillNote: '含装卸', submitTime: '2026-05-16 12:00',
        rejectReason: '报价偏高，请重新报价', rejectTime: '2026-05-16 14:00',
      },
      {
        id: 'R105', origin: '玉林', dest: '江门', goods: '方木', loadMode: '按数量', quantity: 90, unit: '件', transport: '汽运', remark: '', status: '已确认', deadline: '2026-08-20 18:00', publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 5500, unitPrice: 61.11, remark: '', status: '已报价', time: '2026-05-14 09:00' },
        ],
        selectedCarrier: '顺达物流', markupMode: '按固定金额加价', markupValue: 500, confirmPrice: 6000, fillNote: '', submitTime: '2026-05-14 10:00',
      },
    ],
  },
  {
    id: 'HYXJ-2026-0516-003',
    title: '广林4月零星货源询价-已完结',
    type: '零星',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '4月零星已完结',
    status: '已完成',
    publishTime: '2026-04-20 10:00',
    acceptTime: '2026-04-20 11:00',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      {
        id: 'R201', origin: '南宁', dest: '广州', goods: '板材', loadMode: '按数量', quantity: 150, unit: '箱', transport: '汽运', remark: '', status: '已生成托运单', deadline: '2026-08-25 18:00', publishNote: '',
        quotes: [
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 6200, unitPrice: 41.33, remark: '', status: '已成交', time: '2026-04-21 09:20' },
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 6300, unitPrice: 42, remark: '', status: '未入围', time: '2026-04-21 10:45' },
        ],
        selectedCarrier: '广运达物流', markupMode: '按固定金额加价', markupValue: 600, confirmPrice: 6800, fillNote: '', submitTime: '2026-04-21 14:20', shippingOrder: 'ZY-20260425-001',
      },
      {
        id: 'R202', origin: '柳州', dest: '深圳', goods: '原木', loadMode: '按体积', quantity: 200, unit: '立方米', transport: '汽运', remark: '', status: '已生成托运单', deadline: '2026-08-25 18:00', publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 9500, unitPrice: 47.5, remark: '', status: '已成交', time: '2026-04-21 08:00' },
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 9600, unitPrice: 48, remark: '', status: '未入围', time: '2026-04-21 09:30' },
        ],
        selectedCarrier: '顺达物流', markupMode: '按比例加价', markupValue: 7.37, confirmPrice: 10200, fillNote: '', submitTime: '2026-04-21 10:15', shippingOrder: 'ZY-20260425-002',
      },
    ],
  },
  {
    id: 'HYXJ-2026-0516-004',
    title: '广林长协货源询价-待提交',
    type: '长协',
    owner: '广西广林木业有限公司',
    targetNvocc: '',
    desc: '草稿测试',
    status: '草稿',
    publishTime: '', acceptTime: '',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      { id: 'R301', origin: '南宁', dest: '佛山', goods: '原木', loadMode: '按重量', quantity: 200, unit: '吨', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
      { id: 'R302', origin: '柳州', dest: '广州', goods: '板材', loadMode: '按数量', quantity: 300, unit: '箱', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
    ],
  },
  {
    id: 'HYXJ-2026-0516-005',
    title: '广林零星货源询价-新增线路',
    type: '零星',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '新增零星询价，待承接',
    status: '待承接',
    publishTime: '2026-05-16 09:00',
    acceptTime: '',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      { id: 'R401', origin: '玉林', dest: '惠州', goods: '方木', loadMode: '按数量', quantity: 200, unit: '件', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
      { id: 'R402', origin: '北海', dest: '江门', goods: '木片', loadMode: '按体积', quantity: 80, unit: '立方米', transport: '水运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
    ],
  },
  {
    id: 'HYXJ-2026-0516-006',
    title: '广林零星货源询价-被拒绝',
    type: '零星',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: 'NVOCC拒绝承接',
    status: '已拒绝',
    publishTime: '2026-05-15 08:00',
    acceptTime: '',
    rejectReason: '当前运力紧张，无法承接该批货源',
    rejectTime: '2026-05-15 09:30',
    cancelReason: '', cancelTime: '',
    routes: [
      { id: 'R501', origin: '南宁', dest: '广州', goods: '板材', loadMode: '按重量', quantity: 100, unit: '吨', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
    ],
  },
  {
    id: 'HYXJ-2026-0516-007',
    title: '广林长协货源询价-已取消',
    type: '长协',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '货主取消',
    status: '已取消',
    publishTime: '2026-05-14 16:00',
    acceptTime: '',
    rejectReason: '', rejectTime: '',
    cancelReason: '业务调整，该批次暂不需要运输',
    cancelTime: '2026-05-14 17:00',
    routes: [
      { id: 'R601', origin: '玉林', dest: '佛山', goods: '原木', loadMode: '按重量', quantity: 150, unit: '吨', transport: '汽运', remark: '', status: '待处理', quotes: [], deadline: '', publishNote: '' },
    ],
  },
]
