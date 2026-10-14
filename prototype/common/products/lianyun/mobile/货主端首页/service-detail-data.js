// Web 字段对齐用的本地 Mock；各能力独立登记，不由运输方式或中转节点推断。
// 发布企业与承运企业在这些场景中相同，不代表正式业务必须相同。
const rows = [
  ['road-wh-cs','road-co',false,true,true,['免费到货通知'],[],'2026-10-08 09:30'],
  ['water-wh-sh','water-co',false,false,false,['免费到货通知'],[],'2026-10-08 10:00'],
  ['rail-wh-cd','rail-co',false,false,false,['保价服务','免费到货通知'],[],'2026-10-08 10:30'],
  ['air-a-b','air-co',false,false,false,[],[],'2026-10-08 11:00'],
  ['multi-wh-gz','multi-co',true,true,true,['保价服务','免费到货通知'],[],'2026-10-08 11:30'],
  ['multi-cd-wh-gz','integrated-co',true,true,true,['代收货款','保价服务','免费到货通知','定日达','定时达'],['进口报关','出口报关'],'2026-10-09 09:00'],
  ['multi-cd-sh','integrated-co',true,true,true,['保价服务','免费到货通知'],[],'2026-10-09 09:30'],
  ['multi-wh-qz-gz','integrated-co',true,true,true,['免费到货通知'],['出口报关'],'2026-10-09 10:00'],
  ['road-sz-hz','supply-road',true,true,true,['代收货款','保价服务','免费到货通知','定日达','定时达'],[],'2026-10-09 10:30'],
  ['multi-cq-sh','supply-multi',true,true,true,['保价服务','免费到货通知'],[],'2026-10-09 11:00'],
  ['home-service-nj','home-provider-nj',false,true,true,['保价服务','免费到货通知'],[],'2026-10-09 11:30'],
  ['home-service-nb','home-provider-nb',false,true,true,['免费到货通知','定时达'],[],'2026-10-09 13:00'],
  ['home-service-sh','home-provider-sh',false,false,false,['免费到货通知'],['进口报关','出口报关'],'2026-10-09 13:30'],
  ['home-service-cd','home-provider-cd',false,false,false,['保价服务','免费到货通知'],[],'2026-10-09 14:00'],
]
export const serviceDetails = Object.fromEntries(rows.map(([id,publisherId,warehouseTransfer,pickup,lastMile,valueAdded,customs,publishedAt]) => [id,{
  transportType:'物流方案',publisherId,warehouseTransfer,pickup,lastMile,valueAdded,customs,publishedAt,
}]))
// 企业交易次数、发货量为独立的累计展示数据，不借用方案近30天成交或承运单数。
export const publisherStats = {
  'road-co':{transactions:1280,shipmentVolume:'3.2万吨'},
  'water-co':{transactions:860,shipmentVolume:'2.8万吨'},
  'rail-co':{transactions:920,shipmentVolume:'2.4万吨'},
  'air-co':{transactions:120,shipmentVolume:'6吨'},
  'multi-co':{transactions:360,shipmentVolume:'1.2万吨'},
  'integrated-co':{transactions:2000,shipmentVolume:'10万吨'},
  'supply-road':{transactions:1680,shipmentVolume:'1万吨'},
  'supply-multi':{transactions:240,shipmentVolume:'860箱'},
  'home-provider-nj':{transactions:480,shipmentVolume:'1万吨'},
  'home-provider-nb':{transactions:650,shipmentVolume:'2万吨'},
  'home-provider-sh':{transactions:820,shipmentVolume:'620箱'},
  'home-provider-cd':{transactions:960,shipmentVolume:'740箱'},
}
export const booleanLabel = (value, yes='是', no='否') => value===true?yes:value===false?no:'未提供'
export const servicesLabel = value => Array.isArray(value)?value.length?value.join('、'):'无':'未提供'
