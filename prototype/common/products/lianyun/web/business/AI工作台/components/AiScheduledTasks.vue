<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch, ElTag } from 'element-plus'
import AiIcon from './AiIcon.vue'
import { formatRunTime, nextTaskTime, scheduleLabel } from '../scheduled-tasks.js'

const props = defineProps({ tasks: Array, runs: Array, historyTaskId: String })
const emit = defineEmits(['back', 'history', 'new', 'edit', 'toggle', 'run', 'result'])
const statuses = {
  running: { label: '运行中', tone: 'primary' },
  completed: { label: '已完成', tone: 'success' },
  failed: { label: '运行失败', tone: 'danger' },
}
const latestRun = id => props.runs.find(run => run.taskId === id)
const historyTask = computed(() => props.tasks.find(task => task.id === props.historyTaskId))
const taskHistory = computed(() => props.runs.filter(run => run.taskId === props.historyTaskId).reverse())
const workspace = ref(null)
watch(() => props.historyTaskId, () => { if (workspace.value) workspace.value.scrollTop = 0 })
const now = ref(Date.now())
let clockTimer

onMounted(() => {
  clockTimer = setInterval(() => { now.value = Date.now() }, 30_000)
})
onUnmounted(() => clearInterval(clockTimer))

function nextExecutionLabel(task) {
  if (!task.enabled) return '已暂停'
  const next = nextTaskTime(task, now.value)
  if (!next) return '待设置执行时间'
  const minutes = Math.floor((next - now.value) / 60_000)
  if (minutes < 1) return '即将执行'
  if (minutes < 60) return minutes + '分钟后执行'
  return Math.floor(minutes / 60) + '小时后执行'
}

function handleTaskAction(action, task) {
  if (action === 'edit') emit('edit', task)
  if (action === 'run') emit('run', task.id)
}
</script>

<template>
  <section class="zx-scheduled-tasks" aria-label="定时任务管理">
    <header class="ai-conversation-header zx-task-header">
      <h1>{{ historyTask ? historyTask.title : '定时任务' }}</h1>
      <ElButton v-if="historyTask" type="primary" link @click="emit('back')">返回我的任务</ElButton>
      <ElButton v-else class="zx-task-create" type="primary" @click="emit('new')"><AiIcon name="plus" :size="16" />新建任务</ElButton>
    </header>

    <div ref="workspace" class="zx-task-body">
      <section v-if="historyTask" class="zx-task-content zx-task-history" aria-label="任务执行记录">
        <p v-if="!taskHistory.length" class="zx-history-empty">这项任务还没有执行记录。</p>
        <article v-for="run in taskHistory" :key="run.id" class="zx-history-entry">
          <header class="zx-history-meta">
            <time :datetime="new Date(run.startedAt).toISOString()">{{ formatRunTime(run.startedAt) }}</time>
            <ElTag size="small" :type="statuses[run.status].tone">{{ statuses[run.status].label }}</ElTag>
          </header>
          <div class="ai-assistant-message ai-document-reply zx-history-result">
            <template v-if="run.result">
              <h2>{{ run.result.summary }}</h2>
              <dl v-if="run.result.sections?.length" class="zx-history-details">
                <div v-for="section in run.result.sections" :key="section.title">
                  <dt>{{ section.title }}</dt>
                  <dd>{{ section.text }}</dd>
                </div>
              </dl>
              <button type="button" class="ai-document-link" @click="emit('result', run.result.id)">
                <AiIcon name="file" :size="20" />
                <span class="zx-history-result-title"><strong>{{ run.result.title }}</strong><small>定时简报</small></span>
                <span class="ai-document-link-action">查看成果</span>
              </button>
            </template>
            <template v-else-if="run.status === 'failed'">
              <p>{{ run.error }}</p>
              <ElButton type="primary" link :disabled="latestRun(run.taskId)?.status === 'running'" @click="emit('run', run.taskId)">重新运行</ElButton>
            </template>
            <p v-else>正在执行任务…</p>
          </div>
        </article>
        <p class="zx-history-next">
          {{ historyTask.enabled ? '下一次运行 ' + formatRunTime(nextTaskTime(historyTask, now)) + '（北京时间）' : '任务已暂停' }}
        </p>
      </section>

      <div v-else class="zx-task-content zx-task-grid">
        <section v-if="!tasks.length" class="zx-task-empty">
          <div class="zx-task-icon"><AiIcon name="refresh" :size="24" /></div>
          <h2>每天关心的事，交给至小简</h2>
          <p>告诉至小简你想跟进的业务和执行时间，每期简报都可以回看。</p>
          <ElButton type="primary" plain @click="emit('new', true)">使用「每日异常运单简报」示例</ElButton>
        </section>

        <article v-for="task in tasks" :key="task.id" class="zx-task-card zx-schedule-card">
          <header class="zx-schedule-card-header">
            <h2 :title="task.title">
              <button type="button" class="zx-schedule-card-open" :aria-label="'查看执行记录：' + task.title" @click="emit('history', task.id)">{{ task.title }}</button>
            </h2>
            <div class="zx-schedule-controls">
              <ElDropdown trigger="click" placement="bottom-end" @command="handleTaskAction($event, task)">
                <button type="button" class="zx-task-more" :aria-label="'更多操作：' + task.title" title="更多操作">
                  <AiIcon name="more" :size="16" />
                </button>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="edit">编辑</ElDropdownItem>
                    <ElDropdownItem command="run" :disabled="latestRun(task.id)?.status === 'running'">立即运行</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
              <ElSwitch
                class="zx-task-switch"
                size="small"
                :width="28"
                :model-value="task.enabled"
                :aria-label="'定时执行：' + task.title"
                @change="emit('toggle', task.id)"
              />
            </div>
          </header>
          <p class="zx-schedule-description" :title="task.prompt">{{ task.prompt }}</p>
          <footer class="zx-schedule-card-footer">
            <span class="zx-schedule-frequency" title="北京时间"><AiIcon name="clock" :size="16" />{{ scheduleLabel(task) }}</span>
            <span :title="task.enabled ? formatRunTime(nextTaskTime(task, now)) + '（北京时间）' : ''">{{ nextExecutionLabel(task) }}</span>
          </footer>
        </article>
      </div>

    </div>
  </section>
