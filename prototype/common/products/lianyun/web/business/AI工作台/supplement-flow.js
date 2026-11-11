import { batchTasks, buildTaskRows } from '../运单中心/公路批量补录/mock-data.js'

const copy = value => JSON.parse(JSON.stringify(value))
const emptyBox = () => ({ containerNo: '', sealNo: '' })
const shortHaulDriverNames = ['陈海峰', '周建平', '黄志勇', '梁国华', '韦永新', '罗振华', '陆志明', '覃建军', '刘海波', '李建国', '吴晓东']
const shortHaulDriverName = number => shortHaulDriverNames[number - 1]
const shortHaulPlate = number => `桂A${88000 + number}D`

export const driverChoices = [
  { id: 'driver-a', name: '张强', phone: '13800001236', company: '至简测试企业', plate: '苏A8M320' },
  { id: 'driver-b', name: '张强', phone: '13900005678', company: '示例运输企业', plate: '皖A9K888' },
]
export const shortHaulDriverChoices = [
  { id: 'short-haul-a', name: shortHaulDriverName(10), phone: '13800001236', company: '示例承运企业', plate: '桂A88020D' },
  { id: 'short-haul-b', name: shortHaulDriverName(10), phone: '13900005678', company: '示例运输企业', plate: '桂A88021D' },
]
const shortHaulDriverDirectory = new Map(Array.from({ length: 9 }, (_, index) => {
  const number = index + 1
  return [`${shortHaulDriverName(number)}|${shortHaulPlate(number)}`, `13800002${String(number).padStart(3, '0')}`]
}))

function matchShortHaulPhones(group) {
  if (!group.tripQuestions || group.driverPhonesMatched || group.completed) return
  for (const row of [...group.rows, ...group.deferred]) {
    const phone = shortHaulDriverDirectory.get(`${row.driver}|${row.plateNo}`)
    if (phone && !String(row.phone || '').trim()) row.phone = phone
  }
  group.driverPhonesMatched = true
}

export function createSupplementState(fileName = '', taskKey = '') {
  return { version: 2, workspaceOpen: false, fileName, taskKey, loaded: false, currentId: '', groups: [], records: [], history: [], notice: '' }
}

export function loadSupplementExample(state) {
  if (state.loaded) return
  if (!batchTasks.some(task => task.key === state.taskKey)) {
    state.fileName = '公路短驳运输明细（脱敏示例）.xlsx'
    loadRoadExample(state)
    return
  }
  state.fileName = '示例运输明细.xlsx'
  const tasks = copy(batchTasks)
  tasks[0].info.dispatcher = '—'
  tasks[0].info.assignedAt = '—'
  tasks[0].info.assigningCompany = '—'
  let line = 1
  state.groups = tasks.map((task, index) => {
    const rows = buildTaskRows(task, { count: index === 0 ? 2 : 1, withAnomalies: false })
    rows.forEach(row => {
      row.times = {}
      row.weights = {}
      row.sourceIds = row.boxes.filter(box => box.containerNo).map(box => {
        const id = line++
        state.records.push({ id, date: '2026-09-28', start: task.startAlias, end: task.endAlias, plate: row.plateNo, driver: index === 0 && row.seq === 1 ? '张强' : row.driver, box: box.containerNo })
        return id
      })
    })
    if (index === 0) { rows[0].driver = '张强'; rows[0].phone = '' }
    const expectedPlate = rows[0].plateNo
    if (index === 1) {
      rows[0].plateNo = '苏A8M321'
      state.records.filter(item => rows[0].sourceIds.includes(item.id)).forEach(item => { item.plate = rows[0].plateNo })
    }
    return {
      id: `group-${index}`, task, rows, matched: state.taskKey === task.key,
      candidate: task.key, tripDecision: index === 0 ? '' : 'same', driverId: '',
      dispatched: index === 1, expectedPlate, bindingConfirmed: false,
      results: [], deferred: [], completed: false,
    }
  })
  state.loaded = true
  state.currentId = state.groups.find(group => group.task.key === state.taskKey)?.id || state.groups[0].id
  state.history.push('示例运输明细已载入，包含两个运输任务。原始记录按箱登记，重量和作业时间留空。')
}

export function confirmSupplementTask(group) {
  if (!group.candidate) return false
  group.matched = true
  matchShortHaulPhones(group)
  return true
}

