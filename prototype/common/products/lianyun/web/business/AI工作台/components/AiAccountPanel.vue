<script setup>
import { computed, ref, watch } from 'vue'
import { ElButton, ElDialog, ElEmpty, ElProgress } from 'element-plus'
import { accountSections, chinaTime, formatPoints, planBenefits } from '../account-demo.js'
import AiIcon from './AiIcon.vue'
import './account-panel.css'

const props = defineProps({ section: String, activityTarget: String, account: { type: Object, required: true } })
const emit = defineEmits(['navigate', 'start-task'])
const accountContent = ref(null)
const {
  plan, today, signInPoints, signIns, signedToday, streak, streakRewards, claimedStreaks,
  tasks, taskEarned, signInEarned, taskPending, taskCount, activityStart, activityEnd,
  ledger, credits, totalCredits, monthEarned, creditGroups, nextRefreshExample, expiryExample, signIn, claimStreak, claimTask,
} = props.account

const activityTab = ref('每日签到')
const ledgerFilter = ref('全部明细')
const taskFilter = ref('全部')
const month = ref(today.slice(0, 7) + '-01')
const detail = ref(null)
const streakRewardCard = ref(null)
const purchaseUrl = import.meta.env.VITE_AI_SUBSCRIPTION_PURCHASE_URL?.trim()
const feedback = ref('')
const now = ref(Date.now())

const filteredLedger = computed(() => ledger.value.filter(row => {
  if (ledgerFilter.value === '积分收入') return row.points > 0
  if (ledgerFilter.value === '积分支出') return row.points < 0
  return true
}))
const taskRows = computed(() => tasks.value.filter(task => taskFilter.value === '全部' || task.status === taskFilter.value))
const monthDate = computed(() => new Date(month.value))
const monthLabel = computed(() => monthDate.value.getUTCFullYear() + '年' + (monthDate.value.getUTCMonth() + 1) + '月')
const monthPrefix = computed(() => month.value.slice(0, 7))
const monthReward = computed(() => ledger.value.reduce((sum, row) => {
  return sum + (row.time.startsWith(monthPrefix.value) && row.source.endsWith('签到奖励') ? row.points : 0)
}, 0))
const calendarCells = computed(() => {
  const first = monthDate.value
  const leading = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => monthPrefix.value + '-' + String(index + 1).padStart(2, '0')),
  ]
})
const remainingSeconds = computed(() => Math.max(0, Math.ceil((activityEnd - now.value) / 1000)))
const countdown = computed(() => {
  const seconds = remainingSeconds.value
  return [
    [Math.floor(seconds / 86400), '天'], [Math.floor(seconds / 3600) % 24, '时'],
    [Math.floor(seconds / 60) % 60, '分'], [seconds % 60, '秒'],
  ]
})

watch(() => [props.section, props.activityTarget], ([section, target], [previous], onCleanup) => {
  detail.value = null
  feedback.value = ''
  if (!previous) {
    activityTab.value = '每日签到'
  }
  if (section === 'activity') {
    const task = tasks.value.find(item => item.id === target)
    if (task) {
      activityTab.value = '成长任务'
      detail.value = { type: 'task', task }
    } else if (target === 'sign-in' || target === 'streak') {
      activityTab.value = '每日签到'
      month.value = today.slice(0, 7) + '-01'
    }
    now.value = Date.now()
    const timer = setInterval(() => { now.value = Date.now() }, 1000)
    onCleanup(() => clearInterval(timer))
  }
})

watch(() => [props.section, detail.value], () => {
  if (accountContent.value) accountContent.value.scrollTop = 0
}, { flush: 'post' })

function changeMonth(delta) {
  const first = monthDate.value
  month.value = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1)).toISOString().slice(0, 10)
}

function showReward(points) {
  if (points) feedback.value = '已到账 +' + points + ' 积分'
}

function openActivity(tab) {
  activityTab.value = tab
  detail.value = null
  feedback.value = ''
}

function revealActivityTarget() {
  if (props.section === 'activity' && props.activityTarget === 'streak') {
    streakRewardCard.value?.scrollIntoView({ block: 'nearest' })
    streakRewardCard.value?.focus({ preventScroll: true })
  }
}
</script>

