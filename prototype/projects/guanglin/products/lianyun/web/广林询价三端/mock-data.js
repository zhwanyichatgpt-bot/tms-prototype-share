/**
 * 广林询价三端 Mock 数据（严格按源 page.html DB 结构 1:1 还原）
 * 10 条询价覆盖全状态：草稿/待承接/已发布/待确认/已完成/已拒绝/已取消
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
export const transportOptions = ['汽运', '水运', '铁路', '公铁联运', '公水联运', '多式联运']
export const originOptions = ['南宁', '柳州', '桂林', '梧州', '北海', '玉林']
export const destOptions = ['广州', '深圳', '佛山', '中山', '珠海', '江门', '惠州', '肇庆']
export const goodsOptions = ['原木', '板材', '方木', '木片']
export const goodsRecommend = {
  原木: { loadMode: '按重量', unit: '吨' },
  板材: { loadMode: '按重量', unit: '吨' },
  方木: { loadMode: '按数量', unit: '件' },
  木片: { loadMode: '按体积', unit: '立方米' },
}
export const markupModes = ['按比例加价', '按固定金额加价', '按单位加价', '直接填写']
export const quoteModeOptions = ['按运输单价报价', '按运输总价报价']

// 竞价截止时间按当前日期动态生成，避免 Mock 数据随时间过期导致询价大厅为空
function pad2(n) { return String(n).padStart(2, '0') }
function futureDateTime(daysAhead, hour) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, 0, 0, 0)
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
}

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
  '已退回': 'warning', '已替换': 'neutral',
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
      { id: 'R002', origin: '南宁', dest: '深圳', goods: '原木', loadMode: '按重量', quantity: 300, unit: '吨', transport: '汽运', remark: '优先安排', status: '报价中', deadline: futureDateTime(1, 18), publishNote: '请尽快报价', quotes: [] },
      {
        id: 'R003', origin: '柳州', dest: '佛山', goods: '板材', loadMode: '按重量', quantity: 200, unit: '吨', transport: '汽运', remark: '', status: '报价中', deadline: futureDateTime(1, 18), publishNote: '',
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
        id: 'R101', origin: '南宁', dest: '珠海', goods: '板材', loadMode: '按重量', quantity: 80, unit: '吨', transport: '汽运', remark: '', status: '报价中', deadline: futureDateTime(2, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 4200, unitPrice: 52.5, remark: '', status: '已报价', time: '2026-05-15 11:00' },
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 4100, unitPrice: 51.25, remark: '', status: '已报价', time: '2026-05-15 14:00' },
        ],
      },
      { id: 'R102', origin: '梧州', dest: '中山', goods: '原木', loadMode: '按数量', quantity: 120, unit: '件', transport: '汽运', remark: '', status: '报价中', deadline: futureDateTime(2, 18), publishNote: '', quotes: [] },
      {
        id: 'R103', origin: '桂林', dest: '深圳', goods: '板材', loadMode: '按数量', quantity: 60, unit: '件', transport: '汽运', remark: '急件', status: '待货主确认', deadline: futureDateTime(1, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输单价报价', totalAmount: 3800, unitPrice: 63.33, remark: '', status: '已报价', time: '2026-05-15 14:00' },
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 4000, unitPrice: 66.67, remark: '', status: '已报价', time: '2026-05-15 15:30' },
        ],
        selectedCarrier: '顺达物流', markupMode: '直接填写', markupValue: 0, confirmPrice: 4100, fillNote: '', submitTime: '2026-05-15 16:00',
      },
      {
        id: 'R104', origin: '北海', dest: '佛山', goods: '原木', loadMode: '按重量', quantity: 180, unit: '吨', transport: '汽运', remark: '', status: '已驳回', deadline: futureDateTime(3, 18), publishNote: '',
        quotes: [
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 6800, unitPrice: 37.78, remark: '', status: '已报价', time: '2026-05-16 10:00' },
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 7000, unitPrice: 38.89, remark: '', status: '已报价', time: '2026-05-16 11:30' },
        ],
        selectedCarrier: '鑫运运输', markupMode: '按固定金额加价', markupValue: 500, confirmPrice: 7300, fillNote: '含装卸', submitTime: '2026-05-16 12:00',
        rejectReason: '报价偏高，请重新报价', rejectTime: '2026-05-16 14:00',
      },
      {
        id: 'R105', origin: '玉林', dest: '江门', goods: '方木', loadMode: '按数量', quantity: 90, unit: '件', transport: '汽运', remark: '', status: '已确认', deadline: futureDateTime(2, 18), publishNote: '',
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
        id: 'R201', origin: '南宁', dest: '广州', goods: '板材', loadMode: '按数量', quantity: 150, unit: '箱', transport: '汽运', remark: '', status: '已生成托运单', deadline: futureDateTime(4, 18), publishNote: '',
        quotes: [
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 6200, unitPrice: 41.33, remark: '', status: '已成交', time: '2026-04-21 09:20' },
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 6300, unitPrice: 42, remark: '', status: '未入围', time: '2026-04-21 10:45' },
        ],
        selectedCarrier: '广运达物流', markupMode: '按固定金额加价', markupValue: 600, confirmPrice: 6800, fillNote: '', submitTime: '2026-04-21 14:20', shippingOrder: 'ZY-20260425-001',
      },
      {
        id: 'R202', origin: '柳州', dest: '深圳', goods: '原木', loadMode: '按体积', quantity: 200, unit: '立方米', transport: '汽运', remark: '', status: '已生成托运单', deadline: futureDateTime(4, 18), publishNote: '',
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
  {
    id: 'HYXJ-2026-0516-008',
    title: '广林多式联运试运行询价',
    type: '长协',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '公铁联运 / 公水联运 / 多式联运试运行，用于验证运输方式筛选与承运商报价',
    status: '已发布',
    publishTime: '2026-05-16 09:20',
    acceptTime: '2026-05-16 10:00',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      {
        id: 'R701', origin: '南宁', dest: '上海', goods: '原木', loadMode: '按重量', quantity: 800, unit: '吨',
        transport: '公铁联运', remark: '铁路段需提前报箱', status: '报价中', deadline: futureDateTime(2, 18),
        publishNote: '公铁联运首批试运行',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 128000, unitPrice: 160, remark: '含公铁换装费', status: '已报价', time: '2026-05-16 11:20' },
          { carrier: '鑫运运输', quoteMode: '按运输单价报价', totalAmount: 124000, unitPrice: 155, remark: '', status: '已报价', time: '2026-05-16 13:05' },
        ],
      },
      {
        id: 'R702', origin: '柳州', dest: '宁波', goods: '板材', loadMode: '按重量', quantity: 500, unit: '吨',
        transport: '公水联运', remark: '', status: '报价中', deadline: futureDateTime(2, 18), publishNote: '', quotes: [],
      },
      {
        id: 'R703', origin: '贵港', dest: '广州', goods: '木片', loadMode: '按体积', quantity: 300, unit: '立方米',
        transport: '多式联运', remark: '水运 + 汽运', status: '报价中', deadline: futureDateTime(2, 18), publishNote: '',
        quotes: [
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 96000, unitPrice: 320, remark: '', status: '已报价', time: '2026-05-16 15:30' },
        ],
      },
      {
        id: 'R704', origin: '南宁', dest: '厦门', goods: '方木', loadMode: '按数量', quantity: 150, unit: '件',
        transport: '多式联运', remark: '待承运商报价', status: '报价中', deadline: futureDateTime(3, 18), publishNote: '', quotes: [],
      },
    ],
  },
  {
    id: 'HYXJ-2026-0516-009',
    title: '广林零星货源询价-多式联运补单',
    type: '零星',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '覆盖退回报价、删除报价、报价历史等操作场景',
    status: '待确认',
    publishTime: '2026-05-15 16:00',
    acceptTime: '2026-05-15 16:30',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      {
        id: 'R801', origin: '梧州', dest: '深圳', goods: '方木', loadMode: '按数量', quantity: 200, unit: '件',
        transport: '多式联运', remark: '货主已驳回，无车承运人可退回报价给承运商', status: '已驳回',
        deadline: futureDateTime(3, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 9400, unitPrice: 47, remark: '', status: '已报价', time: '2026-05-16 09:10' },
          {
            carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 9000, unitPrice: 45, remark: '可当天提货', status: '已报价', time: '2026-05-16 09:40',
            history: [
              { version: 1, quoteMode: '按运输总价报价', totalAmount: 9500, unitPrice: 47.5, remark: '首轮报价', time: '2026-05-16 08:30', status: '已替换', returnReason: '', returnTime: '' },
              { version: 2, quoteMode: '按运输总价报价', totalAmount: 9000, unitPrice: 45, remark: '可当天提货', time: '2026-05-16 09:40', status: '已报价', returnReason: '', returnTime: '' },
            ],
          },
        ],
        selectedCarrier: '广运达物流', markupMode: '按比例加价', markupValue: 8, confirmPrice: 9720,
        fillNote: '含两端短驳', submitTime: '2026-05-16 10:20', submitVersion: 1,
        rejectReason: '货主认为运价偏高，请重新核算', rejectTime: '2026-05-16 11:00',
        submissionHistory: [
          {
            version: 1, carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 9000, unitPrice: 45,
            markupMode: '按比例加价', markupValue: 8, confirmPrice: 9720, fillNote: '含两端短驳',
            submitTime: '2026-05-16 10:20', status: '已驳回',
            rejectReason: '货主认为运价偏高，请重新核算', rejectTime: '2026-05-16 11:00', confirmTime: '',
          },
        ],
      },
      {
        id: 'R802', origin: '北海', dest: '珠海', goods: '原木', loadMode: '按重量', quantity: 220, unit: '吨',
        transport: '公水联运', remark: '已成交，未入围 / 已失效报价可删除', status: '已确认',
        deadline: futureDateTime(2, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 14800, unitPrice: 67.27, remark: '', status: '已成交', time: '2026-05-15 17:10' },
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 15200, unitPrice: 69.09, remark: '', status: '未入围', time: '2026-05-15 17:40' },
          { carrier: '广运达物流', quoteMode: '按运输单价报价', totalAmount: 16000, unitPrice: 72.73, remark: '', status: '已失效', time: '2026-05-15 18:00' },
        ],
        selectedCarrier: '顺达物流', markupMode: '按固定金额加价', markupValue: 800, confirmPrice: 15600,
        fillNote: '', submitTime: '2026-05-15 18:30', submitVersion: 1,
        submissionHistory: [
          {
            version: 1, carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 14800, unitPrice: 67.27,
            markupMode: '按固定金额加价', markupValue: 800, confirmPrice: 15600, fillNote: '',
            submitTime: '2026-05-15 18:30', status: '已确认',
            rejectReason: '', rejectTime: '', confirmTime: '2026-05-16 09:00',
          },
        ],
      },
      {
        id: 'R803', origin: '玉林', dest: '佛山', goods: '板材', loadMode: '按重量', quantity: 180, unit: '吨',
        transport: '公铁联运', remark: '报价进行中，承运商可修改报价', status: '报价中',
        deadline: futureDateTime(4, 18), publishNote: '',
        quotes: [
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 12600, unitPrice: 70, remark: '', status: '已报价', time: '2026-05-16 10:00' },
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 13000, unitPrice: 72.22, remark: '', status: '已报价', time: '2026-05-16 10:30' },
        ],
      },
      {
        id: 'R804', origin: '钦州', dest: '东莞', goods: '方木', loadMode: '按数量', quantity: 90, unit: '件',
        transport: '多式联运', remark: '含一条已取消报价，可直接删除', status: '待货主确认',
        deadline: futureDateTime(3, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 5800, unitPrice: 64.44, remark: '', status: '已报价', time: '2026-05-16 08:30' },
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 5600, unitPrice: 62.22, remark: '', status: '已取消', time: '2026-05-16 08:50' },
        ],
        selectedCarrier: '顺达物流', markupMode: '按单位加价', markupValue: 2, confirmPrice: 5980,
        fillNote: '', submitTime: '2026-05-16 09:30', submitVersion: 1,
        submissionHistory: [
          {
            version: 1, carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 5800, unitPrice: 64.44,
            markupMode: '按单位加价', markupValue: 2, confirmPrice: 5980, fillNote: '',
            submitTime: '2026-05-16 09:30', status: '待确认',
            rejectReason: '', rejectTime: '', confirmTime: '',
          },
        ],
      },
      {
        id: 'R805', origin: '桂林', dest: '广州', goods: '原木', loadMode: '按重量', quantity: 150, unit: '吨',
        transport: '汽运', remark: '选中报价已被无车承运人退回，承运商可重新报价', status: '已驳回',
        deadline: futureDateTime(3, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 7800, unitPrice: 52, remark: '', status: '已报价', time: '2026-05-16 09:20' },
          {
            carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 7500, unitPrice: 50, remark: '可次日装车', status: '已退回', time: '2026-05-16 09:40',
            returnReason: '货主认为运价偏高，请重新核算运输成本', returnTime: '2026-05-16 11:30',
            history: [
              { version: 1, quoteMode: '按运输总价报价', totalAmount: 7500, unitPrice: 50, remark: '可次日装车', time: '2026-05-16 09:40', status: '已退回', returnReason: '货主认为运价偏高，请重新核算运输成本', returnTime: '2026-05-16 11:30' },
            ],
          },
        ],
        selectedCarrier: '', markupMode: '按比例加价', markupValue: 6, confirmPrice: 7950,
        fillNote: '含短驳费', submitTime: '2026-05-16 10:20', submitVersion: 1,
        rejectReason: '货主认为运价偏高，请重新核算', rejectTime: '2026-05-16 11:00',
        returnedCarrier: '广运达物流',
        submissionHistory: [
          {
            version: 1, carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 7500, unitPrice: 50,
            markupMode: '按比例加价', markupValue: 6, confirmPrice: 7950, fillNote: '含短驳费',
            submitTime: '2026-05-16 10:20', status: '已驳回',
            rejectReason: '货主认为运价偏高，请重新核算', rejectTime: '2026-05-16 11:00', confirmTime: '',
          },
        ],
      },
    ],
  },
  {
    id: 'HYXJ-2026-0516-010',
    title: '广林长协货源询价-跨月备货',
    type: '长协',
    owner: '广西广林木业有限公司',
    targetNvocc: '广林物流',
    desc: '已完成单，含两版提交记录，用于查看多版本报价历史',
    status: '已完成',
    publishTime: '2026-04-22 09:00',
    acceptTime: '2026-04-22 09:30',
    rejectReason: '', rejectTime: '',
    cancelReason: '', cancelTime: '',
    routes: [
      {
        id: 'R901', origin: '南宁', dest: '武汉', goods: '原木', loadMode: '按重量', quantity: 600, unit: '吨',
        transport: '公铁联运', remark: '含两版提交记录', status: '已生成托运单',
        deadline: futureDateTime(4, 18), publishNote: '',
        quotes: [
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 96000, unitPrice: 160, remark: '', status: '已成交', time: '2026-04-23 09:10' },
          { carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 99000, unitPrice: 165, remark: '', status: '未入围', time: '2026-04-23 10:20' },
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 102000, unitPrice: 170, remark: '', status: '已失效', time: '2026-04-23 11:00' },
        ],
        selectedCarrier: '顺达物流', markupMode: '按单位加价', markupValue: 3, confirmPrice: 97800,
        fillNote: '每吨加价 3 元', submitTime: '2026-04-24 09:00', submitVersion: 2,
        shippingOrder: 'ZY-20260428-003',
        submissionHistory: [
          {
            version: 1, carrier: '鑫运运输', quoteMode: '按运输总价报价', totalAmount: 99000, unitPrice: 165,
            markupMode: '按比例加价', markupValue: 5, confirmPrice: 103950, fillNote: '首版按鑫运报价提交',
            submitTime: '2026-04-23 15:00', status: '已驳回',
            rejectReason: '报价高于上月同线路水平', rejectTime: '2026-04-23 18:00', confirmTime: '',
          },
          {
            version: 2, carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 96000, unitPrice: 160,
            markupMode: '按单位加价', markupValue: 3, confirmPrice: 97800, fillNote: '每吨加价 3 元',
            submitTime: '2026-04-24 09:00', status: '已确认',
            rejectReason: '', rejectTime: '', confirmTime: '2026-04-24 14:00',
          },
        ],
      },
      {
        id: 'R902', origin: '南宁', dest: '郑州', goods: '板材', loadMode: '按重量', quantity: 400, unit: '吨',
        transport: '多式联运', remark: '', status: '已生成托运单',
        deadline: futureDateTime(4, 18), publishNote: '',
        quotes: [
          { carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 72000, unitPrice: 180, remark: '', status: '已成交', time: '2026-04-23 09:30' },
          { carrier: '顺达物流', quoteMode: '按运输总价报价', totalAmount: 74000, unitPrice: 185, remark: '', status: '未入围', time: '2026-04-23 10:00' },
        ],
        selectedCarrier: '广运达物流', markupMode: '直接填写', markupValue: 0, confirmPrice: 74800,
        fillNote: '', submitTime: '2026-04-24 10:00', submitVersion: 1,
        shippingOrder: 'ZY-20260428-004',
        submissionHistory: [
          {
            version: 1, carrier: '广运达物流', quoteMode: '按运输总价报价', totalAmount: 72000, unitPrice: 180,
            markupMode: '直接填写', markupValue: 0, confirmPrice: 74800, fillNote: '',
            submitTime: '2026-04-24 10:00', status: '已确认',
            rejectReason: '', rejectTime: '', confirmTime: '2026-04-24 16:00',
          },
        ],
      },
    ],
  },
]