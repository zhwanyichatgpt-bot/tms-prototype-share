// 技能定义与演示报告使用合成资料，不读取上传文件，也不调用真实模型。
import { transportExpert } from './expert-data.js'
import { getDocumentReport } from '../../../../../shared/web/ai-document-analysis/document-analysis.js'

export const skills = [
  { id:'documents', name:'单据分析', type:'技能', icon:'agent-analysis.svg', description:'指定系统里的托运单、运单，生成分析报告', input:'document', fresh:true },
  { id:'waybill-supplement', name:'运单补录', type:'技能', icon:'agent-report.svg', description:'根据公路运输明细匹配任务，协助整理并补录运单', input:'files' },
  { id:'settlement-recon', name:'运输结算', type:'技能', icon:'agent-report.svg', description:'按结算对象汇总运单，生成运输结算单', input:'files' },
  { id:'transport-team', name:transportExpert.shortName, type:'专家', icon:'agent-dispatch.svg', description:transportExpert.description, input:'question' },
  { id:'knowledge', name:'企业知识问答', type:'技能', icon:'agent-report.svg', description:'查制度、流程与经验，答案附资料来源', input:'knowledge' },
  { id:'operations', name:'项目经营分析', type:'技能', icon:'agent-analysis.svg', description:'基于表格，梳理经营表现和关注事项', input:'files' },
  { id:'contract', name:'合同约定整理', type:'技能', icon:'agent-query.png', description:'整理履约和计费约定，保留原文依据', input:'files' },
]
const resultTypes = {
  documents: { label: '分析报告' },
  operations: { label: '分析报告', title: '项目经营分析报告' },
  'transport-team': { label: '运输方案', title: '大宗运输方案建议' },
  contract: { label: '合同要点', title: '合同履约与计费要点' },
  knowledge: { label: '知识答复', title: '企业知识答复' },
}

export function workResultType(skillId) {
  return resultTypes[skillId] || { label: '工作成果' }
}

export const documentTypes = ['托运单','过磅单','入库单']
export const analysisFocus = ['单据汇总','差异与缺项','趋势与分布']
export const demoRows = [
  { id:'DEMO-001', date:'2026-10-12', quantity:20.2, source:'示例资料第1条' },
  { id:'DEMO-002', date:'2026-10-15', quantity:21.6, source:'示例资料第2条' },
  { id:'DEMO-003', date:'2026-10-18', quantity:19.6, source:'示例资料第3条' },
]
export function makeSkillReport(task) {
  if (task.sections) return {
    title: task.title,
    reasoning: task.reasoning || [`此案例按「${task.sections.map(section => section.heading).join('、')}」展示成果结构。`],
    sections: task.sections,
  }
  if (task.documentNo) return getDocumentReport(task)
  const fileMode = ['documents','operations'].includes(task.skillId)
  return {
    title: task.title,
    reasoning: fileMode
      ? ['确认选定的分析类型和重点。', '汇总内置示例明细，列出还需要原始单据佐证的项目。']
      : ['记录本次提问和业务约束。', '按所选技能展示内置示例与需要补充的业务条件。'],
    sections: fileMode ? [
      { heading:'一、分析范围与口径', paragraphs:[`本次技能：${task.skillName}；选择类型：${task.documentType}；分析重点：${task.focus.join('、')}。`,'本报告仅分析内置的3条合成示例，数量单位为吨，不代表上传文件的识别结果。'] },
      { heading:'二、汇总结果', paragraphs:['示例单据3条，合计61.4吨，单据数量分别为20.2、21.6、19.6吨。','该示例不包含可对照的合同、装货重量或计划数量，无法据此判断损耗、盈亏或履约异常。'] },
      { heading:'三、关注事项与依据', paragraphs:['需要确认单据是否完整、同一单据是否重复，以及统计单位是否一致。示例仅展示报告结构，不推断真实业务风险。','明细可在下方逐条查看，引用来源为内置示例资料。'] },
    ] : [
      { heading:'一、本次需求', paragraphs:[task.question || task.requirements || '整理合同中的履约与计费约定。'] },
      { heading:'二、示例输出', paragraphs:[task.skillId==='knowledge'?'示例知识回答：结算资料应依据企业现行制度及合同约定核对。演示引用为“示例结算资料说明”，未接入企业真实知识库。':task.skillId==='transport-team'?'运输建议示例：先确认货物要求、起终点、交付约束与可用资源，再比较方案。当前未连接线路、报价或运力数据，不形成真实采购推荐。':'合同整理示例：将履约要求、计费条件与结算资料分别列项；真实条款必须引用上传合同的原文，本演示不读取合同内容。'] },
      { heading:'三、需要进一步确认', paragraphs:['补齐实际资料与适用条件后才能形成业务结论。当前仅验证技能使用、结果查看与继续对话的交互。'] },
    ],
  }
}

// 案例仅供查看，单独陈列，不写入个人成果或会话。
export const workResultCases = [
  {
    id: 'case-consignment', skillId: 'documents', skillName: '单据分析',
    title: '托运单分析报告', summary: '梳理履约进度、磅单差异与结算待核项',
    sections: [
      { heading: '履约进度', paragraphs: ['这批货计划发运 1,000 吨，已发运 800 吨，其中 600 吨已有签收回单。剩余 200 吨尚未发运，另有 200 吨已发运、未见签收回单。'] },
      { heading: '单据核对', paragraphs: ['已有回单的批次中，有一车装货净重 32.4 吨，卸货净重 32.1 吨。两端磅单相差 0.3 吨，需要结合合同约定确认计费口径。'] },
      { heading: '下一步', paragraphs: ['先核对未回传批次的签收状态，再将有重量差异的运单和两端磅单一并提交结算复核。'] },
    ],
  },
  {
    id: 'case-transport', skillId: 'transport-team', skillName: '大宗运输专家团',
    title: '公铁联运与全程汽运比选', summary: '对比时效、运力与中转条件',
    sections: [
      { heading: '方案对比', paragraphs: ['全程汽运可直接提送，便于应对交付窗口较紧的批次。公铁联运可覆盖稳定的大批量发运，需要确认班列、站台装卸与两端短驳。'] },
      { heading: '下一步', paragraphs: ['按同一交付窗口核对两套方案的门到门报价。公铁方案把短驳、装卸和中转等待计入总成本。'] },
    ],
  },
  {
    id: 'case-contract', skillId: 'contract', skillName: '合同约定整理',
    title: '运输合同履约与计费要点', summary: '提炼重量口径、签收凭证和费用约定',
    sections: [
      { heading: '履约与计费', paragraphs: ['案例约定按装货过磅净重计费。卸货重量用于核对差异，差异超出约定范围时应留存两端磅单，由双方确认。'] },
      { heading: '结算所需资料', paragraphs: ['按运单归集签收回单、装卸磅单及经确认的额外费用凭证。按月汇总后提交双方对账。'] },
    ],
  },
  {
    id: 'case-knowledge', skillId: 'knowledge', skillName: '企业知识问答',
    title: '运输结算资料核对清单', summary: '汇总对账前需要确认的单据和凭证',
    sections: [
      { heading: '对账资料', paragraphs: ['核对托运单、运单、签收凭证和计费依据。涉及按重量计费的业务，补齐磅单并核对计费重量。'] },
      { heading: '异常费用', paragraphs: ['等待、装卸等附加费用按合同约定核对确认单。凭证缺失或金额有差异的项目，单独列入待核清单。'] },
    ],
  },
]
