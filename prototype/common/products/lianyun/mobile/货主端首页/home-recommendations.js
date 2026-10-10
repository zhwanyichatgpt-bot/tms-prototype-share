// 首页推荐及匹配度为演示数据，不代表生产算法或真实企业经营画像。
const exampleRoute = { origin: '苏州', destination: '杭州' }
export function recommendCargos(items, region = '全国') {
  return items.filter(item => region === '全国' || [item.origin.city, item.destination.city].includes(region))
    .map(item => {
      const routeMatch = item.origin.city === exampleRoute.origin && item.destination.city === exampleRoute.destination
      const originMatch = item.origin.city === region
      const recommendation = routeMatch
        ? { score: 96, reason: '经营线路一致' }
        : region === '全国'
          ? { score: 76, reason: '运输条件相符' }
          : { score: originMatch ? 88 : 82, reason: `${region}${originMatch ? '出发' : '到达'}货源` }
      recommendation.score = item.matchScore ?? recommendation.score
      return { ...item, recommendation, priority: routeMatch ? 2 : originMatch ? 1 : 0 }
    }).sort((a, b) => b.recommendation.score - a.recommendation.score).slice(0, 5)
}
