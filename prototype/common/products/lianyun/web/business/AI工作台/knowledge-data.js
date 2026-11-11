import { reactive } from 'vue'

// 内置资料用于验证浏览、问答和出处回查。
export const knowledgeGroups = [
  { label: '个人知识库', ids: ['personal'] },
  { label: '企业知识库', ids: ['manuals', 'rules', 'standards', 'settlement-templates'] },
]

export const knowledgeEntries = reactive({
  'settlement-templates': { name: '结算与对账模板', kind: 'library', summary: '保存企业对账模板，按结算企业与对账方向匹配。', children: [] },
  personal: {
    name: '我的工作资料', kind: 'library', summary: '存放个人常用的工作资料。', children: [],
  },
  manuals: {
    name: '产品操作手册与培训资料', kind: 'library',
    summary: '查找运输业务中的产品操作方法、流程和培训资料。',
    children: ['operations', 'training'],
  },
  operations: {
    name: '操作手册', kind: 'folder', children: ['settlement', 'waybill'],
  },
  training: {
    name: '培训资料', kind: 'folder', children: [],
  },
  settlement: {
    name: '运输结算操作手册', kind: 'document',
    sections: [{
      title: '结算前资料核对', question: '运输结算前需要核对哪些资料？',
      keywords: /结算|回单|费用凭证|对账/,
      basis: '结算前对照运单、签收回单和费用明细，补录费用还要核对凭证。',
      content: '结算前先核对运单、签收回单和费用明细。涉及补录费用时，补齐对应凭证，并按费用类型和结算对象核对金额。资料不齐时，先记录缺项并联系相关人员补齐。',
    }, {
      title: '结算对象核对', question: '如何核对结算对象？',
      keywords: /结算对象|承运方|付款对象/,
      basis: '以合同约定和业务单据为准，核对合同主体、承运方与收款方是否一致。',
      content: '以业务单据及合同约定确认结算对象。发现承运方、收款方或合同主体不一致时，先查明原因，再发起结算。',
    }],
  },
  waybill: {
    name: '运单操作手册', kind: 'document',
    sections: [{
      title: '运单状态核对', question: '运单状态与路段进度不一致时怎么核对？',
      keywords: /运单|路段|进度/,
      basis: '对照运单和路段各自的更新时间，再核对调度、在途和签收记录。',
      content: '分别检查运单状态和对应路段的更新时间，再对照调度记录、在途记录与签收凭证。发现遗漏或异常时，由负责人员核对后更新。',
    }],
  },
  rules: {
    name: '合规管理与规章制度', kind: 'library',
    summary: '查找业务资料归档和日常合规要求。', children: ['archive'],
  },
  archive: {
    name: '运输业务资料归档指引', kind: 'document',
    sections: [{
      title: '运输资料归档', question: '运输业务完成后需要归档哪些资料？',
      keywords: /归档|留存/,
      basis: '按业务单据归集合同、运单、签收凭证和结算资料，核对编号和关联关系。',
      content: '按业务单据归集运输合同、运单、签收凭证及结算资料。归档时核对单据编号和资料关联关系，补齐缺失内容。',
    }],
  },
  standards: {
    name: '大宗物流行业标准', kind: 'library',
    summary: '查阅大宗货物运输交接所需的工作资料。', children: ['handover'],
  },
  handover: {
    name: '大宗货物运输交接指引', kind: 'document',
    sections: [{
      title: '交接核对事项', question: '大宗货物运输交接时要核对哪些信息？',
      keywords: /大宗|货物|交接/,
      basis: '对照货物品名、数量、交接时间和地点，并核对双方确认记录。',
      content: '交接时核对货物品名、数量、交接时间、地点及双方确认记录。实物与单据有差异时，记录差异并交由现场负责人确认。',
    }],
  },
})

const personalFilesKey = 'tms.ai-workbench.personal-knowledge-files.v1'

export const knowledgeFileLimit = 256 * 1024

function splitFileBody(body) {
  return (body.match(/[\s\S]{1,500}/g) || []).map((content, index) => ({
    title: `正文片段 ${index + 1}`, content,
  }))
}

function registerPersonalFile({ id, name, body, error }) {
  const content = typeof body === 'string' && body.length <= knowledgeFileLimit ? body.trim() : ''
  const sections = splitFileBody(content)
  knowledgeEntries[id] = {
    name, kind: 'document', sections, body: content,
    status: sections.length ? 'ready' : 'failed',
    error: error || '资料尚未读取，请重新选择文件。',
  }
  knowledgeEntries.personal.children.push(id)
}

try {
  const files = JSON.parse(localStorage.getItem(personalFilesKey) || '[]')
  if (Array.isArray(files)) {
    for (const file of files) {
      if (/^personal-file-[a-f0-9-]+$/.test(file?.id) && typeof file.name === 'string' && !knowledgeEntries[file.id]) {
        registerPersonalFile(file)
      }
    }
  }
} catch { /* 读取失败时从空资料列表开始。 */ }

function savePersonalFiles() {
  try {
    const saved = knowledgeEntries.personal.children.map(id => {
      const { name, body, error, status } = knowledgeEntries[id]
      return { id, name, body, error: status === 'failed' ? error : undefined }
    })
    localStorage.setItem(personalFilesKey, JSON.stringify(saved))
    return true
  } catch {
    return false
  }
}

