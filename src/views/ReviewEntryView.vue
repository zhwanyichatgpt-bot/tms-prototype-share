<template>
  <div class="entry-view">
    <header class="entry-header">
      <div class="header-inner">
        <div class="brand-lockup">
          <span class="brand-mark">T</span>
          <div><strong>TMS 3.0 原型评审</strong><span>已发布版本目录</span></div>
        </div>
        <el-button :loading="loading" @click="loadData">刷新</el-button>
      </div>
    </header>
    <main class="entry-main">
      <section class="page-heading">
        <div>
          <p class="eyebrow">RELEASE DIRECTORY</p>
          <h1>已发布版本</h1>
          <p class="description">选择版本，查看对应的原型页面、标注和修改记录。</p>
        </div>
        <div class="summary-strip" aria-label="版本统计">
          <div><span>全部版本</span><strong>{{ versions.length }}</strong></div>
          <div><span>进行中</span><strong>{{ inProgressCount }}</strong></div>
          <div><span>已完成</span><strong>{{ completedCount }}</strong></div>
        </div>
      </section>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="load-error" />
      <section class="version-panel" aria-label="已发布版本列表">
        <div class="panel-toolbar">
          <div class="filter-group">
            <el-input v-model="keyword" clearable placeholder="搜索版本名称或编号" aria-label="搜索版本名称或编号" class="search-input" />
            <el-select v-model="statusFilter" placeholder="全部状态" aria-label="版本状态" class="status-select">
              <el-option label="全部状态" value="" />
              <el-option v-for="(label, value) in STATUS_LABELS" :key="value" :label="label" :value="value" />
            </el-select>
          </div>
          <span class="result-count" aria-live="polite">共 {{ filteredVersions.length }} 个版本</span>
        </div>
        <el-table v-loading="loading" :data="filteredVersions" row-key="id"
          :empty-text="error ? '版本列表读取失败，请点击刷新重试' : keyword || statusFilter ? '没有符合条件的已发布版本' : '暂无已发布版本'"
          class="version-table">
          <el-table-column label="版本" min-width="250">
            <template #default="{ row }">
              <div class="version-name-cell"><strong>{{ row.name }}</strong><span>{{ row.id }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="归属" width="140">
            <template #default="{ row }">{{ scopeLabel(row, projectMap) }}</template>
          </el-table-column>
          <el-table-column label="交付变化" width="130">
            <template #default="{ row }"><strong class="revision-text">{{ formatRevisionLabel(row.revision) }}</strong></template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }"><RouterLink :to="buildReviewPath(row.id)" class="review-link" :aria-label="`查看版本：${row.name}`">查看版本</RouterLink></template>
          </el-table-column>
        </el-table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createReviewDataClient } from '../review/review-data-client.mjs'
import { STATUS_LABELS, buildReviewPath, formatRevisionLabel, scopeLabel } from '../review/review-ui-policy.mjs'

const client = createReviewDataClient()
const versions = ref([])
const projects = ref([])
const keyword = ref('')
const statusFilter = ref('')
const loading = ref(false)
const error = ref('')
const projectMap = computed(() => new Map(projects.value.map(project => [project.id, project])))
const inProgressCount = computed(() => versions.value.filter(version => version.status === 'in_progress').length)
const completedCount = computed(() => versions.value.filter(version => version.status === 'completed').length)
const filteredVersions = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return versions.value.filter(version => (
    (!query || `${version.name} ${version.id}`.toLowerCase().includes(query))
    && (!statusFilter.value || version.status === statusFilter.value)
  ))
})

async function loadData() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const [versionItems, projectItems] = await Promise.all([client.getVersions(), client.getProjects()])
    // 仅展示已交付版本；刷新重新读取索引，新发布版本无需手工维护。
    versions.value = versionItems.filter(version => version.publishedAt).sort((left, right) => (
      String(right.updatedAt || right.publishedAt).localeCompare(String(left.updatedAt || left.publishedAt))
    ))
    projects.value = projectItems
  } catch (cause) {
    error.value = cause?.message || '版本列表读取失败，请稍后刷新重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.entry-view { min-height: 100vh; background: #f5f7fb; color: #1d2939; }
.entry-header { background: #fff; border-bottom: 1px solid #e4e9f1; }
.header-inner { max-width: 1200px; min-height: 56px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand-lockup { display: flex; align-items: center; gap: 12px; }
.brand-mark { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; background: #165dff; color: #fff; border-radius: 6px; font-size: 18px; font-weight: 700; }
.brand-lockup strong, .brand-lockup span:not(.brand-mark) { display: block; }
.brand-lockup strong { font-size: 14px; line-height: 22px; }
.brand-lockup div > span { color: #8693ad; font-size: 11px; line-height: 16px; }
.entry-main { max-width: 1200px; margin: 0 auto; padding: 34px 24px 48px; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 26px; }
.eyebrow { margin: 0 0 10px; color: #165dff; font-size: 11px; font-weight: 700; letter-spacing: 1.1px; }
h1 { margin: 0; font-size: 28px; line-height: 38px; }
.description { margin: 8px 0 0; color: #667085; font-size: 13px; line-height: 22px; }
.summary-strip { display: flex; flex: 0 0 auto; border: 1px solid #e1e7f0; border-radius: 6px; background: #fff; }
.summary-strip > div { min-width: 110px; padding: 12px 16px; }
.summary-strip > div + div { border-left: 1px solid #e1e7f0; }
.summary-strip span, .summary-strip strong { display: block; }
.summary-strip span { color: #8693ad; font-size: 11px; margin-bottom: 4px; }
.summary-strip strong { font-size: 20px; line-height: 24px; }
.version-panel { overflow: hidden; border: 1px solid #e1e7f0; border-radius: 6px; background: #fff; box-shadow: 0 8px 20px rgba(35, 61, 112, .03); }
.panel-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; }
.filter-group { display: flex; align-items: center; gap: 10px; min-width: 0; }
.search-input { width: 260px; }
.status-select { width: 150px; }
.result-count { color: #8693ad; font-size: 12px; white-space: nowrap; }
.version-name-cell { display: flex; flex-direction: column; gap: 5px; padding: 4px 0; }
.version-name-cell strong { font-size: 14px; line-height: 22px; color: #344054; }
.version-name-cell span { font-size: 11px; color: #8693ad; }
.revision-text { color: #165dff; font-size: 13px; }
.review-link { color: #165dff; font-size: 13px; font-weight: 600; text-decoration: none; }
.review-link:hover { text-decoration: underline; }
.review-link:focus-visible { outline: 2px solid #165dff; outline-offset: 4px; border-radius: 2px; }
.load-error { margin-bottom: 16px; }
.version-table :deep(th.el-table__cell) { background: #f7f9fc; color: #536176; }
.version-table :deep(.el-table__cell) { padding: 12px 0; }
@media (max-width: 760px) {
  .page-heading { align-items: flex-start; flex-direction: column; gap: 18px; }
  .summary-strip { width: 100%; }
  .summary-strip > div { flex: 1; min-width: 0; }
}
@media (max-width: 520px) {
  .header-inner { padding: 0 16px; }
  .entry-main { padding: 24px 12px 32px; }
  .panel-toolbar { align-items: flex-start; flex-direction: column; padding: 14px; gap: 12px; }
  .filter-group { width: 100%; }
  .search-input { width: auto; flex: 1; min-width: 0; }
  .status-select { width: 120px; flex: 0 0 120px; }
}
</style>
