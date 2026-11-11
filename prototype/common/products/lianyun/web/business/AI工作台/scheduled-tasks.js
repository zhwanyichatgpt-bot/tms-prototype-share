import { computed, ref, watch } from 'vue'
import { waybillRows } from '../运单中心/mock-data.js'

const storageKey = 'tms.ai-workbench.scheduled-tasks.v1'
const timezone = 'Asia/Shanghai'
const weekdays = '日一二三四五六'
const dayInMs = 86_400_000
const localOffset = 8 * 60 * 60 * 1000
const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
})
const timestampFormat = new Intl.DateTimeFormat('zh-CN', {
  timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

const allWaybills = '所有运单'
const legacyDefaultScope = '我负责的线路'
const transportLabels = { truck: '汽运运单', water: '水运运单', rail: '铁路运单' }
export const scheduleWeekdays = Array.from(weekdays, (day, value) => ({ value, label: '周' + day }))
export const scheduleFrequencies = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '周一至周五' },
  { value: 'weekly', label: '每周' },
]
export const anomalyTaskTemplate = {
  title: '每日异常运单简报',
  prompt: '汇总执行时仍未处理的异常运单，列出异常情况和待跟进事项。',
  scope: allWaybills,
  frequency: 'daily',
  weekday: 1,
  time: '08:00',
  remind: true,
}

export function formatRunTime(value) {
  return value ? timestampFormat.format(new Date(value)) : '—'
}

export function scheduleLabel(task) {
  const frequency = task.frequency === 'weekly'
    ? '每周' + weekdays[task.weekday]
    : scheduleFrequencies.find(option => option.value === task.frequency)?.label
  return frequency + ' ' + task.time
}

export function nextTaskTime(task, now = Date.now()) {
  const [hour, minute] = task.time.split(':').map(Number)
  const localDay = Math.floor((now + localOffset) / dayInMs)
  for (let offset = 0; offset <= 7; offset++) {
    const day = localDay + offset
    const weekday = new Date(day * dayInMs).getUTCDay()
    const candidate = day * dayInMs - localOffset + (hour * 60 + minute) * 60_000
    if (candidate <= now) continue
    if (task.frequency === 'weekdays' && (weekday === 0 || weekday === 6)) continue
    if (task.frequency === 'weekly' && weekday !== task.weekday) continue
    return candidate
  }
  return null
}

export const anomalyTaskExample = '每天早上 8 点，汇总未处理的异常运单。'

export function canActivateScheduledTask(config) {
  return scheduleFrequencies.some(option => option.value === config.frequency)
    && (config.frequency !== 'weekly' || scheduleWeekdays.some(day => day.value === config.weekday))
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(config.time)
}

function parseClockNumber(value) {
  if (/^\d+$/.test(value)) return Number(value)
  const digit = character => character === '两' ? 2 : '零一二三四五六七八九'.indexOf(character)
  if (!value.includes('十')) return digit(value)
  const [tens, ones] = value.split('十')
  return (tens ? digit(tens) : 1) * 10 + (ones ? digit(ones) : 0)
}

export function scheduleDraftFromQuestion(question, previous = null, fromTaskEntry = false) {
  if (!previous && !/异常运单|运单异常/.test(question)) return null
  if (!previous && !fromTaskEntry && !/(每天|每日|每周|工作日|定时|持续任务)/.test(question)) return null
  const weekly = question.match(/周([日天一二三四五六])/)
  const frequency = /工作日|周一\s*(?:到|至|[-—])\s*周五/.test(question) ? 'weekdays'
    : /每天|每日/.test(question) ? 'daily'
    : weekly || /每周/.test(question) ? 'weekly'
    : previous?.frequency || ''
  const time = question.match(/(凌晨|上午|早上|中午|下午|晚上)?\s*([\d零一二三四五六七八九十两]{1,3})\s*(?:[:：]\s*(\d{2})|点(?:\s*(半)|\s*([\d零一二三四五六七八九十]{1,3})\s*分)?)/)
  let clock = previous?.time || ''
  if (time) {
    let hour = parseClockNumber(time[2])
    if (/中午|下午|晚上/.test(time[1] || '') && hour < 12) hour += 12
    if (time[1] === '凌晨' && hour === 12) hour = 0
    const minute = time[4] ? 30 : parseClockNumber(time[3] || time[5] || '0')
    clock = hour >= 0 && hour < 24 && minute >= 0 && minute < 60
      ? [hour, minute].map(value => String(value).padStart(2, '0')).join(':')
      : ''
  }
  const remind = /不提醒|不用提醒|不要提醒|关闭提醒/.test(question) ? false
    : /提醒/.test(question) ? true : previous?.remind ?? true
  const config = {
    ...anomalyTaskTemplate,
    title: frequency === 'weekly' ? '每周异常运单简报' : frequency === 'daily' ? anomalyTaskTemplate.title : '异常运单简报',
    frequency,
    weekday: weekly ? weekdays.indexOf(weekly[1].replace('天', '日')) : previous?.weekday ?? null,
    time: clock,
    remind,
  }
  if (previous && Object.keys(config).every(key => config[key] === previous[key])) return null
  return config
}

