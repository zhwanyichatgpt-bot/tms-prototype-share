// 首页评审使用的本地 Mock 场景；企业、价格、路线与匹配度均非生产数据。
const scenes = [
  { key:'nj', name:'苏城干线物流', to:'南京', district:'江宁区', mode:'road', specialty:'公路整车 · 工业品运输', cargo:'机械设备', quantity:'18吨', price:'95元/吨', amount:1710, matchScore:92, duration:'约1天', path:[[120.59,31.3],[120.3,31.56],[119.6,31.75],[118.84,31.94]], coverage:'门到门', condition:'9.6米厢式车', originLabel:'苏州·工业园区', destinationLabel:'南京·江宁区', xy:[118.84,31.94], minimum:'5吨起运' },
  { key:'nb', name:'华东公路运输', to:'宁波', district:'北仑区', mode:'road', specialty:'公路整车 · 包装普货', cargo:'包装纸品', quantity:'26吨', price:'110元/吨', amount:2860, matchScore:90, duration:'约1–2天', path:[[120.59,31.3],[120.7,30.75],[121.1,30.3],[121.85,29.9]], coverage:'门到门', condition:'13米厢式车', originLabel:'苏州·吴中区', destinationLabel:'宁波·北仑区', xy:[121.85,29.9], minimum:'10吨起运' },
  { key:'sh', name:'太仓江海物流', to:'上海', district:'洋山港', mode:'water', specialty:'水路集装箱 · 港口运输', cargo:'集装箱普货', quantity:'6×40GP', price:'1200元/箱', amount:1200, matchScore:88, duration:'约2–3天', path:[[121.15,31.55],[121.55,31.45],[122.05,30.63]], coverage:'港到港', condition:'40GP集装箱', originLabel:'苏州·太仓港', destinationLabel:'上海·洋山港', xy:[122.05,30.63], minimum:'1箱起运' },
  { key:'cd', name:'苏州铁联供应链', to:'成都', district:'青白江区', mode:'rail', specialty:'铁路集装箱 · 场站服务', cargo:'汽车配件', quantity:'3×40GP', price:'5600元/箱', amount:5600, matchScore:86, duration:'约4–6天', path:[[120.68,31.36],[117.28,31.86],[114.3,30.6],[108.9,32.7],[104.25,30.88]], coverage:'站到站', condition:'40GP集装箱', originLabel:'苏州指定铁路场站', destinationLabel:'成都指定铁路场站', xy:[104.25,30.88], minimum:'1箱起运' },
]
const modeNames = {road:'公路运输',water:'水路运输',rail:'铁路运输'}
export const homeProviders = scenes.map((scene,index) => ({
  id:`home-provider-${scene.key}`, name:scene.name, city:'苏州', mode:scene.mode, transportModes:[scene.mode],
  area:`苏州 → ${scene.to}`, specialty:scene.specialty,
  capabilities:scene.mode==='road'?['预约提货','交付跟踪']:scene.mode==='water'?['港区交接','船期协调']:['场站交接','班列协调'],
  cooperation:'单次运输／固定线路合作', verified:true,
  description:`承接苏州至${scene.to}的${modeNames[scene.mode]}，发运条件及费用范围按货物和交接要求确认。`,
  operatingStats:{completedOrders:560+index*230,volume:scene.mode==='road'?`${1+index}万吨`:`${380+index*120}箱`},
  score:4.8,reviewCount:5,
  reviews:[5,5,5,5,4].map((score,n)=>({id:`home-review-${scene.key}-${n}`,date:`2026-10-0${6-n}`,business:`苏州 → ${scene.to} · ${modeNames[scene.mode]}`,score,text:n===4?'运输顺利，交接安排可以再提前确认。':'发运前核对了交接条件，运输进展反馈及时。',reply:''})),
}))
export const homeServices = scenes.map(scene => ({
  id:`home-service-${scene.key}`,providerId:`home-provider-${scene.key}`,mode:scene.mode,
  from:'苏州',to:scene.to,fromId:'suzhou',toId:scene.key,originLabel:scene.originLabel,destinationLabel:scene.destinationLabel,
  cargo:scene.cargo,condition:scene.condition,coverage:scene.coverage,price:scene.price,minimumShipment:scene.minimum,
  recentOrders:12+scenes.indexOf(scene)*5,duration:scene.duration,durationBasis:'从约定交接完成时间起算',
  feeBoundary:scene.mode==='road'?'装卸、等待等费用另行约定':'两端接驳、装卸及场站费用另询',
  inquiryLabel:'按货量、发运时间及交接条件询价',tags:[scene.coverage],
  summary:`${modeNames[scene.mode]}连接苏州与${scene.to}，适用于${scene.cargo}。`,
  segments:[scene.originLabel,modeNames[scene.mode],scene.destinationLabel],
  scope:scene.mode==='road'?'提供约定装卸点之间的运输；装卸和等待费用另行约定。':`仅覆盖指定${scene.mode==='water'?'港区':'场站'}之间的运输，不默认包含两端接驳。`,
}))
export const homeRoutes = Object.fromEntries(scenes.map(scene=>[`home-service-${scene.key}`,{km:'里程待确认',segments:[{from:scene.originLabel,to:scene.destinationLabel,mode:scene.mode,path:scene.path,duration:scene.duration}]}]))
export const homeCargoScenarios = scenes.map((scene,index)=>({
  ...scene,id:`cargo-home-${scene.key}`,number:`HY20261009000${index+4}`,routeId:`home-service-${scene.key}`,
  loadDate:index<2?'2026-10-12':'2026-10-13',unloadDate:index<2?'2026-10-14':index===2?'2026-10-16':'2026-10-19',
  publisherName:['苏州精工设备有限公司','吴中包装制品有限公司','太仓外贸供应链有限公司','苏州汽配制造有限公司'][index],
}))

// 预计运价与货主发布价独立保存；区间仅供原型评审。
export const homeFreightEstimates = {
  'cargo-steel': { min:3600, max:4200, unit:'元/票' },
  'cargo-home-nj': { min:1500, max:1900, unit:'元/票' },
  'cargo-home-nb': { min:2600, max:3200, unit:'元/票' },
  'cargo-home-sh': { min:1000, max:1400, unit:'元/箱' },
  'cargo-home-cd': { min:5200, max:6000, unit:'元/箱' },
  'cargo-grain': { min:40, max:50, unit:'元/吨' },
}