<template>
  <ElDialog
    :model-value="!!section"
    title="账户与权益"
    width="min(1080px, calc(100vw - 36px))"
    align-center
    append-to-body
    :close-on-click-modal="false"
    class="zx-account-dialog"
    @opened="revealActivityTarget"
    @update:model-value="value => { if (!value) emit('navigate', null) }"
  >
    <div class="zx-account-layout">
      <nav class="zx-account-nav" aria-label="账户与权益导航">
        <div class="zx-account-profile">
          <span class="zx-account-icon"><AiIcon name="account" :size="20" /></span>
          <div><strong>我的账户</strong><small>{{ plan }}</small></div>
        </div>
        <button
          v-for="item in accountSections"
          :key="item.id"
          type="button"
          :aria-current="section === item.id ? 'page' : undefined"
          @click="emit('navigate', item.id); detail = null"
        >
          <AiIcon :name="item.icon" :size="17" />{{ item.name }}
        </button>
      </nav>

      <section :key="section" ref="accountContent" class="zx-account-content" :aria-label="accountSections.find(item => item.id === section)?.name">
        <div v-if="detail" class="zx-account-detail">
          <button type="button" class="zx-account-link" @click="detail = null">‹ 返回</button>
          <template v-if="detail.type === 'task'">
            <h2>{{ detail.task.name }}</h2>
            <div class="zx-account-card">
              <span class="zx-account-muted">任务奖励</span>
              <h3>{{ formatPoints(detail.task.points) }} 积分</h3>
              <p>{{ detail.task.status }}</p>
              <ElButton v-if="detail.task.status === '待领取'" type="primary" :disabled="!remainingSeconds" @click="showReward(claimTask(detail.task))">领取积分</ElButton>
              <ElButton v-else-if="detail.task.id === 'waybill' && detail.task.status === '待完成'" type="primary" :disabled="!remainingSeconds" @click="emit('start-task')">去完成</ElButton>
            </div>
          </template>
          <template v-else-if="detail.type === 'records'">
            <h2>订阅记录</h2>
            <ElEmpty description="暂无订阅记录" :image-size="70" />
          </template>
        </div>

        <template v-else-if="section === 'account'">
          <header class="zx-account-heading">
            <div><h2>积分账户</h2><p>查看积分余额、来源和收支明细</p></div>
            <button class="zx-account-link" type="button" @click="emit('navigate', 'activity')">积分活动 <AiIcon name="chevron" :size="13" /></button>
          </header>
          <div class="zx-account-card zx-balance-card">
            <div><span>总剩余积分</span><div class="zx-account-number">{{ formatPoints(credits) }} <small>积分</small></div></div>
            <dl class="zx-balance-stats">
              <div><dt>累计到账</dt><dd>{{ formatPoints(totalCredits) }}</dd></div>
              <div><dt>已用积分</dt><dd>{{ formatPoints(totalCredits - credits) }}</dd></div>
              <div><dt>本月已获得</dt><dd>{{ formatPoints(monthEarned) }}</dd></div>
            </dl>
          </div>
          <div class="zx-credit-section">
            <h3>积分构成</h3>
            <div class="zx-account-pair zx-credit-groups">
              <article v-for="group in creditGroups" :key="group.id" class="zx-account-card zx-credit-card">
                <h4>{{ group.label }}</h4>
                <div class="zx-account-number">{{ formatPoints(group.remaining) }} <small>积分剩余</small></div>
                <ElProgress :percentage="group.percentage" :show-text="false" :stroke-width="6" :aria-label="group.label + '剩余比例'" />
                <div class="zx-credit-usage"><span>已用 {{ formatPoints(group.used) }} / {{ formatPoints(group.earned) }}</span><span>剩余 {{ group.percentage }}%</span></div>
                <p v-if="group.id === 'base'" class="zx-credit-timing">下次刷新（演示） {{ nextRefreshExample }}</p>
                <p v-else class="zx-credit-timing">最近到期（演示） {{ expiryExample.dateLabel }} · {{ formatPoints(expiryExample.points) }} 积分</p>
              </article>
            </div>
          </div>
          <h3>积分明细</h3>
          <div class="zx-account-tabs" aria-label="积分明细筛选">
            <button v-for="filter in ['全部明细', '积分支出', '积分收入']" :key="filter" type="button" :aria-pressed="ledgerFilter === filter" @click="ledgerFilter = filter">{{ filter }}</button>
          </div>
          <table v-if="filteredLedger.length" class="zx-account-table">
            <thead><tr><th scope="col">明细名称</th><th scope="col">积分来源</th><th scope="col">时间</th><th scope="col">积分变动</th></tr></thead>
            <tbody>
              <tr v-for="row in filteredLedger" :key="row.id">
                <td>{{ row.name }}</td><td>{{ row.source }}</td><td>{{ row.time }}</td>
                <td class="zx-points">{{ row.points > 0 ? '+' : '' }}{{ formatPoints(row.points) }}</td>
              </tr>
            </tbody>
          </table>
          <ElEmpty v-else description="暂无相关积分明细" :image-size="70" />
        </template>

        <template v-else-if="section === 'activity'">
          <header class="zx-account-heading">
            <div><h2>积分活动</h2><p>每日签到或完成成长任务，领取积分奖励</p></div>
            <button class="zx-account-link" type="button" @click="emit('navigate', 'account')">积分账户 <AiIcon name="chevron" :size="13" /></button>
          </header>
          <div class="zx-account-tabs" aria-label="积分活动分类">
            <button v-for="tab in ['每日签到', '成长任务']" :key="tab" type="button" :aria-pressed="activityTab === tab" @click="openActivity(tab)">{{ tab }}</button>
          </div>
          <div v-if="activityTab === '每日签到'" class="zx-sign-grid">
            <div class="zx-account-card zx-calendar">
              <div class="zx-calendar-heading">
                <button type="button" aria-label="上个月" @click="changeMonth(-1)">‹</button>
                <h3>{{ monthLabel }}</h3>
                <button type="button" aria-label="下个月" @click="changeMonth(1)">›</button>
              </div>
              <div class="zx-calendar-grid">
                <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="zx-calendar-week">{{ day }}</span>
                <div
                  v-for="(day, index) in calendarCells"
                  :key="day || 'blank-' + index"
                  class="zx-calendar-day"
                  :class="{ 'is-signed': signIns.includes(day), 'is-today': day === today, 'is-blank': !day }"
                >
                  <template v-if="day">
                    <span>{{ Number(day.slice(-2)) }} <AiIcon v-if="signIns.includes(day)" name="check" :size="11" /></span>
                    <small>{{ signIns.includes(day) ? '已领 ' : '+' }}{{ signInPoints }}</small>
                  </template>
                </div>
              </div>
            </div>
            <div class="zx-sign-right">
              <div class="zx-account-card zx-sign-summary">
                <div class="zx-sign-stats">
                  <div><span>连续签到</span><div class="zx-account-number">{{ streak }} <small>天</small></div></div>
                  <div><span>本月已领取</span><div class="zx-account-number">{{ monthReward }} <small>积分</small></div></div>
                </div>
                <ElButton type="primary" :disabled="signedToday" @click="showReward(signIn())">{{ signedToday ? '今日已签到' : '签到领 ' + signInPoints + ' 积分' }}</ElButton>
              </div>
              <div ref="streakRewardCard" class="zx-account-card" tabindex="-1">
                <h3>连续签到额外奖励</h3>
                <div v-for="reward in streakRewards" :key="reward.days" class="zx-reward-row">
                  <span>连续 {{ reward.days }} 天</span>
                  <strong class="zx-points">+{{ reward.points }}</strong>
                  <span v-if="claimedStreaks.includes(reward.days)" class="zx-account-muted">已领取</span>
                  <ElButton v-else-if="streak >= reward.days" size="small" type="primary" plain @click="showReward(claimStreak(reward))">领取</ElButton>
                  <span v-else class="zx-account-muted">待达标</span>
                </div>
              </div>
            </div>
          </div>

          <template v-else>
            <div class="zx-account-card zx-task-overview">
              <div>
                <h3>本期成长任务</h3>
                <p>{{ chinaTime(activityStart) }} 至 {{ chinaTime(activityEnd) }}</p>
                <div class="zx-task-progress"><strong>{{ taskCount }} / {{ tasks.length }}</strong> 项已领取</div>
                <ElProgress :percentage="100 * taskCount / tasks.length" :show-text="false" :stroke-width="6" />
              </div>
              <div class="zx-countdown">
                <span>活动剩余时间</span>
                <div><span v-for="[value, unit] in countdown" :key="unit"><strong>{{ String(value).padStart(2, '0') }}</strong>{{ unit }}</span></div>
                <span>还有 {{ taskPending }} 积分可领取</span>
              </div>
            </div>
            <div class="zx-account-card zx-task-metrics">
              <div><strong>{{ formatPoints(credits) }}</strong><span>可用积分</span></div>
              <div><strong>{{ taskEarned }} / {{ signInEarned }}</strong><span>已领取积分（任务／签到）</span></div>
              <div><strong>{{ taskPending }}</strong><span>待领取积分</span></div>
            </div>
            <div class="zx-task-toolbar">
              <div class="zx-account-tabs" aria-label="任务状态筛选">
                <button v-for="filter in ['全部', '待完成', '待领取', '已领取']" :key="filter" type="button" :aria-pressed="taskFilter === filter" @click="taskFilter = filter">{{ filter }}</button>
              </div>
              <button class="zx-account-link" type="button" @click="emit('navigate', 'account')">积分明细</button>
            </div>
            <table v-if="taskRows.length" class="zx-account-table">
              <thead><tr><th scope="col">任务名称</th><th scope="col">奖励积分</th><th scope="col">状态</th><th scope="col">操作</th></tr></thead>
              <tbody>
                <tr v-for="task in taskRows" :key="task.id">
                  <td><button class="zx-account-link" type="button" @click="detail = { type: 'task', task }">{{ task.name }}</button></td>
                  <td class="zx-points">+{{ task.points }}</td><td>{{ task.status }}</td>
                  <td><ElButton v-if="task.status === '待领取'" size="small" type="primary" plain :disabled="!remainingSeconds" @click="showReward(claimTask(task))">领取</ElButton><span v-else>—</span></td>
                </tr>
              </tbody>
            </table>
            <ElEmpty v-else description="暂无该状态的任务" :image-size="60" />
          </template>
        </template>

        <template v-else-if="section === 'subscription'">
          <header class="zx-account-heading">
            <div><h2>订阅权益</h2><p>比较套餐的积分额度、自动任务和 AI 能力</p></div>
            <button class="zx-account-link" type="button" @click="detail = { type: 'records' }">订阅记录 <AiIcon name="chevron" :size="13" /></button>
          </header>
          <div class="zx-account-pair zx-plan-cards">
            <article class="zx-account-card zx-plan-card">
              <div class="zx-plan-title"><h3>免费版</h3><span>当前版本</span></div>
              <div class="zx-plan-allowance"><strong>200</strong><span>积分 / 月</span></div>
              <p>每月 200 基础积分</p>
              <ul class="zx-plan-highlights">
                <li><AiIcon name="check" :size="14" />2 个自动任务</li>
                <li><AiIcon name="check" :size="14" />支持文本输入</li>
              </ul>
            </article>
            <article class="zx-account-card zx-plan-card zx-paid-plan">
              <div class="zx-plan-title">
                <h3>订阅版</h3>
                <ElButton v-if="purchaseUrl" tag="a" type="primary" :href="purchaseUrl">升级套餐</ElButton>
                <ElButton v-else type="primary" @click="feedback = '暂时无法打开套餐购买页，请稍后再试。'">升级套餐</ElButton>
              </div>
              <div class="zx-plan-allowance"><strong>1,500</strong><span>积分 / 月</span></div>
              <p>每月 1,000 基础积分 + 500 赠送积分</p>
              <ul class="zx-plan-highlights">
                <li><AiIcon name="check" :size="14" />5 个自动任务</li>
                <li><AiIcon name="check" :size="14" />支持多模态输入</li>
              </ul>
            </article>
          </div>
          <h3 id="zx-plan-comparison-title" class="zx-plan-comparison-title">套餐权益对比</h3>
          <div class="zx-plan-comparison">
            <table class="zx-account-table" aria-labelledby="zx-plan-comparison-title">
              <thead><tr><th scope="col">权益项</th><th scope="col">免费版</th><th scope="col">订阅版</th></tr></thead>
              <tbody>
                <tr v-for="[benefit, free, paid] in planBenefits" :key="benefit">
                  <th scope="row">{{ benefit }}</th>
                  <td :class="{ 'is-unavailable': free === '—' }">{{ free }}</td>
                  <td :class="{ 'is-different': free !== paid }">{{ paid }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </div>
    <div v-if="feedback" class="zx-account-feedback" role="status">{{ feedback }}</div>
  </ElDialog>
</template>
