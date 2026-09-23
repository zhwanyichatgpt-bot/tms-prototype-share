/**
 * 运输通道管理 Mock 数据（严格按源 page.html seed 还原，6 条样例覆盖全状态组合）
 */

// 运输方式
export const transportTypes = ['多式联运', '公路', '水路', '铁路']

// 业务方向（选填，含空项）
export const businessDirections = ['', '进口', '出口', '内贸', '跨境']

// 货类
export const cargoTypes = ['普货', '冷链', '危险品', '散货', '集装箱货', '大件货']

// 箱型
export const containerTypes = ['20GP', '40GP', '40HQ', '45HQ', '冷藏箱']

// 服务能力开关
export const serviceSwitches = [
  { key: 'pickup', label: '支持上门' },
  { key: 'lastMile', label: '支持末端' },
  { key: 'customs', label: '支持通关' },
]
export const valueAddedSwitches = [
  { key: 'valueAdded', label: '支持增值服务' },
  { key: 'storageTransfer', label: '支持仓储中转' },
]

// 路段运输方式
export const segmentModes = ['公路', '铁路', '水路', '海运', '空运']

// 作业类型
export const operationTypes = ['报关作业', '散改集', '集改散', '装卸作业', '换装作业', '短驳接驳', '仓储中转']

// 发布状态
export const publishStatusOptions = ['全部', '未发布', '待审核', '已发布', '已下架', '已驳回']

// 本体状态 tabs
export const bodyStatusTabs = [
  { label: '全部', value: '全部' },
  { label: '草稿', value: '草稿' },
  { label: '启用', value: '启用' },
  { label: '停用', value: '停用' },
]

// 是否已有方案
export const hasSchemeOptions = ['全部', '已有方案', '无方案']

// 参考价类型
export const priceTypes = [
  { value: 'start', label: '起报价' },
  { value: 'range', label: '区间价' },
  { value: 'consult', label: '面议' },
]

// 计费条件（源字段名 billingDimension，语义=按什么算钱）
export const billingDimensions = ['按重量', '按体积', '按数量', '按集装箱']

// 币种
export const currencies = ['RMB', 'USD']

// 参考时效类型
export const leadTimeTypes = [
  { value: 'fixed', label: '固定值' },
  { value: 'range', label: '区间值' },
  { value: 'pending', label: '待确认' },
]

// 时效单位
export const leadTimeUnits = ['天']

// 费用组织方式
export const quoteModes = ['整段', '分段']

// 业务类型（路段级）
export const segmentBusinessTypes = ['散货', '集装箱']

// 增值服务字典
export const valueAddedDictionary = ['货物加固', '换单服务', '贴标分拣', '预约入仓', '保险代办', '仓储中转']

// 通关服务子项
export const customsServiceTypes = ['出口报关', '进口清关', '报关+清关']

// 费用类型
export const feeTypeOptions = ['增项', '减项']
// 计价方式
export const feeCalcModes = ['固定金额', '单价×基数']

// 服务区域树（用于 cascader）
export const serviceAreaTree = [
  { label: '江苏省', cities: [
    { label: '苏州市', districts: ['工业园区', '高新区', '吴中区'] },
    { label: '无锡市', districts: ['新吴区', '锡山区', '惠山区'] },
  ]},
  { label: '上海市', cities: [{ label: '上海市', districts: ['浦东新区', '宝山区', '闵行区'] }] },
  { label: '广东省', cities: [
    { label: '广州市', districts: ['南沙区', '黄埔区', '番禺区'] },
    { label: '深圳市', districts: ['盐田区', '宝安区', '龙岗区'] },
  ]},
]

// 候选承运商池（按运输方式分类）
export const carrierPool = {
  公路: [
    { id: 'road-1', name: '华东短驳合作车队', source: '自有合作', note: '专注长三角短驳' },
    { id: 'road-2', name: '长三角整车承运商', source: '自有合作', note: '稳定整车资源' },
    { id: 'road-3', name: '平台推荐公路资源', source: '平台承运商', note: '平台审核认证' },
  ],
  铁路: [
    { id: 'rail-1', name: '欧亚班列合作资源池', source: '自有合作', note: '中欧班列稳定舱位' },
    { id: 'rail-2', name: '陆桥铁路承运商', source: '自有合作', note: '国内干线路局合作' },
  ],
  水路: [
    { id: 'water-1', name: '沿江驳运合作船队', source: '自有合作', note: '长江内河驳船' },
    { id: 'water-2', name: '内河船东资源池', source: '自有合作', note: '京杭运河资源' },
  ],
  海运: [
    { id: 'sea-1', name: '远洋主干合作船司', source: '自有合作', note: '欧洲地中海主干' },
    { id: 'sea-2', name: '港口航线代理', source: '自有合作', note: '近洋支线代理' },
  ],
  空运: [
    { id: 'air-1', name: '航空包板合作商', source: '自有合作', note: '主货站包板' },
  ],
}

