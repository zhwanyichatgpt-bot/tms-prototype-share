<template>
  <section ref="pageRoot" :class="['la-page', { 'la-page--overlay': dialog }]" aria-label="应用中心">
    <div ref="scrollRoot" class="la-scroll">
      <header class="la-header"><span class="la-brand"><img src="/lianyun-mobile-assets/brand-logo-v2.png" alt="" />至简联运</span><h1>应用</h1><AppsIcon name="grid" /></header>
      <Search v-model="query" class="la-main-search" shape="round" background="transparent" placeholder="搜索应用" aria-label="搜索全部应用" clear-trigger="always" />

      <template v-if="!query.trim()">
        <div class="la-portals">
          <button class="la-portal" @click="openPortal('market')"><span>应用市场 <Icon name="arrow" /></span><AppsIcon name="grid" tone="purple" /></button>
          <button class="la-portal la-portal--mall" @click="openPortal('mall')"><span>云商城 <Icon name="arrow" /></span><AppsIcon name="cloud" tone="teal" /></button>
        </div>
        <section class="la-common"><div class="la-heading"><h2>常用应用</h2><button @click="startEditing">编辑</button></div>
          <Grid class="la-common-grid" :border="false" :column-num="4" clickable>
            <GridItem v-for="app in commonApps" :key="app.id" :text="app.name" @click="openApplication(app)"><template #icon><AppsIcon :name="app.icon" :tone="app.tone" /></template></GridItem>
            <GridItem class="la-add" text="添加应用" @click="startEditing"><template #icon><AppsIcon name="plus" /></template></GridItem>
          </Grid>
        </section>
      </template>

      <section class="la-catalog" aria-label="全部应用">
        <div class="la-catalog-heading"><h2>{{ query.trim() ? '搜索结果' : '全部应用' }}</h2><span v-if="query.trim()">{{ searchResults.length }}个应用</span></div>
        <template v-if="query.trim()">
          <Grid v-if="searchResults.length" class="la-search-grid" :border="false" :column-num="3" clickable><GridItem v-for="app in searchResults" :key="app.id" @click="openApplication(app)"><template #icon><AppsIcon :name="app.icon" :tone="app.tone" /></template><template #text><span class="la-app-name">{{ app.name }}</span><small class="la-result-group">{{ groupName(app.groupId) }}</small></template></GridItem></Grid>
          <div v-else class="la-empty"><Icon name="search" /><h3>未找到相关应用</h3><p>试试其他名称或关键词</p><button @click="query = ''">查看全部应用</button></div>
        </template>
        <template v-else>
          <Tabs :active="activeDomain" class="la-domains" color="#3a65ff" title-active-color="#3a65ff" title-inactive-color="#718096" :line-width="24" :line-height="3" :ellipsis="false" :duration="0" @change="selectDomain"><Tab v-for="domain in appDomains" :key="domain.id" :name="domain.id" :title="domain.name" /></Tabs>
          <div :id="`${uid}-catalog-panel`" role="region" :aria-label="selectedDomain.name" class="la-directory">
            <Sidebar v-if="visibleGroups.length > 1" v-model="activeGroupIndex" class="la-groups" aria-label="功能子类"><SidebarItem v-for="group in visibleGroups" :key="group.id" :title="group.name" /></Sidebar>
            <section ref="applicationPanel" class="la-panel" :aria-label="selectedGroup?.name || selectedDomain.name">
              <template v-if="visibleApps.length"><div class="la-panel-heading"><h3>{{ selectedGroup?.name }}</h3><small>{{ visibleApps.length }}个应用</small></div><Grid class="la-grid" :border="false" :column-num="3" clickable><GridItem v-for="app in visibleApps" :key="app.id" :text="app.name" @click="openApplication(app)"><template #icon><AppsIcon :name="app.icon" :tone="app.tone" /></template></GridItem></Grid></template>
              <div v-else class="la-empty"><AppsIcon :name="emptyIcons[activeDomain]" /><h3>暂无{{ selectedDomain.name }}应用</h3><p>应用上架后将在这里展示</p></div>
            </section>
          </div>
        </template>
      </section>
    </div>

    <div v-if="dialog" class="la-overlay" @keydown.esc.stop="closeDialog">
      <button class="la-backdrop" aria-label="关闭弹层" tabindex="-1" @click="closeDialog" />
      <section ref="dialogPanel" class="la-sheet" role="dialog" aria-modal="true" :aria-labelledby="`${uid}-dialog-title`" tabindex="-1" @keydown.tab="trapFocus">
        <header class="la-sheet-heading"><h2 :id="`${uid}-dialog-title`">{{ dialogTitle }}</h2><button aria-label="关闭" @click="closeDialog"><Icon name="cross" /></button></header>
        <template v-if="dialog === 'edit'">
          <p class="la-sheet-hint">选择常用应用，可调整显示顺序</p>
          <p v-if="storageError" role="status" class="la-storage-note">浏览器存储不可用，设置仅在本次会话生效</p>
          <div class="la-sheet-body">
            <div v-if="draftApps.length" class="la-edit-list"><div v-for="(app, index) in draftApps" :key="app.id" class="la-edit-row"><AppsIcon :name="app.icon" :tone="app.tone" /><span>{{ app.name }}</span><button :disabled="index === 0" :aria-label="`上移${app.name}`" @click="moveDraft(index, -1)"><Icon name="arrow-up" /></button><button :disabled="index === draftApps.length - 1" :aria-label="`下移${app.name}`" @click="moveDraft(index, 1)"><Icon name="arrow-down" /></button><button :aria-label="`移除${app.name}`" @click="toggleDraft(app.id)"><Icon name="minus" /></button></div></div>
            <p v-else class="la-sheet-hint">尚未选择常用应用</p>
            <Search v-model="pickerQuery" class="la-picker-search" background="transparent" placeholder="搜索可添加的应用" aria-label="搜索可添加的应用" />
            <div class="la-picker"><button v-for="app in pickerResults" :key="app.id" :aria-pressed="draftIds.includes(app.id)" @click="toggleDraft(app.id)"><AppsIcon :name="app.icon" :tone="app.tone" /><span>{{ app.name }}<small>{{ groupName(app.groupId) }}</small></span><Icon :name="draftIds.includes(app.id) ? 'checked' : 'plus'" /></button><p v-if="!pickerResults.length" class="la-sheet-hint">没有匹配的应用</p></div>
          </div>
          <footer class="la-sheet-footer"><button @click="closeDialog">取消</button><button class="la-primary" @click="saveCommon">保存</button></footer>
        </template>
        <template v-else>
          <div class="la-preview-content"><AppsIcon :name="dialog === 'app' ? openedApp.icon : dialog === 'market' ? 'grid' : 'cloud'" :tone="dialog === 'app' ? openedApp.tone : 'blue'" /><h3>{{ dialogTitle }}</h3><p>{{ previewText }}</p><span class="la-preview-label">入口预览</span></div>
          <footer class="la-sheet-footer"><button class="la-primary" @click="closeDialog">返回应用</button></footer>
        </template>
      </section>
    </div>
    <div v-if="notice" class="la-notice" role="status">{{ notice }}</div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Grid, GridItem, Icon, Search, Sidebar, SidebarItem, Tab, Tabs } from 'vant'
