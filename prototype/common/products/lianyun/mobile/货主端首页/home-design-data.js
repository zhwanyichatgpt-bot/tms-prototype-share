// Pixso 首页的独立本地示例，不代表实际货源、报价、资质或经营数据。
export const homeDesignCargoIds=['home-design-cargo-0','home-design-cargo-1']
export function createHomeDesignFixtures({ cargos, services, providers, makeChannel }) {
  const clone = value => JSON.parse(JSON.stringify(value))
  const register = (target, rows) => rows.map(row => {
    const old = target.find(item => item.id === row.id)
    if (old) return Object.assign(old, row)
    target.push(row)
    return row
  })
  const description = '华东整车运输、仓储中转与配送，支持单次发运及固定线路合作。'
  const providerBase = providers.find(item => item.id === 'supply-road') || providers[0]
  const companies = register(providers, ['启程供应链', '苏城干线物流', '大同运输物流有限公司'].map((name, i) => ({
    ...clone(providerBase), id: `home-design-company-${i}`, name, description, area:'华东', city:'苏州',
    verified:true, score:4.8, reviewCount:5, operatingStats:{completedOrders:345,volume:'5,345万吨'},
    // 评价内容沿用本地样例，数量为设计稿展示值。
    reviews: clone(providerBase.reviews || []),
  })))
  const cargoBase = cargos[0]
  const cargoRows = register(cargos, [0,1].map(i => ({
    ...clone(cargoBase), id:homeDesignCargoIds[i], number:`HY-MOCK-0814-${i+1}`, goods:'钢材', quantity:'23吨',
    origin:{city:'福州',district:'长乐区',name:'佳隆煤矿厂',address:'长乐区佳隆煤矿厂（示例）',xy:[119.52,25.96]},
    destination:{city:'无锡',district:'',name:'篱笆庄佳隆煤矿厂',address:'无锡市篱笆庄佳隆煤矿厂（示例）',xy:[120.3,31.57]},
    loadDate:'2026-08-14',unloadDate:'2026-08-14',loadWindow:'待确认',unloadWindow:'待确认',
    price:{amount:null,unit:'元/票',label:'货主发布价'},estimatedFreight:{min:3600,max:3600,unit:'元/票',basis:'设计稿示例估算，实际询价确认'},
    tags:['整车','需篷布','钢材·23吨'],routeId:null,fees:'装卸及额外费用待确认',payment:'待确认',deadline:'待确认',
    summary:'钢材运输示例，需篷布；实际装卸安排及费用请询价确认。',requirements:[['运输方式','公路运输'],['货物包装','待确认'],['车辆要求','待确认']],
    publisher:{...clone(cargoBase.publisher),name:companies[2].name,short:companies[2].name},publishLabel:'10分钟前发布',
    publishMode:i?'抢单':'报价',...(i?{grabAvailability:'open',grabEndsAt:'2026-11-10T18:00:00+08:00',deadline:'2026-11-10 18:00',loadDate:'2026-11-12',unloadDate:'2026-11-13',price:{amount:3600,unit:'元/票',label:'货主定价'},fixedPrice:{unitPrice:3600,quantity:1,unit:'票'},fees:'含全程运输费与篷布；装卸费由货主承担。',payment:'签收后7日内付款',summary:'按货主定价承接钢材运输，运输全程需篷布覆盖，发运前预约装卸。',requirements:[['运输方式','公路运输'],['车辆要求','9.6米平板车'],['货物包装','捆扎'],['运输要求','全程篷布覆盖']]}:{}),
  })))
  const baseService = services.find(item => item.id === 'road-sz-hz') || services[0]
  const baseChannel = makeChannel(baseService)
  const serviceRows = register(services, ['road','water','water','multi'].map((mode,i) => {
    const id = `home-design-service-${i}`
    const channel = clone(baseChannel)
    channel.id=id; channel.name='苏州 → 杭州运输通道'; channel.publisherId=companies[2].id
    channel.price='70–90元/吨';channel.duration='约2–3天';channel.cargoTypes=['普货']
    channel.capabilities={pickup:true,lastMile:false,warehouseTransfer:true,valueAdded:[],customs:[]}
    channel.paths.forEach((path,n) => {
      path.id=`${id}-path-${n+1}`
      path.name=n===0 ? ({road:'公路',water:'水路',multi:'公水联运'}[mode]+'直达路线') : '中转路线'
      path.segments.forEach(leg=>{leg.mode=mode==='multi'?'water':mode})
    })
    channel.schemes.forEach((scheme,n)=>{scheme.id=`${id}-scheme-${n+1}`;scheme.channelId=id;scheme.pathId=channel.paths[n===2?1:0].id;scheme.duration='约2–3天';scheme.services.lastMile=false})
    return {...clone(baseService),id,mode,from:'苏州',to:'杭州',originLabel:'苏州·相城区',destinationLabel:'杭州·萧山区',
      price:'70–90元/吨',duration:'约2–3天',providerId:companies[2].id,tags:['普货','支持上门','仓储中转'],
      homeArt:['road','water','rail','multi'][i],homeDesignChannel:channel}
  }))
  return {cargos:cargoRows,services:serviceRows,providers:[
    {key:'qicheng',company:companies[0],logo:'logo-qicheng.png',routes:3},
    {key:'sucheng',company:companies[1],logo:'logo-sucheng.png',routes:2},
    {key:'qicheng-green',company:companies[0],logo:'logo-qicheng-green.png',routes:3},
    {key:'qicheng-repeat',company:companies[0],logo:'logo-qicheng.png',routes:3},
  ]}
}
