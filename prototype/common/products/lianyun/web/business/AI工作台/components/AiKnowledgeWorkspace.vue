<script setup>
import { computed, ref, watch } from 'vue'
import AiIcon from './AiIcon.vue'
import AiTemplateLibrary from './AiTemplateLibrary.vue'
import { asset } from '../mock-data.js'
import { addPersonalKnowledgeFiles, knowledgeChildren, knowledgeDocuments, knowledgeEntries, knowledgeGroups, knowledgeQuestions } from '../knowledge-data.js'

const emit = defineEmits(['ask', 'help'])
const path = ref(['manuals'])
const scopeId = ref('manuals')
const draft = ref('')
const input = ref(null)
const personalFileInput = ref(null)
const retryFileInput = ref(null)
const uploadStatus = ref('')
const reader = ref(null)
const fileStatus = { processing: '处理中', ready: '可提问', failed: '处理失败' }
const currentId = computed(() => path.value.at(-1))
const current = computed(() => knowledgeEntries[currentId.value])
const library = computed(() => knowledgeEntries[path.value[0]])
const questions = computed(() => knowledgeQuestions(scopeId.value))
const canAsk = computed(() => knowledgeDocuments(scopeId.value).length > 0)
const canUseCurrent = computed(() => currentId.value !== scopeId.value && knowledgeDocuments(currentId.value).length > 0)
const unavailableText = computed(() => {
  if (scopeId.value === 'personal' && knowledgeChildren('personal').some(id => knowledgeEntries[id].status === 'processing')) {
    return '资料正在处理，完成后即可提问。'
  }
  return scopeId.value === 'personal' ? '添加可读取的资料后即可提问。' : '当前范围暂无可提问的资料。'
})

watch(currentId, () => {
  if (reader.value) reader.value.scrollTop = 0
}, { flush: 'post' })

function openLibrary(id) {
  if (path.value[0] !== id) draft.value = ''
  path.value = [id]
  scopeId.value = id
}

function chooseQuestion(question) {
  draft.value = question
  input.value?.focus()
}

async function addPersonalFiles(event, retryId = null) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  event.target.value = ''
  uploadStatus.value = ''
  const saved = await addPersonalKnowledgeFiles(files, retryId)
  if (!saved) uploadStatus.value = '本地空间不足或不可用，本次资料刷新后可能无法保留。'
}

function sendQuestion() {
  const question = draft.value.trim()
  if (!canAsk.value || !question) return
  emit('ask', question, scopeId.value)
  draft.value = ''
}
</script>