// ============ 6 条样例通道（覆盖全状态组合）============
export const seedChannels = [
  {
    id: 'TC2026-0101',
    name: '华东出口海铁通道',
    transportType: '多式联运',
    businessDirection: '出口',
    origin: '苏州园区',
    destination: '汉堡港',
    bodyStatus: '启用',
    publishStatus: '已发布',
    rejectReason: '', rejectTime: '',
    updatedAt: '2026-04-16 14:26',
    cargoTypes: ['普货', '集装箱货'],
    containerTypes: ['40GP', '40HQ'],
    serviceConfig: { pickup: true, lastMile: false, customs: true, valueAdded: true, storageTransfer: false },
    displayConfig: {
      price: { type: 'start', billingDimension: '按集装箱', currency: 'USD', value: 2150, min: 0, max: 0, note: '具体箱型价格以方案配置为准' },
      leadTime: { type: 'range', value: 0, min: 30, max: 45, unit: '天', note: '稳定时效' },
      description: '面向华东制造业出口业务的稳定型海铁通道，覆盖电子产品、机械设备出口场景。',
    },
    paths: [
      { id: 'p1-1', name: '主路径', segments: [
        { id: 's1-1', type: 'segment', mode: '公路', from: '苏州园区', to: '上海芦潮港', note: '公路短驳' },
        { id: 's1-2', type: 'segment', mode: '铁路', from: '上海芦潮港', to: '义乌', note: '义新欧班列起点' },
        { id: 's1-3', type: 'segment', mode: '海运', from: '宁波港', to: '汉堡港', note: '远洋主干段' },
      ]},
    ],
    schemes: [
      { id: 'TS2026-0101-1', name: '电子产品出口标准方案', pathName: '主路径', transportType: '多式联运', status: '启用', serviceSummary: '上门/通关/增值', priceSummary: 'USD 2150/箱 起', leadTimeSummary: '30-45 天', carrierSummary: '3 家承运商', updatedAt: '2026-04-15 10:00' },
      { id: 'TS2026-0101-2', name: '设备出口稳定型方案', pathName: '主路径', transportType: '多式联运', status: '启用', serviceSummary: '上门/通关/增值', priceSummary: 'USD 2400/箱 起', leadTimeSummary: '35-50 天', carrierSummary: '2 家承运商', updatedAt: '2026-04-10 14:30' },
      { id: 'TS2026-0101-3', name: '冷链食品空运备选方案', pathName: '主路径', transportType: '多式联运', status: '草稿', serviceSummary: '通关/仓储中转', priceSummary: '面议', leadTimeSummary: '7-10 天', carrierSummary: '1 家承运商', updatedAt: '2026-04-08 16:20' },
    ],
  },
  {
    id: 'TC2026-0202',
    name: '长三角纯公路通道',
    transportType: '公路',
    businessDirection: '内贸',
    origin: '上海',
    destination: '杭州',
    bodyStatus: '启用',
    publishStatus: '待审核',
    rejectReason: '', rejectTime: '',
    updatedAt: '2026-04-15 09:00',
    cargoTypes: ['普货'],
    containerTypes: [],
    serviceConfig: { pickup: true, lastMile: true, customs: false, valueAdded: false, storageTransfer: false },
    displayConfig: {
      price: { type: 'range', billingDimension: '按重量', currency: 'RMB', value: 0, min: 200, max: 350, note: '' },
      leadTime: { type: 'fixed', value: 1, min: 0, max: 0, unit: '天', note: '当日达' },
      description: '长三角短驳和整车运输能力，覆盖电子产品、纺织品城配场景。',
    },
    paths: [
      { id: 'p2-1', name: '主路径', segments: [
        { id: 's2-1', type: 'segment', mode: '公路', from: '上海', to: '杭州', note: '' },
      ]},
    ],
    schemes: [
      { id: 'TS2026-0202-1', name: '电子产品城配方案', pathName: '主路径', transportType: '公路', status: '启用', serviceSummary: '上门/末端', priceSummary: '200-350 元/吨', leadTimeSummary: '1 天', carrierSummary: '2 家承运商', updatedAt: '2026-04-15 09:30' },
    ],
  },
  {
    id: 'TC2026-0303',
    name: '内河散货水运通道',
    transportType: '水路',
    businessDirection: '内贸',
    origin: '南京港',
    destination: '上海港',
    bodyStatus: '停用',
    publishStatus: '已下架',
    rejectReason: '', rejectTime: '',
    updatedAt: '2026-03-28 11:00',
    cargoTypes: ['散货', '大件货'],
    containerTypes: [],
    serviceConfig: { pickup: false, lastMile: false, customs: false, valueAdded: true, storageTransfer: true },
    displayConfig: {
      price: { type: 'consult', billingDimension: '按重量', currency: 'RMB', value: 0, min: 0, max: 0, note: '' },
      leadTime: { type: 'pending', value: 0, min: 0, max: 0, unit: '天', note: '' },
      description: '长江内河散货稳定水运能力，已停用，仅作历史保留。',
    },
    paths: [
      { id: 'p3-1', name: '主路径', segments: [
        { id: 's3-1', type: 'segment', mode: '水路', from: '南京港', to: '上海港', note: '' },
      ]},
    ],
    schemes: [],
  },
  {
    id: 'TC2026-0404',
    name: '华南冷链铁路通道',
    transportType: '铁路',
    businessDirection: '内贸',
    origin: '广州',
    destination: '成都',
    bodyStatus: '启用',
    publishStatus: '已驳回',
    rejectReason: '冷链温控证明材料不完整，请补充承运商冷链资质后再提交。',
    rejectTime: '2026-04-12 10:30',
    updatedAt: '2026-04-12 10:30',
    cargoTypes: ['冷链'],
    containerTypes: ['冷藏箱'],
    serviceConfig: { pickup: false, lastMile: false, customs: false, valueAdded: false, storageTransfer: false },
    displayConfig: {
      price: { type: 'start', billingDimension: '按集装箱', currency: 'RMB', value: 4500, min: 0, max: 0, note: '冷藏箱起报价' },
      leadTime: { type: 'fixed', value: 4, min: 0, max: 0, unit: '天', note: '' },
      description: '',
    },
    paths: [
      { id: 'p4-1', name: '主路径', segments: [
        { id: 's4-1', type: 'segment', mode: '铁路', from: '广州', to: '成都', note: '冷链专列' },
      ]},
    ],
    schemes: [],
  },
  {
    id: 'TC2026-0505',
    name: '中部多式联运试点通道',
    transportType: '多式联运',
    businessDirection: '内贸',
    origin: '武汉',
    destination: '上海',
    bodyStatus: '启用',
    publishStatus: '已下架',
    rejectReason: '', rejectTime: '',
    updatedAt: '2026-04-05 16:00',
    cargoTypes: ['普货', '集装箱货'],
    containerTypes: ['20GP', '40GP'],
    serviceConfig: { pickup: true, lastMile: true, customs: false, valueAdded: true, storageTransfer: false },
    displayConfig: {
      price: { type: 'range', billingDimension: '按重量', currency: 'RMB', value: 0, min: 180, max: 280, note: '' },
      leadTime: { type: 'range', value: 0, min: 5, max: 8, unit: '天', note: '' },
      description: '中部地区江海联运试点，已下架调整中。',
    },
    paths: [
      { id: 'p5-1', name: '主路径', segments: [
        { id: 's5-1', type: 'segment', mode: '水路', from: '武汉', to: '上海港', note: '长江段' },
      ]},
      { id: 'p5-2', name: '备用路径', segments: [
        { id: 's5-2', type: 'segment', mode: '公路', from: '武汉', to: '上海', note: '公路备用' },
      ]},
    ],
    schemes: [
      { id: 'TS2026-0505-1', name: '普货江海联运方案', pathName: '主路径', transportType: '多式联运', status: '停用', serviceSummary: '上门/末端/增值', priceSummary: '180-280 元/吨', leadTimeSummary: '5-8 天', carrierSummary: '1 家承运商', updatedAt: '2026-04-04 14:00' },
    ],
  },
  {
    id: 'TC2026-0606',
    name: '北方煤炭铁路通道',
    transportType: '铁路',
    businessDirection: '内贸',
    origin: '大同',
    destination: '天津港',
    bodyStatus: '草稿',
    publishStatus: '未发布',
    rejectReason: '', rejectTime: '',
    updatedAt: '2026-04-01 10:00',
    cargoTypes: ['散货'],
    containerTypes: [],
    serviceConfig: { pickup: false, lastMile: false, customs: false, valueAdded: false, storageTransfer: false },
    displayConfig: {
      price: { type: 'consult', billingDimension: '按重量', currency: 'RMB', value: 0, min: 0, max: 0, note: '' },
      leadTime: { type: 'pending', value: 0, min: 0, max: 0, unit: '天', note: '' },
      description: '煤炭外运通道，配置中。',
    },
    paths: [
      { id: 'p6-1', name: '主路径', segments: [
        { id: 's6-1', type: 'segment', mode: '铁路', from: '大同', to: '天津港', note: '' },
      ]},
    ],
    schemes: [],
  },
]

// idSeed（自增 TC2026-XXXX）
export const initialIdSeed = 7000
