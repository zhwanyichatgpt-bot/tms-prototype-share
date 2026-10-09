// 城市中心仅用于原型筛选与地图定位，不作为逆地理编码结果或进场地址。
export const networkCities = [
  {name:'嘉兴',xy:[120.75,30.75]}, {name:'苏州',xy:[120.59,31.3]},
  {name:'杭州',xy:[120.15,30.27]}, {name:'上海',xy:[121.48,31.3]},
  {name:'重庆',xy:[106.55,29.57]}, {name:'武汉',xy:[114.3,30.58]},
  {name:'成都',xy:[104.08,30.67]}, {name:'长沙',xy:[113.08,28.25]},
  {name:'广州',xy:[113.48,23.1]},
]
export function distanceKm(a,b){
  const rad=value=>value*Math.PI/180
  const angle=Math.sin(rad(b[1]-a[1])/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(rad(b[0]-a[0])/2)**2
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,angle)))
}
export function pointBounds(points,minSpan=.8){
  const xs=points.map(point=>point[0]),ys=points.map(point=>point[1])
  const left=Math.min(...xs),right=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys)
  const padX=Math.max(minSpan,(right-left)*.12),padY=Math.max(minSpan*.75,(top-bottom)*.12)
  return [[left-padX,bottom-padY],[right+padX,top+padY]]
}
export function nodeType(place){
  if(place.kind==='warehouses')return {key:'warehouses',name:'仓储',color:'#16a783'}
  if(place.id.startsWith('station'))return {key:'stations',name:'场站',color:'#8262cf'}
  return {key:'ports',name:'港口',color:'#3a65ff'}
}
