const planScenarios = [
  {
    key: 'bulk-plan', kind: 'bulk',
    info: {
      number: 'GLSZH20260923003', status: '执行中', name: '武汉—曲靖散杂货公路运输计划',
      transportType: '散杂货运输', createdAt: '2026-09-23 09:45:18', creator: '运输部',
    },
    bulk: {
      vehicle: '鄂A6K528', driver: '张强',
      loadCity: '湖北省｜武汉市', loadAddress: '武汉市江汉区发展大道185号',
      unloadCity: '云南省｜曲靖市', unloadAddress: '曲靖市马龙区041县道',
      cargoRows: [{ key: 'steel-coil', cargo: '热轧卷板（Q355B）｜其他', transportedWeight: '0.00', remainingWeight: '32.00', loadWeight: '31.80', unloadWeight: '31.72' }],
      loadTime: '2026-09-23 12:35:00', unloadTime: '2026-09-24 20:30:00',
      loadProof: '装货凭证 1份', unloadProof: '卸货凭证 1份',
    },
  },
  {
    key: 'direct-plan', kind: 'container',
    info: {
      number: 'GLJZX20260923001', status: '执行中', name: '南京—合肥集装箱公路运输计划',
      transportType: '集装箱运输', createdAt: '2026-09-23 09:18:36', creator: '运输部',
    },
    containerRows: [
      { key: '40gp-machine', containerType: '普通干货箱', size: '40GP', cargo: '机械设备', plannedCount: 10, transportedCount: 3, remainingCount: 7 },
      { key: '20gp-parts', containerType: '普通干货箱', size: '20GP', cargo: '电子配件', plannedCount: 6, transportedCount: 2, remainingCount: 4 },
    ],
    actualContainers: [
      { key: 'actual-1', planContainerKey: '40gp-machine', containerNo: 'MSCU1234567', sealNo: 'SEAL89210', chassisNo: '架A001' },
    ],
    segments: [
      {
        key: 'direct-waybill', waybillText: '预计生成1张运单',
        vehicle: '苏A6K528', driver: '张强', phone: '138****8206',
        nodes: [
          { key: 'pickup-empty', type: '提空', city: '江苏省｜南京市', address: '南京龙潭集装箱堆场', actualTime: '2026-09-23 10:20:00', proof: '提空凭证 1张' },
          { key: 'load', type: '装货', city: '江苏省｜南京市', address: '南京江宁物流仓库', actualTime: '2026-09-23 12:35:00', quantity: '28.50', proof: '装货凭证 2张' },
          { key: 'unload', type: '卸货', city: '安徽省｜合肥市', address: '合肥经开区制造基地', actualTime: '2026-09-23 20:30:00', quantity: '28.42', proof: '卸货凭证 2张' },
          { key: 'return-empty', type: '还空', city: '安徽省｜合肥市', address: '合肥港集装箱堆场', actualTime: '2026-09-23 22:18:00', proof: '还空凭证 1张' },
        ],
        stages: [
          { key: 'empty-pickup', name: '空箱提运', startIndex: 0, endIndex: 1, operationIndex: 0, mode: 'simple' },
          { key: 'loaded-transport', name: '重箱运输', startIndex: 1, endIndex: 2, mode: 'cargo', weightMode: 'both' },
          { key: 'empty-return', name: '空箱归还', startIndex: 2, endIndex: 3, operationIndex: 3, mode: 'simple' },
        ],
      },
    ],
  },
  {
    key: 'drop-hook-plan', kind: 'container',
    info: {
      number: 'GLJZX20260923002', status: '执行中', name: '南京甩挂接续—合肥集装箱运输计划',
      transportType: '集装箱运输', createdAt: '2026-09-23 10:06:12', creator: '运输部',
    },
    containerRows: [
      { key: '40gp-steel', containerType: '普通干货箱', size: '40GP', cargo: '钢材', plannedCount: 8, transportedCount: 2, remainingCount: 6 },
    ],
    actualContainers: [
      { key: 'actual-drop-1', planContainerKey: '40gp-steel', containerNo: 'TGHU7654321', sealNo: 'SEAL66318', chassisNo: '架B008' },
    ],
    segments: [
      {
        key: 'drop-waybill', waybillText: '预计生成运单1',
        vehicle: '苏A6K528', driver: '张强', phone: '138****8206',
        nodes: [
          { key: 'pickup-empty', type: '提空', city: '江苏省｜南京市', address: '南京龙潭集装箱堆场', actualTime: '2026-09-23 09:10:00', proof: '提空凭证 1张' },
          { key: 'load', type: '装货', city: '江苏省｜南京市', address: '南京江宁钢材仓库', actualTime: '2026-09-23 11:20:00', quantity: '31.80', proof: '装货凭证 2张' },
          { key: 'drop-trailer', type: '甩挂', city: '江苏省｜南京市', address: '南京绕城甩挂场', actualTime: '2026-09-23 14:05:00', proof: '甩挂凭证 1张' },
        ],
        stages: [
          { key: 'empty-pickup', name: '空箱提运', startIndex: 0, endIndex: 1, operationIndex: 0, mode: 'simple' },
          { key: 'load-to-drop', name: '装货至甩挂', startIndex: 1, endIndex: 2, mode: 'cargo', weightMode: 'load' },
        ],
      },
      {
        key: 'hook-waybill', waybillText: '预计生成运单2',
        vehicle: '皖A8N736', driver: '李明', phone: '139****1752',
        nodes: [
          { key: 'hook-trailer', type: '提挂', city: '江苏省｜南京市', address: '南京绕城甩挂场', actualTime: '2026-09-23 15:10:00', proof: '提挂凭证 1张' },
          { key: 'unload', type: '卸货', city: '安徽省｜合肥市', address: '合肥经开区钢材基地', actualTime: '2026-09-23 20:40:00', quantity: '31.72', proof: '卸货凭证 2张' },
          { key: 'return-empty', type: '还空', city: '安徽省｜合肥市', address: '合肥港集装箱堆场', actualTime: '2026-09-23 22:35:00', proof: '还空凭证 1张' },
        ],
        stages: [
          { key: 'hook-to-unload', name: '提挂至卸货', startIndex: 0, endIndex: 1, mode: 'cargo', weightMode: 'unload' },
          { key: 'empty-return', name: '空箱归还', startIndex: 1, endIndex: 2, operationIndex: 2, mode: 'simple' },
        ],
      },
    ],
  },
]

