#!/usr/bin/env node

import process from 'node:process'

import { recordVersionChange } from '../review/change-recorder.mjs'

const MAX_INPUT_BYTES = 256 * 1024

function readOption(name) {
  const direct = process.argv.find(argument => argument.startsWith(`--${name}=`))
  if (direct) return direct.slice(name.length + 3)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : ''
}

async function readPayload() {
  const chunks = []
  let size = 0
  for await (const chunk of process.stdin) {
    size += chunk.length
    if (size > MAX_INPUT_BYTES) throw new Error('变更记录内容超过 256KB 限制')
    chunks.push(chunk)
  }
  const source = Buffer.concat(chunks).toString('utf8').trim()
  if (!source) throw new Error('请通过标准输入提供变更记录 JSON')
  return JSON.parse(source)
}

async function main() {
  const versionId = readOption('version')
  const projectRoot = readOption('project-root') || process.cwd()
  if (!versionId) throw new Error('缺少 --version 参数')

  const payload = await readPayload()
  const result = await recordVersionChange({ projectRoot, versionId, payload })
  process.stdout.write(`${JSON.stringify({
    versionId: result.version.id,
    revision: result.version.revision,
    updatedAt: result.version.updatedAt,
  })}\n`)
}

main().catch(error => {
  process.stderr.write(`${error?.message || String(error)}\n`)
  process.exitCode = 1
})
