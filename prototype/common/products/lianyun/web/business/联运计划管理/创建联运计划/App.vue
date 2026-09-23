<script setup>
import { useRouter } from 'vue-router'
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
const tabs = [{ key: 'multimodalCreate', label: '新增联运计划' }]
const shellScale = 0.85

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
function goBack() {
  router.push({ name: 'multimodalManage' })
}

function onCancel() {
  ElMessageBox.confirm('确认取消新增？已填写内容将不会保存。', '取消新增', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '继续编辑',
  }).then(() => {
    goBack()
  }).catch(() => {})
}

function onSubmit() {
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
  <div class="create-plan-viewport">
    <div class="create-plan-stage">
      <TmsWebShell
        :site-name="siteName"
        :organization-name="organizationName"
        :date-text="dateText"
        :weather-text="weatherText"
        :active-menu="'dashboard'"
        :tabs="tabs"
        :active-tab-key="'multimodalCreate'"
        :nav-items="navItems"
        :active-nav="'plan'"
        :scale="shellScale"
        @menu-select="onMenuSelect"
        @go-workbench="goWorkbench"
        @close-tab="closeTab"
        @switch-tab="switchTab"
        @navigate="onNavigate"
      >
        <template #logo><span class="cp-logo-text">至简集运</span></template>
        <template #avatar>
          <img class="cp-top-avatar" src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png" alt="企业头像" />
        </template>
        <template #weather-icon><span class="cp-weather-glyph" aria-hidden="true">☀</span></template>
        <template #actions>
          <img src="/tms-web-shell-assets/Group_26_152.svg" class="cp-top-icon" alt="" />
          <img src="/tms-web-shell-assets/Vector_26_158.svg" class="cp-top-icon" alt="" />
        </template>
        <template #home-icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="8.4" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="8.4" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
          </svg>
        </template>

        <div class="create-plan-page">
          <h2 class="cp-page-title">新增联运计划</h2>

          <BasicInfoSection />
          <CargoInfoSection />
          <RouteInfoSection />
          <FeeInfoSection />
          <ExtraFeeSection />
          <AttachmentSection />

          <!-- 底部提交栏 -->
          <div class="cp-footer">
            <button type="button" class="cp-btn cp-btn-default" @click="onCancel">取消</button>
            <button type="button" class="cp-btn cp-btn-primary" @click="onSubmit">提交</button>
          </div>
        </div>
      </TmsWebShell>
    </div>
  </div>
</template>

<style scoped>
.create-plan-viewport { width: 100%; min-height: calc(100vh - 48px); overflow: auto; }
.create-plan-stage { width: 1920px; transform-origin: left top; }
.cp-logo-text { font-size: 18px; font-weight: 700; color: #1d2129; letter-spacing: 1px; }
.cp-top-avatar { width: 34px; height: 34px; border-radius: 50%; }
.cp-weather-glyph { font-size: 18px; }
.cp-top-icon { width: 24px; height: 24px; }
</style>
