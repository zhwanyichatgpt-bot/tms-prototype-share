import { serviceRoute } from './service-routes.js'
import { homeCargoScenarios, homeFreightEstimates } from './home-supply-scenes.js'

// 本次设计评审的货源场景，仅用于本机验证，不代表真实发布、价格或资质。
export const cargoModes = [{ key: 'all', label: '全部' }, { key: 'road', label: '公路' }, { key: 'water', label: '水路' }, { key: 'rail', label: '铁路' }, { key: 'multi', label: '联运' }]
const baseCargos = [
  {
    id: 'cargo-steel', number: 'HY202610090001', mode: 'road', category: '钢材', goods: '钢材', quantity: '32吨',
    origin: { city: '苏州', district: '相城区', name: '钢材仓储园', address: '黄埭镇钢材仓储园', xy: [120.55, 31.45] },
    destination: { city: '杭州', district: '萧山区', name: '收货仓', address: '经济技术开发区收货仓', xy: [120.28, 30.24] },
    loadDate: '2026-10-12', unloadDate: '2026-10-13', loadWindow: '08:00—12:00', unloadWindow: '18:00前',
    price: { amount: 3840, unit: '元/票', label: '运输总价' }, coverage: '门到门', tags: ['钢材·32吨', '整车', '门到门', '需篷布'],
    summary: '厂内装货，收货方卸货；运输全程需防雨。',
    requirements: [['运输方式', '公路运输'], ['车辆要求', '9.6米平板车'], ['货物包装', '捆扎'], ['最长尺寸', '6米']],
    deadline: '2026-10-11 18:00', fees: '含运输费，装卸费另计', payment: '签收后7日内付款',
    publisher: { name: '华东钢材贸易有限公司', short: '华东钢材贸易', verified: true, score: 4.8, contact: '陈经理', phone: '138****3211', area: '华东地区', business: '钢材贸易与运输委托' },
    publishedAt: '2026-10-09 09:00', publishLabel: '10分钟前发布', routeId: 'road-sz-hz'
  },
  {
    id: 'cargo-container', number: 'HY202610090002', mode: 'multi', category: '集装箱普货', goods: '集装箱普货', quantity: '4×40GP',
    origin: { city: '重庆', district: '江北区', name: '制造园', address: '江北区制造园提箱交接点', xy: [106.55, 29.6] },
    destination: { city: '广州', district: '黄埔区', name: '交付仓', address: '黄埔区交付仓', xy: [113.48, 23.1] },
    loadDate: '2026-10-12', unloadDate: '2026-10-14', loadWindow: '预约交接', unloadWindow: '预约卸货',
    price: { amount: null, unit: '元/箱', label: '运费' }, coverage: '门到门', tags: ['普货·4×40GP', '联运优先', '门到门', '接受方案'],
    summary: '需组织提箱、干线运输及目的地配送，接受承运企业提出联运方案。',
    requirements: [['运输方式', '联运优先，接受方案建议'], ['箱型箱量', '4×40GP'], ['装载条件', '单箱重量、尺寸需核对'], ['中转安排', '由承运方提出']],
    deadline: '2026-10-11 18:00', fees: '请分别说明提箱、干线及配送费用', payment: '报价时协商确认',
    publisher: { name: '渝川制造有限公司', short: '渝川制造', verified: true, score: 4.9, contact: '李经理', phone: '139****6528', area: '重庆、广州', business: '制造业货物运输委托' },
    publishedAt: '2026-10-09 08:40', publishLabel: '30分钟前发布'
  },
  {
    id: 'cargo-grain', number: 'HY202610090003', mode: 'water', category: '粮食', goods: '粮食', quantity: '1000吨',
    origin: { city: '武汉', district: '阳逻港', name: '', address: '武汉阳逻港约定装船点', xy: [114.59, 30.66] },
    destination: { city: '上海', district: '罗泾港', name: '', address: '上海罗泾港约定卸船点', xy: [121.49, 31.49] },
    loadDate: '2026-10-15', unloadDate: '2026-10-19', loadWindow: '预约装船', unloadWindow: '预约卸船',
    price: { amount: 45, unit: '元/吨', label: '按吨计价' }, coverage: '港到港', tags: ['粮食·1000吨', '水路', '港到港', '需防潮'],
    summary: '支持分批装运，需做好防潮措施，请报价注明装卸及其他费用范围。',
    requirements: [['运输方式', '水路运输'], ['货物包装', '散装'], ['分批装运', '允许，需说明批次'], ['装卸安排', '由双方确认']],
    deadline: '2026-10-13 18:00', fees: '请注明运输、装卸及港口费用范围', payment: '报价时协商确认',
    publisher: { name: '江汉粮贸有限公司', short: '江汉粮贸', verified: true, score: 4.7, contact: '王经理', phone: '137****1096', area: '长江沿线', business: '粮食贸易与运输委托' },
    publishedAt: '2026-10-09 08:10', publishLabel: '1小时前发布', routeId: 'water-wh-sh'
  }
]
export const cargos = [...baseCargos, ...homeCargoScenarios.map(scene => ({
  ...baseCargos[0], id:scene.id, number:scene.number, mode:scene.mode, category:scene.cargo, goods:scene.cargo, quantity:scene.quantity,
  origin:{city:'苏州',district:scene.mode==='water'?'太仓港':scene.mode==='rail'?'指定铁路场站':scene.key==='nj'?'工业园区':'吴中区',name:'',address:scene.originLabel,xy:scene.path[0]},
  destination:{city:scene.to,district:scene.district,name:'',address:scene.destinationLabel,xy:scene.xy},
  loadDate:scene.loadDate,unloadDate:scene.unloadDate,loadWindow:'预约交接',unloadWindow:'预约交接',
  price:{amount:scene.amount,unit:scene.mode==='road'?'元/票':'元/箱',label:scene.mode==='road'?'运输总价':'按箱计价'},
  coverage:scene.coverage,tags:[`${scene.cargo}·${scene.quantity}`,scene.condition,scene.coverage],
  summary:`需安排苏州至${scene.to}的运输，发运前核对货量、包装和交接条件。`,
  requirements:[['运输方式',scene.mode==='road'?'公路运输':scene.mode==='water'?'水路运输':'铁路运输'],['运输条件',scene.condition],['交付范围',scene.coverage],['交接安排','预约确认']],
  deadline:'2026-10-11 18:00',fees:scene.mode==='road'?'运输费按票计，装卸费另计':'单箱参考价，两端接驳与装卸费用另询',
  publisher:{...baseCargos[0].publisher,name:scene.publisherName,short:scene.publisherName.replace('有限公司',''),area:'苏州',business:`${scene.cargo}运输委托`},
  publishLabel:'今天发布',routeId:scene.routeId,matchScore:scene.matchScore,
}))].map(cargo => ({ ...cargo, estimatedFreight: homeFreightEstimates[cargo.id] }))
export const dateLabel = date => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
export const placeLabel = place => `${place.city}·${place.district}${place.name}`
export const cargoPrice = cargo => cargo.price.amount == null ? '邀约报价' : `¥${cargo.price.amount.toLocaleString('zh-CN')}${cargo.price.unit === '元/吨' ? '/吨' : cargo.price.unit === '元/箱' ? '/箱' : ''}`
export const estimatedCargoPrice = cargo => cargo.estimatedFreight ? `¥${cargo.estimatedFreight.min.toLocaleString('zh-CN')}–${cargo.estimatedFreight.max.toLocaleString('zh-CN')}` : '待询价'
export function cargoRoute(cargo) {
  if (!cargo.routeId) return { id: cargo.id, name: `${cargo.origin.city} → ${cargo.destination.city}`, segments: [] }
  const route = serviceRoute({ id: cargo.routeId, originLabel: cargo.origin.city, destinationLabel: cargo.destination.city })
  return { ...route, segments: route.segments.map((leg, index, list) => ({ ...leg, from: index === 0 ? `${cargo.origin.city}·${cargo.origin.district}` : leg.from, to: index === list.length - 1 ? `${cargo.destination.city}·${cargo.destination.district}` : leg.to, path: leg.path.map((xy, n) => index === 0 && n === 0 ? cargo.origin.xy : index === list.length - 1 && n === leg.path.length - 1 ? cargo.destination.xy : xy) })) }
}
