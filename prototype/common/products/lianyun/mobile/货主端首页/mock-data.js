// 本页均为本地演示数据，不代表实际覆盖、报价、运输状态或企业资质。
import { intermodalProviders, intermodalServices } from './intermodal-service-scenarios.js'
import { platformProviders, platformServices } from './platform-data.js'
import { homeProviders, homeServices } from './home-supply-scenes.js'
export const tabs = [
  { key: 'home', label: '首页', icon: 'wap-home-o' },
  { key: 'analysis', label: '分析', icon: 'chart-trending-o' },
  { key: 'ai', label: 'AI 助手', icon: 'service-o' },
  { key: 'app', label: '应用', icon: 'apps-o' },
  { key: 'mine', label: '我的', icon: 'user-o' },
]
export const modes = [
  { key: 'road', label: '公路运输', short: '公路', color: '#3a65ff' },
  { key: 'water', label: '水路运输', short: '水路', color: '#179eaa' },
  { key: 'rail', label: '铁路运输', short: '铁路', color: '#8262cf' },
  { key: 'air', label: '低空运输', short: '低空', color: '#329fc8' },
  { key: 'multi', label: '多式联运', short: '多式联运', color: '#547fe5' },
]
export const queryTabs = [
  { key: 'plan', label: '查方案' }, { key: 'track', label: '查运输' }, { key: 'ask', label: '问问题' },
]
export const addresses = [
  { id: 'wuhan', city: '武汉市', district: '东西湖区' },
  { id: 'changsha', city: '长沙市', district: '长沙县' },
  { id: 'shanghai', city: '上海市', district: '宝山区' },
  { id: 'chengdu', city: '成都市', district: '青白江区' },
  { id: 'guangzhou', city: '广州市', district: '黄埔区' },
  { id: 'park-a', city: '光谷配送服务点', district: '指定起降点' },
  { id: 'park-b', city: '未来科技城配送服务点', district: '指定起降点' },
]
const providerFacts = {
  'road-co': { cooperation: '单次发运／固定线路持续合作', score: 4.8, reviewCount: 126, reviews: [
    { id: 'r1', date: '2026-09-26', business: '武汉 → 长沙 · 公路整车', score: 5, text: '装货前确认了车型和装卸要求，到货后及时反馈交付情况。', reply: '感谢反馈，后续固定线路需求可提前沟通。' },
    { id: 'r2', date: '2026-09-20', business: '湖北 → 湖南 · 托盘普货', score: 4, text: '运输沟通及时，临时调整收货时间时进行了协调。', reply: '' },
  ] },
  'water-co': { cooperation: '单次集装箱运输／持续发运', score: 4.6, reviewCount: 48, reviews: [
    { id: 'w1', date: '2026-09-22', business: '武汉港 → 上海港 · 集装箱', score: 5, text: '询价时说明了港到港范围和接驳另计项目。', reply: '' },
  ] },
  'rail-co': { cooperation: '单次发运／固定方向持续合作', score: 4.7, reviewCount: 62, reviews: [
    { id: 't1', date: '2026-09-18', business: '武汉 → 成都 · 铁路集装箱', score: 5, text: '交接前明确了指定场站和两端接驳的责任范围。', reply: '' },
  ] },
  'air-co': { cooperation: '指定服务点配送／园区持续合作', score: null, reviewCount: 0, reviews: [] },
  'multi-co': { cooperation: '单次全程运输／持续合作', score: 4.9, reviewCount: 3, reviews: [
    { id: 'm1', date: '2026-09-24', business: '武汉 → 广州 · 公水联运', score: 5, text: '两端接驳和干线运输统一协调，费用范围沟通清楚。', reply: '' },
  ] },
}
export const providers = [
  { id: 'road-co', name: '楚湘公路服务商', mode: 'road', area: '湖北 → 湖南', specialty: '整车普货 · 公路运输', capabilities: ['上门提货', '到货配送'], description: '承接武汉至长沙的整车普货运输，车型及装卸条件需结合货物确认。' },
  { id: 'water-co', name: '长江集装箱运输服务商', mode: 'water', area: '武汉港 → 上海港', specialty: '水路集装箱', capabilities: ['港到港运输', '接驳另询'], description: '提供港到港集装箱运输，工厂至港口及到港后的配送需另行确认。' },
  { id: 'rail-co', name: '中部铁路运输服务商', mode: 'rail', area: '武汉 → 成都', specialty: '铁路集装箱 · 40GP', capabilities: ['站到站运输', '接驳另询'], description: '承接指定铁路节点之间的集装箱运输，不默认包含两端公路接驳。' },
  { id: 'air-co', name: '光谷低空配送服务商', mode: 'air', area: '光谷配送服务点 → 未来科技城配送服务点', specialty: '小件配送 · 指定服务点', capabilities: ['指定起降点交接', '货物条件确认'], description: '仅支持指定服务点之间的小件配送；重量、尺寸和服务范围均需确认，不表示全国可飞。' },
  { id: 'multi-co', name: '江海联运服务商', mode: 'multi', area: '武汉 → 广州', specialty: '公水联运 · 集装箱', capabilities: ['两端接驳', '全程运输'], description: '提供公路接驳、水路干线及目的地配送的组合服务。' },
].concat(intermodalProviders, platformProviders, homeProviders).map(provider => ({ ...provider, transportModes: provider.mode === 'multi' ? ['road', 'water'] : [provider.mode], ...provider, ...providerFacts[provider.id] }))
const serviceFacts = {
  'road-wh-cs': { originLabel: '武汉·东西湖', destinationLabel: '长沙·长沙县', cargo: '托盘普货', feeBoundary: '装卸另行约定', duration: '约1–2天', durationBasis: '从约定装货完成时间起算', inquiryLabel: '按货物、车型与装卸要求询价' },
  'water-wh-sh': { originLabel: '武汉指定港区', destinationLabel: '上海指定港区', feeBoundary: '两端短驳、装卸另询', inquiryLabel: '按箱型、箱量及港区询价' },
  'rail-wh-cd': { originLabel: '武汉指定场站', destinationLabel: '成都指定场站', feeBoundary: '两端接驳另询', duration: '约4–6天', durationBasis: '从约定始发场站交接完成起算', inquiryLabel: '按箱型、箱量及场站询价' },
  'air-a-b': { originLabel: '光谷配送服务点', destinationLabel: '未来科技城配送服务点', feeBoundary: '服务范围与交接条件需确认', inquiryLabel: '按重量、尺寸及服务点询价' },
  'multi-wh-gz': { originLabel: '武汉·东西湖', destinationLabel: '广州·黄埔', feeBoundary: '装卸与附加费用另行约定', duration: '约9–12天', durationBasis: '从约定工厂提货完成起算', inquiryLabel: '按全程范围、箱型与箱量询价' },
}
export const services = [
  { id: 'road-wh-cs', mode: 'road', fromId: 'wuhan', toId: 'changsha', from: '武汉', to: '长沙', cargo: '整车普货', condition: '13米厢式车', coverage: '门到门', tags: ['门到门', '普货'], price: '面议', providerId: 'road-co', segments: ['武汉工厂提货', '公路干线运输', '长沙收货点交付'], scope: '包含提货至收货点的公路运输；装卸服务与费用按实际需求确认。' },
  { id: 'water-wh-sh', mode: 'water', fromId: 'wuhan', toId: 'shanghai', from: '武汉港', to: '上海港', cargo: '集装箱', condition: '20GP / 40GP', coverage: '港到港', tags: ['港到港', '接驳另询'], price: '面议', providerId: 'water-co', segments: ['武汉港交箱', '水路干线运输', '上海港交付'], scope: '仅覆盖港到港运输；集疏港短驳、装卸与其他费用需另行询价。' },
  { id: 'rail-wh-cd', mode: 'rail', fromId: 'wuhan', toId: 'chengdu', from: '武汉', to: '成都', cargo: '铁路集装箱', condition: '40GP', coverage: '站到站', tags: ['站到站', '接驳另询'], price: '面议', providerId: 'rail-co', segments: ['武汉指定铁路场站', '铁路干线运输', '成都指定铁路场站'], scope: '仅覆盖指定场站间运输，具体场站及两端接驳需由服务方确认。' },
  { id: 'air-a-b', mode: 'air', fromId: 'park-a', toId: 'park-b', from: '光谷配送服务点', to: '未来科技城配送服务点', cargo: '小件配送', condition: '重量与尺寸需确认', coverage: '指定起降点交接', tags: ['指定起降点交接'], price: '询价', providerId: 'air-co', segments: ['园区A指定点交货', '低空配送', '园区B指定点交付'], scope: '仅支持指定服务范围，不能外推为城市间长距离或任意地址配送。' },
  { id: 'multi-wh-gz', mode: 'multi', fromId: 'wuhan', toId: 'guangzhou', from: '武汉', to: '广州', cargo: '集装箱', condition: '公路接驳 + 水路干线', coverage: '门到门', tags: ['门到门', '两端接驳'], price: '面议', providerId: 'multi-co', segments: ['武汉工厂提货', '起运港接驳', '水路干线运输', '广州收货点配送'], scope: '展示两端公路接驳与水路干线组成的门到门服务，费用范围需询价确认。' },
].concat(intermodalServices, platformServices, homeServices).map(service => ({ ...service, ...serviceFacts[service.id] }))
export const networkNodes = [
  { id: 'wuhan', label: '武汉', x: 167, y: 99 },
  { id: 'changsha', label: '长沙', x: 158, y: 158 },
  { id: 'shanghai', label: '上海', x: 274, y: 86 },
  { id: 'chengdu', label: '成都', x: 63, y: 103 },
  { id: 'guangzhou', label: '广州', x: 206, y: 202 },
]
export const trackingExamples = [
  { number: 'LY20260930001', route: '武汉 → 长沙', status: '运输中', updated: '2026-09-30 10:20', events: [
    { time: '09-30 10:20', title: '车辆已驶离装货点', detail: '最近回传：武汉市。节点记录不代表实时定位。' },
    { time: '09-30 09:30', title: '装货完成', detail: '运输任务已完成装货确认。' },
    { time: '09-30 08:40', title: '车辆到达装货点', detail: '武汉市 · 东西湖区。' },
  ] },
]