import AppsIcon from './AppsIcon.vue'
import { appDomains, appGroups, applicationCatalog, commonAppsStorageKey, defaultCommonApps, normalizeCommonApps, searchApplications } from './apps-data.js'

const emit = defineEmits(['open-app', 'open-market', 'open-mall', 'overlay-change'])
const uid = useId()
const pageRoot = ref(null), scrollRoot = ref(null), applicationPanel = ref(null), dialogPanel = ref(null)
const query = ref(''), activeDomain = ref('transport'), activeGroup = ref('transport-business')
const commonIds = ref([...defaultCommonApps]), storageError = ref(false)
try {
  const stored = localStorage.getItem(commonAppsStorageKey)
  if (stored !== null) commonIds.value = normalizeCommonApps(JSON.parse(stored))
} catch { storageError.value = true }
const appById = new Map(applicationCatalog.map(app => [app.id, app]))
const commonApps = computed(() => commonIds.value.map(id => appById.get(id)).filter(Boolean))
const visibleGroups = computed(() => appGroups.filter(group => group.domainId === activeDomain.value))
const activeGroupIndex = computed({
  get: () => Math.max(0, visibleGroups.value.findIndex(group => group.id === activeGroup.value)),
  set: index => { if (visibleGroups.value[index]) selectGroup(visibleGroups.value[index].id) },
})
const selectedDomain = computed(() => appDomains.find(domain => domain.id === activeDomain.value))
const selectedGroup = computed(() => visibleGroups.value.find(group => group.id === activeGroup.value))
const visibleApps = computed(() => applicationCatalog.filter(app => app.domainId === activeDomain.value && app.groupId === activeGroup.value))
const searchResults = computed(() => searchApplications(query.value))
const emptyIcons = { warehouse: 'container', station: 'crane', 'value-added': 'wallet' }
const groupName = id => appGroups.find(group => group.id === id)?.name || ''
function selectDomain(id) {
  activeDomain.value = id
  activeGroup.value = appGroups.find(group => group.domainId === id)?.id || ''
  nextTick(() => { if (applicationPanel.value) applicationPanel.value.scrollTop = 0 })
}
function selectGroup(id) {
  activeGroup.value = id
  nextTick(() => { if (applicationPanel.value) applicationPanel.value.scrollTop = 0 })
}

