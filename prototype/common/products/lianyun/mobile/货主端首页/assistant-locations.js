// 地点库用于选择与对话解析，坐标为规划参考位置。
export const locations = [
  {id:'dalian',name:'大连市甘井子区',type:'region',region:['辽宁省','大连市','甘井子区'],xy:[121.53,38.95]},
  {id:'wuhan-hs',name:'武汉市洪山区',type:'region',region:['湖北省','武汉市','洪山区'],xy:[114.35,30.50]},
  {id:'wuhan-dxh',name:'武汉市东西湖区',type:'region',region:['湖北省','武汉市','东西湖区'],xy:[114.08,30.67]},
  {id:'changsha',name:'长沙县',type:'region',region:['湖南省','长沙市','长沙县'],xy:[113.08,28.25]},
  {id:'shanghai',name:'上海市宝山区',type:'region',region:['上海市','上海市','宝山区'],xy:[121.49,31.4]},
  {id:'chengdu',name:'成都市青白江区',type:'region',region:['四川省','成都市','青白江区'],xy:[104.26,30.89]},
  {id:'guangzhou',name:'广州市黄埔区',type:'region',region:['广东省','广州市','黄埔区'],xy:[113.48,23.18]},
  {id:'kunming',name:'昆明市五华区',type:'region',region:['云南省','昆明市','五华区'],xy:[102.71,25.04]},
  {id:'lhasa',name:'拉萨市城关区',type:'region',region:['西藏自治区','拉萨市','城关区'],xy:[91.13,29.65]},
  {id:'yangluo',name:'武汉阳逻港',type:'port',region:['湖北省','武汉市','阳逻港'],xy:[114.59,30.66]},
  {id:'sh-port',name:'上海港',type:'port',region:['上海市','上海市','上海港'],xy:[121.7,31.4]},
  {id:'ningbo',name:'宁波舟山港',type:'port',region:['浙江省','宁波市','宁波舟山港'],xy:[121.85,29.93]},
  {id:'wh-rail',name:'武汉吴家山铁路场站',type:'port',region:['湖北省','武汉市','吴家山铁路场站'],xy:[114.08,30.67]},
  {id:'cs-rail',name:'长沙铁路货运场站',type:'port',region:['湖南省','长沙市','铁路货运场站'],xy:[113.02,28.22]},
  {id:'islamabad',name:'巴基斯坦伊斯兰堡',type:'overseas',region:['巴基斯坦','伊斯兰堡','伊斯兰堡城区'],xy:[73.05,33.69]},
  {id:'karachi',name:'巴基斯坦卡拉奇港',type:'overseas',region:['巴基斯坦','卡拉奇','卡拉奇港'],xy:[66.99,24.8]},
  {id:'wh-east',name:'武汉市东湖高新区',type:'region',region:['湖北省','武汉市','东湖高新区'],xy:[114.44,30.46]},
  {id:'wh-air-a',name:'光谷配送服务点',type:'port',region:['湖北省','武汉市','光谷配送服务点'],xy:[114.44,30.46]},
  {id:'wh-air-b',name:'未来科技城配送服务点',type:'port',region:['湖北省','武汉市','未来科技城配送服务点'],xy:[114.54,30.48]},
  {id:'duisburg',name:'德国杜伊斯堡物流节点',type:'overseas',region:['德国','杜伊斯堡','杜伊斯堡物流节点'],xy:[6.76,51.43]},
  {id:'rotterdam',name:'荷兰鹿特丹港',type:'overseas',region:['荷兰','鹿特丹','鹿特丹港'],xy:[4.48,51.9]},
  {id:'yangon',name:'缅甸仰光物流节点',type:'overseas',region:['缅甸','仰光','仰光物流节点'],xy:[96.16,16.84]},
]
export function resolveLocation(name) {
  const exact=locations.find(item=>item.name===name)
  if(exact) return exact
  const matches=locations.filter(item=>item.name.includes(name) || name.includes(item.name))
  return matches.length===1 ? matches[0] : null
}
