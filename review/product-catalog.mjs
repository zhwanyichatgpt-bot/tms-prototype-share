// 产品标识与作业端标识分别登记；产品存在不代表已实现全部功能。
export const products = Object.freeze([
  { id: 'lianyun', name: '至简联运' },
  { id: 'zhiyun', name: '至简智运' },
  { id: 'chuanyun', name: '至简船运' },
  { id: 'lowaltitude', name: '低空产品' },
])
export const operationApps = Object.freeze([
  { id: 'driver', name: '至简司机' },
  { id: 'shipowner', name: '至简船东' },
  { id: 'pilot', name: '飞手端' },
])
export function pageProductLabel(page) {
  const owner = page.operationAppId
    ? operationApps.find(item => item.id === page.operationAppId)?.name
    : products.find(item => item.id === page.productId)?.name
  return `${owner || '未分类'} · ${page.platform === 'mobile' ? '移动端' : 'Web'}${page.channel === 'portal' ? ' · 门户' : ''}`
}
export function groupProductPages(pages) {
  const groups = new Map()
  for (const page of pages) {
    const key = `${page.productId || page.operationAppId}:${page.platform}:${page.channel || 'business'}`
    if (!groups.has(key)) groups.set(key, { key, label: pageProductLabel(page), pages: [] })
    groups.get(key).pages.push(page)
  }
  return [...groups.values()]
}