export function decideSupplementTrip(group, decision) {
  if (group.tripQuestions) {
    const question = pendingTrip(group)
    if (!question || !['same', 'separate'].includes(decision)) return
    if (decision === 'same') {
      const first = group.rows.find(row => row.sourceIds[0] === question.ids[0])
      const second = group.rows.find(row => row.sourceIds[0] === question.ids[1])
      first.sourceIds.push(...second.sourceIds)
      first.boxes[1] = second.boxes[0]
      group.rows = group.rows.filter(row => row !== second)
      group.rows.forEach((row, index) => { row.seq = index + 1 })
    }
    question.decision = decision
    return
  }
  if (group.tripDecision || !['same', 'separate'].includes(decision)) return
  const first = group.rows[0]
  if (decision === 'separate') {
    const second = copy(first)
    second.key += '-second'
    second.sourceIds = first.sourceIds.slice(1)
    second.boxes = [copy(first.boxes[1]), emptyBox()]
    first.sourceIds = first.sourceIds.slice(0, 1)
    first.boxes[1] = emptyBox()
    group.rows.splice(1, 0, second)
  }
  group.tripDecision = decision
  group.rows.forEach((row, index) => { row.seq = index + 1 })
}

export function selectSupplementDriver(group, id) {
  const driver = (group.tripQuestions ? shortHaulDriverChoices : driverChoices).find(item => item.id === id)
  if (!driver) return
  group.driverId = id
  group.driverConfirmedName = driver.name
  group.rows.filter(row => group.tripQuestions
    ? row.driver === driver.name && row.plateNo === shortHaulPlate(10) && !String(row.phone || '').trim()
    : row.sourceIds.some(source => source <= 2)).forEach(row => {
    row.driver = driver.name
    row.phone = driver.phone
  })
}

export function supplementIssues(group) {
  if (!group || group.completed || !group.rows.length) return []
  const issues = []
  const missingPhone = group.rows.filter(row => !String(row.phone || '').trim())
  if (!group.matched) issues.push({ id: 'task', text: '请先确认运输任务。' })
  if (group.tripQuestions) {
    const trip = pendingTrip(group)
    if (trip) issues.push({ id: 'trip', text: `请确认原表第 ${trip.ids.join('、')} 行实际跑了几趟。` })
    if (!group.weightDecision) issues.push({ id: 'weight', text: '请确认是否将石场磅单值填入装货重量。' })
    if (missingPhone.some(row => row.driver === shortHaulDriverName(10) && row.plateNo === shortHaulPlate(10))) {
      issues.push({ id: 'driver', text: `司机“${shortHaulDriverName(10)}”存在同名档案，请确认具体司机或填写已核实的手机号。` })
    }
    if (missingPhone.length) issues.push({ id: 'phone', text: `还有 ${missingPhone.length} 趟缺少司机手机号。请补齐或暂缓这些车次。` })
    return issues
  }
  if (!group.tripDecision && group.rows.some(row => row.sourceIds.some(id => id <= 2))) issues.push({ id: 'trip', text: '原表第1、2行是同一趟运输，还是分两趟运输？' })
  const ambiguousRows = group.rows.filter(row => row.sourceIds.some(id => id <= 2))
  if (ambiguousRows.some(row => row.driver === '张强') && !group.driverId) issues.push({ id: 'driver', text: '司机“张强”存在同名档案，请确认具体司机。' })
  if (group.dispatched && group.rows.some(row => row.plateNo !== group.expectedPlate)) issues.push({ id: 'binding', text: `运输明细车辆与已有派车记录 ${group.expectedPlate} 不一致。` })
  if (group.dispatched && !group.bindingConfirmed && !issues.some(item => item.id === 'binding')) issues.push({ id: 'binding-check', text: '车辆已调整，请确认已核实原始运输明细。' })
  if (missingPhone.length) issues.push({ id: 'phone', text: `还有 ${missingPhone.length} 趟缺少司机手机号。请补齐或暂缓这些车次。` })
  return issues
}

export function deferSupplementRows(group, rows) {
  const keys = new Set(rows.map(row => row.key))
  group.deferred.push(...copy(rows))
  group.rows = group.rows.filter(row => !keys.has(row.key))
  group.rows.forEach((row, index) => { row.seq = index + 1 })
}

export function finishSupplementGroup(group) {
  if (group.completed || supplementIssues(group).length || !group.rows.length) return false
  const offset = group.results.length
  group.results.push(...group.rows.map((row, index) => ({
    number: `DEMO-${group.id.slice(-1)}-${String(offset + index + 1).padStart(3, '0')}`,
    driver: row.driver, plate: row.plateNo, boxes: row.boxes.filter(box => box.containerNo).map(box => box.containerNo), sourceIds: [...row.sourceIds],
  })))
  group.completed = true
  return true
}


// 从客户短驳明细保留日期、行序、两组同车多箱和两列重量，人员、车牌、箱号用演示标识。
const shortHaulRows = [
  [1, '31.8', '31.8'], [2, '31.85', '31.85'], [3, '31.85', '31.85'],
  [4, '32.4', '32.3'], [5, '32.15', '32.15'], [6, '32.05', '32'],
  [6, '32', '32'], [7, '31.35', '31.35'], [8, '32.45', '31.95'],
  [8, '32.05', '32.05'], [9, '31.75', '31.75'], [10, '31.85', '31.85'],
  [11, '31.9', '31.9'],
]