const [bulkPlan, directPlan, dropHookPlan] = planScenarios

const taskInfo = (number, status, assignedAt, carrier = '至简测试企业') => ({
  number, status, carrier, dispatcher: '运输部', assigningCompany: '至简测试企业', assignedAt,
})

const box = (key, containerNo, sealNo, chassisNo) => ({ key, containerNo, sealNo, chassisNo })
const waybill = (source, key, vehicle, driver, phone, containers) => ({
  ...source, key, vehicle, driver, phone, containers,
})

// 任务决定箱型与运输范围；固定指派带出箱号，入场匹配只从该任务候选箱中选择。
export const taskScenarios = [
  {
    key: 'bulk-task', kind: 'bulk', info: taskInfo('YSRW-2609241049494307', '运输中', '2026-09-24 09:49:43'),
    startAlias: '武汉江汉仓', endAlias: '曲靖马龙卸货点',
    bulk: bulkPlan.bulk,
  },
  {
    key: 'direct-fixed-task', kind: 'container', assignmentMode: 'fixed',
    info: taskInfo('YSRW-2609241013282124', '运输中', '2026-09-24 10:13:28'),
    startAlias: '龙潭堆场', endAlias: '合肥港堆场',
    container: { ...directPlan.containerRows[0], taskCount: 3 },
    segment: waybill(directPlan.segments[0], 'fixed-waybill', '苏A6K528', '张强', '138****8206', [
      box('fixed-box-1', 'MSCU1234567', 'SEAL89210', '架A001'),
      box('fixed-box-2', 'MSCU1234568', 'SEAL89211', '架A002'),
    ]),
  },
  {
    key: 'direct-arrival-task', kind: 'container', assignmentMode: 'arrival',
    info: taskInfo('YSRW-2609240944407316', '运输中', '2026-09-24 09:44:40'),
    startAlias: '龙潭堆场', endAlias: '合肥港堆场',
    container: { ...directPlan.containerRows[1], taskCount: 3 },
    candidateContainers: [
      box('candidate-1', 'TGHU2034561', 'SEAL20361', '架C011'),
      box('candidate-2', 'TGHU2034562', 'SEAL20362', '架C012'),
      box('candidate-3', 'TGHU2034563', 'SEAL20363', '架C013'),
      box('candidate-4', 'TGHU2034564', 'SEAL20364', '架C014'),
    ],
    segment: waybill(directPlan.segments[0], 'arrival-waybill', '苏A6K528', '张强', '138****8206', [box('arrival-box-1', '', '', '')]),
  },
  {
    key: 'drop-task', kind: 'container', assignmentMode: 'fixed',
    info: taskInfo('YSRW-2609231423206804', '运输中', '2026-09-23 14:23:20'),
    startAlias: '龙潭堆场', endAlias: '绕城甩挂场',
    container: { ...dropHookPlan.containerRows[0], taskCount: 1 },
    segment: waybill(dropHookPlan.segments[0], 'drop-waybill', '苏A6K528', '张强', '138****8206', [
      box('drop-box-1', 'TGHU7654321', 'SEAL66318', '架B008'),
    ]),
  },
  {
    key: 'hook-task', kind: 'container', assignmentMode: 'fixed',
    info: taskInfo('YSRW-2609231344053238', '运输中', '2026-09-23 13:44:05'),
    startAlias: '绕城甩挂场', endAlias: '合肥港堆场',
    container: { ...dropHookPlan.containerRows[0], taskCount: 1 },
    segment: {
      ...waybill(dropHookPlan.segments[1], 'hook-waybill', '皖A8N736', '李明', '139****1752', [
        box('hook-box-1', 'TGHU7654321', 'SEAL66318', '架B008'),
      ]),
      loadedWeight: '31.80',
    },
  },
]
