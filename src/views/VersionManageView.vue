<template>
  <div class="manage-view">
    <header class="manage-header">
      <div class="manage-header-inner">
        <div class="brand-lockup">
          <span class="brand-mark">T</span>
          <div><strong>TMS 3.0 原型评审</strong><span>产品版本管理</span></div>
        </div>
        <div class="header-actions">
          <el-button @click="loadData">刷新</el-button>
          <el-button @click="openPrototypeCatalog">全部原型</el-button>
          <el-button type="primary" @click="openCreateDialog">创建版本</el-button>
        </div>
      </div>
    </header>

    <main class="manage-main">
      <section class="page-heading">
        <div>
          <p class="eyebrow">RELEASE MANAGEMENT</p>
          <h1>研发版本</h1>
          <p>每个版本对应一次明确的研发交付范围，研发通过独立地址进入评审。</p>
        </div>
        <div class="summary-strip">
          <div><span>全部版本</span><strong>{{ versions.length }}</strong></div>
          <div><span>进行中</span><strong>{{ inProgressCount }}</strong></div>
          <div><span>已完成</span><strong>{{ completedCount }}</strong></div>
        </div>
      </section>

      <section class="version-panel">
        <div class="panel-toolbar">
          <div class="filter-group">
            <el-input v-model="keyword" clearable placeholder="搜索版本名称或编号" style="width: 260px" />
            <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 150px">
              <el-option v-for="(label, value) in STATUS_LABELS" :key="value" :label="label" :value="value" />
            </el-select>
          </div>
          <span class="result-count">共 {{ filteredVersions.length }} 个版本</span>
        </div>

        <el-table v-loading="loading" :data="filteredVersions" class="version-table" empty-text="还没有研发版本">
          <el-table-column label="版本" min-width="260">
            <template #default="{ row }">
              <div class="version-name-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.id }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="归属" width="140">
            <template #default="{ row }"><span>{{ scopeText(row) }}</span></template>
          </el-table-column>
          <el-table-column label="交付变化" width="120">
            <template #default="{ row }"><strong class="revision-text">{{ formatRevisionLabel(row.revision) }}</strong></template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }"><el-tag :type="statusTagType(row.status)" effect="light">{{ STATUS_LABELS[row.status] }}</el-tag></template>
          </el-table-column>
          <el-table-column label="计划上线" width="130">
            <template #default="{ row }">{{ row.targetReleaseDate || '待确定' }}</template>
          </el-table-column>
          <el-table-column label="最近修改" width="170">
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="研发评审地址" min-width="300">
            <template #default="{ row }">
              <div class="review-address-cell">
                <code>{{ row.publishedAt ? reviewAddress(row) : '尚未发布' }}</code>
                <el-button v-if="row.publishedAt" link type="primary" @click="copyReviewAddress(row)">复制地址</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="250">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button link type="primary" @click="openReview(row)">查看版本</el-button>
                <el-button v-if="row.revision === 'pending'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
                <el-button link type="primary" @click="publishReviewAddress(row)">发布研发地址</el-button>
                <el-button v-if="row.status !== 'completed'" link type="primary" @click="markCompleted(row)">标记完成</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </main>

    <el-dialog v-model="versionDialogVisible" :title="editingVersionId ? '编辑版本' : '创建版本'" width="720px" destroy-on-close>
      <el-form ref="versionFormRef" :model="versionForm" :rules="versionRules" label-position="top">
        <div class="form-grid">
          <el-form-item label="版本名称" prop="name" class="span-2">
            <el-input v-model="versionForm.name" maxlength="60" show-word-limit placeholder="例如：TMS 通用能力 9 月交付" />
          </el-form-item>
          <el-form-item label="需求归属" prop="scope">
            <el-radio-group v-model="versionForm.scope" :disabled="Boolean(editingVersionId)">
              <el-radio-button value="common">通用</el-radio-button>
              <el-radio-button value="project">定制项目</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="versionForm.scope === 'project'" label="所属项目" prop="projectId">
            <el-select v-model="versionForm.projectId" :disabled="Boolean(editingVersionId)" placeholder="请选择项目" style="width: 100%">
              <el-option v-for="project in activeProjects" :key="project.id" :label="project.name" :value="project.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="计划上线日期">
            <el-date-picker v-model="versionForm.targetReleaseDate" type="date" value-format="YYYY-MM-DD" placeholder="发布研发地址前必填" style="width: 100%" />
          </el-form-item>
          <el-form-item label="继承基线">
            <el-select v-model="versionForm.baseVersionId" clearable placeholder="可选" style="width: 100%">
              <el-option v-for="item in availableBaseVersions" :key="item.id" :label="`${item.name} · ${formatRevisionLabel(item.revision)}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="原型选择（全部原型）" class="span-2">
            <div class="page-selector">
              <el-checkbox-group v-model="versionForm.pageKeys">
                <el-checkbox v-for="page in selectablePages" :key="page.key" :value="page.key">
                  <span class="page-option">
                    <span class="page-option-title"><strong>{{ page.name }}</strong><em>{{ pageOwnershipText(page) }}</em></span>
                    <small>{{ page.requirement }}</small>
                    <span class="page-remark">{{ page.remark }}</span>
                  </span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="versionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVersion">{{ editingVersionId ? '保存修改' : '创建版本' }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { pages } from '../page-registry'
import { createReviewDataClient } from '../review/review-data-client.mjs'
import { STATUS_LABELS, buildReviewUrl, formatRevisionLabel, scopeLabel, statusTagType } from '../review/review-ui-policy.mjs'

const router = useRouter()
const client = createReviewDataClient()
const loading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const projects = ref([])
const versions = ref([])
const versionDialogVisible = ref(false)
const editingVersionId = ref('')
const editingBundle = ref(null)
const versionFormRef = ref()

const versionForm = reactive({ name: '', scope: 'common', projectId: '', baseVersionId: '', targetReleaseDate: '', pageKeys: [] })
const versionRules = {
  name: [{ required: true, message: '请填写版本名称', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择需求归属', trigger: 'change' }],
  projectId: [{ validator: (_rule, value, callback) => versionForm.scope === 'project' && !value ? callback(new Error('请选择所属项目')) : callback(), trigger: 'change' }],
}

const projectMap = computed(() => new Map(projects.value.map(project => [project.id, project])))
const activeProjects = computed(() => projects.value.filter(project => project.status === 'active'))
const filteredVersions = computed(() => versions.value.filter(version => {
  const matchKeyword = !keyword.value || `${version.name} ${version.id}`.toLowerCase().includes(keyword.value.toLowerCase())
  return matchKeyword && (!statusFilter.value || version.status === statusFilter.value)
}))
const inProgressCount = computed(() => versions.value.filter(version => version.status === 'in_progress').length)
const completedCount = computed(() => versions.value.filter(version => version.status === 'completed').length)
const configuredPublicOrigin = String(import.meta.env.VITE_REVIEW_PUBLIC_ORIGIN || '').trim()
const selectablePages = computed(() => pages)
const availableBaseVersions = computed(() => versions.value.filter(version => {
  if (version.id === editingVersionId.value) return false
  if (versionForm.scope === 'common') return version.scope === 'common'
  return version.scope === 'common' || version.projectId === versionForm.projectId
}))

watch([() => versionForm.scope, () => versionForm.projectId], () => {
  const validKeys = new Set(selectablePages.value.map(page => page.key))
  versionForm.pageKeys = versionForm.pageKeys.filter(key => validKeys.has(key))
  if (versionForm.scope === 'common') versionForm.projectId = ''
})

function scopeText(version) { return scopeLabel(version, projectMap.value) }
function pageOwnershipText(page) {
  if (page.scope === 'common') return '通用'
  return projectMap.value.get(page.projectId)?.name || page.projectId || '定制项目'
}
function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function reviewAddress(row) {
  return buildReviewUrl(row.id, configuredPublicOrigin || window.location.origin)
}

async function copyReviewAddress(row) {
  const address = reviewAddress(row)
  try {
    await navigator.clipboard.writeText(address)
    ElMessage.success('研发评审地址已复制')
  } catch {
    ElMessage.warning(`请手动复制：${address}`)
  }
}

async function loadData() {
  loading.value = true
  try {
    const [projectItems, versionItems] = await Promise.all([client.getProjects(), client.getVersions()])
    projects.value = projectItems
    versions.value = versionItems
  } catch (error) {
    ElMessage.error(error.message || '版本数据读取失败')
  } finally { loading.value = false }
}

function resetVersionForm() {
  Object.assign(versionForm, { name: '', scope: 'common', projectId: '', baseVersionId: '', targetReleaseDate: '', pageKeys: [] })
  editingVersionId.value = ''
  editingBundle.value = null
}

function openCreateDialog() {
  resetVersionForm()
  versionDialogVisible.value = true
}

async function openEditDialog(row) {
  try {
    const bundle = await client.getVersionBundle(row.id)
    editingVersionId.value = row.id
    editingBundle.value = bundle
    Object.assign(versionForm, {
      name: bundle.version.name,
      scope: bundle.version.scope,
      projectId: bundle.version.projectId || '',
      baseVersionId: bundle.version.baseVersionId || '',
      targetReleaseDate: bundle.version.targetReleaseDate || '',
      pageKeys: bundle.version.pages.sort((a, b) => a.order - b.order).map(page => page.pageKey),
    })
    versionDialogVisible.value = true
  } catch (error) { ElMessage.error(error.message) }
}

async function submitVersion() {
  if (!await versionFormRef.value?.validate().catch(() => false)) return
  submitting.value = true
  const pagesPayload = versionForm.pageKeys.map((pageKey, index) => ({ pageKey, order: index + 1 }))
  try {
    if (editingVersionId.value) {
      await client.updateVersion(editingVersionId.value, {
        name: versionForm.name,
        baseVersionId: versionForm.baseVersionId || null,
        targetReleaseDate: versionForm.targetReleaseDate || null,
        pages: pagesPayload,
      })
      ElMessage.success('版本已更新')
    } else {
      await client.createVersion({
        name: versionForm.name,
        scope: versionForm.scope,
        projectId: versionForm.scope === 'project' ? versionForm.projectId : null,
        baseVersionId: versionForm.baseVersionId || null,
        targetReleaseDate: versionForm.targetReleaseDate || null,
        pages: pagesPayload,
      })
      ElMessage.success('版本已创建')
    }
    versionDialogVisible.value = false
    await loadData()
  } catch (error) { ElMessage.error(error.message) } finally { submitting.value = false }
}

async function publishReviewAddress(row) {
  try {
    await client.publishVersion(row.id)
    await loadData()
    const address = reviewAddress(row)
    await navigator.clipboard.writeText(address).catch(() => undefined)
    if (configuredPublicOrigin) {
      ElMessage.success('研发地址已发布并复制')
    } else {
      ElMessage.warning('已生成本地预览地址；配置研发服务器域名并部署后才能对外访问')
    }
  } catch (error) {
    ElMessage.error(error.message || '研发地址发布失败')
  }
}

async function markCompleted(row) {
  try {
    await ElMessageBox.confirm('仅标记该版本已完成，不代表产品上线，也不会冻结版本。', '标记完成', { type: 'info', confirmButtonText: '确认', cancelButtonText: '取消' })
    await client.completeVersion(row.id)
    ElMessage.success('版本已标记完成')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || '标记完成失败')
  }
}

function openReview(row) { router.push({ name: 'versionReview', params: { versionId: row.id } }) }
function openPrototypeCatalog() { router.push({ name: 'prototypeCatalog' }) }
onMounted(loadData)
</script>

<style scoped>
.manage-view { min-height: 100vh; background: #f5f7fa; color: #1d2939; }
.manage-header { height: 64px; background: #fff; border-bottom: 1px solid #e5e9f0; }
.manage-header-inner { max-width: 1280px; height: 100%; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
.brand-lockup { display: flex; align-items: center; gap: 12px; }
.brand-mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 7px; background: #165dff; color: #fff; font-weight: 700; }
.brand-lockup div { display: flex; flex-direction: column; gap: 2px; }
.brand-lockup strong { font-size: 14px; }.brand-lockup div span { color: #98a2b3; font-size: 11px; }
.header-actions { display: flex; gap: 8px; }
.manage-main { max-width: 1280px; margin: 0 auto; padding: 34px 24px 64px; }
.page-heading { margin-bottom: 26px; display: flex; align-items: flex-end; justify-content: space-between; }
.eyebrow { margin: 0 0 8px !important; color: #165dff !important; font-size: 11px !important; font-weight: 700; letter-spacing: .08em; }
.page-heading h1 { margin: 0; font-size: 28px; }.page-heading p { margin: 8px 0 0; color: #667085; font-size: 13px; }
.summary-strip { display: flex; gap: 1px; overflow: hidden; border: 1px solid #e5e9f0; border-radius: 7px; background: #e5e9f0; }
.summary-strip div { min-width: 110px; padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; background: #fff; }
.summary-strip span { color: #98a2b3; font-size: 11px; }.summary-strip strong { font-size: 19px; }
.version-panel { overflow: hidden; border: 1px solid #e5e9f0; border-radius: 8px; background: #fff; box-shadow: 0 5px 18px rgba(31,45,61,.04); }
.panel-toolbar { min-height: 66px; padding: 0 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #edf0f4; }
.filter-group { display: flex; gap: 10px; }.result-count { color: #98a2b3; font-size: 12px; }
.version-table { width: 100%; }.version-name-cell { display: flex; flex-direction: column; gap: 5px; }
.version-name-cell strong { color: #344054; }.version-name-cell span { color: #98a2b3; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
.revision-text { color: #165dff; }.row-actions { display: flex; align-items: center; flex-wrap: wrap; }.frozen-label { color: #98a2b3; font-size: 12px; }
.review-address-cell { display: flex; align-items: center; gap: 8px; }
.review-address-cell code { max-width: 220px; overflow: hidden; color: #475467; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.form-grid, .revision-item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }.span-2 { grid-column: 1 / -1; }
.page-selector { width: 100%; max-height: 260px; overflow: auto; padding: 10px 14px; border: 1px solid #dcdfe6; border-radius: 4px; }
.page-selector :deep(.el-checkbox-group) { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 18px; }
.page-selector :deep(.el-checkbox) { height: auto; min-height: 78px; margin: 0; align-items: flex-start; padding: 8px 0; }
.page-option { display: flex; flex-direction: column; gap: 3px; white-space: normal; }
.page-option-title { display: flex; align-items: center; gap: 7px; }.page-option strong { color: #344054; font-size: 13px; }
.page-option-title em { padding: 1px 6px; border-radius: 3px; background: #eef4ff; color: #165dff; font-size: 10px; font-style: normal; }
.page-option small { color: #667085; }.page-remark { color: #98a2b3; font-size: 11px; line-height: 1.45; }
.revision-form { margin-top: 20px; }.revision-patch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.change-list-heading, .revision-item-title { display: flex; align-items: center; justify-content: space-between; }
.change-list-heading { margin: 8px 0 12px; }.revision-item-form { margin-bottom: 14px; padding: 16px; border: 1px solid #e5e9f0; border-radius: 6px; background: #fafbfc; }
.revision-item-title { margin-bottom: 10px; color: #475467; font-size: 13px; font-weight: 600; }
@media (max-width: 820px) { .page-heading { align-items: flex-start; flex-direction: column; gap: 20px; }.summary-strip { width: 100%; }.summary-strip div { flex: 1; min-width: 0; }.form-grid, .revision-item-grid, .revision-patch-grid { grid-template-columns: 1fr; }.span-2 { grid-column: auto; }.page-selector :deep(.el-checkbox-group) { grid-template-columns: 1fr; } }
</style>
