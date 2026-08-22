<template>
  <main v-if="version" class="requirement-catalog">
    <section class="catalog-heading">
      <div>
        <div class="catalog-kicker">REQUIREMENT CATALOG</div>
        <div class="catalog-title-row">
          <h1>需求目录</h1>
          <el-tag v-if="visibleStatus" type="success" effect="light">{{ visibleStatus }}</el-tag>
          <el-tag effect="plain">{{ revisionLabel }}</el-tag>
        </div>
        <p>本版本研发范围、交付时间和修订变化统一在此查看。</p>
      </div>
      <div class="release-date">
        <span>计划上线</span>
        <strong>{{ formatDate(version.targetReleaseDate) }}</strong>
      </div>
    </section>

    <section class="catalog-section">
      <header class="section-heading">
        <div><span>01</span><h2>版本信息</h2></div>
      </header>
      <div class="overview-grid">
        <div><span>版本编号</span><strong>{{ version.id }}</strong></div>
        <div><span>需求归属</span><strong>{{ scopeText }}</strong></div>
        <div><span>当前变化</span><strong>{{ revisionLabel }}</strong></div>
        <div v-if="visibleStatus"><span>版本状态</span><strong>{{ visibleStatus }}</strong></div>
        <div><span>计划上线日期</span><strong>{{ formatDate(version.targetReleaseDate) }}</strong></div>
        <div><span>原型页面</span><strong>{{ pages.length }} 个</strong></div>
      </div>
    </section>

    <section class="catalog-section">
      <header class="section-heading">
        <div><span>02</span><h2>本次需求范围</h2></div>
      </header>
      <el-empty v-if="!pages.length" description="本版本暂未纳入需求页面" />
      <div v-else class="requirement-table">
        <div class="requirement-row requirement-table-head">
          <span>序号</span>
          <span>需求内容</span>
          <span>对应原型</span>
        </div>
        <div v-for="(page, index) in pages" :key="page.key" class="requirement-row">
          <span class="requirement-order">{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ page.module || page.name }}</strong>
          <span>{{ page.name }}</span>
        </div>
      </div>
    </section>

    <section class="catalog-section">
      <header class="section-heading">
        <div><span>03</span><h2>修改记录</h2></div>
      </header>
      <el-empty v-if="!revisionBatches.length" description="版本尚未形成首次交付记录" />
      <div v-else class="revision-list">
        <article v-for="batch in revisionBatches" :key="batch.revision" class="revision-batch">
          <div class="revision-header">
            <div><strong>{{ formatRevisionLabel(batch.revision) }}</strong><span>{{ batch.reason }}</span></div>
            <time>{{ formatDateTime(batch.date) }}</time>
          </div>
          <div v-if="batch.items?.length" class="change-items">
            <div v-for="(item, itemIndex) in batch.items" :key="itemIndex" class="change-item">
              <div class="change-meta">
                <el-tag size="small" type="info" effect="plain">{{ typeLabel(item.type) }}</el-tag>
                <span>影响页面：{{ pageNames(item.pageKeys) }}</span>
              </div>
              <div class="change-compare">
                <div><span>修改前</span><p>{{ item.before }}</p></div>
                <div><span>修改后</span><p>{{ item.after }}</p></div>
              </div>
              <div class="dev-impact"><strong>研发注意</strong><span>{{ item.devImpact }}</span></div>
            </div>
          </div>
          <p v-else class="initial-delivery">首次交付，以当前需求目录和原型内容为准。</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import {
  formatRevisionLabel,
  reviewVisibleStatus,
  sortRevisionBatches,
} from '../review/review-ui-policy.mjs'

const props = defineProps({
  version: { type: Object, default: null },
  changes: { type: Object, default: () => ({ revisions: [] }) },
  pages: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] },
})

const projectMap = computed(() => new Map(props.projects.map(project => [project.id, project])))
const scopeText = computed(() => (
  props.version?.scope === 'common'
    ? '通用'
    : projectMap.value.get(props.version?.projectId)?.name || props.version?.projectId || '定制项目'
))
const revisionLabel = computed(() => formatRevisionLabel(props.version?.revision))
const visibleStatus = computed(() => reviewVisibleStatus(props.version?.status))
const revisionBatches = computed(() => sortRevisionBatches(props.changes?.revisions))
const pageNameMap = computed(() => new Map(props.pages.map(page => [page.key, page.name])))

