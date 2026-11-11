// 本地原型按问题类型展示交互样例，不调用模型或读取业务数据。
export const transportExpert = {
  id: 'transport-team',
  name: '至简·大宗运输物流专家',
  shortName: '大宗运输物流专家',
  description: '为煤炭、钢铁、塑料粒子、棉纺大宗物料设计物流指标体系，覆盖口径定义、吨均成本拆解与库存周转诊断。',
  fields: ['煤炭', '钢铁', '塑料粒子', '棉纺'],
  questions: ['帮我设计一套煤炭物流指标，并明确各指标的统计口径。', '帮我拆解钢铁运输的吨均成本，需要准备哪些数据？', '我想诊断塑料粒子的库存周转，应该从哪些指标入手？'],
}
export const expertAnnouncement = {
  id: 'bulk-logistics-expert-20261106', available: true, expertId: transportExpert.id,
  title: transportExpert.shortName, icon: 'agent-dispatch.svg',
  text: '建立物流指标、拆解吨均成本、诊断库存周转。', action: '了解专家',
  example: '怎么计算钢铁运输的吨均成本？',
}
export function makeExpertAnswer(question, previousQuestions = []) {
  const topic = /成本|周转|库存|指标/.test(question) ? question : [...previousQuestions].reverse().find(text => /成本|周转|库存|指标/.test(text)) || question
  const cost = /成本/.test(topic), stock = !cost && /周转|库存/.test(topic)
  const sections = cost ? [
    { heading: '先统一计算口径', paragraphs: ['吨均物流成本＝同一统计期间、同一业务范围的物流费用总额 ÷ 对应结算吨数。先约定含税或不含税、运费计入期间，以及退货、损耗和跨期费用的处理方式。'] },
    { heading: '按费用环节拆解', paragraphs: ['可按干线运输、短驳、装卸、仓储及其他费用分别计算每吨分摊；同一笔费用只能归入一个环节。对照路线、运输方式和月份，定位差异。'] },
    { heading: '需要你补充', paragraphs: ['请提供目标统计期内各条线路的结算吨数和分项费用。目前缺少这些数据，不能判断实际吨均成本或异常幅度。'] },
  ] : stock ? [
    { heading: '建议先看三个指标', paragraphs: ['库存周转率：统计期出库量 ÷ 同期平均库存量。库存周转天数：统计期天数 ÷ 库存周转率。库龄结构：按入库时间分组，查看各区间的库存数量与占比。'] },
    { heading: '统一比较范围', paragraphs: ['按物料牌号、仓库和统计期间分别比较，确保出库量与库存量的单位一致。平均库存优先采用日均库存；缺少每日快照时，需要明确替代口径。'] },
    { heading: '下一步', paragraphs: ['请说明你想诊断的仓库和期间，并补充库存快照、出入库明细及入库时间。当前只能梳理诊断方法，还不能判断哪些库存积压。'] },
  ] : [
    { heading: '建议的指标框架', paragraphs: ['成本：吨均物流成本及分项占比。效率：运输周期、装卸等待时长。库存：周转天数、库龄结构。质量：数量损耗率、异常发生率。'] },
    { heading: '每项指标统一六个要素', paragraphs: ['业务定义、计算公式、统计范围、时间口径、计量单位、数据来源。煤炭涉及过磅和水分差异时，还需约定结算吨数与损耗的计量基准。'] },
    { heading: '先明确你的管理目标', paragraphs: ['这套指标主要用于运输管理，还是包含仓储的全程物流？你更想控制成本、提升效率，还是排查库存问题？确认范围后再细化指标口径。'] },
  ]
  return { title: cost ? '吨均成本拆解' : stock ? '库存周转诊断思路' : '物流指标体系建议',
    processSummary: '梳理指标口径与所需资料',
    reasoning: ['根据本次问题选择指标体系、吨均成本或库存周转的讨论方向。', '先明确统计口径和计算方法，再列出需要补充的资料；未读取业务数据。'], sections }
}