export async function addPersonalKnowledgeFiles(files, retryId = null) {
  await Promise.all(files.map(async file => {
    const id = retryId || 'personal-file-' + crypto.randomUUID()
    if (!retryId) registerPersonalFile({ id, name: file.name })
    const entry = knowledgeEntries[id]
    if (!entry || entry.status === 'processing') return
    Object.assign(entry, { name: file.name, status: 'processing', error: '' })
    try {
      if (!/\.(txt|md)$/i.test(file.name)) throw new Error('当前支持 TXT 和 Markdown，请选择支持的文件。')
      if (file.size > knowledgeFileLimit) throw new Error('文件超过 256 KB，请拆分后重试。')
      let body
      try {
        body = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()).trim()
      } catch {
        throw new Error('无法读取正文，请将文件另存为 UTF-8 后重试。')
      }
      if (!body || body.includes('\0')) throw new Error('没有读取到有效正文，请检查文件后重试。')
      Object.assign(entry, { body, status: 'ready', sections: splitFileBody(body) })
    } catch (error) {
      Object.assign(entry, { status: 'failed', error: error.message, body: '', sections: [] })
    }
  }))
  return savePersonalFiles()
}

export function knowledgeChildren(id) {
  return knowledgeEntries[id]?.children || []
}

export function knowledgeDocuments(id) {
  const entry = knowledgeEntries[id]
  if (!entry) return []
  if (entry.kind === 'document') return entry.sections.length ? [id] : []
  return knowledgeChildren(id).flatMap(knowledgeDocuments)
}

export function knowledgeOptions(id, parent = '') {
  const label = parent ? `${parent} / ${knowledgeEntries[id].name}` : knowledgeEntries[id].name
  if (!knowledgeDocuments(id).length) return []
  return [{ id, label }, ...knowledgeChildren(id).flatMap(child => knowledgeOptions(child, label))]
}

export function knowledgeQuestions(id) {
  return knowledgeDocuments(id)
    .flatMap(docId => knowledgeEntries[docId].sections.map(section => section.question))
    .filter(Boolean)
    .slice(0, 2)
}

function textRelevance(question, content) {
  const normalized = question.toLowerCase().replace(/请问|告诉我|是什么|有哪些|怎么做|怎么办|如何|需要|可以|一下/g, ' ')
  const words = normalized.match(/[a-z0-9-]{2,}|[\p{Script=Han}]{2,}/gu) || []
  const excerpt = content.toLowerCase()
  return words.reduce((score, word) => {
    if (excerpt.includes(word)) return score + word.length
    if (!/^\p{Script=Han}{3,}$/u.test(word)) return score
    const matchingPairs = new Set()
    for (let i = 0; i < word.length - 1; i++) {
      const pair = word.slice(i, i + 2)
      if (excerpt.includes(pair)) matchingPairs.add(pair)
    }
    return score + (matchingPairs.size >= 2 ? matchingPairs.size : 0)
  }, 0)
}

export function makeKnowledgeAnswer(question, scopeId, previousSources = []) {
  const documents = knowledgeDocuments(scopeId)
  const passages = documents.flatMap(docId => knowledgeEntries[docId].sections.map((section, index) => ({ docId, section, index })))
  const exact = passages.find(item => item.section.question === question)
  const scored = passages.map(item => ({
    ...item,
    score: item.section.keywords?.exec(question)?.[0].length || (!item.section.keywords ? textRelevance(question, item.section.content) : 0),
  })).sort((a, b) => b.score - a.score)
  const previous = previousSources[0]
  const referring = /这份资料|这些资料|上述|刚才|上一步|这一项|不齐|缺失/.test(question)
  const referenced = referring && previous && passages.find(item =>
    item.docId === previous.docId && item.index === previous.sectionIndex
    && (!previous.content || previous.content === item.section.content))
  const ranked = exact || (scored[0]?.score > 0 ? scored[0] : null) || referenced
  const scope = knowledgeEntries[scopeId]?.name
  const searchStep = scope
    ? `在「${scope}」的 ${documents.length} 份可用资料中匹配问题。`
    : '当前对话的知识范围已不可用。'

  if (!ranked) return {
    title: '当前资料中未找到相关依据',
    processSummary: documents.length ? `检索 ${documents.length} 份资料，未找到相关依据` : '当前范围暂无可用资料',
    reasoning: [searchStep, '没有匹配到可引用的原文。'],
    sections: [{ heading: '可以继续核对', paragraphs: ['试试补充业务关键词，或选择更相关的资料后再问。'] }],
  }

  const { docId, section, index } = ranked
  return {
    title: section.title,
    processSummary: ranked === referenced ? '沿用上一轮出处' : `检索 ${documents.length} 份资料，找到 1 处依据`,
    reasoning: [
      searchStep,
      ...(ranked === referenced ? ['这次追问沿用上一轮引用的段落。'] : []),
      section.basis
        ? `依据「${knowledgeEntries[docId].name}」的「${section.title}」：${section.basis}`
        : `命中「${knowledgeEntries[docId].name}」的「${section.title}」，依据为该段原文。`,
    ],
    sections: [{ heading: ranked === referenced ? '上一轮引用的原文，可进一步核对' : '根据资料', paragraphs: [section.content] }],
    sources: [{
      docId, sectionIndex: index, label: `${knowledgeEntries[docId].name} · ${section.title}`,
      name: knowledgeEntries[docId].name, title: section.title, content: section.content,
    }],
  }
}
