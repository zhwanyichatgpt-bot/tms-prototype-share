/**
 * 公路集装箱批量补录 —— 任务、候选箱池与车次行 Mock 数据。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 *
 * 批量补录锁定单个运输任务，表格列由任务路段（route.stages）派生，
 * 不同路线形态的任务因此得到不同的作业时间与重量列。
 */

const DRIVERS = ['王强', '李明', '张建国', '刘卫东', '陈志远', '赵大勇', '孙立新', '周文斌']
const PLATE_PREFIXES = ['苏A', '苏B', '皖A', '皖B', '浙A', '苏C']
const PLATE_SUFFIXES = ['8M320', '6T111', '9K888', '3F216', '2P507', '7Q933', '5N118', '1R624']
const CHASSIS_LETTERS = 'ABCDEFGH'

function buildPool({ count, containerSeed, sealSeed, containerKeys }) {
  return Array.from({ length: count }, (_, index) => ({
    key: `pool-box-${containerSeed + index}`,
    containerNo: `MSCU${containerSeed + index}`,
    sealNo: `SEAL${sealSeed + index}`,
    chassisNo: `架${CHASSIS_LETTERS[index % 8]}${String(1 + Math.floor(index / 8)).padStart(3, '0')}`,
    /* 箱池中的每个箱号自带箱型，用于校验所选箱号与行内箱型一致。 */
    containerKey: containerKeys[index % containerKeys.length],
  }))
}

function taskInfo(number, status, assignedAt) {
  return {
    number, status, carrier: '至简测试企业', dispatcher: '运输部',
    assigningCompany: '至简测试企业', assignedAt,
  }
}

/* 普通路线：提空 → 装货 → 卸货 → 还空，三个路段。 */
const directRoute = {
  pattern: '提空还空',
  nodes: [
    { key: 'pickup-empty', type: '提空', city: '江苏省｜南京市', address: '南京龙潭集装箱堆场' },
    { key: 'load', type: '装货', city: '江苏省｜南京市', address: '南京江宁物流仓库' },
    { key: 'unload', type: '卸货', city: '安徽省｜合肥市', address: '合肥经开区制造基地' },
    { key: 'return-empty', type: '还空', city: '安徽省｜合肥市', address: '合肥港集装箱堆场' },
  ],
  stages: [
    { key: 'empty-pickup', name: '空箱提运', type: 'simple', nodeKeys: ['pickup-empty'] },
    { key: 'loaded-transport', name: '重箱运输', type: 'cargo', loadKey: 'load', unloadKey: 'unload' },
    { key: 'empty-return', name: '空箱归还', type: 'simple', nodeKeys: ['return-empty'] },
  ],
}

const directRouteNingbo = {
  ...directRoute,
  nodes: [
    { key: 'pickup-empty', type: '提空', city: '上海市｜上海市', address: '上海外高桥集装箱堆场' },
    { key: 'load', type: '装货', city: '上海市｜上海市', address: '上海临港装备仓库' },
    { key: 'unload', type: '卸货', city: '浙江省｜宁波市', address: '宁波北仑装备基地' },
    { key: 'return-empty', type: '还空', city: '浙江省｜宁波市', address: '宁波北仑港堆场' },
  ],
}

export const batchTasks = [
  {
    key: 'batch-direct-nanjing-hefei',
    info: taskInfo('YSRW-2609281013282124', '运输中', '2026-09-28 10:13:28'),
    startAlias: '龙潭堆场',
    endAlias: '合肥港堆场',
    /* 一个任务可含多个箱型，各箱型货品不同。 */
    containers: [
      { key: '40gp-parts', containerType: '普通干货箱', size: '40GP', cargo: '电子配件', taskCount: 300 },
      { key: '20gp-machine', containerType: '普通干货箱', size: '20GP', cargo: '机械设备', taskCount: 120 },
    ],
    assignmentMode: '入场匹配',
    candidateContainers: buildPool({
      count: 420, containerSeed: 1200001, sealSeed: 80001,
      containerKeys: ['40gp-parts', '40gp-parts', '20gp-machine'],
    }),
    route: directRoute,
  },
  {
    key: 'batch-direct-shanghai-ningbo',
    info: taskInfo('YSRW-2609281442086617', '运输中', '2026-09-28 14:42:08'),
    startAlias: '外高桥堆场',
    endAlias: '北仑港堆场',
    containers: [
      { key: '40hc-steel', containerType: '普通干货箱', size: '40HC', cargo: '钢材', taskCount: 260 },
    ],
    assignmentMode: '固定指派',
    candidateContainers: buildPool({
      count: 260, containerSeed: 2300001, sealSeed: 90001,
      containerKeys: ['40hc-steel'],
    }),
    route: directRouteNingbo,
  },
]

