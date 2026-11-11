// 原型共用样例。单据、分数和摘要均用于验证交互。
export const documentSamples = [
  {
    id: 'WT202409030001', type: '托运单', label: '原煤 · 10,000 吨', scores: [90.47, 93.45, 91.88],
    summary: '综合 92 分，优先关注回款周期和空驶成本。',
    findings: [
      { label: '账期', text: '货主历史平均回款 45 天，比 30 天目标多 15 天。' },
      { label: '运输', text: '准时率 97.6%，空驶率 18%，高于报告的满分档上限 15%。' },
      { label: '收益', text: '本单毛利率 12.81%，略高于公司均值 12.11%。' },
    ],
    process: [
      '已读取原煤 10,000 吨托运单，核对货物、运输执行和费用信息。',
      '已比较回款周期与目标账期，检查空驶率是否超出报告的控制值。',
      '发现账期和空驶两项需要关注，已将相关数据与结论整理到报告中。',
    ],
    updates: [
      '正在读取托运单，核对货物、运输执行和费用信息。',
      '正在比较回款周期与目标账期，检查空驶率是否超出报告的控制值。',
      '已发现账期和空驶两项需要关注，正在整理报告。',
    ],
  },
  { id: 'TY20250811000001', type: '托运单', label: '待执行 · 工业品' },
  { id: 'QY2508191910391932', type: '运单', label: '运输执行', summary: '可查看本张运单的运输状态、执行节点和异常记录。' },
]
export const documentRunDuration = 3600
export const conversationStorageKey = 'tms.ai-workbench.v1'
export const runStorageKey = 'tms.ai-workbench.skill-runs.v1'

export function documentAnalysisStage(elapsed) {
  return Math.min(2, Math.floor(Math.max(0, elapsed) / (documentRunDuration / 3)))
}

// 原型按模拟任务阶段展示工作摘要，文案与当前单据的数据范围保持一致。
export function getDocumentAnalysisUpdates(task) {
  const record = documentSamples.find(item => item.id === task.documentNo)
  if (!task.documentSnapshot && record?.updates) return record.updates
  return [
    `正在读取${task.documentType} ${task.documentNo}，核对本次提供的业务资料。`,
    task.documentType === '托运单'
      ? '正在核对委托、运输执行和计费信息，检查哪些资料还不完整。'
      : '正在核对运输状态、执行节点和异常记录，检查哪些资料还不完整。',
    '正在整理已核对的内容，将资料不足和需要进一步确认的地方写入报告。',
  ]
}

export function isDocumentAnalysisRequest(question) {
  return /(?:分析|评估|生成.{0,10}报告).{0,24}(?:托运单|运单|过磅单|入库单|这(?:一)?张单|当前单据|这(?:一)?单)/.test(question)
    || /(?:托运单|运单|过磅单|入库单|这(?:一)?张单|当前单据|这(?:一)?单).{0,24}(?:分析一下|做.{0,8}分析|生成.{0,8}报告)/.test(question)
}

export function resolveDocument(question, current) {
  const ids = question.toUpperCase().match(/[A-Z][A-Z0-9-]*\d[A-Z0-9-]*|\d{6,}/g) || []
  const types = [...new Set((question.match(/托运单|过磅单|入库单|运单/g) || []))]
  const records = current ? [current, ...documentSamples.filter(item => item.id !== current.id)] : documentSamples
  const candidates = records.filter(item => !types.length || types.includes(item.type))
  if (ids.length) {
    const matches = candidates.filter(item => ids.includes(item.id))
    if (ids.length === 1 && matches.length === 1) return { record: matches[0] }
    return {
      message: matches.length ? '请选择本次要分析的一张单据。' : '未找到该单据。请核对单号，或从下方选择。',
      candidates: matches.length ? matches : candidates,
    }
  }
  if (current && (!types.length || types.includes(current.type))) return { record: current }
  return { message: '请输入要分析的单号，或从下方选择。', candidates }
}

export function createDocumentAnalysis(record, question, sessionId) {
  const startedAt = Date.now()
  return {
    id: crypto.randomUUID(),
    skillId: 'documents',
    skillName: '单据分析',
    sessionId,
    title: record.type + '分析报告',
    documentType: record.type,
    documentNo: record.id,
    ...(record.snapshot && { documentSnapshot: record.snapshot }),
    focus: ['业务概览', '执行情况'],
    files: [],
    question,
    requirements: '',
    sample: true,
    startedAt,
    status: 'running',
    stage: 0,
  }
}

// 旧版记录只保存单号，按该原型样例补齐可核对的页面字段。
const pendingConsignmentSample = {
  status: '待执行',
  shipper: '福建万维宇宙科技有限公司',
  cargo: '工业品 · 1000吨',
  route: '辽宁 朝阳 → 福州 台江',
  modes: '汽运、水运、铁路',
  currentProgress: 50,
  baseFreight: '154.00 元',
  pricing: '重量  |  装货重量  |  运输单价：100元/吨',
  prepayment: '预付 1,000.00 元',
}

export function captureConsignmentSnapshot(detail) {
  const cargo = detail.goodsList?.find(item => item.fields?.length)
  const weight = cargo?.fields.find(field => field.label === '总重量')?.value
  const route = detail.segments?.find(segment => segment.loadPoint && segment.unloadPoint)
  const cost = detail.costInfo
  return {
    status: detail.statusText,
    shipper: detail.shipperInfo?.company,
    cargo: [cargo?.name, weight].filter(Boolean).join(' · '),
    route: route ? `${route.loadPoint.city} → ${route.unloadPoint.city}` : '',
    modes: [...new Set(detail.segments?.map(segment => segment.mode).filter(Boolean))].join('、'),
    currentProgress: detail.segments?.find(segment => segment.currentStage)?.progress,
    baseFreight: cost?.baseFreight ? cost.baseFreight + ' 元' : '',
    pricing: cost?.rule,
    prepayment: cost?.payTypeAmount ? `${cost.payTypeTag || '付款方式'} ${cost.payTypeAmount} 元` : '',
  }
}