const shortHaulTaskInfo = {
  number: 'YSRW-2610030815301024',
  status: '运输中',
  carrier: '示例承运企业',
  dispatcher: '—',
  assignedAt: '—',
  assigningCompany: '—',
  plannedDateRange: '2026-10-03 至 2026-10-05',
  loadContact: '周师傅',
  unloadContact: '陈师傅',
}

export function refreshSupplementExample(state, messages = []) {
  if (state?.groups?.some(group => group.task.key === 'short-haul-demo')) {
    const replaceDemoNames = text => text?.replace(/示例司机(0[1-9]|1[01])(?!\d)/g, (_, number) => shortHaulDriverName(Number(number)))
    for (const record of state.records || []) record.driver = replaceDemoNames(record.driver)
    for (const group of state.groups) {
      if (group.task.key !== 'short-haul-demo') continue
      for (const row of [...group.rows, ...group.deferred, ...group.results]) row.driver = replaceDemoNames(row.driver)
      if (group.driverConfirmedName) group.driverConfirmedName = replaceDemoNames(group.driverConfirmedName)
    }
    for (const message of messages) {
      if (message.supplementPrompt && message.answer) message.answer.title = replaceDemoNames(message.answer.title)
      if (message.role === 'user' && /^你?确认司机为示例司机\d{2}，手机号尾号 \d{4}。$/.test(message.text)) {
        message.text = replaceDemoNames(message.text)
      }
    }
  }
  for (const group of state?.groups || []) {
    if (group.task.key === 'short-haul-demo' && group.task.info.number === 'YSRW-DEMO-1003') {
      Object.assign(group.task.info, shortHaulTaskInfo)
    }
    if (group.matched) matchShortHaulPhones(group)
  }
}

function loadRoadExample(state) {
  state.records = shortHaulRows.map(([driver, siteWeight, railWeight], index) => ({
    id: index + 2, date: index === 12 ? '2026-10-05' : '2026-10-03',
    driver: shortHaulDriverName(driver),
    plate: shortHaulPlate(driver),
    box: `DEMU${String(1000001 + index)}`,
    start: '陇蒙山', end: '钦州货场', unloadCode: '101', cargo: '5-8',
    siteWeight, railWeight,
  }))
  const task = {
    key: 'short-haul-demo', startAlias: '陇蒙山', endAlias: '钦州货场',
    info: { ...shortHaulTaskInfo },
    containers: [{ key: '20gp-stone', containerType: '普通干货箱', size: '20GP', cargo: '石料（5-8）', taskCount: 13 }],
    assignmentMode: '入场匹配',
    candidateContainers: state.records.map(record => ({
      key: `pool-${record.id}`, containerNo: record.box, containerKey: '20gp-stone',
    })),
    route: {
      pattern: '重箱短驳',
      nodes: [
        { key: 'load', type: '装货', city: '广西', address: '陇蒙山' },
        { key: 'unload', type: '卸货', city: '广西｜钦州市', address: '钦州货场' },
      ],
      stages: [{ key: 'loaded-transport', name: '重箱运输', type: 'cargo', loadKey: 'load', unloadKey: 'unload' }],
    },
  }
  const rows = state.records.map((record, index) => ({
    key: `short-haul-row-${record.id}`, seq: index + 1, selected: false,
    containerKey: task.containers[0].key, cargo: task.containers[0].cargo,
    driver: record.driver, phone: '', plateNo: record.plate, chassisNo: '',
    boxes: [{ containerNo: record.box, sealNo: '' }, emptyBox()],
    times: {}, weights: {}, sourceIds: [record.id],
  }))
  const sameVehicle = new Map()
  for (const record of state.records) {
    const key = [record.date, record.driver, record.plate].join('|')
    const ids = sameVehicle.get(key) || []
    ids.push(record.id)
    sameVehicle.set(key, ids)
  }
  const tripQuestions = [...sameVehicle.values()].filter(ids => ids.length === 2).map(ids => ({ ids, decision: '' }))
  state.groups = [{
    id: 'group-0', task, rows, matched: false, candidate: task.key,
    tripQuestions, weightDecision: '', dispatched: false, results: [], deferred: [], completed: false,
  }]
  state.loaded = true
  state.currentId = 'group-0'
}

export function pendingTrip(group) {
  return group?.tripQuestions?.find(question => !question.decision)
}

export function decideSupplementWeight(group, records, useSiteWeight) {
  const weightsById = new Map(records.map(record => [record.id, Math.round(Number(record.siteWeight) * 100)]))
  if (useSiteWeight) {
    for (const row of group.rows) {
      const total = row.sourceIds.reduce((sum, id) => sum + weightsById.get(id), 0)
      row.weights.load = (total / 100).toFixed(2)
    }
  }
  group.weightDecision = useSiteWeight ? 'site' : 'blank'
}
