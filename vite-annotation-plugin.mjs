import path from 'node:path'
import { createRequire } from 'node:module'
import { mkdir, rename, writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const BODY_LIMIT = 2 * 1024 * 1024

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function sanitizePageId(value) {
  const decoded = decodeURIComponent(String(value || '')).trim().replace(/\\/g, '/')
  const parts = decoded.split('/').filter(Boolean)
  if (!parts.length || parts.some((part) => part === '.' || part === '..' || part.includes('\0'))) {
    throw new Error('无效 page 参数')
  }
  return parts.join('/')
}

function ensureWithin(root, target) {
  const relative = path.relative(root, target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('目标路径越界')
  return target
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > BODY_LIMIT) throw new Error('请求体过大')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function stable(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stable(value[key])
      return result
    }, {})
  }
  return value
}

function validateSpec(spec, specText, yaml) {
  if (!spec || typeof spec !== 'object' || !spec.meta || !Array.isArray(spec.units)) {
    throw new Error('spec 必须包含 meta 对象和 units 数组')
  }
  if (typeof specText !== 'string' || !specText.trim()) throw new Error('specText 不能为空')
  if (Buffer.byteLength(specText, 'utf8') > BODY_LIMIT) throw new Error('specText 过大')
  let parsedText
  try {
    parsedText = yaml.load(specText)
  } catch (error) {
    throw new Error(`specText YAML 解析失败: ${error.message}`)
  }
  if (JSON.stringify(stable(parsedText)) !== JSON.stringify(stable(spec))) {
    throw new Error('specText 与已校验的结构化 spec 不一致')
  }
  const ids = new Set()
  for (const unit of spec.units) {
    if (!unit || typeof unit !== 'object' || !unit.id || !unit.title || !unit.anchor_selector) {
      throw new Error('每个 unit 必须包含 id/title/anchor_selector')
    }
    if (ids.has(unit.id)) throw new Error(`重复 unit id: ${unit.id}`)
    ids.add(unit.id)
    if (unit.origin != null && !['ai', 'human'].includes(unit.origin)) throw new Error(`unit ${unit.id} 的 origin 无效`)
    if (unit.human_locked != null && typeof unit.human_locked !== 'boolean') throw new Error(`unit ${unit.id} 的 human_locked 必须是布尔值`)
    if (unit.origin === 'human' && unit.human_locked !== true) throw new Error(`unit ${unit.id} 为 human 时必须 human_locked: true`)
    if (unit.human_locked === true && unit.origin !== 'human') throw new Error(`unit ${unit.id} 锁定时必须 origin: human`)
  }
}

async function writeAtomic(file, content) {
  await mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temp, content, 'utf8')
  await rename(temp, file)
}

export function annotationPlugin(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || process.cwd())
  const specRoot = path.resolve(projectRoot, options.specRoot || 'src/views')
  const yamlModulePath = ensureWithin(projectRoot, path.resolve(projectRoot, options.yamlModulePath || 'public/annotation/vendor/js-yaml.min.js'))
  const yaml = require(yamlModulePath)
  const pages = options.pages || {}

  const resolveSpecFile = (rawPage) => {
    const page = sanitizePageId(rawPage)
    const configured = pages[page]
    const specFile = configured
      ? path.resolve(projectRoot, configured)
      : path.resolve(specRoot, ...page.split('/'), 'spec.yaml')
    return ensureWithin(projectRoot, specFile)
  }

  return {
    name: 'prototype-annotation-direct-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://annotation.local')
        if (req.method !== 'POST' || url.pathname !== '/api/spec') return next()
        try {
          const body = await readJsonBody(req)
          validateSpec(body.spec, body.specText, yaml)
          await writeAtomic(resolveSpecFile(body.page), body.specText)
          return sendJson(res, 200, { success: true })
        } catch (error) {
          return sendJson(res, 400, { success: false, error: error && error.message ? error.message : String(error) })
        }
      })
    },
  }
}
