#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.log('用法: node validate-prd.mjs <PRD文件> [--json]');
}

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const fileArg = args.find((arg) => arg !== '--json');

if (!fileArg) {
  usage();
  process.exit(2);
}

const filePath = path.resolve(fileArg);
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(2);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);
const errors = [];
const warnings = [];

function add(target, code, message, line) {
  target.push({ code, message, ...(line ? { line } : {}) });
}

const requiredChapters = [0, 1, 2, 3, 4, 5, 7, 8];
for (const chapter of requiredChapters) {
  const pattern = new RegExp(`^#{1,4}\\s+(?:第\\s*${chapter}\\s*章|${chapter}(?:\\.|、|\\s))`);
  if (!lines.some((line) => pattern.test(line.trim()))) {
    add(errors, 'missing_chapter', `缺少第 ${chapter} 章`);
  }
}

const headings = new Map();
for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index].trim();
  if (!/^#{1,6}\s+/.test(line)) continue;
  const normalized = line.replace(/^#{1,6}\s+/, '').replace(/\s+/g, ' ').trim();
  const previous = headings.get(normalized);
  if (previous) {
    add(warnings, 'duplicate_heading', `标题重复：“${normalized}”`, index + 1);
  } else {
    headings.set(normalized, index + 1);
  }
}

const placeholders = [/\bTODO\b/i, /\bTBD\b/i, /\[待填写\]/, /\{[^{}]{1,40}\}/];
for (let index = 0; index < lines.length; index += 1) {
  if (placeholders.some((pattern) => pattern.test(lines[index]))) {
    add(errors, 'placeholder', '存在未处理占位符', index + 1);
  }
}

let inPendingSection = false;
for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (/^#{1,6}\s+.*(?:待确认|第\s*8\s*章)/.test(line)) inPendingSection = true;
  if (/^#{1,6}\s+.*变更记录/.test(line)) inPendingSection = false;
  if (!inPendingSection && /待确认|待核实|❓/.test(line) && !/^#{1,6}/.test(line)) {
    add(warnings, 'pending_in_body', '正文中出现待确认表述，请检查是否被当成正式规则', index + 1);
  }
}

const technicalTerms = [
  /\bv-model\b/i,
  /\bv-if\b/i,
  /@click\b/i,
  /\bElTable\b/i,
  /\bReact\b/,
  /\bVue\b/,
  /\/(?:api|src|components)\//i,
];
for (let index = 0; index < lines.length; index += 1) {
  if (technicalTerms.some((pattern) => pattern.test(lines[index]))) {
    add(warnings, 'technical_term', '发现可能不应出现在业务PRD中的技术实现词', index + 1);
  }
}

if (lines.length > 1000) {
  add(warnings, 'very_long_document', `文档共 ${lines.length} 行，请检查是否存在重复或模板填充`);
}

const result = {
  file: filePath,
  lines: lines.length,
  errors,
  warnings,
  passed: errors.length === 0,
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`PRD校验: ${filePath}`);
  console.log(`行数: ${lines.length}`);
  for (const item of errors) {
    console.log(`错误 [${item.code}]${item.line ? ` 第${item.line}行` : ''}: ${item.message}`);
  }
  for (const item of warnings) {
    console.log(`提醒 [${item.code}]${item.line ? ` 第${item.line}行` : ''}: ${item.message}`);
  }
  console.log(errors.length === 0 ? '结果: 通过结构校验' : '结果: 未通过结构校验');
}

process.exit(errors.length === 0 ? 0 : 1);
