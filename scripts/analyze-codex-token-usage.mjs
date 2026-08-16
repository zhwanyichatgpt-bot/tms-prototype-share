#!/usr/bin/env node

import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const topArg = args.find((arg) => arg.startsWith('--top='))
const top = Number.parseInt(topArg?.slice(6) ?? '20', 10)
const inputs = args.filter((arg) => !arg.startsWith('--'))

if (inputs.length === 0 || !Number.isFinite(top) || top < 1) {
  console.error('用法: node scripts/analyze-codex-token-usage.mjs <rollout.jsonl|目录> [...] [--top=20] [--json]')
  process.exitCode = 1
} else {
  const files = [...new Set((await Promise.all(inputs.map(collectJsonlFiles))).flat())].sort()
  if (files.length === 0) {
    console.error('未找到 .jsonl 日志。')
    process.exitCode = 1
  } else {
    const sessions = []
    for (const file of files) sessions.push(await analyzeFile(file))
    const ranked = sessions.sort((a, b) => b.tokens.total - a.tokens.total).slice(0, top)
    const report = { generatedAt: new Date().toISOString(), scannedFiles: files.length, sessions: ranked }
    if (jsonMode) console.log(JSON.stringify(report, null, 2))
    else printTable(report)
  }
}

async function collectJsonlFiles(input) {
  const path = resolve(input)
  const info = await stat(path).catch(() => null)
  if (!info) throw new Error(`路径不存在: ${path}`)
  if (info.isFile()) return path.endsWith('.jsonl') ? [path] : []
  if (!info.isDirectory()) return []

  const result = []
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) result.push(...await collectJsonlFiles(child))
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) result.push(child)
  }
  return result
}

async function analyzeFile(file) {
  const result = {
    file,
    sessionId: '',
    cwd: '',
    startedAt: '',
    endedAt: '',
    turns: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolCalls: 0,
    toolOutputs: 0,
    toolNames: {},
    skillLoads: 0,
    memoryReads: 0,
    modelCalls: 0,
    callsOver20kInput: 0,
    maxSingleInput: 0,
    contextWindow: 0,
    tokens: { input: 0, cachedInput: 0, output: 0, reasoningOutput: 0, total: 0 }
  }
  let lastTotal = -1
  const callIds = new Set()
  const outputIds = new Set()
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity })

  for await (const line of lines) {
    let event
    try { event = JSON.parse(line) } catch { continue }
    result.startedAt ||= event.timestamp ?? ''
    result.endedAt = event.timestamp ?? result.endedAt
    const payload = event.payload ?? {}

    if (event.type === 'session_meta') {
      result.sessionId = payload.id ?? payload.session_id ?? result.sessionId
      result.cwd = payload.cwd ?? result.cwd
    } else if (event.type === 'turn_context') {
      result.turns += 1
      result.cwd ||= payload.cwd ?? ''
    } else if (event.type === 'response_item') {
      inspectResponseItem(payload, result, callIds, outputIds)
    } else if (event.type === 'event_msg' && payload.type === 'token_count') {
      const info = payload.info ?? {}
      const total = info.total_token_usage ?? {}
      const currentTotal = number(total.total_tokens)
      if (currentTotal > result.tokens.total) {
        result.tokens = {
          input: number(total.input_tokens),
          cachedInput: number(total.cached_input_tokens),
          output: number(total.output_tokens),
          reasoningOutput: number(total.reasoning_output_tokens),
          total: currentTotal
        }
      }
      result.contextWindow = Math.max(result.contextWindow, number(info.model_context_window))
      if (currentTotal !== lastTotal) {
        const last = info.last_token_usage ?? {}
        const input = number(last.input_tokens)
        result.modelCalls += 1
        result.maxSingleInput = Math.max(result.maxSingleInput, input)
        if (input > 20_000) result.callsOver20kInput += 1
        lastTotal = currentTotal
      }
    }
  }

  result.toolCalls = callIds.size
  result.toolOutputs = outputIds.size
  result.cacheRatio = result.tokens.input > 0 ? result.tokens.cachedInput / result.tokens.input : 0
  result.averageInputPerCall = result.modelCalls > 0 ? Math.round(result.tokens.input / result.modelCalls) : 0
  result.toolNames = Object.fromEntries(Object.entries(result.toolNames).sort((a, b) => b[1] - a[1]))
  return result
}

function inspectResponseItem(payload, result, callIds, outputIds) {
  if (payload.type === 'message') {
    if (payload.role === 'user') result.userMessages += 1
    if (payload.role === 'assistant') result.assistantMessages += 1
    return
  }

  const callTypes = new Set(['function_call', 'custom_tool_call', 'local_shell_call', 'web_search_call'])
  const outputTypes = new Set(['function_call_output', 'custom_tool_call_output', 'local_shell_call_output'])
  if (callTypes.has(payload.type)) {
    const id = payload.call_id ?? payload.id ?? `${payload.type}:${callIds.size}`
    callIds.add(id)
    const name = payload.name ?? payload.tool_name ?? payload.type
    result.toolNames[name] = (result.toolNames[name] ?? 0) + 1
    const serialized = JSON.stringify(payload)
    if (/\/skills\/[^/]+\/SKILL\.md|\bSKILL\.md\b/.test(serialized)) result.skillLoads += 1
    if (/\.codex\/memories|rollout_summaries\/|MEMORY\.md/.test(serialized)) result.memoryReads += 1
  } else if (outputTypes.has(payload.type)) {
    outputIds.add(payload.call_id ?? payload.id ?? `${payload.type}:${outputIds.size}`)
  }
}

function printTable(report) {
  console.log(`扫描 ${report.scannedFiles} 个日志；按总 Token 展示前 ${report.sessions.length} 个任务。`)
  console.log('')
  console.log('总Token\t输入\t缓存占比\t输出\t模型调用\t>20k输入\t工具调用\t轮次\t任务ID')
  for (const item of report.sessions) {
    console.log([
      formatNumber(item.tokens.total),
      formatNumber(item.tokens.input),
      formatPercent(item.cacheRatio),
      formatNumber(item.tokens.output),
      item.modelCalls,
      item.callsOver20kInput,
      item.toolCalls,
      item.turns,
      item.sessionId || '(未知)'
    ].join('\t'))
  }
  console.log('')
  console.log('判读建议：优先检查“>20k输入”“工具调用”和“轮次”同时偏高的任务；高缓存占比说明主要成本来自重复携带上下文，不代表输出很多。')
}

function number(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}
