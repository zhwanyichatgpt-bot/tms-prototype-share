<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AssistantEntry from '../../至小简入口/AssistantEntry.vue'
import PlanAssistantConversation from './components/PlanAssistantConversation.vue'
import { parsePlanRequest, missingPlanFields, planNextReply, planReviewRows, planStartExample } from './plan-assistant.js'
import { saveCreatedPlan } from './created-plan-store.js'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TmsWebShell } from '../../../../../../shared/web/tms-web-shell/index.js'
import BasicInfoSection from './components/BasicInfoSection.vue'
import CargoInfoSection from './components/CargoInfoSection.vue'
import RouteInfoSection from './components/RouteInfoSection.vue'
import FeeInfoSection from './components/FeeInfoSection.vue'
import ExtraFeeSection from './components/ExtraFeeSection.vue'
import AttachmentSection from './components/AttachmentSection.vue'
import './create-plan.css'

/* —— 顶部栏 / 系统框架数据（复用共享框架）—— */
const siteName = '楹联集运站'
const organizationName = '企业名称企业名称企业企业名称...'
const dateText = '2022 年 05 月 27 日'
const weatherText = '24℃ 多云'
const tabs = [{ key: 'multimodalCreate', label: '运输计划' }]
const shellScale = 1

const navItems = [
  {
    key: 'plan', label: '联运计划', left: 0, top: 0, width: 32, height: 32,
    imgs: [
      { src: '/tms-web-shell-assets/Vector_26_236.svg', x: 3.2, y: 3.2, w: 13.5, h: 13.9 },
      { src: '/tms-web-shell-assets/Vector_26_237.svg', x: 7.4, y: 16.1, w: 13.6, h: 12.7 },
      { src: '/tms-web-shell-assets/Vector_26_238.svg', x: 17.1, y: 4.4, w: 11.7, h: 15 },
    ],
  },
  {
    key: 'other', label: '其他', left: 1, top: 87, width: 30, height: 30,
    imgs: [{ src: '/tms-web-shell-assets/Group_26_241.svg', x: 3.75, y: 3.43, w: 22, h: 22.5 }],
    badge: { x: 13.9, y: 2.6, w: 9, h: 9 },
  },
]

const router = useRouter()
const route = useRoute()
const basicSection = ref(null), cargoSection = ref(null), routeSection = ref(null), feeSection = ref(null)
const aiAssisted = ref(false)
const viewport = ref(null)
const canvasScale = ref(1)
const feeConfirmed = ref(false)
const exampleFlow = ref(false)
let initialPlan
let lastFeeSnapshot
let canvasObserver
onMounted(() => {
  initialPlan = JSON.parse(JSON.stringify(currentPlan()))
  lastFeeSnapshot = JSON.stringify({ fee: initialPlan.fee, enabled: initialPlan.feeEnabled })
  canvasObserver = new ResizeObserver(([entry]) => { canvasScale.value = Math.min(1, entry.contentRect.width / 1920) })
  canvasObserver.observe(viewport.value)
})
onUnmounted(() => canvasObserver?.disconnect())
const assistantMessages = ref([{ role: 'assistant', text: '你可以先告诉我托运企业、货品和发货量，我来帮你整理联运计划。\n\n接着核对各段路线、中转衔接、联系信息和货主计费设置。每次补充都会同步填写到当前页面；已有的信息会直接沿用。', choices: [{ title: '用一份运输需求试填', description: '福建大道成 · 1,000 吨煤炭，逐步补充路线和费用', value: planStartExample }] }])
function currentPlan() {
  return { basic: basicSection.value.form, cargo: cargoSection.value.rows, segments: routeSection.value.segments, fee: feeSection.value.form, feeEnabled: feeSection.value.enabled }
}
const reviewRows = computed(() => basicSection.value ? planReviewRows(currentPlan()) : [])
function askPlanAssistant(text) {
  let current = currentPlan()
  // 识别用户在表单中进行的费用调整，避免覆盖或重复追问。
  feeConfirmed.value ||= JSON.stringify({ fee: current.fee, enabled: current.feeEnabled }) !== lastFeeSnapshot
  assistantMessages.value.push({ role: 'user', text })
  exampleFlow.value ||= text === planStartExample
  const patch = parsePlanRequest(text, current.cargo)
  const skipFee = /(?:暂不配置|不设置|关闭)货主费用/.test(text)
  // 开始协助新建时仅移除仍未编辑的设计稿演示数据。
  if (!aiAssisted.value && patch.changed.length) {
    if (JSON.stringify(current.cargo) === JSON.stringify(initialPlan.cargo)) cargoSection.value.rows = []
    if (JSON.stringify(current.segments) === JSON.stringify(initialPlan.segments)) routeSection.value.segments = []
    current = currentPlan()
  }
  aiAssisted.value ||= patch.changed.length > 0 || skipFee
  Object.assign(current.basic, patch.basic)
  if (patch.cargo) { cargoSection.value.rows = [patch.cargo]; cargoSection.value.activeMode = '按重量' }
  if (patch.segments) routeSection.value.segments = patch.segments
  else if (patch.cargo) {
    for (const segment of current.segments) for (const node of segment.nodes) node.cargoItems = [{ text: `${patch.cargo.name}丨${patch.cargo.weight}吨` }]
  }
  current = currentPlan()
  if (!current.basic.planName && patch.segments) {
    current.basic.planName = `${patch.segments[0].nodes[0].address}至${patch.segments.at(-1).nodes.at(-1).address}联运计划`
  }
  if (Object.keys(patch.fee).length) {
    Object.assign(current.fee, patch.fee)
    feeSection.value.enabled = true
    feeConfirmed.value ||= Object.hasOwn(patch.fee, 'unitPrice')
  }
  if (skipFee) { feeSection.value.enabled = false; feeConfirmed.value = true }
  lastFeeSnapshot = JSON.stringify({ fee: current.fee, enabled: feeSection.value.enabled })
  let acknowledgement = patch.changed.length ? `已填写${[...new Set(patch.changed)].join('、')}，当前页面已同步。` : ''
  if (skipFee) acknowledgement = '已关闭货主费用设置，其余计划信息保留。'
  if (!patch.changed.length && !skipFee) acknowledgement = '我会按当前表单继续核对。你可以具体说明要修改的字段，例如“重量改为800吨，单价改为160元”。'
  assistantMessages.value.push(planNextReply(currentPlan(), { feeConfirmed: feeConfirmed.value, exampleFlow: exampleFlow.value, acknowledgement }))
}
function goBack() {
  openPrototypePage(router, route, 'multimodalManage')
}

