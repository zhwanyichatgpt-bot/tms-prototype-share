<script setup>
import { formatPoints } from '../account-demo.js'
import AiIcon from './AiIcon.vue'

defineProps({
  collapsed: Boolean,
  credits: Number,
  plan: String,
  pendingReward: Object,
})
const emit = defineEmits(['open'])
</script>

<template>
  <div class="account-entry" :class="{ 'is-icon-only': collapsed }">
    <button
      v-if="collapsed"
      class="account-icon"
      type="button"
      aria-label="积分与活动"
      title="积分与活动"
      @click="emit('open', 'account')"
    >
      <AiIcon name="chart" :size="16" />
    </button>
    <template v-else>
      <span class="account-label">当前版本</span>
      <span class="account-label">可用积分</span>
      <strong class="account-value">{{ plan }}</strong>
      <button class="account-value account-balance" type="button" @click="emit('open', 'account')">
        {{ formatPoints(credits) }}<span class="account-detail-hint">明细</span>
      </button>
      <button class="account-action" type="button" @click="emit('open', 'subscription')">查看权益</button>
      <button class="account-action account-points-action" :class="{ 'has-reward': pendingReward }" type="button" @click="emit('open', 'activity', pendingReward?.id)">
        {{ pendingReward ? '领取 ' + formatPoints(pendingReward.points) + ' 积分' : '获取积分' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.account-entry {
  --account-accent: var(--tms-brand-blue, #3a65ff);
  --account-accent-soft: #f4f6ff;
  display: grid;
  flex: none;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 4px 8px;
  margin: 8px 30px 16px;
  padding-top: 12px;
  border-top: 1px solid #edf0f6;
}
.account-label { color: #5e6b82; font-size: 11px; line-height: 16px; }
.account-value { color: #24304c; font-size: 15px; font-weight: 600; line-height: 20px; }
.account-entry .account-balance {
  display: flex;
  align-items: baseline;
  gap: 4px;
  justify-self: start;
  padding: 0;
  text-align: left;
  font-variant-numeric: tabular-nums;
}
.account-detail-hint { color: var(--account-accent); font-size: 10px; font-weight: 400; }
.account-balance:hover .account-detail-hint { text-decoration: underline; }
.account-entry .account-action {
  display: grid;
  place-items: center;
  min-height: 28px;
  margin-top: 3px;
  padding: 3px 4px;
  border: 1px solid #bccbff;
  border-radius: 4px;
  background: transparent;
  color: var(--account-accent);
  font-size: 11px;
  line-height: 16px;
}
.account-entry .account-action:hover { background: var(--account-accent-soft); }
.account-entry .account-points-action { border-color: transparent; background: var(--account-accent-soft); }
.account-entry .account-points-action:hover { border-color: #bccbff; }
.account-entry .account-points-action.has-reward { border-color: var(--account-accent); background: var(--account-accent); color: #fff; }
.account-entry .account-points-action.has-reward:hover { border-color: #345be6; background: #345be6; }
.account-entry button:focus-visible { outline: 2px solid var(--account-accent); outline-offset: 2px; }
.account-entry.is-icon-only { grid-template-columns: 1fr; margin: auto 8px 12px; padding: 4px; border-top: 0; }
.account-entry .account-icon { display: grid; place-items: center; min-height: 28px; border-radius: 4px; color: var(--account-accent); }
.account-entry .account-icon:hover { background: var(--account-accent-soft); }
</style>
