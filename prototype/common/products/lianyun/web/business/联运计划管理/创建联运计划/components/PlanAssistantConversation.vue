<script setup>
import { nextTick, ref, watch } from 'vue'
const props = defineProps({ messages: Array, reviewRows: Array })
const emit = defineEmits(['question'])
const draft = ref('')
const thread = ref(null)
function send(text = draft.value) {
  const question = text.trim()
  if (!question) return
  draft.value = ''
  emit('question', question)
}
watch(() => props.messages.length, async () => { await nextTick(); if (thread.value) thread.value.scrollTop = thread.value.scrollHeight })
</script>
<template>
  <div class="cp-assistant-conversation">
    <div ref="thread" class="cp-assistant-thread" aria-live="polite">
      <article v-for="(message, index) in messages" :key="index" :class="message.role">
        <img v-if="message.role === 'assistant'" src="/ai-workbench-assets/assistant-avatar.svg" alt="至小简" />
        <div class="cp-assistant-message">
          <p>{{ message.text }}</p>
          <div v-if="message.choices?.length" class="cp-assistant-choices">
            <button v-for="choice in message.choices" :key="choice.value" type="button" :disabled="index !== messages.length - 1" @click="send(choice.value)">
              <span><strong>{{ choice.title }}</strong><small>{{ choice.description }}</small></span>
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <dl v-if="message.review" class="cp-assistant-review">
            <div v-for="[label, value] in (index === messages.length - 1 ? reviewRows : message.reviewRows)" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
          </dl>
        </div>
      </article>
    </div>
    <form @submit.prevent="send()">
      <textarea v-model="draft" aria-label="联运计划助手输入" placeholder="描述运输需求，或补充、修改页面信息…" rows="2" @keydown.enter.exact.prevent="!$event.isComposing && send()" />
      <div><span>Enter 发送 · Shift + Enter 换行</span><button type="submit" :disabled="!draft.trim()">发送</button></div>
    </form>
  </div>
</template>
<style scoped>
.cp-assistant-conversation { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.cp-assistant-thread { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
.cp-assistant-thread article { display: flex; gap: 8px; margin-bottom: 14px; align-items: flex-start; }
.cp-assistant-thread article img { width: 28px; height: 28px; object-fit: contain; flex: none; }
.cp-assistant-message { min-width: 0; padding: 12px; background: #fff; border-radius: 8px; color: #3d4050; font-size: 13px; line-height: 1.8; }
.cp-assistant-thread article p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.cp-assistant-thread article.user { justify-content: flex-end; margin-left: 32px; }
.cp-assistant-thread article.user .cp-assistant-message { background: #eef2ff; border: 1px solid #dce3ff; }
.cp-assistant-choices { display: grid; gap: 8px; margin-top: 14px; }
.cp-assistant-choices button { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 10px 12px; border: 1px solid #dfe4ed; background: white; border-radius: 6px; text-align: left; font: inherit; color: inherit; cursor: pointer; }
.cp-assistant-choices strong, .cp-assistant-choices small { display: block; }
.cp-assistant-choices small { color: #737988; font-size: 12px; font-weight: 400; margin-top: 3px; }
.cp-assistant-choices button:hover:not(:disabled) { border-color: #3a65ff; background: #f5f7ff; }
.cp-assistant-choices button:disabled { cursor: default; color: #737988; background: #fafbfc; }
.cp-assistant-choices button:focus-visible { outline: 2px solid #3a65ff; outline-offset: 2px; }
.cp-assistant-review { margin: 14px 0 0; border-top: 1px solid #e9ecf2; padding-top: 12px; }
.cp-assistant-review>div { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 10px; margin-bottom: 8px; }
.cp-assistant-review dt { color: #737988; }
.cp-assistant-review dd { margin: 0; overflow-wrap: anywhere; }
.cp-assistant-conversation form { flex: none; padding: 12px; background: white; }
.cp-assistant-conversation textarea { box-sizing: border-box; width: 100%; resize: none; border: 1px solid #dfe4ed; border-radius: 6px; padding: 10px; font: inherit; font-size: 13px; outline-color: #3a65ff; }
.cp-assistant-conversation form>div { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.cp-assistant-conversation form span { font-size: 11px; color: #909499; }
.cp-assistant-conversation form button { border: 0; background: #3a65ff; color: white; border-radius: 4px; padding: 6px 14px; cursor: pointer; }
.cp-assistant-conversation form button:disabled { background: #dce3ff; cursor: default; }
</style>

<style>
.zx-chat:has(.cp-assistant-conversation) { display: flex; flex-direction: column; height: min(620px, calc(100dvh - 190px)); overflow: hidden; }
.zx-chat:has(.cp-assistant-conversation)>header,
.zx-chat:has(.cp-assistant-conversation)>.zx-context { flex: none; }
.create-plan-stage .zx-entry-business { display: none; }
.zx-floating[data-business-context="plan-create"] { bottom: 100px; }
.zx-floating[data-business-context="plan-create"] .zx-chat:has(.cp-assistant-conversation) { height: min(620px, calc(100dvh - 250px)); }
</style>
