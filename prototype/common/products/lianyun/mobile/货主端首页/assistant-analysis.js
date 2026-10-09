// 根据当前可比较方案生成可解释的结果摘要；不声明全网最优或实时价格。
export function analyseSchemes(items, priority = '综合考虑') {
  if (!items.length) return { recommendedId:'', title:'', reason:'', brief:'', details:[], note:'', badges:{} }
  const fastest = [...items].sort((a,b) => a.hours[1]-b.hours[1] || a.transfers-b.transfers)[0]
  const allPriced = items.every(item => item.priceKnown)
  const cheapest = allPriced ? [...items].sort((a,b) => a.price[1]-b.price[1] || a.hours[1]-b.hours[1])[0] : null
  const shortest = [...items].sort((a,b) => a.km-b.km)[0]
  // 仅使用已声明的模拟均衡场景，不代表正式推荐算法。费用未齐时不做均衡费用判断。
  const balanced = priority === '综合考虑' && allPriced ? items.find(item => item.balancedExample) : null
  const recommended = priority === '费用优先' && cheapest ? cheapest : balanced || fastest
  const badges = Object.fromEntries(items.map(item => [item.id,
    item.id === recommended.id ? '优先推荐' : cheapest?.id === item.id ? '参考费用较低' : shortest.id === item.id && item.km < recommended.km ? '里程较短' : '另一种走法'
  ]))
  const alternative = items.find(item => item.id !== recommended.id)
  let reason = '预计全程'+recommended.duration+'，'+(recommended.transfers ? recommended.transfers+'次交接。' : '全程直达，减少中转交接。')
  if (alternative) {
    if (recommended === balanced) reason += recommended.balancedReason
    else if (recommended === cheapest && recommended !== fastest) reason += '参考费用较低；若更赶时效，可选'+fastest.name+'（'+fastest.duration+'）。'
    else reason += '另一方案需'+alternative.duration+'，当前优先考虑时效。'
  }
  const fewest = [...items].sort((a,b) => a.transfers-b.transfers)[0]
  const sameTransfers = items.every(item => item.transfers === fewest.transfers)
  const sameTime = items.every(item => item.hours[1] === fastest.hours[1])
  const lowerCost = cheapest && items.every(item => item.id === cheapest.id || cheapest.price[1] < item.price[0])
  const costText = cheapest
    ? cheapest.name+(lowerCost ? '参考费用更低' : '参考费用上限较低')+(cheapest.id !== fastest.id ? '，适合交期宽裕时选。' : '，兼顾时效与预算。')
    : '条件未齐，补充货物信息后再比价。'
  const details = [
    {title:'时效',text:sameTime ? '预计时效相近，优先核对可发运时间。' : fastest.name+'预计'+fastest.duration+'，更适合赶交期。'},
    {title:'费用',text:costText},
    {title:'交接',text:sameTransfers ? '均为'+fewest.transfers+'次交接，重点比较全程服务责任。' : fewest.name+'仅'+fewest.transfers+'次交接，衔接环节较少。'},
  ]
  return {
    recommendedId:recommended.id,
    title:(items.length > 1 ? '建议优先选' : '当前可选')+'「'+recommended.name+'」',
    reason,
    brief:recommended === balanced ? recommended.balancedReason : recommended === cheapest && recommended !== fastest ? '参考费用较低，适合交期相对宽裕的货物。' : '预计'+recommended.duration+'，当前优先考虑运输时效。',
    details,
    note:(items.some(item => item.priceAssumed && item.priceKnown) ? '未填写条件的价格先按示例箱型及普货比较。' : '')+'费用、时效及发运条件，以服务商确认为准。',
    badges,
  }
}