function section(heading, text, fields = []) {
  return { heading, paragraphs: [text], fields: fields.filter(([, value]) => value != null && value !== '') }
}

function getConsignmentReport(task, snapshot) {
  const { status, shipper, cargo, route, modes, currentProgress, baseFreight, pricing, prepayment } = snapshot
  const progress = typeof currentProgress === 'number' ? `${currentProgress}%` : ''
  const stateMismatch = status === '待执行' && currentProgress > 0
  const executionNote = stateMismatch
    ? `单据状态为待执行，当前路段却显示 ${progress} 进度。建议先核对两处状态，再判断实际履约进展。`
    : '页面路段数据可供核对，完整履约情况还需结合实际运输记录确认。'
  const financeNote = '页面可核对计费和付款约定。当前资料缺少完整成本与到账明细，暂无法判断毛利和回款表现。'
  return {
    title: task.title,
    status,
    summary: stateMismatch ? `单据待执行，当前路段显示 ${progress} 进度，建议先核对执行状态。` : '已汇总当前托运单的委托、路段与计费信息。',
    findings: [
      { label: '委托', text: [shipper, cargo].filter(Boolean).join(' · ') || '暂无可核对的委托明细。' },
      { label: '费用', text: prepayment ? `页面列有${prepayment}，毛利和回款表现待确认。` : '毛利和回款表现待确认。' },
    ],
    process: [
      `确认托运单 ${task.documentNo}，读取详情页委托和货品信息。`,
      '对照单据状态与当前路段进度，标明需要核对的地方。',
      '核对页面计费和付款约定，标出缺失的成本与到账明细。',
    ],
    sections: [
      section('货主与货物评估', '委托资料可核对，当前页面没有货主历史履约数据。', [['托运企业', shipper], ['货品与重量', cargo]]),
      section('承运商执行效能', executionNote, [['单据状态', status], ['运输方式', modes], ['汽运路段', route], ['当前路段进度', progress]]),
      section('财务与回款健康', financeNote, [['基础运费', baseFreight], ['计费规则', pricing], ['付款约定', prepayment]]),
    ],
  }
}

export function getDocumentReport(task) {
  const record = documentSamples.find(item => item.id === task.documentNo)
  const snapshot = task.documentSnapshot || (task.documentNo === 'TY20250811000001' ? pendingConsignmentSample : null)
  if (snapshot) return getConsignmentReport(task, snapshot)

  const sections = [
    section('本次分析对象', task.documentType + ' ' + task.documentNo + ''),
  ]
  if (record?.scores) {
    sections.push(
      section('综合评估 · 92 分', record.summary),
      section('货主与货物评估 · 90.47 分', record.findings[0].text),
      section('承运商执行效能 · 93.45 分', record.findings[1].text),
      section('财务与回款健康 · 91.88 分', record.findings[2].text),
    )
  } else if (task.documentType === '托运单') {
    sections.push(
      section('货主与货物评估', '当前报告未取得完整的委托及货品明细。'),
      section('承运商执行效能', '当前报告未取得完整的执行明细。'),
      section('财务与回款健康', '当前报告缺少结算和到账明细。'),
    )
  } else {
    sections.push(
      section('运输执行概览', '当前报告缺少可核对的运输状态和执行节点。'),
      section('异常与签收', '可在运单详情核对异常记录与签收信息。'),
    )
  }
  return {
    title: task.title,
    summary: record?.summary || '可打开报告查看本次分析的范围与内容。',
    findings: record?.findings || [],
    process: record?.process,
    sections,
  }
}

// 浮窗和工作台共用本地会话、成果记录，切页后可打开同一份报告。
export function saveFloatingAnalysis(run, messages) {
  const oldChat = localStorage.getItem(conversationStorageKey)
  const oldRuns = localStorage.getItem(runStorageKey)
  const chat = oldChat ? JSON.parse(oldChat) : { version: 1, sessions: [] }
  const runs = oldRuns ? JSON.parse(oldRuns) : []
  if (chat.version !== 1 || !Array.isArray(chat.sessions) || !Array.isArray(runs)) {
    throw new Error('无法读取已有记录')
  }
  const session = {
    id: run.sessionId,
    title: run.title + ' · ' + run.documentNo,
    agentId: 'analysis',
    group: '今天',
    pinned: false,
    messages,
  }
  const existingSession = chat.sessions.find(item => item.id === session.id)
  const nextSession = existingSession ? { ...existingSession, messages } : session
  const nextChat = JSON.stringify({ ...chat, sessions: [nextSession, ...chat.sessions.filter(item => item.id !== session.id)] })
  const previousRun = runs.find(item => item.id === run.id)
  const nextRuns = JSON.stringify([{ ...previousRun, ...run }, ...runs.filter(item => item.id !== run.id)])
  localStorage.setItem(conversationStorageKey, nextChat)
  try {
    localStorage.setItem(runStorageKey, nextRuns)
  } catch (error) {
    if (oldChat === null) localStorage.removeItem(conversationStorageKey)
    else localStorage.setItem(conversationStorageKey, oldChat)
    throw error
  }
}
