<script setup>
import { computed, reactive } from 'vue'
import { ElButton, ElDialog, ElInput, ElOption, ElSelect, ElSwitch } from 'element-plus'
import { nextTaskTime, formatRunTime, scheduleFrequencies, scheduleWeekdays } from '../scheduled-tasks.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['close', 'save'])
const form = reactive({ ...props.config })
const validTime = computed(() => /^([01]\d|2[0-3]):[0-5]\d$/.test(form.time))
const next = computed(() => validTime.value ? formatRunTime(nextTaskTime(form)) : '请选择执行时间')
const canSave = computed(() => !!(form.title.trim() && form.prompt.trim() && form.scope && validTime.value))

function save() {
  if (canSave.value) emit('save', { ...form, title: form.title.trim(), prompt: form.prompt.trim() })
}
</script>

<template>
  <ElDialog :model-value="true" title="编辑定时任务" width="min(560px, calc(100vw - 32px))" @close="emit('close')">
    <form class="zx-task-form" @submit.prevent="save">
      <label><span>任务名称</span><ElInput v-model="form.title" aria-label="任务名称" maxlength="40" /></label>
      <label><span>执行内容</span><ElInput v-model="form.prompt" aria-label="执行内容" type="textarea" :rows="3" maxlength="300" /></label>
      <p class="zx-task-form-note">业务范围 · {{ form.scope }}。每次汇总该范围内尚未处理的异常运单。</p>
      <div class="zx-task-schedule-fields">
        <label><span>执行频率</span><ElSelect v-model="form.frequency" aria-label="执行频率"><ElOption v-for="option in scheduleFrequencies" :key="option.value" v-bind="option" /></ElSelect></label>
        <label v-if="form.frequency === 'weekly'"><span>执行日</span><ElSelect v-model="form.weekday" aria-label="执行日"><ElOption v-for="day in scheduleWeekdays" :key="day.value" v-bind="day" /></ElSelect></label>
        <label><span>执行时间</span><input v-model="form.time" type="time" aria-label="执行时间" required></label>
      </div>
      <p class="zx-task-form-note">北京时间 · {{ form.enabled === false ? '恢复后下次执行' : '下次执行' }} {{ next }}</p>
      <div class="zx-task-remind"><span>结果生成后在站内提醒</span><ElSwitch v-model="form.remind" aria-label="站内提醒" /></div>
    </form>
    <template #footer>
      <ElButton @click="emit('close')">取消</ElButton>
      <ElButton type="primary" :disabled="!canSave" @click="save">保存修改</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.zx-task-form { display: grid; gap: 12px; }
.zx-task-form label { display: grid; gap: 5px; min-width: 0; color: #334159; }
.zx-task-form input[type="time"] { box-sizing: border-box; min-height: 32px; padding: 4px 8px; border: 1px solid #dcdfe6; border-radius: 4px; color: #334159; font: inherit; }
.zx-task-form-note { margin: -6px 0 0; color: #68758a; font-size: 12px; }
.zx-task-schedule-fields { display: flex; gap: 10px; }
.zx-task-schedule-fields label { flex: 1; }
.zx-task-remind { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #edf0f5; padding-top: 7px; }
</style>
