import { computed, ref } from 'vue'

const dayMs = 86_400_000
const chinaOffset = 8 * 3_600_000
const dateKey = time => new Date(time).toISOString().slice(0, 10)
const signInPoints = 20
const streakRewards = [
  { days: 3, points: 50 },
  { days: 7, points: 150 },
  { days: 15, points: 300 },
]

export const accountSections = [
  { id: 'account', name: '积分账户', icon: 'chart' },
  { id: 'activity', name: '积分活动', icon: 'clock' },
  { id: 'subscription', name: '订阅权益', icon: 'star' },
]

export const planBenefits = [
  ['每月基础积分', '200 积分', '1,000 积分'],
  ['每月赠送积分', '—', '500 积分'],
  ['每月合计积分', '200 积分', '1,500 积分'],
  ['自动任务数量', '2 个', '5 个'],
  ['智问', '支持', '支持'],
  ['智搜', '支持文本', '支持多模态'],
  ['智图', '—', '支持'],
  ['智办', '—', '支持'],
  ['输入方式', '文本', '多模态'],
]

export const formatPoints = value => value.toLocaleString('zh-CN')
export const chinaTime = time => new Date(time + chinaOffset).toISOString().slice(0, 16).replace('T', ' ')

let dailyDemo

export function useAccountDemo() {
  const today = dateKey(Date.now() + chinaOffset)
  if (dailyDemo?.today !== today) dailyDemo = createDailyDemo(today)
  return dailyDemo
}

function createDailyDemo(today) {
  // 业务首页和 AI 工作台共用当日演示状态，页面切换时保留到账记录。
  const todayTime = Date.parse(today)
  const signIns = ref(Array.from({ length: 5 }, (_, index) => dateKey(todayTime - (index + 1) * dayMs)))
  const claimedStreaks = ref([])
  const tasks = ref([
    { id: 'waybill', name: '分析托运单 1 次', points: 200, status: '待完成' },
    { id: 'plan', name: '创建运输计划 1 次', points: 300, status: '已领取' },
  ])
  const monthlyGrant = { id: 'monthly-base', category: 'base', name: '每月基础积分', source: '免费额度 · 基础积分', time: today.slice(0, 7) + '-01 00:00', points: 200 }
  const taskGrant = { id: 'plan', category: 'reward', name: '创建运输计划 1 次', source: '免费额度 · 成长任务', time: today + ' 08:00', points: 300 }
  const demoUsage = { id: 'usage-example', category: 'reward', name: 'AI 服务消耗（演示）', source: '免费额度 · 成长任务', time: today + ' 09:00', points: -200 }
  // 演示基础积分按自然月刷新，正式周期以套餐规则为准。
  const nextRefresh = new Date(todayTime)
  nextRefresh.setUTCMonth(nextRefresh.getUTCMonth() + 1, 1)
  const nextRefreshExample = dateKey(nextRefresh) + ' 00:00'
  const expiryDay = new Date(todayTime + 5 * dayMs)
  // 仅展示一笔任务积分的模拟余量和到期日，不定义正式有效期或扣减顺序。
  const expiryExample = {
    points: taskGrant.points + demoUsage.points,
    dateLabel: (expiryDay.getUTCMonth() + 1) + ' 月 ' + expiryDay.getUTCDate() + ' 日',
  }
  const ledger = ref([
    demoUsage, taskGrant, monthlyGrant,
    ...signIns.value.map(day => ({ id: day, category: 'reward', name: '每日签到', source: '免费额度 · 签到奖励', time: day + ' 09:00', points: signInPoints })),
  ].sort((a, b) => b.time.localeCompare(a.time)))
  const credits = computed(() => ledger.value.reduce((sum, row) => sum + row.points, 0))
  const totalCredits = computed(() => ledger.value.reduce((sum, row) => sum + Math.max(0, row.points), 0))
  const monthEarned = computed(() => ledger.value.reduce((sum, row) =>
    row.points > 0 && row.time.startsWith(today.slice(0, 7)) ? sum + row.points : sum, 0))
  const creditGroups = computed(() => [
    { id: 'base', label: '套餐基础积分' },
    { id: 'reward', label: '活动奖励积分' },
  ].map(group => {
    let earned = 0
    let used = 0
    for (const row of ledger.value) {
      if (row.category !== group.id) continue
      earned += Math.max(row.points, 0)
      used += Math.max(-row.points, 0)
    }
    const remaining = earned - used
    const percentage = earned ? Math.round(remaining / earned * 100) : 0
    return { ...group, earned, used, remaining, percentage }
  }))
  const signedToday = computed(() => signIns.value.includes(today))
  const streak = computed(() => {
    let days = 0
    let cursor = signedToday.value ? todayTime : todayTime - dayMs
    while (signIns.value.includes(dateKey(cursor))) {
      days += 1
      cursor -= dayMs
    }
    return days
  })
  const taskEarned = computed(() => tasks.value.reduce((sum, task) => sum + (task.status === '已领取' ? task.points : 0), 0))
  const signInEarned = computed(() => ledger.value.reduce((sum, row) => sum + (row.source.endsWith('签到奖励') ? row.points : 0), 0))
  const taskPending = computed(() => tasks.value.reduce((sum, task) => sum + (task.status === '待领取' ? task.points : 0), 0))
  const taskCount = computed(() => tasks.value.filter(task => task.status === '已领取').length)
  const activityStart = todayTime - chinaOffset - 7 * dayMs
  const activityEnd = todayTime - chinaOffset + dayMs - 1
  const activityActive = ref(true)
  setTimeout(() => { activityActive.value = false }, activityEnd - Date.now() + 1)
  const promotion = computed(() => {
    const task = tasks.value.find(item => item.id === 'waybill')
    return activityActive.value && task?.status !== '已领取' ? task : null
  })
  const readyStreak = computed(() => streakRewards.find(reward => streak.value >= reward.days && !claimedStreaks.value.includes(reward.days)))
  const rewardTarget = computed(() => {
    if (readyStreak.value) return 'streak'
    return activityActive.value ? tasks.value.find(task => task.status === '待领取')?.id : null
  })

  function addReward(id, name, source, points) {
    ledger.value.unshift({ id, category: 'reward', name, source: '免费额度 · ' + source, time: chinaTime(Date.now()), points })
    return points
  }

  function signIn() {
    if (signedToday.value) return 0
    signIns.value.unshift(today)
    return addReward(today, '每日签到', '签到奖励', signInPoints)
  }

  function claimStreak(reward) {
    if (streak.value < reward.days || claimedStreaks.value.includes(reward.days)) return 0
    claimedStreaks.value.push(reward.days)
    return addReward('streak-' + reward.days, '连续签到 ' + reward.days + ' 天', '签到奖励', reward.points)
  }

  function claimTask(task) {
    if (task.status !== '待领取' || Date.now() > activityEnd) return 0
    task.status = '已领取'
    return addReward(task.id, task.name, '成长任务', task.points)
  }

  function completeTask(id) {
    const task = tasks.value.find(item => item.id === id)
    if (task?.status === '待完成' && Date.now() <= activityEnd) task.status = '待领取'
  }

  return {
    plan: '免费版', today, signInPoints, signIns, signedToday, streak, streakRewards, claimedStreaks,
    tasks, taskEarned, signInEarned, taskPending, taskCount, activityStart, activityEnd, promotion, readyStreak, rewardTarget,
    ledger, credits, totalCredits, monthEarned, creditGroups, nextRefreshExample, expiryExample, signIn, claimStreak, claimTask, completeTask,
  }
}
