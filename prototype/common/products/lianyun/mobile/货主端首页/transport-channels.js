import { serviceRoute } from './service-routes.js'
import { serviceDetails } from './service-detail-data.js'

// 本地场景用于验证 Web 的通道→路线→经营方案关系；不代表真实在售方案或报价。
// 保留原服务 ID 作为通道 ID，兼容收藏、企业供给与已保存的需求入口。
const segment=(from,to,mode,path,duration)=>({from,to,mode,path,duration})
const alternatePaths={
 'road-sz-hz':{name:'湖州中转路线',km:'约210 km',segments:[
  segment('苏州·相城区','湖州中转中心','road',[[120.59,31.3],[120.43,31.04],[120.1,30.87]],'约1天'),
  segment('湖州中转中心','杭州·萧山区','road',[[120.1,30.87],[120.13,30.56],[120.15,30.27]],'约1天'),
 ],duration:'约2–3天',price:'70元/吨'},
 'multi-cd-wh-gz':{name:'公铁联运路线',km:'约2,100 km',segments:[
  segment('成都·新都','成都城厢站','road',[[104.15,30.82],[104.34,30.89]],'约0.5天'),
  segment('成都城厢站','广州铁路办理站','rail',[[104.34,30.89],[106.54,29.57],[108.32,22.84],[110.32,25.3],[113.2,23.3]],'约5–7天'),
  segment('广州铁路办理站','广州·黄埔','road',[[113.2,23.3],[113.48,23.1]],'约0.5天'),
 ],duration:'约6–8天',price:'面议'},
}
// 适运货类为通道独立配置，不从车辆、箱型或货名推定业务能力。
const cargoTypesByChannel={
 'road-wh-cs':['普货'],'water-wh-sh':['集装箱货'],'rail-wh-cd':['集装箱货'],'air-a-b':['普货'],
 'multi-wh-gz':['集装箱货'],'multi-cd-wh-gz':['集装箱货'],'multi-cd-sh':['集装箱货'],'multi-wh-qz-gz':['集装箱货'],
 'road-sz-hz':['普货'],'multi-cq-sh':['集装箱货'],'home-service-nj':['普货','大件货'],'home-service-nb':['普货'],
 'home-service-sh':['集装箱货'],'home-service-cd':['集装箱货'],
}
const channelDisplay={'road-sz-hz':{price:'70–80元/吨',duration:'约1–3天'},'multi-cd-wh-gz':{price:'面议',duration:'约6–15天'}}
const modeNames={road:'公路',water:'水路',rail:'铁路',air:'低空'}
export function routeModeLabel(route){
 const modes=[...new Set((route.segments||[]).map(item=>item.mode))]
 return modes.map(mode=>modeNames[mode]||mode).join(' + ')
}
function referencePrice(value){return !value || /询价|确认|面议/.test(value)?'面议':value}
export function transportChannel(service){
 const details=serviceDetails[service.id]||{}
 const source=serviceRoute(service)
 const path={...source,id:service.id+'-path-1',name:routeModeLabel(source)+(source.segments?.length>1?'衔接路线':'直达路线')}
 const capabilities={pickup:details.pickup===true,lastMile:details.lastMile===true,warehouseTransfer:details.warehouseTransfer===true,valueAdded:details.valueAdded||[],customs:details.customs||[]}
 const time=service.duration && !/询价|确认/.test(service.duration)?service.duration:'待确认'
 const price=referencePrice(service.price)
 const basic={...capabilities,warehouseTransfer:false,valueAdded:[],customs:[]}
 const hasExtras=capabilities.warehouseTransfer||capabilities.valueAdded.length||capabilities.customs.length
 const name=service.from+' → '+service.to+'运输通道'
 const scheme=(suffix,name,path,services,price,duration)=>({id:service.id+'-scheme-'+suffix,channelId:service.id,pathId:path.id,name,services,price,duration,quoteMode:'整段'})
 const schemes=[
  scheme('standard','标准运输方案',path,basic,price,time),
  scheme('extended',hasExtras?'增值服务方案':'预约运输方案',path,capabilities,'面议',hasExtras?time:'按预约时间确认'),
 ]
 const paths=[path]
 if(alternatePaths[service.id]){
  const alternate={...alternatePaths[service.id],id:service.id+'-path-2'}
  paths.push(alternate)
  schemes.push(scheme('alternative',alternate.name.replace('路线','方案'),alternate,basic,alternate.price,alternate.duration))
 }
 return {id:service.id,name,capabilities,paths,schemes,price:channelDisplay[service.id]?.price||price,duration:channelDisplay[service.id]?.duration||time,cargoTypes:cargoTypesByChannel[service.id]||[],description:`提供${service.from}至${service.to}运输，可选择具体经营方案。`,publisherId:details.publisherId||service.providerId,publishedAt:details.publishedAt}
}
export function channelCapabilityLabels(capabilities){
 return [[capabilities.pickup,'支持上门'],[capabilities.lastMile,'支持末端'],[capabilities.warehouseTransfer,'仓储中转'],[capabilities.valueAdded.length,'增值服务'],[capabilities.customs.length,'通关服务']].filter(([supported])=>supported).map(([,label])=>label)
}
export function transportInquiry(service,channel,scheme){
 const path=channel.paths.find(item=>item.id===scheme.pathId)
 // 保存选择时的快照，不让后续方案调整改写用户已保存的询价内容。
 return {...service,channelId:channel.id,channelName:channel.name,schemeId:scheme.id,schemeName:scheme.name,pathId:path.id,pathName:path.name,schemeSnapshot:JSON.parse(JSON.stringify({...scheme,path}))}
}

// 本地推荐按相同方向或运输方式筛选，排除当前通道；不新增业务字段。
export function relatedTransportChannels(service,candidates,limit=3){
 const score=item=>(item.from===service.from?4:0)+(item.to===service.to?4:0)+(item.mode===service.mode?2:0)
 return candidates.filter(item=>item.id!==service.id&&score(item)>0).sort((a,b)=>score(b)-score(a)).slice(0,limit)
}
