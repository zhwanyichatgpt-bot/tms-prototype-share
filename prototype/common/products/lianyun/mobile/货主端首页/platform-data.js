// 平台服务与企业均为本地验证数据，不代表真实合作或可订资源。
export const serviceCategories = [
  { id: 'transport', name: '运输服务', icon: 'logistics' },
  { id: 'warehouse', name: '仓储中转', icon: 'shop-o' },
  { id: 'customs', name: '关务服务', icon: 'records-o' },
  { id: 'container', name: '集装箱服务', icon: 'bag-o' },
  { id: 'air', name: '低空配送', icon: 'guide-o' },
  { id: 'more', name: '更多服务', icon: 'apps-o' },
]
export const browsingRegions = ['全国', '苏州', '重庆', '上海', '武汉', '成都', '广州']
// 企业承运统计、方案近30天成交量、评分、认证状态和评价内容均为原型示例；评分汇总按下列五条示例评价计算。
export const platformProviders = [
  { id: 'supply-road', name: '启程供应链', mode: 'road', transportModes: ['road'], area: '华东', specialty: '公路整车 · 仓储配送', capabilities: ['提货配送', '仓配衔接'], cooperation: '单次运输／持续合作', description: '提供华东整车运输、仓储中转与配送，支持单次发运及固定线路合作。', city: '苏州', verified: true, operatingStats: { completedOrders: 2000, volume: '1万吨' }, score: 4.8, reviewCount: 5, reviews: [
    { id:'sr1', date:'2026-10-06', business:'苏州 → 杭州 · 公路整车', score:5, text:'装货前确认了车型和到货时间，交付反馈及时。', reply:'' },
    { id:'sr2', date:'2026-10-03', business:'苏州 → 杭州 · 托盘普货', score:5, text:'提货安排清楚，装卸要求提前做了沟通。', reply:'' },
    { id:'sr3', date:'2026-09-28', business:'华东 · 仓储中转', score:5, text:'入库和出库交接信息比较完整。', reply:'' },
    { id:'sr4', date:'2026-09-25', business:'苏州 → 杭州 · 整车配送', score:5, text:'收货时间变更后，及时协调了配送安排。', reply:'' },
    { id:'sr5', date:'2026-09-20', business:'苏州 → 杭州 · 公路整车', score:4, text:'运输顺利，等待费用确认还可以再提前一些。', reply:'后续会在发运前核对等待费用约定。' },
  ] },
  { id: 'supply-multi', name: '联达综合物流', mode: 'multi', transportModes: ['road', 'water'], area: '重庆、上海及关联线路', specialty: '集装箱运输 · 多式联运', capabilities: ['干线与接驳协同', '装拆箱服务'], cooperation: '单次发运／固定线路合作', description: '组织沿江集装箱运输与两端接驳，提供装拆箱及分段交接协同。', city: '重庆', verified: true, operatingStats: { completedOrders: 286, volume: '860箱' }, score: 4.6, reviewCount: 5, reviews: [
    { id:'sm1', date:'2026-10-05', business:'重庆 → 上海 · 公水联运', score:5, text:'接驳与干线的交接安排沟通清楚。', reply:'' },
    { id:'sm2', date:'2026-10-01', business:'重庆 → 上海 · 集装箱', score:5, text:'提前说明了交箱资料和码头办理要求。', reply:'' },
    { id:'sm3', date:'2026-09-27', business:'上海 · 装拆箱服务', score:5, text:'装拆箱和配送衔接顺利。', reply:'' },
    { id:'sm4', date:'2026-09-23', business:'重庆 → 上海 · 公水联运', score:4, text:'整体协调到位，希望船期变更能更早通知。', reply:'会在船期确认或调整后及时同步。' },
    { id:'sm5', date:'2026-09-18', business:'重庆 → 上海 · 集装箱', score:4, text:'运输完成顺利，附加费用沟通花了一些时间。', reply:'' },
  ] },
]
// 以下区县、运价和起运量用于原型场景展示，不代表真实报价或服务覆盖承诺。
export const platformServices = [
  { id: 'road-sz-hz', mode: 'road', from: '苏州', to: '杭州', fromId: 'suzhou', toId: 'hangzhou', originLabel: '苏州·相城区', destinationLabel: '杭州·萧山区', cargo: '托盘普货', condition: '整车运输', coverage: '门到门', price: '80元/吨', recentOrders: 23, minimumShipment: '10吨起运', summary: '适合批量托盘普货，整车运输连接苏杭两地。', providerId: 'supply-road', duration: '约1–2天', durationBasis: '从约定装货完成时间起算', feeBoundary: '装卸、等待等费用另行约定', inquiryLabel: '按货物、车型及装卸要求询价', recommendation: '提货与配送一并安排', tags: ['门到门'], segments: ['苏州提货', '公路运输', '杭州交付'], scope: '提供约定装卸地点之间的整车运输，10吨起运，按实际货量及车型确认总价。装卸和等待费用另行约定。' },
  { id: 'multi-cq-sh', mode: 'multi', from: '重庆', to: '上海', fromId: 'chongqing', toId: 'shanghai', originLabel: '重庆·江北区', destinationLabel: '上海·宝山区', cargo: '集装箱', condition: '公路接驳＋水路干线', coverage: '门到门', price: '面议', recentOrders: 12, summary: '以沿江水路为干线，组合两端公路接驳。', providerId: 'supply-multi', duration: '时效询价确认', feeBoundary: '码头操作、装卸及附加费用需核对', inquiryLabel: '按箱型、箱量与两端交接地点询价', recommendation: '可衔接两端接驳', tags: ['门到门', '两端接驳'], segments: ['重庆提货', '果园港交箱', '水路干线', '上海配送'], scope: '组合起运地接驳、沿江集装箱运输与目的地配送。由服务方确认各段承接主体及交接安排。' },
]
export const catalogOffers = [
  { id: 'wh-sz', category: 'warehouse', name: '常温仓储与中转分拨', city: '苏州', providerId: 'supply-road', tags: ['常温仓', '托盘普货', '中转分拨'], facts: [['服务位置', '苏州 · 相城区'], ['适存货物', '包装普货、托盘货物'], ['服务内容', '入库验收、临时存储、分拣出库'], ['计费方式', '按面积或托盘及存储周期询价']], note: '库位、存储周期及装卸安排需确认，不包含危化品和冷链货物。' },
  { id: 'wh-sh', category: 'warehouse', name: '集装箱拆箱与暂存', city: '上海', providerId: 'supply-multi', tags: ['拆箱暂存', '装卸衔接'], facts: [['服务位置', '上海 · 宝山'], ['适存货物', '集装箱普货'], ['服务内容', '拆箱、暂存及出库交接'], ['计费方式', '按箱量与存储时间询价']], note: '需提供货物清单、包装尺寸及到库计划，是否可承接以确认结果为准。' },
  { id: 'customs-sh', category: 'customs', name: '进出口关务咨询与申报', city: '上海', providerId: 'supply-multi', tags: ['上海口岸', '进出口'], facts: [['服务口岸', '上海口岸'], ['适用货物', '一般贸易普货'], ['办理事项', '资料核对、申报协同、进度反馈'], ['计费方式', '按票及办理事项询价']], note: '需核对贸易方式和商品信息；税费、查验等费用另行确认，不承诺通关时效。' },
  { id: 'box-cq', category: 'container', name: '集装箱租用与装拆箱', city: '重庆', providerId: 'supply-multi', tags: ['20GP / 40GP', '租箱', '装拆箱'], facts: [['服务地点', '重庆'], ['服务项目', '箱源咨询、租用与装拆箱'], ['所需信息', '箱型、数量、租期和交还箱地点'], ['计费方式', '按箱型、租期和作业项目询价']], note: '箱源、押金、交还箱要求及箱损责任需确认。' },
  { id: 'handling-sz', category: 'more', name: '装卸作业与短驳接送', city: '苏州', providerId: 'supply-road', tags: ['叉车装卸', '短驳'], facts: [['服务区域', '苏州市'], ['适用货物', '包装普货、托盘货物'], ['作业方式', '按场地与货物匹配人员、设备'], ['计费方式', '按作业量或接送距离询价']], note: '请说明单件重量、场地条件和是否需要设备，超限及特殊作业另行确认。' },
  { id: 'port-wh-dray', category: 'more', name: '阳逻港集装箱接送与交箱协同', city: '武汉', providerId: 'water-co', tags: ['港口接驳', '交箱协同'], facts: [['服务区域', '武汉 · 阳逻港关联区域'], ['适用货物', '20GP / 40GP 普货集装箱'], ['服务内容', '提送箱、进港资料核对、交箱衔接'], ['计费方式', '按箱型、接送距离与作业项目询价']], note: '由关联物流企业提供协同服务，不代表港口自营；堆存、港杂与等待费用另行核对。' },
  { id: 'rail-cd-handover', category: 'more', name: '铁路集装箱到站交接与短驳', city: '成都', providerId: 'rail-co', tags: ['到站交接', '集装箱短驳'], facts: [['服务地点', '成都 · 约定办理场站'], ['适用货物', '铁路集装箱普货'], ['服务内容', '到站资料核对、提箱协调与目的地配送'], ['计费方式', '按箱量、交接与短驳范围询价']], note: '具体办理站、提货凭证、作业窗口及箱源状态需确认，不代表所有铁路场站均可办理。' },
  { id: 'air-wh', category: 'air', name: '园区小件低空配送咨询', city: '武汉', providerId: 'air-co', tags: ['指定服务点', '小件普货', '条件核验'], facts: [['服务区域', '武汉 · 指定园区服务点之间'], ['适用货物', '包装小件，重量与尺寸需核验'], ['服务内容', '起降点、货物与配送条件评估'], ['计费方式', '按航段与服务条件确认']], note: '并非任意地址均可配送。可用航线、载荷、天气和运行安排核验通过后再确认承接；不承诺即时起飞。' },
]
export const networkPlaces = [
  { id: 'port-cq', kind: 'ports', name: '重庆果园港', xy: [106.77,29.63], city: '重庆', summary: '集装箱交接 · 公水衔接', detail: '可关联重庆出发的集装箱运输方案；港区、交箱要求与作业条件需在询价时核对。', serviceId: 'multi-cq-sh', providerId: 'supply-multi' },
  { id: 'port-wh', kind: 'ports', name: '武汉阳逻港', xy: [114.59,30.66], city: '武汉', summary: '水路集装箱 · 港口接驳', detail: '查看相关港到港运输服务，接驳与码头费用需分别确认。', serviceId: 'water-wh-sh', providerId: 'water-co' },
  { id: 'station-cd', kind: 'ports', name: '成都铁路场站', xy: [104.08,30.8], city: '成都', summary: '铁路集装箱交接', detail: '具体办理站、到站交接要求及两端接驳由服务企业确认。', serviceId: 'rail-wh-cd', providerId: 'rail-co' },
  { id: 'storage-sz', kind: 'warehouses', name: '苏州常温仓储服务点', xy: [120.63,31.4], city: '苏州', summary: '常温普货 · 中转分拨', detail: '面向包装及托盘普货的仓储中转服务，库位及承接条件需确认。', offerId: 'wh-sz', providerId: 'supply-road' },
  { id: 'storage-sh', kind: 'warehouses', name: '上海拆箱暂存服务点', xy: [121.48,31.4], city: '上海', summary: '拆箱暂存 · 出库交接', detail: '可关联集装箱拆箱及暂存服务，非实时库存或可订库位。', offerId: 'wh-sh', providerId: 'supply-multi' },
]
export const guides = [
  { id: 'rail', title: '第一次走铁路，如何办理发货？', steps: [['准备货物信息', '整理品名、重量、包装尺寸、箱型及装卸地点。'], ['核对办理条件', '向服务企业确认办理场站、货物限制与包装要求。'], ['确认方案与费用', '核对接驳、铁路运输、装卸等包含范围及预计时效。'], ['约定交接', '确认发运安排和所需资料后，再按约定交付货物。']], note: '具体办理要求以服务企业及办理场站确认为准。' },
  { id: 'fees', title: '门到门报价，需要确认哪些费用？', steps: [['两端接驳', '确认提货和配送地址、车型、距离及等待费用。'], ['干线运输', '核对计价单位、箱型货量及报价有效条件。'], ['节点作业', '核对装卸、中转、堆存、装拆箱是否包含。'], ['其他费用', '确认保险、关务、税费及异常费用的责任范围。']], note: '比价前应统一服务范围，参考费用不等同于最终承运报价。' },
]
