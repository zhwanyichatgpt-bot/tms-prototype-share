// 以下均为原型演示数据，不代表实际报价、班期或企业认证。
export const tabs = [
  { key: 'home', label: '首页', icon: 'wap-home-o' },
  { key: 'cargo', label: '货源', icon: 'orders-o' },
  { key: 'ai', label: 'AI 助手', icon: 'service-o' },
  { key: 'analysis', label: '分析', icon: 'chart-trending-o' },
  { key: 'mine', label: '我的', icon: 'user-o' },
]

export const addresses = [
  { id: 'fuzhou', city: '福州市', district: '江上图首府叁号' },
  { id: 'wuhan', city: '武汉市', district: '东西湖区' },
  { id: 'guangzhou', city: '广州市', district: '黄埔区' },
  { id: 'suzhou', city: '苏州市', district: '昆山市' },
  { id: 'chengdu', city: '成都市', district: '青白江区' },
]

export const services = [
  { id: 'water', mode: '公水联运', coverage: '门到门', from: '武汉', to: '广州', load: '东西湖区', unload: '黄埔区', duration: '9–12', price: '3,600', unit: '20GP', frequency: '每周 2 班', cargo: '集装箱普货', containers: '20GP / 40GP', fee: '含两端接驳及干线运费，装卸另计', company: '江海通联物流', initial: '江', tone: 'blue' },
  { id: 'rail', mode: '公铁联运', coverage: '门到站', from: '苏州', to: '成都', load: '昆山市', unload: '成都国际铁路港', duration: '4–6', price: '4,800', unit: '40GP', frequency: '每周 4 班', cargo: '集装箱普货', containers: '40GP', fee: '含上门提货及铁路运费，目的站自提', company: '华铁联程物流', initial: '铁', tone: 'teal' },
]