const dialog = ref(''), openedApp = ref(null), draftIds = ref([]), pickerQuery = ref('')
const draftApps = computed(() => draftIds.value.map(id => appById.get(id)).filter(Boolean))
const pickerResults = computed(() => searchApplications(pickerQuery.value))
const dialogTitle = computed(() => dialog.value === 'edit' ? '编辑常用应用' : dialog.value === 'market' ? '应用市场' : dialog.value === 'mall' ? '云商城' : openedApp.value?.name || '')
const previewText = computed(() => dialog.value === 'market' ? '发现更多业务应用。应用详情与开通流程暂未接入。' : dialog.value === 'mall' ? '浏览商品与配套服务。商品目录与交易流程暂未接入。' : '已选中此应用，具体业务页面暂未接入。')
let returnFocus = null, noticeTimer
watch(dialog, async (value, oldValue) => {
  emit('overlay-change', Boolean(value))
  if (value && !oldValue) returnFocus = document.activeElement
  await nextTick()
  if (value) dialogPanel.value?.focus()
  else returnFocus?.focus?.()
})
function startEditing() { draftIds.value = [...commonIds.value]; pickerQuery.value = ''; dialog.value = 'edit' }
function toggleDraft(id) { draftIds.value = draftIds.value.includes(id) ? draftIds.value.filter(item => item !== id) : [...draftIds.value, id] }
function moveDraft(index, delta) {
  const target = index + delta
  if (target < 0 || target >= draftIds.value.length) return
  const rows = [...draftIds.value]
  ;[rows[index], rows[target]] = [rows[target], rows[index]]
  draftIds.value = rows
}
function saveCommon() {
  commonIds.value = normalizeCommonApps(draftIds.value)
  try { localStorage.setItem(commonAppsStorageKey, JSON.stringify(commonIds.value)); storageError.value = false }
  catch { storageError.value = true }
  closeDialog()
  notice.value = storageError.value ? '已更新，仅在本次会话生效' : '常用应用已保存'
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 2200)
}
const notice = ref('')
function openApplication(app) { openedApp.value = app; dialog.value = 'app'; emit('open-app', { ...app }) }
function openPortal(kind) { dialog.value = kind; emit(kind === 'market' ? 'open-market' : 'open-mall') }
function closeDialog() { dialog.value = '' }
function trapFocus(event) {
  const elements = [...dialogPanel.value.querySelectorAll('button:not(:disabled), input, [tabindex="0"]')].filter(element => element.getClientRects().length)
  const first = elements[0], last = elements[elements.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogPanel.value)) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogPanel.value)) { event.preventDefault(); first?.focus() }
}
onBeforeUnmount(() => { clearTimeout(noticeTimer); emit('overlay-change', false) })
defineExpose({ closeOverlay: closeDialog })
</script>

<style src="./apps-page.css"></style>
