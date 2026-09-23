import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pageCatalog } from '../review/page-catalog.mjs'
import { products, operationApps } from '../review/product-catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const check = (condition, message) => { if (!condition) errors.push(message) }
const exists = relative => fs.existsSync(path.join(root, relative))
function filesUnder(folder) {
  if (!exists(folder)) return []
  return fs.readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap(entry => {
    const name = `${folder}/${entry.name}`
    return entry.isDirectory() ? filesUnder(name) : entry.isFile() ? [name] : []
  })
}
const productIds = new Set(products.map(item => item.id))
const appIds = new Set(operationApps.map(item => item.id))
const registry = fs.readFileSync(path.join(root, 'src/page-registry.js'), 'utf8')
const runtime = [...registry.matchAll(/key: '([^']+)'[^\n]+import\('([^']+)'\)/g)].map(match => ({ key: match[1], file: path.posix.normalize(`src/${match[2]}`) }))
check(new Set(runtime.map(p => p.key)).size === runtime.length, '运行时页面 key 重复')
check(JSON.stringify(runtime.map(p => p.key).sort()) === JSON.stringify(pageCatalog.map(p => p.key).sort()), '运行时与页面目录不一致')
for (const page of pageCatalog) {
  check(['common', 'project'].includes(page.scope), `${page.key} 需求归属无效`)
  check(page.scope === 'project' ? Boolean(page.projectId) : page.projectId === null, `${page.key} 项目归属无效`)
  check(Boolean(page.productId) !== Boolean(page.operationAppId), `${page.key} 产品与作业端必须且只能选一种`)
  check(page.operationAppId ? appIds.has(page.operationAppId) : productIds.has(page.productId), `${page.key} 产品/端未登记`)
  if (page.operationAppId) check(page.servesProducts?.length && page.servesProducts.every(id => productIds.has(id)), `${page.key} 共用端缺少服务产品`)
  check(['web', 'mobile'].includes(page.platform), `${page.key} 缺少使用端`)
  const entry = runtime.find(item => item.key === page.key)
  if (!entry) continue
  const prefix = `prototype/${page.scope === 'common' ? 'common' : `projects/${page.projectId}`}/${page.operationAppId ? `operation-apps/${page.operationAppId}` : `products/${page.productId}`}/${page.platform}/`
  check(entry.file.startsWith(prefix), `${page.key} 源码不在所属目录：${entry.file}`)
  check(exists(entry.file), `${page.key} 入口不存在`)
  check(page.sourcePaths.some(item => item.endsWith('/') ? entry.file.startsWith(item) : entry.file === item), `${page.key} 入口未纳入 sourcePaths`)
  for (const item of [...page.sourcePaths, ...page.evidencePaths]) check(exists(item), `${page.key} 来源不存在：${item}`)
  for (const item of page.sourcePaths.filter(item => item.endsWith('/'))) {
    for (const child of runtime.filter(other => other.key !== page.key)) {
      check(!child.file.startsWith(item), `${page.key} 目录范围覆盖 ${child.key}：${item}`)
    }
  }
}
// 校验原型和运行时代码的相对引用及项目隔离，不扫描依赖包。
for (const file of [...filesUnder('prototype'), ...filesUnder('src')].filter(p => /\.(vue|js|mjs|ts|tsx|css)$/.test(p))) {
  const text = fs.readFileSync(path.join(root, file), 'utf8')
  for (const match of text.matchAll(/(?:from\s*|import\s*\(?|@import\s*)['"](\.[^'"]+)['"]/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1].split('?')[0]))
    check([target, `${target}.js`, `${target}.mjs`, `${target}.vue`, `${target}.ts`, `${target}.tsx`, `${target}/index.js`].some(exists), `${file} 引用不存在：${match[1]}`)
    check(!(file.startsWith('prototype/common/') && target.startsWith('prototype/projects/')), `${file} 通用源码反向依赖项目`)
    const sourceProject = file.match(/^prototype\/projects\/([^/]+)\//)?.[1]
    const targetProject = target.match(/^prototype\/projects\/([^/]+)\//)?.[1]
    check(!(sourceProject && targetProject && sourceProject !== targetProject), `${file} 跨项目依赖 ${target}`)
  }
}
for (const folder of ['prd', 'discussions', 'context/business-rules', 'design']) {
  for (const file of filesUnder(folder).filter(p => p.endsWith('.md'))) {
    if (file.endsWith('/README.md')) continue
    const relative = file.slice(folder.length + 1)
    if (relative.startsWith('pending-classification/')) {
      check(fs.readFileSync(path.join(root, file), 'utf8').includes('架构归属状态: 待确认'), `${file} 待归属缺少说明`)
      continue
    }
    check(/^(common|projects\/[^/]+)\/(products\/(lianyun|zhiyun|chuanyun|lowaltitude)|operation-apps\/(driver|shipowner|pilot)|shared)\//.test(relative), `${file} 不在规范目录`)
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] || ''
    for (const key of ['需求归属', '所属项目', '研发版本', '修订', '状态']) check(new RegExp(`^${key}:`, 'm').test(fm), `${file} 缺少 ${key}`)
    const project = relative.match(/^projects\/([^/]+)\//)?.[1]
    check(new RegExp(`^需求归属: ${project ? 'project' : 'common'}$`, 'm').test(fm), `${file} 需求归属与目录不一致`)
    check(new RegExp(`^所属项目: ${project || 'null'}$`, 'm').test(fm), `${file} 项目元信息与目录不一致`)
    const app = relative.match(/\/operation-apps\/([^/]+)\//)?.[1]
    if (app) check(new RegExp(`^共用端归属: ${app}$`, 'm').test(fm), `${file} 共用端元信息与目录不一致`)
    const product = relative.match(/\/products\/([^/]+)\//)?.[1]
    if (product) check(new RegExp(`^产品归属: ${product}$`, 'm').test(fm), `${file} 产品元信息与目录不一致`)
  }
}
const versions = filesUnder('public/review-data/versions').filter(p => p.endsWith('/version.json'))
for (const file of versions) {
  const version = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  for (const page of version.pages || []) {
    check(pageCatalog.some(item => item.key === page.pageKey), `${version.id} 未知页面 ${page.pageKey}`)
    check(exists(`${path.posix.dirname(file)}/annotations/${page.pageKey}.json`), `${version.id} 缺少版本标注 ${page.pageKey}`)
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
else console.log(`架构检查通过：${pageCatalog.length} 个页面，${versions.length} 个版本；归属、入口、来源、相对引用与项目依赖检查通过。`)
