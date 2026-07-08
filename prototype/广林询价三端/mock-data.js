/**
 * 广林询价三端 Mock 数据
 * 三端联动：货主端 + 无车承运人端 + 承运商端
 * 一份共享数据 + 三个角色视图
 */

// 询价类型
export const inquiryTypes = ['长协货源询价', '零星货源询价']

// 配载方式
export const stowageModes = ['按重量', '按数量', '按体积']

// 单位映射
export const unitMap = {
  按重量: ['吨', '千克'],
  按数量: ['件', '箱', '托', '车'],
  按体积: ['立方米'],
}

// 货品推荐配载方式
export const cargoRecommend = {
  原木: { stowage: '按重量', unit: '吨' },
  板材: { stowage: '按重量', unit: '吨' },
  方木: { stowage: '按数量', unit: '件' },
  木片: { stowage: '按体积', unit: '立方米' },
  煤炭: { stowage: '按重量', unit: '吨' },
  钢材: { stowage: '按重量', unit: '吨' },
}

// 货品选项
export const cargoOptions = Object.keys(cargoRecommend)

// 地址库
export const addressOptions = ['苏州', '上海', '杭州', '南京', '广州', '深圳', '成都', '武汉']

// 询价对象（无车承运人）
export const nvoccOptions = ['广林物流平台公司', '东南无车承运', '华中联运平台']

// 报价加价方式
export const markupTypes = ['按比例加价', '按固定金额加价', '直接填写']

// 初始数据：5 张货源询价
export const initialInquiries = [
  {
    id: 'IQ20260701001',
    inquiryType: '长协货源询价',
    title: '广林项目-华东木材长协',
    shipper: '广林木业有限公司',
    nvocc: '广林物流平台公司',
    description: '原木从苏州发往上海，按月稳定货源',
    status: '草稿',
    createdAt: '2026-07-01 09:00',
    rejectReason: '',
    cancelReason: '',
    routes: [
      {
        id: 'R001', origin: '苏州', destination: '上海', cargo: '原木',
        stowage: '按重量', cargoQty: 200, unit: '吨', transportMode: '汽运',
        remark: '',
        status: '待处理',
        publishDeadline: '',
        publishRemark: '',
        carrierQuotes: [],
        currentQuoteVersion: null, // 当前对货主报价版本
        waybillNo: '',
      },
    ],
  },
  {
    id: 'IQ20260701002',
    inquiryType: '长协货源询价',
    title: '广林项目-木片发运',
    shipper: '广林木业有限公司',
    nvocc: '广林物流平台公司',
    description: '',
    status: '待承接',
    createdAt: '2026-07-01 10:00',
    rejectReason: '',
    cancelReason: '',
    routes: [
      {
        id: 'R002', origin: '苏州', destination: '杭州', cargo: '木片',
        stowage: '按体积', cargoQty: 500, unit: '立方米', transportMode: '汽运',
        remark: '',
        status: '待处理',
        publishDeadline: '',
        publishRemark: '',
        carrierQuotes: [],
        currentQuoteVersion: null,
        waybillNo: '',
      },
    ],
  },
  {
    id: 'IQ20260701003',
    inquiryType: '零星货源询价',
    title: '零星-钢材运输',
    shipper: '广林木业有限公司',
    nvocc: '广林物流平台公司',
    description: '',
    status: '待确认',
    createdAt: '2026-07-02 09:00',
    rejectReason: '',
    cancelReason: '',
    routes: [
      {
        id: 'R003', origin: '上海', destination: '南京', cargo: '钢材',
        stowage: '按重量', cargoQty: 50, unit: '吨', transportMode: '汽运',
        remark: '',
        status: '待货主确认',
        publishDeadline: '2026-07-05 18:00',
        publishRemark: '请尽快报价',
        carrierQuotes: [
          { id: 'Q001', carrier: '顺达物流', totalAmount: 8000, unitPrice: 160, createdAt: '2026-07-03 10:00' },
          { id: 'Q002', carrier: '鑫运运输', totalAmount: 7500, unitPrice: 150, createdAt: '2026-07-03 11:00' },
          { id: 'Q003', carrier: '广运达物流', totalAmount: 7800, unitPrice: 156, createdAt: '2026-07-03 14:00' },
        ],
        currentQuoteVersion: { totalAmount: 8200, unitPrice: 164, submitRemark: '加价 4%', submittedAt: '2026-07-03 16:00', baseQuoteId: 'Q002' },
        waybillNo: '',
      },
    ],
  },
  {
    id: 'IQ20260701004',
    inquiryType: '长协货源询价',
    title: '广林项目-板材稳定运输',
    shipper: '广林木业有限公司',
    nvocc: '广林物流平台公司',
    description: '',
    status: '已完成',
    createdAt: '2026-06-20 09:00',
    rejectReason: '',
    cancelReason: '',
    routes: [
      {
        id: 'R004', origin: '苏州', destination: '深圳', cargo: '板材',
        stowage: '按重量', cargoQty: 100, unit: '吨', transportMode: '汽运',
        remark: '',
        status: '已生成托运单',
        publishDeadline: '2026-06-25 18:00',
        publishRemark: '',
        carrierQuotes: [
          { id: 'Q004', carrier: '顺达物流', totalAmount: 15000, unitPrice: 150, createdAt: '2026-06-21 09:00' },
          { id: 'Q005', carrier: '广运达物流', totalAmount: 14500, unitPrice: 145, createdAt: '2026-06-21 10:00' },
        ],
        currentQuoteVersion: { totalAmount: 14800, unitPrice: 148, submitRemark: '', submittedAt: '2026-06-22 10:00', baseQuoteId: 'Q005' },
        waybillNo: 'CON20260622001',
      },
    ],
  },
  {
    id: 'IQ20260701005',
    inquiryType: '零星货源询价',
    title: '已取消示例',
    shipper: '广林木业有限公司',
    nvocc: '广林物流平台公司',
    description: '',
    status: '已取消',
    createdAt: '2026-06-15 09:00',
    rejectReason: '',
    cancelReason: '客户取消订单',
    routes: [],
  },
]

// 当前承运商（用于承运商端视角过滤）
export const currentCarrier = '顺达物流'

// 承运商池（承运商端模拟"当前承运商"）
export const carrierPool = ['顺达物流', '鑫运运输', '广运达物流']
