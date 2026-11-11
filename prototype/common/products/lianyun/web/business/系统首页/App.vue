<script setup>
import { computed, ref, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../src/review/prototype-navigation.mjs'
import { ElButton, ElDrawer } from 'element-plus'
import TmsAiWorkbenchShell from '../../../../../shared/web/tms-web-shell/TmsAiWorkbenchShell.vue'
import { workspaceDateText } from '../至小简入口/workspace-content.js'
import AssistantEntry from '../至小简入口/AssistantEntry.vue'
import { useAccountDemo } from '../AI工作台/account-demo.js'
import DashboardCards from './DashboardCards.vue'
import './workbench-tokens.css'
import './system-workbench.css'
import './dashboard-cards.css'
const router = useRouter(), route = useRoute()
const assistantEntry = ref(null)
const availablePageKeys = inject('prototypePageKeys', null)
function canOpenPage(key) { return key && (!route.params.versionId || availablePageKeys?.value.has(key)) }
function openPage(key) {
  if (canOpenPage(key)) openPrototypePage(router, route, key)
}
const floatingPreview = computed(() => route.query.preview === 'floating')
const updatePreview = computed(() => floatingPreview.value ? route.query.updates : undefined)
const account = useAccountDemo()
const signInStatus = computed(() => ({ signed: account.signedToday.value, points: account.signInPoints }))
const activityDismissKey = 'tms.system-home.activity-dismissed-date'
const activityDismissed = ref(false)
try { activityDismissed.value = localStorage.getItem(activityDismissKey) === account.today } catch { /* 存储不可用时只在当前页面记录。 */ }

const activityNotice = computed(() => {
  if (activityDismissed.value) return null
  const id = 'points-activity'
  if (!account.signedToday.value) return {
    id, title: '今日签到 · 领 ' + account.signInPoints + ' 积分',
    text: '完成今日签到，积分即刻到账。', action: '去签到', activityTarget: 'sign-in',
  }
  const target = account.rewardTarget.value
  if (target) {
    const reward = target === 'streak' ? account.readyStreak.value : account.tasks.value.find(task => task.id === target)
    return {
      id, title: '有 ' + reward.points + ' 积分待领取',
      text: target === 'streak' ? '已达成连续签到 ' + reward.days + ' 天奖励。' : reward.name + '已完成。',
      action: '领取奖励', activityTarget: target,
    }
  }
  const task = account.promotion.value
  return task ? {
    id, title: '分析托运单，领 ' + task.points + ' 积分',
    text: '生成一份托运单分析报告，完成成长任务。', action: '查看活动', activityTarget: task.id,
  } : null
})

function dismissActivityNotice() {
  activityDismissed.value = true
  try { localStorage.setItem(activityDismissKey, account.today) } catch { /* 不影响当前页面收起活动卡。 */ }
}
const asset = name => '/ai-workbench-assets/' + name
const navigation = [
 {key:'apps',label:'我的应用',left:8,top:0,imgs:[{src:asset('apps.svg'),x:4,y:4}]},
 {key:'shortcuts',label:'常用应用',left:8,top:68,imgs:[{src:asset('inbox.svg'),x:4,y:4}]},
]
const shortcuts = [
 ['至小简','aiWorkbench'],['运单中心3.0','waybillCenter'],['运输任务3.0','transportTask'],['客户列表'],
 ['铁路运输3.0'],['托运订单管理3.0','waybillManage'],['水路运输3.0'],['运输通道3.0','transportChannel'],
 ['公路运输3.0'],['托运单管理3.0','waybillManage'],['调度统计'],['船舶明细3.0'],['船长明细3.0'],
]
const shortcutIcons = ['agent-dispatch.svg','agent-report.svg','agent-encyclopedia.png','agent-analysis.svg']
const appsOpen = ref(false), appGroup = ref('全部')
function openWorkbench() { appsOpen.value=false;openPage('aiWorkbench') }
function openApps() { appGroup.value='全部';appsOpen.value=true }
</script>

<template>
  <div class="system-home" :class="{ 'system-home-floating': floatingPreview }">
    <TmsAiWorkbenchShell site-name="至简测试企业" organization-name="至简测试企业" :date-text="workspaceDateText" weather-text="4℃ 晴"
      fluid :nav-items="navigation" @navigate="openApps">
      <template #status>
        <AssistantEntry ref="assistantEntry" :context="{kind:'home',label:'系统首页'}" :update-preview="updatePreview"
          :activity-notice="activityNotice" :sign-in-status="signInStatus" @dismiss-activity="dismissActivityNotice" />
      </template>
      <main class="system-dashboard" aria-label="系统工作台">
        <DashboardCards />
      </main>
      <nav class="system-dock" aria-label="工作台快捷应用">
        <component :is="canOpenPage(key) ? 'button' : 'span'" v-for="([label, key], index) in shortcuts" :key="label" @click="openPage(key)">
          <img :src="asset(shortcutIcons[index % shortcutIcons.length])" alt="" /><span>{{ label }}</span>
        </component>
        <button type="button" aria-label="更多应用" @click="openApps">›</button>
        <button type="button" @click="assistantEntry?.showSettings()"><img :src="asset('settings.svg')" alt="" /><span>工作台设置</span></button>
      </nav>
    </TmsAiWorkbenchShell>

    <ElDrawer v-model="appsOpen" title="我的应用" direction="ltr" size="min(660px, 85vw)" append-to-body>
      <div class="system-app-drawer">
        <nav aria-label="应用分类"><ElButton v-for="group in ['全部', 'TMS3.0', 'AI']" :key="group" text :type="appGroup === group ? 'primary' : 'default'" @click="appGroup = group">{{ group }}</ElButton></nav>
        <div class="system-app-list">
          <ElButton v-if="appGroup !== 'TMS3.0'" @click="openWorkbench()">至小简</ElButton>
          <template v-if="appGroup !== 'AI'">
            <ElButton v-for="[label, key] in shortcuts.filter(item => canOpenPage(item[1]))" :key="label" @click="openPage(key)">{{ label }}</ElButton>
          </template>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>
