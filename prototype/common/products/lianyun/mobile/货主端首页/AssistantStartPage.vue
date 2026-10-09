<template>
  <section class="las-page" aria-label="小简 AI 助手首屏">
    <header class="las-header">
      <button aria-label="查看历史会话" @click="panel = 'history'"><van-icon name="bars"/></button>
      <h1>小简 AI 助手</h1>
      <button aria-label="新建对话" @click="restart"><van-icon name="add-o"/></button>
    </header>
    <main class="las-content">
      <section class="las-welcome">
        <img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简"/>
        <h2>有什么我能帮你的吗？</h2>
        <p>建单、识图、找方案、查运输</p>
      </section>
      <section class="las-recommendations" aria-label="推荐问题">
        <div class="las-heading"><h3>为你推荐</h3><button @click="suggestionSet = (suggestionSet + 1) % suggestions.length"><van-icon name="replay"/>换一换</button></div>
        <button v-for="item in suggestions[suggestionSet]" :key="item.text" class="las-prompt" @click="choose(item)">{{ item.text }}</button>
      </section>
    </main>
    <footer class="las-input-area">
      <h3>快捷操作</h3>
      <div class="las-actions">
        <button @click="askForPlan"><van-icon name="guide-o"/>找方案</button>
        <button @click="openImage"><van-icon name="photo-o"/>智能识图</button>
        <button @click="openCreate()"><van-icon name="records-o"/>智能建单</button>
      </div>
      <form class="las-composer" @submit.prevent="send">
        <button type="button" aria-label="上传图片或文件" @click="openImage"><van-icon name="photograph"/></button>
        <textarea ref="composer" v-model="input" rows="1" maxlength="500" aria-label="向小简描述运输需求" placeholder="说需求，或上传图片…" @keydown.enter.exact.prevent="send"/>
        <button type="button" :aria-label="listening ? '停止语音输入' : '语音输入'" :class="{listening}" @click="toggleVoice"><van-icon name="audio"/></button>
        <button type="submit" class="las-send" :disabled="!input.trim()" aria-label="发送消息"><van-icon name="arrow-up"/></button>
      </form>
      <p v-if="notice" class="las-notice" role="status">{{ notice }}</p>
    </footer>

    <div v-if="panel" class="las-overlay" @click.self="closePanel" @keydown.esc="closePanel">
      <section class="las-sheet" role="dialog" aria-modal="true" :aria-label="panelTitle" tabindex="-1" ref="sheet">
        <header class="las-heading"><h2>{{ panelTitle }}</h2><button aria-label="关闭面板" @click="closePanel"><van-icon name="cross"/></button></header>
        <template v-if="panel === 'history'">
          <p class="las-hint">会话与演示单据仅保留在本次页面会话中。</p>
          <p v-if="!sessions.length && !documents.length" class="las-empty">还没有历史记录，先和小简说说你的需求吧。</p>
          <button v-for="session in sessions" :key="session.id" class="las-history-row" @click="emit('restore', session); closePanel()"><van-icon name="chat-o"/><span>{{ session.title }}</span><van-icon name="arrow"/></button>
          <button v-for="doc in documents" :key="doc.id" class="las-history-row" @click="created = doc; panel = 'done'"><van-icon name="records-o"/><span>{{ doc.type }} · {{ doc.origin }} → {{ doc.destination }}</span><van-icon name="arrow"/></button>
        </template>
        <template v-else-if="panel === 'image'">
          <p class="las-hint">上传货物清单、运输需求或报价图片。</p>
          <div class="las-upload-actions"><button class="las-outline" @click="cameraPicker.click()"><van-icon name="photograph"/>拍照</button><button class="las-outline" @click="filePicker.click()"><van-icon name="photo-o"/>图片 / PDF</button></div>
          <input ref="filePicker" hidden type="file" accept="image/*,.pdf" @change="selectFile"/>
          <input ref="cameraPicker" hidden type="file" accept="image/*" capture="environment" @change="selectFile"/>
          <div v-if="fileName" class="las-file"><img v-if="imageUrl" :src="imageUrl" alt="已上传图片预览"/><p>{{ fileName }}</p><button class="las-link" @click="clearFile">移除</button></div>
          <p v-if="fileName" class="las-hint">图片内容尚未识别。可手工填写，或使用示例体验识图结果。</p>
          <p v-if="fileError" class="las-error" role="alert">{{ fileError }}</p>
          <button class="las-primary" @click="useImageExample">体验示例识图</button>
          <button v-if="fileName" class="las-outline" @click="openCreate()">手工整理建单信息</button>
        </template>
        <template v-else-if="panel === 'create'">
          <p class="las-hint"><span v-if="fromExample" class="las-badge">识图示例</span>{{ fromExample ? '以下来自示例货物清单，请核对后继续。' : '选择单据类型，核对运输信息。' }}</p>
          <div class="las-type-tabs" role="group" aria-label="建单类型"><button v-for="type in ['运输需求单','订单']" :key="type" :aria-pressed="form.type === type" @click="form.type = type">{{ type }}</button></div>
          <form class="las-draft" @submit.prevent="saveDocument">
            <label>装货地<input v-model="form.origin" required maxlength="100" placeholder="请输入装货城市或地址"/></label>
            <label>卸货地<input v-model="form.destination" required maxlength="100" placeholder="请输入卸货城市或地址"/></label>
            <label>货物信息<input v-model="form.goods" required maxlength="200" placeholder="货物名称、重量或数量"/></label>
            <label>出运日期<input v-model="form.departure" type="date"/></label>
            <label>补充要求<textarea v-model="form.note" rows="2" maxlength="500" placeholder="到货时间、装卸或其他要求"/></label>
            <p v-if="formError" class="las-error" role="alert">{{ formError }}</p>
            <p class="las-hint">本次为建单演示，仅模拟保存，不提交真实订单。</p>
            <button class="las-primary" type="submit">确认保存{{ form.type }}</button>
          </form>
        </template>
        <template v-else-if="panel === 'done' && created">
          <div class="las-success"><van-icon name="passed"/><h3>{{ created.type }}已模拟保存</h3><p>{{ created.id }}</p></div>
          <dl class="las-document"><dt>运输路线</dt><dd>{{ created.origin }} → {{ created.destination }}</dd><dt>货物信息</dt><dd>{{ created.goods }}</dd><dt>出运日期</dt><dd>{{ created.departure || '未填写' }}</dd><dt>补充要求</dt><dd>{{ created.note || '无' }}</dd></dl>
          <p class="las-hint">演示单据仅保留在本次页面会话中，未对外提交。</p>
          <button class="las-primary" @click="closePanel">完成</button>
          <button class="las-outline" @click="openCreate()">再建一单</button>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { blankDemand } from './assistant-data.js'
