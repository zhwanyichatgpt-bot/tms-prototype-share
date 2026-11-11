export const asset = name => `/ai-workbench-assets/${name}`

export const agents = [
  { id: 'analysis', name: '运营数据分析', model: 'TMS分析助手', icon: 'agent-analysis.svg', description: '一句话关于运营数据分析的介绍' },
  { id: 'dispatch', name: 'AI智能调度', model: '智优配煤', icon: 'agent-dispatch.svg', description: '一句话关于AI智能调度的介绍' },
  { id: 'report', name: 'AI早报', model: 'AI值守', icon: 'agent-report.svg', description: '一句话关于AI早报的介绍' },
  { id: 'encyclopedia', name: '企业百科', model: '智选供应商', icon: 'agent-encyclopedia.png', description: '查询企业业务知识与常见问题' },
  { id: 'query', name: '数据查询', model: 'AI运力匹配', icon: 'agent-query.png', description: '查找运输、车辆与运单相关信息' },
]

export const questionBatches = [
  ['分析上月的运输情况，生成一份最新运输情况分析总结报告', '分析近一月的运营周报数据，生成总结报告', '查询近一周车辆告警记录，汇总分析全部数据，生成报告'],
  ['近一周车辆异常情况分析统计数据', '分析上月的运输情况，提供最新运输情况分析报告', '近一月的运营周报数据，分析总结'],
]
export const scopeTags = ['运单', '调度指派', '数据统计', '数据分析', '需要统计图表', '交易商机']
export const followupQuestions = ['TMS当前月份数据分析？', '实时跟踪与可视化要怎么实施？', 'TMS 分析的核心模块与价值？']

// 保留设计稿中的示例文案，仅用于还原会话版式，不代表真实AI回答或业务数据。
export const designAnswer = {
  title: 'TMS 分析：多领域含义与深度解析',
  reasoning: [
    'TMS 在多个领域有不同含义。按领域区分，并结合当前工作台说明运输管理系统的含义。',
    '整理各含义的应用范围。涉及本企业的运输分析时，需要以实际业务数据为准。',
  ],
  sections: [
    { heading: '一、医学领域：经颅磁刺激（Transcranial Magnetic Stimulation, TMS）', paragraphs: ['1. 概念与原理', '经颅磁刺激（TMS）是一种非侵入性神经调控技术，通过头皮外的电磁线圈产生脉冲磁场，穿透颅骨后在大脑皮层诱导感应电流，从而调节神经元的电活动。其核心原理基于电磁感应现象。'] },
    { heading: '二、物流领域：运输管理系统（Transportation Management System）', paragraphs: ['围绕运输计划、调度执行、实时跟踪与运费结算组织运输业务，帮助企业查看运输进度、协同作业并分析运输成本。', '可从运输时效、车辆利用、异常处理和费用结构等维度进行分析；具体结论需要以实际业务数据为依据。'] },
    { heading: '三、其他领域的 TMS 含义补充', paragraphs: ['1、时间管理系统（Time Management System）：', '分析维度：任务优先级排序、工时统计、效率瓶颈识别，常用于项目管理或人力资源领域。', '2、肿瘤代谢综合征（Tumor Metabolic Syndrome）：', '医学研究中对肿瘤细胞代谢特征的分析，如糖酵解（Warburg 效应）、脂质代谢重编程等。'] },
    { heading: '总结', paragraphs: ['TMS 的含义需结合具体领域解读：医学中 TMS 分析聚焦神经调控机制与治疗效果，物流中则侧重运输流程优化与成本控制。若需进一步探讨某一领域的细节，可提供更多背景信息以深化分析。'] },
  ],
}

export function makeAnswer(question, agent) {
  if (/什么是\s*TMS|TMS.*核心模块/.test(question)) return structuredClone(designAnswer)
  return {
    title: question.length > 36 ? `${question.slice(0,36)}…` : question,
    reasoning: [
      `按「${agent.name}」整理本次提问和可补充的业务条件。`,
      '使用内置演示内容列出待核对的信息，实际业务结论需查系统记录。',
    ],
    sections: [
      { heading: `${agent.name} · 演示答复`, paragraphs: [`已收到你的问题：“${question}”。`, '当前展示本地预置的分析结构，用于验证提问、追问与结果操作流程，未连接真实AI或生产数据。'] },
      { heading: '建议查看的信息', paragraphs: ['运输任务与运单进度、业务时间范围、车辆及线路信息、异常记录与处理结果。涉及费用时，结合相同口径的结算数据进一步核对。'] },
      { heading: '下一步', paragraphs: ['你可以继续补充时间、线路或业务范围，也可以引用、收藏或分享本条答复。'] },
    ],
  }
}

export function createInitialState() {
  const titles = ['上月运输情况分析', '闽A123456三月份报警记录', '查询出差标准', '本月运单消息分析、成本查询最长到', '本月运单消息分析', '过磅异常情况分析', '年度运输情况、成本分析', '最新运输政策', '过磅异常情况分析']
  const sessions = titles.map((title, i) => ({
    id: `history-${i+1}`, title, agentId: i === 1 ? 'query' : 'analysis', group: i < 5 ? '本周' : '本月', pinned: false,
    messages: [
      { id: `question-${i}`, role: 'user', text: '解释一下什么是TMS' },
      { id: `answer-${i}`, role: 'assistant', answer: structuredClone(designAnswer) },
      { id: `question-next-${i}`, role: 'user', text: '解释一下什么是TMS' },
      { id: `answer-next-${i}`, role: 'assistant', answer: structuredClone(designAnswer) },
    ],
  }))
  return {
    sessions, agentOrder: agents.map(a => a.id),
    favorites: sessions.slice(0,7).map((s,i) => ({ id: `favorite-${i}`, sessionId: s.id, messageIds: [s.messages[0].id, s.messages[1].id], title: s.title, agentId: s.agentId, date: '2024-03-24', excerpt: designAnswer.sections[0].paragraphs[1] })),
  }
}
