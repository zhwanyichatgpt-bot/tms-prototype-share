// 应用名称来自用户提供的既有目录；其他业务大类暂不填充未确认应用。
export const appDomains = [
  { id: 'transport', name: '运输' },
  { id: 'warehouse', name: '仓储' },
  { id: 'station', name: '场站' },
  { id: 'value-added', name: '增值服务' },
]

export const appGroups = [
  { id: 'transport-business', domainId: 'transport', name: '运输业务' },
  { id: 'energy', domainId: 'transport', name: '能耗管理' },
  { id: 'safety', domainId: 'transport', name: '安全管控' },
]

const business = [
  ['consignment', '托运单管理', 'document'],
  ['booking', '托运订单管理', 'document'],
  ['channel', '运输通道', 'route'],
  ['intermodal', '联运计划', 'route'],
  ['road', '公路运输', 'truck'],
  ['water', '水路运输', 'ship'],
  ['rail', '铁路运输', 'train'],
  ['container', '集装箱调度', 'container'],
  ['bulk', '散杂货调度', 'crane'],
  ['task', '运输任务', 'task'],
  ['waybill', '运单中心', 'document'],
  ['settlement', '运输结算', 'wallet'],
  ['captain', '船长明细', 'person'],
  ['vessel', '船舶明细', 'ship'],
  ['statement', '对账单管理', 'search-document'],
]

const energy = [
  ['refuel', '加油管理', 'energy'],
  ['gas', '加气管理', 'energy'],
  ['oil-monitor', '油量监控', 'chart'],
  ['gas-monitor', '气量监控', 'chart'],
  ['electric-monitor', '电量监控', 'energy'],
  ['electric-analysis', '电量分析', 'chart'],
  ['carbon', '碳中和分析', 'leaf'],
  ['oil-record', '油量动态明细', 'document'],
  ['vehicle-fuel', '车辆油耗分析', 'truck'],
  ['charging', '充换电管理', 'energy'],
  ['fuel-assessment', '油耗考核', 'task'],
]

const safety = [
  ['alarm', '报警明细', 'alert'],
  ['snapshot', '闪拍监控', 'camera'],
  ['evidence', '存证中心', 'document'],
  ['alarm-policy', '报警策略设置', 'shield'],
  ['alarm-handling', '报警处置记录', 'task'],
  ['fence-alarm', '围栏报警设置', 'route'],
  ['escort', '陪护记录', 'person'],
  ['danger-video', '危险报警视频', 'camera'],
  ['fence-record', '围栏出入明细', 'route'],
  ['command', '指令下发记录', 'document'],
  ['driver-blacklist', '司机黑名单管理', 'person'],
  ['risk', '风控中心', 'shield'],
]

const colors = ['blue', 'teal', 'purple']
function createApps(rows, groupId, version = '') {
  return rows.map(([id, name, icon], index) => ({
    id, name, icon, version, groupId, domainId: 'transport',
    tone: colors[index % colors.length],
  }))
}

export const applicationCatalog = [
  ...createApps(business, 'transport-business', '3.0'),
  ...createApps(energy, 'energy'),
  ...createApps(safety, 'safety'),
]
export const defaultCommonApps = ['waybill', 'intermodal', 'road']
export const commonAppsStorageKey = 'lianyun-common-apps-v1'

export function normalizeCommonApps(value) {
  if (!Array.isArray(value)) return [...defaultCommonApps]
  const validIds = new Set(applicationCatalog.map(app => app.id))
  return [...new Set(value.filter(id => validIds.has(id)))]
}

export function searchApplications(value) {
  const query = String(value || '').trim().toLowerCase()
  if (!query) return applicationCatalog
  return applicationCatalog.filter(app => {
    const group = appGroups.find(item => item.id === app.groupId)
    return `${app.name}${app.version}运输${group.name}`.toLowerCase().includes(query)
  })
}