/* 箱型 → 货品映射，用于行内选择箱型后带出货品。 */
export function cargoOf(task, containerKey) {
  return task?.containers.find(item => item.key === containerKey)?.cargo || ''
}

export function containerOptionsOf(task) {
  return (task?.containers || []).map(item => ({
    key: item.key,
    label: `${item.size}｜${item.containerType}`,
    size: item.size,
    cargo: item.cargo,
  }))
}

/* 表格列由任务路段派生：simple 路段一条作业时间，cargo 路段装卸时间与重量。 */
export function buildColumnGroups(task) {
  if (!task) return []
  const nodeByKey = Object.fromEntries(task.route.nodes.map(node => [node.key, node]))
  return task.route.stages.map(stage => {
    if (stage.type === 'cargo') {
      return {
        key: stage.key,
        name: stage.name,
        columns: [
          { key: `${stage.key}-load-time`, label: `${nodeByKey[stage.loadKey].type}时间`, kind: 'time', nodeKey: stage.loadKey, width: 146 },
          { key: `${stage.key}-load-weight`, label: '装货重量(吨)', kind: 'weight', nodeKey: 'load', width: 78 },
          { key: `${stage.key}-unload-time`, label: `${nodeByKey[stage.unloadKey].type}时间`, kind: 'time', nodeKey: stage.unloadKey, width: 146 },
          { key: `${stage.key}-unload-weight`, label: '卸货重量(吨)', kind: 'weight', nodeKey: 'unload', width: 78 },
        ],
      }
    }
    return {
      key: stage.key,
      name: stage.name,
      columns: stage.nodeKeys.map(nodeKey => ({
        key: `${stage.key}-${nodeKey}`,
        label: `${nodeByKey[nodeKey].type}时间`,
        kind: 'time',
        nodeKey,
        width: 146,
      })),
    }
  })
}

export function dynamicColumnsOf(task) {
  return buildColumnGroups(task).flatMap(group => group.columns)
}

/* 校验与展示共用的节点顺序（按任务路线真实顺序）。 */
export function nodeSequenceOf(task) {
  if (!task) return []
  const nodeByKey = Object.fromEntries(task.route.nodes.map(node => [node.key, node]))
  return dynamicColumnsOf(task)
    .filter(column => column.kind === 'time')
    .map(column => ({ key: column.nodeKey, label: nodeByKey[column.nodeKey].type }))
}

