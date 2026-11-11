<script setup>
import { computed } from 'vue'
import { ElButton } from 'element-plus'
import { canActivateScheduledTask, formatRunTime, nextTaskTime, scheduleLabel } from '../scheduled-tasks.js'

const props = defineProps({ proposal: { type: Object, required: true }, readOnly: Boolean })
const emit = defineEmits(['confirm', 'cancel', 'open'])
const config = computed(() => props.proposal.config)
const ready = computed(() => canActivateScheduledTask(config.value))
const status = {
  draft: '待确认',
  enabled: '已启用',
  superseded: '已更新',
  cancelled: '已取消',
}
const next = computed(() => ready.value ? formatRunTime(nextTaskTime(config.value)) : '待补充')
</script>

<template>
  <p v-if="!ready" class="zx-schedule-clarification">请补充执行频率和时间，比如「每周三下午三点半」。</p>
  <section v-else class="zx-schedule-proposal" aria-label="定时任务计划">
    <header><h2>{{ config.title }}</h2><span :class="{ enabled: proposal.state === 'enabled' }">{{ status[proposal.state] }}</span></header>
    <p>{{ config.prompt }}</p>
    <dl>
      <div><dt>业务范围</dt><dd>{{ config.scope }}</dd></div>
      <div><dt>执行时间</dt><dd>{{ scheduleLabel(config) }}（北京时间）</dd></div>
      <div v-if="proposal.state === 'draft'"><dt>下次执行</dt><dd>{{ next }}</dd></div>
      <div><dt>结果提醒</dt><dd>{{ config.remind ? '站内提醒' : '不提醒' }}</dd></div>
    </dl>
    <template v-if="proposal.state === 'draft' && !readOnly">
      <p class="zx-schedule-hint">可以继续告诉我怎么调整，比如「改成每天九点」。</p>
      <footer>
        <ElButton size="small" text @click="emit('cancel', proposal)">取消创建</ElButton>
        <ElButton size="small" type="primary" @click="emit('confirm', proposal)">确认启用</ElButton>
      </footer>
    </template>
    <footer v-if="proposal.state === 'enabled' && !readOnly">
      <ElButton size="small" type="primary" link @click="emit('open')">查看定时任务</ElButton>
    </footer>
  </section>
</template>

<style scoped>
.zx-schedule-clarification { margin: 0; }
.zx-schedule-proposal { width: min(100%, 520px); --el-color-primary: var(--ai-blue); }
.zx-schedule-proposal header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.zx-schedule-proposal h2 { font-size: 18px; line-height: 28px; }
.zx-schedule-proposal header span { padding: 0 6px; border-radius: 4px; background: #f2f3f5; color: #666; font-size: 12px; line-height: 22px; }
.zx-schedule-proposal header .enabled { background: #edf8ef; color: #287644; }
.zx-schedule-proposal p { margin-top: 8px; font-size: 16px; line-height: 26px; }
.zx-schedule-proposal dl { margin: 10px 0; border-block: 1px solid var(--ai-border); font-size: 14px; line-height: 22px; }
.zx-schedule-proposal dl > div { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 12px; padding-block: 4px; }
.zx-schedule-proposal dl > div + div { border-top: 1px solid var(--ai-border); }
.zx-schedule-proposal dt, .zx-schedule-proposal .zx-schedule-hint { color: #666; }
.zx-schedule-proposal .zx-schedule-hint { font-size: 14px; line-height: 22px; }
.zx-schedule-proposal dd { margin: 0; overflow-wrap: anywhere; }
.zx-schedule-proposal footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.zx-schedule-proposal footer :deep(.el-button) { height: 32px; margin-left: 0; border-radius: 8px; font-size: 14px; }
</style>