function formatDate(value) {
  return value || '待确定'
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

function typeLabel(type) {
  return {
    initial_delivery: '首次交付',
    page_scope: '页面范围',
    release_date: '上线日期',
    rule: '规则调整',
    interaction: '交互调整',
    copy: '文案调整',
  }[type] || type
}

function pageNames(pageKeys) {
  return (pageKeys || []).map(key => pageNameMap.value.get(key) || key).join('、') || '-'
}
</script>

<style scoped>
.requirement-catalog {
  min-height: calc(100vh - 48px);
  box-sizing: border-box;
  padding: 32px 36px 64px;
  background: #f5f7fa;
  color: #1d2939;
}

.catalog-heading,
.catalog-section {
  max-width: 1120px;
  margin: 0 auto;
}

.catalog-heading {
  min-height: 116px;
  padding: 26px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border: 1px solid #dce6f7;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.catalog-kicker {
  color: #165dff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.4px;
}

.catalog-title-row {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.catalog-title-row h1 {
  margin: 0 8px 0 0;
  font-size: 24px;
}

.catalog-heading p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.release-date {
  min-width: 152px;
  padding-left: 28px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  border-left: 1px solid #d7e2f4;
}

.release-date span { color: #7b8aa1; font-size: 12px; }
.release-date strong { color: #1d4f9f; font-size: 18px; }

.catalog-section {
  margin-top: 18px;
  padding: 26px 28px;
  box-sizing: border-box;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #ffffff;
}

.section-heading {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.section-heading > div { display: flex; align-items: center; gap: 10px; }
.section-heading > div > span { color: #165dff; font-size: 11px; font-weight: 700; }
.section-heading h2 { margin: 0; font-size: 18px; }
.section-heading p { margin: 0; color: #98a2b3; font-size: 12px; }

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  overflow: hidden;
  border: 1px solid #edf0f4;
  border-radius: 6px;
  background: #edf0f4;
}

.overview-grid > div {
  min-height: 72px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  background: #ffffff;
}

.overview-grid > div:nth-child(5):last-child { grid-column: span 2; }

.overview-grid span { color: #98a2b3; font-size: 12px; }
.overview-grid strong { color: #344054; font-size: 14px; }

.requirement-table { border: 1px solid #e5e9f0; border-radius: 6px; overflow: hidden; }
.requirement-row {
  min-height: 58px;
  display: grid;
  grid-template-columns: 80px minmax(260px, 1fr) minmax(200px, .65fr);
  align-items: center;
  border-top: 1px solid #edf0f4;
}
.requirement-row:first-child { border-top: none; }
.requirement-row > * { height: 100%; padding: 0 18px; display: flex; align-items: center; border-left: 1px solid #edf0f4; box-sizing: border-box; }
.requirement-row > *:first-child { border-left: none; }
.requirement-table-head { min-height: 44px; background: #f7f8fa; color: #475467; font-size: 12px; font-weight: 600; }
.requirement-row strong { color: #344054; font-size: 14px; }
.requirement-row > span:last-child { color: #667085; font-size: 13px; }
.requirement-order { color: #98a2b3; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.revision-list { display: flex; flex-direction: column; gap: 14px; }
.revision-batch { padding: 18px; border: 1px solid #e7ebf0; border-radius: 7px; background: #fafbfc; }
.revision-header { display: flex; align-items: flex-start; justify-content: space-between; }
.revision-header > div { display: flex; align-items: center; gap: 12px; }
.revision-header strong { color: #165dff; font-size: 16px; }
.revision-header span { color: #344054; font-weight: 600; }
.revision-header time { color: #98a2b3; font-size: 12px; }
.change-items { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.change-item { padding: 16px; border: 1px solid #e7ebf0; border-radius: 6px; background: #ffffff; }
.change-meta { display: flex; align-items: center; gap: 12px; color: #667085; font-size: 12px; }
.change-compare { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.change-compare > div { padding: 11px 13px; border-radius: 5px; background: #f7f8fa; }
.change-compare span { color: #98a2b3; font-size: 11px; }
.change-compare p { margin: 6px 0 0; color: #475467; line-height: 1.6; }
.dev-impact { margin-top: 10px; padding: 10px 12px; display: flex; gap: 10px; border-left: 3px solid #f59e0b; background: #fff9eb; color: #7a5b18; font-size: 12px; }
.initial-delivery { margin: 14px 0 0; color: #667085; font-size: 13px; }

@media (max-width: 1100px) {
  .requirement-catalog { padding: 24px 20px 48px; }
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