function stamp(day, hour, minute) {
  return `2026-09-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/* 车次行：一行 = 一个车次 = 一张运单；每 4 车出现一次双箱；一车只允许同一箱型。 */
export function buildTaskRows(task, { count = 300, withAnomalies = true } = {}) {
  const pool = task.candidateContainers
  /* 按箱型分组各维护独立游标：双箱车次取到同箱型箱号，且不修改原箱池。 */
  const queues = new Map()
  pool.forEach(box => {
    if (!queues.has(box.containerKey)) queues.set(box.containerKey, [])
    queues.get(box.containerKey).push(box)
  })
  const keys = [...queues.keys()]
  const cursors = new Map(keys.map(key => [key, 0]))
  const take = key => {
    const list = queues.get(key) || []
    const cursor = cursors.get(key) || 0
    if (cursor >= list.length) return null
    cursors.set(key, cursor + 1)
    return list[cursor]
  }
  const hasAny = () => keys.some(key => (cursors.get(key) || 0) < (queues.get(key) || []).length)

  const rows = []
  let keyCursor = 0
  for (let index = 0; index < count; index += 1) {
    if (!hasAny()) break
    /* 轮询箱型，使同一批内不同箱型的车次混合出现。 */
    let first = null
    for (let attempt = 0; attempt < keys.length && !first; attempt += 1) {
      first = take(keys[keyCursor % keys.length])
      keyCursor += 1
    }
    if (!first) break
    const second = index % 4 === 0 ? take(first.containerKey) : null
    const day = 20 + Math.floor(index / 150)
    const baseHour = 6 + (index % 3)
    const minute = (index * 7) % 60
    const loadWeight = (28 + (index % 5) * 0.5).toFixed(2)
    rows.push({
      key: `${task.key}-row-${index + 1}`,
      seq: index + 1,
      selected: false,
      containerKey: first.containerKey,
      cargo: cargoOf(task, first.containerKey),
      driver: DRIVERS[index % DRIVERS.length],
      phone: `138${String(10000000 + index * 137).slice(0, 8)}`,
      plateNo: `${PLATE_PREFIXES[index % PLATE_PREFIXES.length]}${PLATE_SUFFIXES[index % PLATE_SUFFIXES.length]}`,
      chassisNo: first.chassisNo,
      boxes: [
        { containerNo: first.containerNo, sealNo: first.sealNo },
        { containerNo: second ? second.containerNo : '', sealNo: second ? second.sealNo : '' },
      ],
      times: {
        'pickup-empty': stamp(day, baseHour, minute),
        load: stamp(day, baseHour + 2, minute),
        unload: stamp(day, baseHour + 11, minute),
        'return-empty': stamp(day, baseHour + 13, minute),
      },
      weights: {
        load: loadWeight,
        unload: (Number(loadWeight) - 0.08).toFixed(2),
      },
    })
  }
  if (withAnomalies) applyAnomalies(rows)
  return rows
}

/* 预置异常行，用于展示全量校验效果（时间选填，故异常集中在箱号、必填与格式）。 */
function applyAnomalies(rows) {
  if (rows.length < 210) return
  rows[6].boxes[0].containerNo = 'MSCU9999999'
  rows[24].boxes[1].containerNo = rows[20].boxes[1].containerNo
  rows[24].boxes[1].sealNo = rows[20].boxes[1].sealNo
  rows[57].times.unload = rows[57].times['pickup-empty']
  rows[120].boxes[0].containerNo = ''
  rows[199].driver = ''
}

const TEMPLATE_HEAD = ['箱型', '货品', '司机', '联系电话', '车牌号', '车架号', '实际箱号1', '铅封号1', '实际箱号2', '铅封号2']

export function templateHeader(task) {
  return [...TEMPLATE_HEAD, ...dynamicColumnsOf(task).map(column => column.label)]
}

export function rowToCells(row, task) {
  const option = containerOptionsOf(task).find(item => item.key === row.containerKey)
  return [
    option ? option.label : '', row.cargo || '',
    row.driver, row.phone, row.plateNo, row.chassisNo,
    row.boxes[0].containerNo, row.boxes[0].sealNo, row.boxes[1].containerNo, row.boxes[1].sealNo,
    ...dynamicColumnsOf(task).map(column => (
      column.kind === 'time' ? row.times[column.nodeKey] : row.weights[column.nodeKey]
    )),
  ]
}

export function templateCsvText(task) {
  const sample = buildTaskRows(task, { count: 1, withAnomalies: false })[0]
  return [templateHeader(task).join(','), rowToCells(sample, task).join(',')].join('\n')
}

export function templateTsvText(task, count = 300) {
  const rows = buildTaskRows(task, { count, withAnomalies: true })
  return [templateHeader(task).join('\t'), ...rows.map(row => rowToCells(row, task).join('\t'))].join('\n')
}

export function parseTsv(text, task) {
  const columns = dynamicColumnsOf(task)
  const options = containerOptionsOf(task)
  const lines = String(text).split(/\r?\n/).filter(line => line.trim())
  if (lines.length <= 1) return []
  return lines.slice(1).map((line, index) => {
    const cells = line.split('\t').map(cell => cell.trim())
    /* 箱型列按标签匹配既有选项；匹配不到时回退到该任务首个箱型，交由校验提示。 */
    const matched = options.find(item => item.label === cells[0] || item.size === cells[0])
    const containerKey = matched ? matched.key : (options[0]?.key || '')
    const row = {
      key: `${task.key}-import-${index + 1}`,
      seq: index + 1,
      selected: false,
      containerKey,
      cargo: matched ? matched.cargo : (cells[1] || ''),
      driver: cells[2] || '',
      phone: cells[3] || '',
      plateNo: cells[4] || '',
      chassisNo: cells[5] || '',
      boxes: [
        { containerNo: cells[6] || '', sealNo: cells[7] || '' },
        { containerNo: cells[8] || '', sealNo: cells[9] || '' },
      ],
      times: {},
      weights: {},
    }
    columns.forEach((column, columnIndex) => {
      const value = cells[10 + columnIndex] || ''
      if (column.kind === 'time') row.times[column.nodeKey] = value
      else row.weights[column.nodeKey] = value
    })
    return row
  })
}
