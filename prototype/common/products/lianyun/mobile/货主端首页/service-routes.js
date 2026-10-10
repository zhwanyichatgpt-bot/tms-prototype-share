// 首页方案的场景路径，仅用于体验验证，不代表实时导航或已确认运力。
import { extraSchemes } from './assistant-scenarios.js'
import { intermodalRoutes } from './intermodal-service-scenarios.js'
import { homeRoutes } from './home-supply-scenes.js'
const leg=(from,to,mode,path,duration)=>({from,to,mode,path,duration})
const road=leg('武汉·东西湖','长沙·长沙县','road',[[114.14,30.62],[114.02,30.3],[113.9,29.7],[113.15,29.37],[113.08,28.25]],'约1–2天')
const water=extraSchemes.find(item=>item.id==='river-shanghai').segments[0]
const routes={
 'road-sz-hz':{km:'约160 km',segments:[leg('苏州·相城区','杭州·萧山区','road',[[120.59,31.3],[120.63,31.12],[120.67,30.85],[120.55,30.64],[120.32,30.42],[120.15,30.27]],'约1–2天')]},
 'multi-cq-sh':{km:'里程询价确认',segments:[
 leg('重庆·江北区提货点','重庆果园港','road',[[106.55,29.57],[106.65,29.61],[106.77,29.63]],'接驳待确认'),
 leg('重庆果园港','上海港','water',[[106.77,29.63],[107.39,29.7],[108.4,30.8],[109.48,31.02],[110.85,30.85],[111.3,30.7],[112.24,30.33],[113.05,29.62],[114.3,30.58],[114.88,30.46],[115.2,29.85],[116,29.72],[117.05,30.52],[117.75,30.92],[118.38,31.33],[118.75,32.08],[119.44,32.23],[120.28,31.95],[121.1,31.78],[121.7,31.4]],'干线时效待确认'),
 leg('上海港','上海·宝山区交付点','road',[[121.7,31.4],[121.53,31.35],[121.48,31.3]],'配送待确认')
 ]},
 ...intermodalRoutes,
 ...homeRoutes,
 'road-wh-cs':{km:'约350 km',segments:[road]},
 'water-wh-sh':{km:'约1,100 km',segments:[{...water,duration:'时效待确认'}]},
 'rail-wh-cd':{km:'约1,200 km',segments:[leg('武汉指定场站','成都指定场站','rail',[[114.25,30.7],[112.13,32.04],[109.49,32.69],[107.51,31.21],[104.08,30.8]],'约4–6天')]},
 'air-a-b':{km:'约12 km',segments:extraSchemes.find(item=>item.id==='local-air').segments.map(item=>({...item,duration:'时效待确认'}))},
 'multi-wh-gz':{km:'里程待确认',segments:[
 leg('武汉·东西湖','武汉阳逻港','road',[[114.14,30.62],[114.59,30.66]],'接驳时效待确认'),
 leg('武汉阳逻港','广州港','water',[[114.59,30.66],[115.6,29.9],[117.1,30.1],[118.8,32.05],[121.7,31.4],[122.6,29.7],[120.6,26.7],[118.5,24.3],[115,22.4],[113.68,22.68]],'含内河及沿海运输，衔接待确认'),
 leg('广州港','广州·黄埔','road',[[113.68,22.68],[113.48,23.1]],'配送时效待确认')
 ]}
}
export function serviceRoute(service){return {...routes[service.id],id:service.id,name:service.originLabel+' → '+service.destinationLabel}}

// 仅说明方案中的方式衔接，不推定吊装、装拆箱或具体作业能力。
export function transferDescription(incoming, outgoing) {
 const names={road:'公路',rail:'铁路',water:'水路',air:'低空'}
 if(!incoming || !outgoing)return ''
 return incoming===outgoing ? (names[incoming]||incoming)+'中转' : (names[incoming]||incoming)+'转'+(names[outgoing]||outgoing)
}
