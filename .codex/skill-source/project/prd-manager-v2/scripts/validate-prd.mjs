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

function findChapterLine(chapter) {
  const pattern = new RegExp(`^#{1,4}\\s+(?:第\\s*${chapter}\\s*章|${chapter}(?:\\.|、|\\s))`);
  return lines.findIndex((line) => pattern.test(line.trim()));
}

const frontmatterEnd = lines[0]?.trim() === '---'
  ? lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  : -1;

if (frontmatterEnd < 0) {
  add(errors, 'missing_frontmatter', '缺少完整 YAML frontmatter');
} else {
  const frontmatter = lines.slice(1, frontmatterEnd).join('\n');
  const requiredKeys = ['类型', '所属模块', '主题', '版本', '状态', '最后更新日期', '来源'];
  for (const key of requiredKeys) {
    if (!new RegExp(`^${key}\\s*:`, 'm').test(frontmatter)) {
      add(errors, 'missing_frontmatter_key', `frontmatter 缺少“${key}”`);
    }
  }

  const statusMatch = frontmatter.match(/^状态\s*:\s*(.+)$/m);
  if (statusMatch) {
    const allowedStatuses = ['草稿', '待原型验证', '原型验证中', '待评审', '已确认', '已上线'];
    if (!allowedStatuses.some((status) => statusMatch[1].includes(status))) {
      add(warnings, 'unknown_status', `文档状态“${statusMatch[1].trim()}”不在建议状态中`);
    }
  }
}

for (let chapter = 0; chapter <= 8; chapter += 1) {
  const start = findChapterLine(chapter);
  if (start < 0) {
    add(errors, 'missing_chapter', `缺少第 ${chapter} 章`);
    continue;
  }

  const nextStarts = [];
  for (let next = chapter + 1; next <= 8; next += 1) {
    const index = findChapterLine(next);
    if (index >= 0) nextStarts.push(index);
  }
  const end = nextStarts.length > 0 ? Math.min(...nextStarts) : lines.length;
  const body = lines.slice(start + 1, end).filter((line) => {
    const trimmed = line.trim();
    return trimmed && !/^#{1,6}\s+/.test(trimmed);
  });
  if (body.length === 0) {
    add(errors, 'empty_chapter', `第 ${chapter} 章没有正文内容`, start + 1);
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

const ruleIds = new Map();
for (let index = 0; index < lines.length; index += 1) {
  const match = lines[index].trim().match(/^(?:#{1,6}\s+|(?:\d+\.\s+)?\*\*)(R\d{2,3})[：:\s]/i);
  if (!match) continue;
  const id = match[1].toUpperCase();
  const previous = ruleIds.get(id);
  if (previous) {
    add(errors, 'duplicate_rule_id', `规则编号重复：“${id}”，首次出现在第 ${previous} 行`, index + 1);
  } else {
    ruleIds.set(id, index + 1);
  }
}

const placeholders = [/\bTODO\b/i, /\bTBD\b/i, /\[待填写\]/, /\{[^{}]{1,40}\}/];
for (let index = 0; index < lines.length; index += 1) {
  if (placeholders.some((pattern) => pattern.test(lines[index]))) {
    add(errors, 'placeholder', '存在未处理占位符', index + 1);
  }
}

let pendingDepth = null;
for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  const heading = line.match(/^(#{1,6})\s+(.+)/);
  if (heading) {
    const depth = heading[1].length;
    const title = heading[2];
    if (/待确认/.test(title)) {
      pendingDepth = depth;
    } else if (pendingDepth !== null && depth <= pendingDepth) {
      pendingDepth = null;
    }
  }
  if (pendingDepth === null && /待确认|待核实|❓/.test(line) && !/^#{1,6}/.test(line)) {
    add(warnings, 'pending_in_body', '正文中出现待确认表述，请检查是否被当成正式规则', index + 1);
  }
}

const technicalTerms = [
  /\bv-model\b/i,
  /\bv-if\b/i,
  /@click\b/i,
  /\bEl(?:Table|Form|Dialog|Drawer|Button|Input|Select)\b/i,
  /\bReact\b/,
  /\bVue\b/,
  /\bElement Plus\b/i,
  /\bAnt Design\b/i,
  /\/(?:api|src|views|components)\//i,
  /\b(?:ref|reactive|computed|watch)\s*\(/i,
];
for (let index = 0; index < lines.length; index += 1) {
  if (technicalTerms.some((pattern) => pattern.test(lines[index]))) {
    add(warnings, 'technical_term', '发现可能不应出现在业务 PRD 中的技术实现词', index + 1);
  }
}

let longParagraphWarnings = 0;
for (let index = 0; index < lines.length && longParagraphWarnings < 10; index += 1) {
  const line = lines[index].trim();
  if (!line || /^[-|#>`]/.test(line) || /^\d+[.、]\s*/.test(line)) continue;
  if (line.length > 240) {
    add(warnings, 'long_paragraph', '单段超过 240 字，请检查是否应拆分条件、结果或例外', index + 1);
    longParagraphWarnings += 1;
  }
}

const stateMentions = (content.match(/状态/g) || []).length;
if (stateMentions >= 5 && !/(进入条件|退出事件|退出条件|允许操作|状态、角色与操作|状态与操作)/.test(content)) {
  add(warnings, 'state_contract', '文档包含较多状态，但未发现进入/退出条件或状态操作映射');
}

if (lines.length > 1200) {
  add(warnings, 'very_long_document', `文档共 ${lines.length} 行，请检查是否存在重复、模板填充或过度字段展开`);
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