function onCancel() {
  ElMessageBox.confirm('确认取消新增？已填写内容将不会保存。', '取消新增', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '继续编辑',
  }).then(() => {
    goBack()
  }).catch(() => {})
}

function onSubmit() {
  if (aiAssisted.value) {
    const missing = missingPlanFields(currentPlan())
    if (missing.length) { ElMessage.warning('请补充' + missing.join('、')); return }
    try { saveCreatedPlan(currentPlan(), route.params.versionId) }
    catch { ElMessage.error('本地保存失败，请保留当前页面后重试'); return }
  }
  ElMessage.success('联运计划提交成功')
  setTimeout(() => goBack(), 600)
}

function onMenuSelect() {}
function goWorkbench() {}
function closeTab() { goBack() }
function switchTab() {}
function onNavigate() {}
</script>

<template>
  <div ref="viewport" class="create-plan-viewport">
    <div class="create-plan-stage" :style="{ zoom: canvasScale }">
      <TmsWebShell :site-name="siteName" :organization-name="organizationName" :date-text="dateText" :weather-text="weatherText" active-menu="dashboard" :tabs="tabs" active-tab-key="multimodalCreate" :nav-items="navItems" active-nav="plan" :scale="shellScale" @menu-select="onMenuSelect" @go-workbench="goWorkbench" @close-tab="closeTab" @switch-tab="switchTab" @navigate="onNavigate">
        <template #logo><img class="cp-brand-logo" src="/ai-workbench-assets/brand-logo.svg" alt="至简集运" /></template>
        <template #avatar><img class="cp-top-avatar" src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png" alt="企业头像" /></template>
        <template #weather-icon><span class="cp-weather-glyph" aria-hidden="true">☀</span></template>
        <template #actions><img src="/tms-web-shell-assets/Group_26_152.svg" class="cp-top-icon" alt="" /><img src="/tms-web-shell-assets/Vector_26_158.svg" class="cp-top-icon" alt="" /></template>
      </TmsWebShell>
      <div class="cp-drawer-mask" />
      <section class="cp-create-drawer" aria-label="新增联运计划">
        <header class="cp-drawer-header"><h1>新增联运计划</h1><button type="button" aria-label="关闭新增联运计划" @click="onCancel"><img src="/multimodal-plan-assets/close.svg" alt="" /></button></header>
        <div class="cp-drawer-body">
          <div class="create-plan-page">
            <BasicInfoSection ref="basicSection" class="cp-basic-section" />
            <CargoInfoSection ref="cargoSection" class="cp-cargo-section" />
            <RouteInfoSection ref="routeSection" />
            <FeeInfoSection ref="feeSection" class="cp-fee-section" />
            <ExtraFeeSection class="cp-extra-section" />
            <AttachmentSection class="cp-attachment-section" />
          </div>
        </div>
        <footer class="cp-footer"><button type="button" class="cp-btn cp-btn-default" @click="onCancel">取消</button><button type="button" class="cp-btn cp-btn-primary" @click="onSubmit">提交</button></footer>
      </section>
      <AssistantEntry placement="business" :announcement="[]" :context="{ kind: 'plan-create', label: '当前页面 · 新增联运计划' }"><template #conversation><PlanAssistantConversation :messages="assistantMessages" :review-rows="reviewRows" @question="askPlanAssistant" /></template></AssistantEntry>
    </div>
  </div>
</template>
