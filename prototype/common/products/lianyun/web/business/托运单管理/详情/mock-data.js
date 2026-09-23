/**
 * 托运单详情 —— Mock 数据
 * 设计依据：Pixso 画板 92:3397 (托运订单-托运单详情)
 */

export const waybillDetailData = {
  id: 'TY20250811000001',
  status: 'todo',
  statusText: '待执行',
  typeTag: '公开托运',
  createTime: '2024-08-08 11:20:23',
  creator: '林森森',

  // 托运信息
  shipperInfo: {
    company: '福建万维宇宙科技有限公司',
    contact: '林森森（17822221124）',
    remark: '包括普通货运，可运输各类普通货物；货物专...',
  },

  // 费用信息
  costInfo: {
    baseFreight: '154.00',
    tags: ['含税', '单位计费'],
    rule: '重量  |  装货重量  |  运输单价：100元/吨',
    payTypeAmount: '1,000.00',
    payTypeTag: '预付',
    payMethod: '垫付',
    lossTemplate: 'xxxxxxxx计费模板',
    settlementSummary: [
      { label: '累计结算运费', amount: '1,000.00', unit: '元' },
      { label: '待支付运费', amount: '1,000.00', unit: '元' },
      { label: '已支付运费', amount: '1,000.00', unit: '元' },
    ],
  },

  // 货品信息
  goodsList: [
    {
      name: '工业品',
      spec: '（货品名称 | 货品规格）',
      expanded: true,
      fields: [
        { label: '总重量', value: '1000吨' },
        { label: '总体积', value: '1000m³' },
        { label: '总数量', value: '50件' },
        { label: '包装', value: '木托' },
        { label: '货品单价', value: '300元' },
        { label: '货品总价', value: '300000元' },
      ],
      remark: '这里是备注内容这里是备注内容这里是备注内容',
    },
    {
      name: '工业品',
      spec: '（货品名称 | 货品规格）',
      expanded: false,
      fields: [],
      remark: '',
    },
  ],

  // 附件列表
  attachments: [
    { name: '文件名称文件名称.jpg', type: 'image' },
    { name: '文件名称文件名称.pdf', type: 'pdf' },
  ],

  // 右侧联运路段列表
  segments: [
    {
      id: 'seg-1',
      title: '路段1',
      mode: '汽运',
      cargoType: '散杂货',
      currentStage: true,
      progress: 50,
      loadedCount: 75,
      loadedDetail: '（数量50件+数量25吨）',
      totalDesc: '总量：100吨  |  已完成：50吨  |  剩余：50吨',
    },
    {
      id: 'seg-1-detail',
      title: '路段1',
      mode: '汽运',
      cargoType: '散杂货',
      progress: 50,
      loadPoint: {
        city: '辽宁 朝阳',
        time: '2025-03-02 08:00',
        address: '北票市龙潭镇马架子村幸福路123号',
      },
      unloadPoint: {
        city: '福州 台江',
        time: '2025-03-02 08:00',
        address: '好运街道野姜花路1号',
      },
      metrics: {
        total: '50',
        surplus: '20',
        accepted: '10',
        available: '10',
        inTransit: '50',
        unloaded: '20',
        loss: '10',
      },
    },
    {
      id: 'seg-3',
      title: '路段3',
      mode: '水运',
      cargoType: '集装箱',
      currentStage: false,
      progress: 50,
      loadedCount: 75,
      loadedDetail: '（数量50件+数量25吨）',
      totalDesc: '集装箱：10个  |  已装：5个  |  已卸：5个',
    },
    {
      id: 'seg-4',
      title: '路段4',
      mode: '铁路',
      cargoType: '集装箱',
      hasActions: true,
    },
  ],

  // 地图枢纽与中转点
  transferNodes: [
    {
      name: '阜阳站',
      type: 'load',
      typeText: '装',
    },
    {
      name: '鑫淮港口',
      tags: ['公转水', '散改集'],
      truckLoadTime: '2024-9-3 12:00',
      shipLoadTime: '2024-9-3 12:00',
      cargoList: [
        { name: '玉米', value: '30吨' },
        { name: '玉米', value: '30吨' },
        { name: '集装箱', value: '20GP | 30吨' },
        { name: '集装箱', value: '40GP | 30吨' },
      ],
    },
    {
      name: '九江站',
      type: 'unload',
      typeText: '卸',
    },
  ],

  // 北斗轨迹查询面板数据
  beidouQuery: {
    remainCount: 100,
    consumeCount: 23,
    activeWaybillTab: 'truck',
    waybillTabs: [
      { key: 'truck', label: '汽运运单' },
      { key: 'ship', label: '水运运单' },
      { key: 'train', label: '火运运单' },
    ],
    waybillList: [
      {
        id: 'QY2508191910391932',
        status: '已卸货',
        truck: '闽A12345',
        driver: '陈师傅',
        phone: '12233332222',
        timeline: [
          { date: '05-13', time: '22:00', label: '已接单', active: true },
          { date: '05-13', time: '08:00', label: '已装货', active: true },
          { date: '', time: '', label: '运输中', active: false },
          { date: '', time: '', label: '已卸货', active: false },
          { date: '', time: '', label: '已复核', active: false },
          { date: '', time: '', label: '已结算', active: false },
        ],
      },
      {
        id: 'QY2508191910391932',
        status: '已卸货',
        truck: '闽A12345',
        driver: '陈师傅',
        phone: '12233332222',
        timeline: [
          { date: '05-13', time: '22:00', label: '已接单', active: true },
          { date: '05-13', time: '08:00', label: '已装货', active: true },
          { date: '05-13', time: '08:00', label: '运输中', active: true },
          { date: '05-14', time: '08:00', label: '已卸货', active: true },
          { date: '05-14', time: '08:00', label: '已复核', active: true },
          { date: '', time: '', label: '已结算', active: false },
        ],
      },
      {
        id: 'QY2508191910391932',
        status: '已卸货',
        truck: '东风99',
        driver: '陈师傅',
        phone: '12233332222',
        timeline: [
          { date: '05-13', time: '22:00', label: '已接单', active: true },
          { date: '05-13', time: '08:00', label: '已装货', active: true },
          { date: '05-13', time: '08:00', label: '运输中', active: true },
          { date: '05-14', time: '08:00', label: '已卸船', active: true },
          { date: '05-14', time: '08:00', label: '已复核', active: true },
          { date: '05-15', time: '08:00', label: '已结算', active: true },
        ],
      },
      {
        id: 'QY2508191910391932',
        status: '已卸货',
        truck: '闽A12345',
        driver: '陈师傅',
        phone: '12233332222',
        timeline: [
          { date: '05-13', time: '22:00', label: '已接单', active: true },
          { date: '', time: '', label: '已装货', active: false },
          { date: '', time: '', label: '运输中', active: false },
          { date: '', time: '', label: '已卸货', active: false },
          { date: '', time: '', label: '已复核', active: false },
          { date: '', time: '', label: '已结算', active: false },
        ],
      },
    ],
  },
}