</template>

<style scoped>
.zx-scheduled-tasks {
  display: flex;
  flex-direction: column;
  height: 100%;
  --el-color-primary: #3a65ff;
}
.zx-task-header { display: flex; align-items: center; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; }
.zx-task-header h1 { min-width: 0; }
.zx-task-body { flex: 1; min-height: 0; overflow: auto; }
.zx-task-content { max-width: 1048px; padding: 24px var(--ai-page-gutter); }
.zx-task-create { height: 32px; border-radius: 6px; }
.zx-task-create :deep(span) { gap: 4px; }
.zx-task-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); }
.zx-task-grid .zx-task-empty { grid-column: 1 / -1; }
.zx-task-card, .zx-task-empty { border: 1px solid #e1e5f2; border-radius: 8px; background: #fff; padding: 12px 20px; }
.zx-schedule-card {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 550px;
  padding: 20px;
  border: 1px solid #dfe2ec;
  border-radius: 16px;
  box-shadow: 0 4px 12px #232b4b06;
}
.zx-schedule-card-header, .zx-schedule-controls, .zx-schedule-card-footer, .zx-schedule-frequency { display: flex; align-items: center; }
.zx-schedule-card-header, .zx-schedule-card-footer { justify-content: space-between; gap: 8px 12px; }
.zx-schedule-controls { flex: none; gap: 8px; }
.zx-schedule-card .zx-schedule-card-header h2 { display: block; min-width: 0; overflow: hidden; color: #232544; text-overflow: ellipsis; white-space: nowrap; }
.zx-schedule-card-open { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: inherit; vertical-align: top; }
.zx-schedule-card-open::after { position: absolute; inset: 0; border-radius: 16px; content: ''; }
.zx-schedule-card:hover, .zx-schedule-card:focus-within { border-color: #c9c9f9; }
.zx-schedule-controls { position: relative; z-index: 1; }
.zx-task-more { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 6px; color: #6c7085; }
.zx-task-more:hover, .zx-task-more[aria-expanded="true"] { background: #f1f1fa; color: #4a4d68; }
.zx-task-switch { --el-switch-on-color: #625df6; --el-switch-off-color: #dfe2ec; }
.zx-schedule-card p.zx-schedule-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 8px 0 12px;
  color: #686e86;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.zx-schedule-card-footer { flex-wrap: wrap; margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e5f2; color: #686e86; font-size: 14px; line-height: 22px; }
.zx-schedule-frequency { gap: 4px; }
.zx-task-card h2, .zx-task-empty h2 { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 16px; line-height: 24px; font-weight: 700; overflow-wrap: anywhere; }
.zx-task-card p, .zx-task-empty p { margin-top: 4px; color: #6c7080; font-size: 14px; line-height: 22px; overflow-wrap: anywhere; }
.zx-task-empty { display: grid; justify-items: center; gap: 10px; padding: 36px 18px; text-align: center; }
.zx-task-icon { display: grid; flex: none; place-items: center; width: 32px; height: 32px; border-radius: 6px; background: #ebefff; color: var(--el-color-primary); }
.zx-history-entry + .zx-history-entry { margin-top: 20px; }
.zx-history-meta { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; margin: 0 0 8px; color: #525666; line-height: 22px; }
.zx-history-result { overflow-wrap: anywhere; }
.zx-history-details { display: grid; gap: 12px; margin: 12px 0 0; font-size: 14px; line-height: 22px; }
.zx-history-details dt { color: #263755; font-weight: 600; }
.zx-history-details dd { margin: 2px 0 0; color: #525666; }
.zx-history-result .ai-document-link { margin-bottom: 0; }
.zx-history-result-title { min-width: 0; }
.zx-task-history .zx-history-empty, .zx-task-history .zx-history-next { color: #66738c; font-size: 14px; line-height: 22px; }
.zx-task-history .zx-history-next { margin-top: 16px; }
@container (max-width: 480px) {
  .zx-task-content { padding-block: 16px; }
  .zx-schedule-card { padding: 16px; }
}
</style>