const exampleIssues = {
  'water-1': '到港进度待确认。请联系承运方核实最新预计到港时间。',
  'truck-3': '签收回单待核对。请核实回单后再继续办理结算。',
}

function makeResult(task, run, completedAt) {
  const records = waybillRows.filter(row => Object.hasOwn(exampleIssues, row.key))
  const date = dateFormat.format(new Date(completedAt))
  const summary = records.length ? '发现 ' + records.length + ' 条待跟进异常运单。' : '当前范围内无待处理异常运单。'
  return {
    id: run.id,
    taskId: task.id,
    title: task.title + ' · ' + date,
    resultType: 'scheduled-brief',
    resultLabel: '定时简报',
    date,
    generatedAt: formatRunTime(completedAt),
    completedAt,
    summary,
    reasoning: ['按任务范围「' + task.scope + '」查询执行时的演示数据。', '保留未处理的异常并按运单整理待跟进事项。'],
    sections: [
      { title: '本次查询范围', text: task.scope + ' · ' + task.prompt },
      ...records.map(record => ({
        title: record.waybillNo,
        text: [transportLabels[record.transportMode], record.statusLabel].join(' · ') + '。' + exampleIssues[record.key],
        page: 'waybillCenterDetail',
        query: { key: record.key },
        action: '查看运单 ' + record.waybillNo,
      })),
    ],
  }
}

function normalizeLegacyRun(run) {
  if (run.scope !== legacyDefaultScope) return run
  run.scope = allWaybills
  if (run.result) {
    // 旧默认范围的演示执行已查询全部运单，此处只校正范围文案。
    for (const section of run.result.sections || []) {
      if (section.title === '本次查询范围') section.text = section.text.replace(legacyDefaultScope, allWaybills)
    }
    run.result.reasoning = run.result.reasoning?.map(line => line.replace(legacyDefaultScope, allWaybills))
  }
  return run
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (Array.isArray(saved?.tasks) && Array.isArray(saved?.runs)) {
      return {
        tasks: saved.tasks.map(task => ({ ...task, scope: allWaybills })),
        runs: saved.runs.map(normalizeLegacyRun),
      }
    }
  } catch { /* 本地记录不可用时从空列表开始。 */ }
  return { tasks: [], runs: [] }
}

export function useScheduledTasks() {
  const saved = loadTasks()
  const tasks = ref(saved.tasks)
  const runs = ref(saved.runs.map(run => run.status === 'running'
    ? { ...run, status: 'failed', error: '上次试运行中断，可以重新运行。' }
    : run))
  const results = computed(() => runs.value.flatMap(run => run.result ? [run.result] : []))
  watch([tasks, runs], () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tasks: tasks.value, runs: runs.value }))
    } catch { /* 存储不可用时保留本次页面中的记录。 */ }
  }, { deep: true, flush: 'sync' })

  function saveTask(config) {
    const existing = tasks.value.find(task => task.id === config.id)
    if (existing) {
      Object.assign(existing, config)
      return existing
    }
    const task = { ...config, id: crypto.randomUUID(), enabled: true }
    tasks.value.unshift(task)
    return task
  }

  async function runNow(taskId) {
    const task = tasks.value.find(item => item.id === taskId)
    if (!task || runs.value.some(run => run.taskId === taskId && run.status === 'running')) return null
    const snapshot = { ...task }
    const run = { id: crypto.randomUUID(), taskId, title: task.title, scope: task.scope, startedAt: Date.now(), status: 'running' }
    runs.value.unshift(run)
    await new Promise(resolve => setTimeout(resolve, 650))
    const savedRun = runs.value.find(item => item.id === run.id)
    const completedAt = Date.now()
    Object.assign(savedRun, { status: 'completed', result: makeResult(snapshot, run, completedAt) })
    return savedRun
  }

  function toggleTask(id) {
    const task = tasks.value.find(item => item.id === id)
    if (task) task.enabled = !task.enabled
  }

  return { tasks, runs, results, saveTask, runNow, toggleTask }
}