import { parseRequest } from './assistant-engine.js'
const props = defineProps({ sessions: { type: Array, default: () => [] } })
const emit = defineEmits(['message', 'restore', 'restart', 'overlay'])
const input = ref(''), composer = ref(null), sheet = ref(null), panel = ref(''), suggestionSet = ref(0)
const notice = ref(''), listening = ref(false), filePicker = ref(null), cameraPicker = ref(null)
const imageUrl = ref(''), fileName = ref(''), fileError = ref(''), formError = ref(''), fromExample = ref(false)
const documents = ref([]), created = ref(null)
const emptyForm = () => ({ type: '运输需求单', origin: '', destination: '', goods: '', departure: '', note: '' })
const form = ref(emptyForm())
let recognition
const suggestions = [
  [{text:'宁波到重庆，20吨设备，帮我建单',task:'create'}, {text:'上传货物清单，帮我提取建单信息',task:'image'}, {text:'这批货走公路还是铁路更合适？',task:'plan'}, {text:'帮我查询运输进展',task:'tracking'}],
  [{text:'帮我整理一张运输需求单',task:'create'}, {text:'这张运输需求截图，帮我识别一下',task:'image'}, {text:'武汉到长沙，比较运输方案',task:'query'}, {text:'查询运单 LY20260930001',task:'query'}],
]
const panelTitle = computed(() => ({history:'历史记录',image:'智能识图',create:'核对建单信息',done:'建单结果'})[panel.value])
watch(panel, async value => { emit('overlay', !!value); if(value) { await nextTick(); sheet.value?.focus() } })
function closePanel() { panel.value = ''; nextTick(() => composer.value?.focus()) }
function restart() { input.value = ''; notice.value = ''; emit('restart') }
function choose(item) {
  if(item.task === 'create') openCreate(item.text)
  else if(item.task === 'image') openImage()
  else if(item.task === 'plan') askForPlan()
  else if(item.task === 'tracking') emit('message', '帮我查运输')
  else emit('message', item.text)
}
function send() {
  const text = input.value.trim()
  if(!text) return
  if(/建单|创建.*(需求单|订单)|生成.*(需求单|订单)/.test(text)) openCreate(text)
  else if(/识图|识别.*(图片|截图|清单)/.test(text)) openImage()
  else emit('message', text)
  input.value = ''
}
function askForPlan() { emit('message', '帮我找运输方案') }
function openCreate(text = '') {
  const parsed = parseRequest(text, blankDemand())
  const cargo = text.match(/(\d+(?:\.\d+)?\s*吨[^，,。]*)/)
  form.value = { ...emptyForm(), type: /订单/.test(text) ? '订单' : '运输需求单', origin:parsed.origin, destination:parsed.destination, goods:cargo?.[1] || '', departure:parsed.departure || '' }
  fromExample.value = false; formError.value = ''; panel.value = 'create'
}
function openImage() { fileError.value = ''; panel.value = 'image' }
function clearFile() { if(imageUrl.value) URL.revokeObjectURL(imageUrl.value); imageUrl.value = ''; fileName.value = '' }
function selectFile(event) {
  const file = event.target.files?.[0]; event.target.value = ''
  if(!file) return
  fileError.value = ''
  if(!(file.type.startsWith('image/') || file.type === 'application/pdf')) { fileError.value = '请选择图片或 PDF 文件。'; return }
  if(file.size > 10 * 1024 * 1024) { fileError.value = '文件超过 10 MB，请选择较小的文件。'; return }
  clearFile(); fileName.value = file.name
  if(file.type.startsWith('image/')) imageUrl.value = URL.createObjectURL(file)
}
function useImageExample() {
  form.value = { ...emptyForm(), origin:'宁波', destination:'重庆', goods:'设备，20吨' }
  fromExample.value = true; formError.value = ''; panel.value = 'create'
}
function saveDocument() {
  formError.value = ''
  const fields = ['origin','destination','goods']
  if(fields.some(key => !form.value[key].trim())) { formError.value = '请补充装货地、卸货地和货物信息。'; return }
  if(form.value.origin.trim() === form.value.destination.trim()) { formError.value = '请核对装卸地点，两个地点不能相同。'; return }
  created.value = { ...form.value, ...Object.fromEntries(fields.map(key => [key,form.value[key].trim()])), id:'DEMO-'+Date.now() }
  documents.value.unshift(created.value); panel.value = 'done'
}
function toggleVoice() {
  if(listening.value) { recognition?.stop(); return }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if(!SpeechRecognition) { notice.value = '当前浏览器暂不支持语音输入，请使用文字或图片。'; return }
  recognition = new SpeechRecognition(); recognition.lang = 'zh-CN'; recognition.interimResults = false
  recognition.onresult = event => { input.value += event.results[0][0].transcript; notice.value = '请核对识别文字后发送。' }
  recognition.onerror = () => { notice.value = '语音输入未完成，请检查麦克风权限或改用文字。'; listening.value = false }
  recognition.onend = () => { listening.value = false }
  try { recognition.start(); listening.value = true; notice.value = '正在聆听，点击麦克风停止。' }
  catch { listening.value = false; notice.value = '暂时无法开始语音输入，请改用文字。' }
}
onBeforeUnmount(() => { recognition?.abort(); clearFile(); emit('overlay', false) })
</script>

