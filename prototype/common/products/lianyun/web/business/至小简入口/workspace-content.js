export const workspaceDateText = '2026 年 11 月 06 日'
export const dailyBrief = {
  id: 'daily-brief-20261106',
  resultType: 'brief',
  resultLabel: '早报',
  status: 'completed',
  completedAt: Date.parse('2026-11-06T08:00:00+08:00'),
  startedAt: Date.parse('2026-11-06T08:00:00+08:00'),
  files: [],
  summary: '56项待办、2条异常运单，另有1项单据状态需核对。',
  date: '2026年11月6日',
  generatedAt: '2026年11月6日 08:00',
  title: '2026年11月6日工作早报',
  subtitle: '运输与待办概览',
  reasoning: ['汇总本期示例中的待办、运输异常和单据状态。', '标出需要核对的项目，以及早报中缺少的业务明细。'],
  sections: [
    { title: '待办任务 · 56项', text: '工作台待办包含司机运输申请。建议核对申请资料、计划时间和负责人，按业务要求处理。', action:'查看待办与工作概况', page:'systemWorkbench' },
    { title: '运输概况 · 2条异常运单', text: '运输概况列有2条异常运单。当前汇总未包含异常原因和处理明细，先核对受影响对象及处理进展。', action:'查看运输概况', page:'systemWorkbench' },
    { title: '单据关注 · 状态与进度需核对', text: '托运单 TY20250811000001 标记待执行，当前路段显示50%进度，建议先核对两处状态。成本与到账明细不足，暂不能据此判断毛利和回款。', action:'查看这张托运单', page:'waybillDetail' },
  ],
}

export function makeBriefReply(question) {
  if (/生成|时间|日期|截至/.test(question)) return {title:'早报时间与范围',reasoning:['查看本期早报的生成时间，并检查是否提供了数据采集的截至时间。'],sections:[{heading:'本期时间',paragraphs:['这份早报的生成时间为2026年11月6日08:00。早报没有提供各业务数据的采集截至时间，不能将生成时间等同于全部数据的更新时间。']}]}
  if (/缺少|资料|核对|依据/.test(question)) return {title:'需要补充的信息',reasoning:['对照早报列出的异常运单和单据状态，梳理缺少哪些明细。'],sections:[{heading:'核对范围',paragraphs:['异常运单缺少原因、负责人和处理明细；状态不一致的托运单需要对照单据与路段各自的更新时间。成本与到账明细不足，暂不能判断毛利和回款。']}]}
  return {title:'本期建议关注',reasoning:['从早报中提取需要关注的异常和状态差异。','检查是否有足够的明细和截止时间判断优先级。'],sections:[{heading:'关注事项',paragraphs:['可以先核对2条异常运单的影响与处理进展，再核对托运单的状态和路段进度差异。','当前缺少异常明细与全部待办的截止时间，不能据此认定异常严重程度，或排出56项待办的完整处理顺序。']}]}
}