<template>
  <section class="knowledge-workspace" aria-label="知识库工作区">
    <aside class="knowledge-directory" aria-label="知识库目录">
      <h1>知识库</h1>
      <section v-for="group in knowledgeGroups" :key="group.label" class="knowledge-group">
        <h2>{{ group.label }}</h2>
        <button v-for="id in group.ids" :key="id" type="button"
          :aria-current="path[0] === id ? 'true' : undefined"
          @click="openLibrary(id)">
          <AiIcon name="file" :size="16" />
          <span>{{ knowledgeEntries[id].name }}</span>
        </button>
      </section>
    </aside>

    <div class="knowledge-main">
      <header class="knowledge-header">
        <nav aria-label="资料路径">
          <template v-for="(id, index) in path" :key="id">
            <span v-if="index" aria-hidden="true">/</span>
            <button v-if="index < path.length - 1" type="button" @click="path = path.slice(0, index + 1)">{{ knowledgeEntries[id].name }}</button>
            <span v-else aria-current="page">{{ knowledgeEntries[id].name }}</span>
          </template>
        </nav>
        <div class="knowledge-header-actions">
          <template v-if="currentId === 'personal'">
            <input ref="personalFileInput" type="file" multiple hidden @change="addPersonalFiles" />
            <button class="knowledge-upload" type="button" @click="personalFileInput?.click()"><AiIcon name="attach" :size="16" />上传资料</button>
          </template>
          <button type="button" @click="emit('help')">使用帮助</button>
        </div>
      </header>

      <div ref="reader" class="knowledge-content">
        <AiTemplateLibrary v-if="currentId === 'settlement-templates'" />
        <p v-if="path.length === 1 && currentId !== 'settlement-templates'" class="knowledge-summary">{{ library.summary }}</p>
        <p v-if="currentId === 'personal'" class="knowledge-summary knowledge-file-hint">支持 UTF-8 编码的 TXT、Markdown，单份最多 256 KB。资料仅保存在当前浏览器。</p>
        <p v-if="currentId === 'personal' && uploadStatus" class="knowledge-summary" role="status">{{ uploadStatus }}</p>
        <article v-if="current.kind === 'document'" class="knowledge-reader">
          <h2>{{ current.name }}</h2>
          <p v-if="current.status" class="knowledge-empty" role="status">{{ fileStatus[current.status] }}</p>
          <template v-if="current.status === 'failed'">
            <p>{{ current.error }}</p>
            <input ref="retryFileInput" type="file" hidden @change="addPersonalFiles($event, currentId)" />
            <button type="button" class="knowledge-text-button" @click="retryFileInput?.click()">重新选择文件</button>
          </template>
          <section v-for="section in current.sections" :key="section.title">
            <h3>{{ section.title }}</h3>
            <p>{{ section.content }}</p>
          </section>
        </article>
        <div v-else-if="knowledgeChildren(currentId).length" class="knowledge-grid">
          <button v-for="id in knowledgeChildren(currentId)" :key="id" type="button" @click="path = [...path, id]">
            <span class="knowledge-card-icon"><AiIcon :name="knowledgeEntries[id].kind === 'folder' ? 'grid' : 'file'" :size="24" /></span>
            <strong>{{ knowledgeEntries[id].name }}</strong>
            <small :class="'status-' + knowledgeEntries[id].status">{{ fileStatus[knowledgeEntries[id].status] || (knowledgeEntries[id].kind === 'folder' ? '文件夹' : '文档') }}</small>
          </button>
        </div>
        <p v-else-if="currentId !== 'settlement-templates'" class="knowledge-empty">{{ currentId === 'personal' ? '还没有资料，点击右上角「上传资料」添加。' : '暂无文件或文件夹' }}</p>
      </div>

      <form v-if="currentId !== 'settlement-templates'" class="knowledge-composer" @submit.prevent="sendQuestion">
        <div class="knowledge-scope">
          <span>提问范围 · {{ knowledgeEntries[scopeId].name }}</span>
          <button v-if="canUseCurrent" type="button" @click="scopeId = currentId">使用当前{{ current.kind === 'document' ? '文档' : current.kind === 'folder' ? '文件夹' : '知识库' }}</button>
          <button v-if="scopeId !== path[0] && currentId !== path[0]" type="button" @click="scopeId = path[0]">使用整个知识库</button>
        </div>
        <div v-if="questions.length" class="knowledge-questions">
          <button v-for="question in questions" :key="question" type="button" @click="chooseQuestion(question)">{{ question }}</button>
        </div>
        <p v-if="!canAsk" class="knowledge-empty-scope" role="status">{{ unavailableText }}</p>
        <div class="knowledge-input">
          <textarea ref="input" v-model="draft" rows="2" aria-label="基于知识库提问" placeholder="基于知识库提问" :disabled="!canAsk"></textarea>
          <button type="submit" class="ai-send-button" aria-label="发送问题" title="发送" :disabled="!draft.trim() || !canAsk"><img :src="asset('send.svg')" width="16" height="18" alt="" /></button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.knowledge-workspace{display:grid;grid-template-columns:minmax(168px,232px) minmax(0,1fr);height:100%;color:#333}
.knowledge-directory{padding:16px 14px;overflow:auto;border-right:1px solid var(--ai-border);background:#fff}
.knowledge-directory h1{margin:0 10px 20px;font-size:20px;line-height:28px}
.knowledge-group{margin-bottom:18px}
.knowledge-group h2{margin:0 10px 6px;font-size:13px;color:#777}
.knowledge-group button{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;padding:8px 10px;border-radius:9px;text-align:left;font-size:14px}
.knowledge-group button span{min-width:0;overflow-wrap:anywhere}
.knowledge-group button svg{flex:none;color:var(--ai-blue)}
.knowledge-group button[aria-current],.knowledge-group button:hover{background:#f1f2f3}
.knowledge-main{min-width:0;min-height:0;display:flex;flex-direction:column}
.knowledge-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;border-bottom:1px solid var(--ai-border)}
.knowledge-header nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:16px;line-height:26px}
.knowledge-header button,.knowledge-scope button{font-size:14px;color:var(--ai-blue)}
.knowledge-header-actions{display:flex;align-items:center;gap:12px;flex:none}
.knowledge-header .knowledge-upload{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:1px solid var(--ai-border);border-radius:9px;background:#fff}
.knowledge-content{flex:1;min-height:0;overflow:auto;padding:20px 24px}
.knowledge-text-button{flex:none;color:var(--ai-blue);font-size:14px}
.knowledge-summary{margin:0 0 16px;font-size:14px;line-height:22px;color:#666}
.knowledge-file-hint{font-size:13px}
.knowledge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(150px, 100%), 240px));gap:14px}
.knowledge-grid button{display:grid;gap:8px;align-content:start;justify-items:start;padding:18px 19px;border:1px solid var(--ai-border);border-radius:9px;background:#fff;text-align:left}
.knowledge-grid button:hover{border-color:#c7d0ff}
.knowledge-card-icon{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--ai-border);border-radius:12px;color:var(--ai-blue)}
.knowledge-grid strong{font-size:16px;line-height:24px;font-weight:400}
.knowledge-grid strong,.knowledge-reader h2,.knowledge-header nav{overflow-wrap:anywhere;min-width:0}
.knowledge-grid small,.knowledge-empty,.knowledge-empty-scope{font-size:13px;color:#777}
.knowledge-grid .status-ready{color:#217653}
.knowledge-grid .status-failed{color:#a43c36}
.knowledge-reader{max-width:760px;line-height:1.7}
.knowledge-reader h2{margin:0 0 12px;font-size:18px;font-weight:400}
.knowledge-reader h3{margin:12px 0 4px;font-size:16px;font-weight:400}
.knowledge-reader p{margin:0 0 16px;white-space:pre-wrap;overflow-wrap:anywhere}
.knowledge-composer{width:min(100%, 1048px);padding:14px 24px 24px}
.knowledge-scope,.knowledge-questions,.knowledge-input{display:flex;gap:8px;align-items:center}
.knowledge-scope,.knowledge-questions{flex-wrap:wrap;margin-bottom:8px}
.knowledge-scope span{border-radius:8px;background:#ebebeb;padding:4px 8px;font-size:13px;color:#555}
.knowledge-questions button{border:1px solid var(--ai-border);border-radius:8px;background:#fff;padding:4px 10px;font-size:14px;text-align:left}
.knowledge-questions button:hover{border-color:#c7d0ff;color:var(--ai-blue)}
.knowledge-input{align-items:flex-end;border:1px solid var(--ai-blue);border-radius:16px;background:#fff;padding:12px;box-shadow:0 6px 16px #0000000d}
.knowledge-input textarea{flex:1;min-width:0;resize:vertical;max-height:100px;border:0;padding:2px 4px;font:inherit;font-size:16px;line-height:24px;color:inherit}
.knowledge-input textarea:focus{outline:none}
.knowledge-input textarea::placeholder{color:#999}
.knowledge-input .ai-send-button{flex:none}
@container (max-width: 680px){.knowledge-workspace{grid-template-columns:140px minmax(0,1fr)}.knowledge-header,.knowledge-content,.knowledge-composer{padding-inline:12px}.knowledge-header-actions{flex-wrap:wrap;flex-shrink:1}}
</style>