<style scoped>
.las-page{display:flex;flex-direction:column;height:100%;min-height:0;background:#fff;color:#24324b;font-size:13px;line-height:1.5}
.las-page button{font:inherit;cursor:pointer}.las-page button:focus-visible{outline:2px solid #3a65ff;outline-offset:2px}.las-header{display:flex;align-items:center;justify-content:space-between;height:46px;flex:none;padding:0 16px}.las-header h1{font-size:16px;font-weight:600}.las-header button{display:grid;place-items:center;width:32px;height:32px;border:0;background:none;font-size:24px;color:#24324b}
.las-content{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:0 18px 8px;scrollbar-width:none}.las-welcome{text-align:center;padding:40px 0 29px}.las-welcome img{width:104px;height:104px;object-fit:contain}.las-welcome h2{font-size:22px;font-weight:600;line-height:1.5;margin:14px 0 8px}.las-welcome p{font-size:14px;color:#8999b2;letter-spacing:1px}.las-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.las-heading h3,.las-input-area>h3{font-size:12px;font-weight:600;color:#879bb6}.las-heading button{display:flex;gap:5px;align-items:center;border:0;background:none;color:#879bb6;font-size:11px;padding:6px 0}.las-recommendations>.las-heading{margin-bottom:9px}.las-prompt{display:block;width:fit-content;max-width:100%;padding:10px 12px;margin:0 0 9px;text-align:left;background:#fff;border:1px solid #dce3ee;border-radius:10px;color:#526985;font-size:12px!important;line-height:1.55}.las-prompt:hover{background:#f6f8ff;border-color:#b9cbff}
.las-input-area{flex:none;padding:10px 14px 15px;background:#fff}.las-input-area>h3{margin:0 4px 8px}.las-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:0 4px 10px}.las-actions button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;border:1px solid #dce3ee;border-radius:9px;background:#fff;color:#526985;font-size:12px}.las-actions .van-icon{font-size:18px}.las-composer{display:flex;align-items:center;gap:7px;padding:10px 11px;border:1px solid #e6eaf2;border-radius:27px;box-shadow:0 5px 18px #1c35550a;background:white}.las-composer button{flex:none;display:grid;place-items:center;width:27px;height:30px;border:0;background:none;color:#425977;font-size:21px}.las-composer textarea{flex:1;min-width:0;height:24px;max-height:72px;padding:2px 0;border:0;outline:none;resize:none;background:none;font:inherit;font-size:13px;line-height:20px;color:#24324b}.las-composer textarea::placeholder{color:#9ba9bf}.las-composer .las-send{width:30px;height:30px;border-radius:50%;color:#3a65ff;background:#edf2ff}.las-send:disabled{opacity:.5}.las-composer .listening{color:#3a65ff}.las-notice{font-size:10px;color:#879bb6;margin:5px 8px 0}
.las-overlay{position:absolute;inset:0;z-index:40;background:#20345466;display:flex;align-items:flex-end}.las-sheet{width:100%;max-height:90%;overflow-y:auto;padding:19px 18px 24px;background:#fff;border-radius:20px 20px 0 0;outline:none}.las-sheet>.las-heading{margin-bottom:13px}.las-sheet h2{font-size:17px}.las-sheet>.las-heading>button{font-size:21px;color:#526985;padding:4px}.las-hint{font-size:11px;color:#8999b2;margin:10px 0;line-height:1.65}.las-badge{display:inline-block;color:#3a65ff;background:#edf2ff;border-radius:5px;padding:2px 5px;margin-right:5px}.las-primary,.las-outline{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:42px;border-radius:10px;font-size:13px!important;margin-top:10px}.las-primary{background:#3a65ff;color:white!important;border:0}.las-outline{background:white;border:1px solid #dce3ee;color:#526985}.las-link{border:0;background:none;color:#3a65ff;font-size:12px}.las-upload-actions{display:flex;gap:10px}.las-file{padding:10px;background:#f5f7fc;border-radius:10px;margin-top:14px;overflow-wrap:anywhere}.las-file>img{width:100%;max-height:180px;object-fit:contain}.las-file p{font-size:12px}.las-error{color:#bf4141;font-size:12px;margin:8px 0}.las-empty{padding:35px 10px;color:#8999b2;text-align:center}.las-history-row{display:flex;align-items:center;gap:10px;width:100%;padding:13px 0;background:none;border:0;border-bottom:1px solid #eef1f6;text-align:left;color:#526985}.las-history-row>span{flex:1;overflow-wrap:anywhere}.las-type-tabs{display:flex;gap:8px;margin:14px 0}.las-type-tabs>button{flex:1;padding:9px 4px;border:1px solid #dce3ee;background:white;border-radius:9px;color:#526985}.las-type-tabs>button[aria-pressed=true]{border-color:#3a65ff;background:#edf2ff;color:#3a65ff}.las-draft>label{display:block;font-size:12px;margin:12px 0;color:#526985}.las-draft input,.las-draft textarea{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #dce3ee;border-radius:8px;background:white;font:inherit;color:#24324b;box-sizing:border-box}.las-success{text-align:center;padding:12px}.las-success>.van-icon{font-size:36px;color:#3a65ff}.las-success h3{margin-top:8px;font-size:17px}.las-success p{color:#8999b2;font-size:11px}.las-document{display:grid;grid-template-columns:70px minmax(0,1fr);gap:12px;font-size:12px}.las-document dt{color:#8999b2}.las-document dd{margin:0;overflow-wrap:anywhere}
@media(max-height:750px){.las-welcome{padding:22px 0 22px}.las-welcome img{width:88px;height:88px}.las-welcome h2{font-size:20px}.las-prompt{padding:8px 10px}}
</style>
