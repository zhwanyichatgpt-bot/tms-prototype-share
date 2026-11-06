<template>
  <section class="aia-page aia-home" aria-label="至宝推荐 AI 首页">
    <AiTopBar title="至小简" @history="drawer = true" @new-task="restart" @restart="restart" @close="emit('close')"/>

    <main class="aia-home__scroll">
      <section class="aia-hero" aria-label="至宝推荐">
        <img class="aia-hero__for-you" src="/shared-mobile-assets/ai/for-you-text.svg" alt=""/>
        <span class="aia-tag aia-tag--daily">每日洞察</span>
        <span class="aia-tag aia-tag--smart">智能推荐</span>
        <img class="aia-hero__mascot" src="/shared-mobile-assets/ai/zhibao-mascot.png" alt="至宝"/>
        <h1>至宝推荐</h1>
        <p>读懂业务动态，从一份「经营洞察」开始</p>
      </section>

      <section class="aia-analysis-panel" aria-label="托运单分析">
        <header>
          <h2>托运单分析</h2>
          <p>点击托运单，至宝帮你立刻分析~</p>
        </header>
        <div class="aia-bill-list">
          <button v-for="bill in featuredBills" :key="bill.id" type="button" class="aia-bill-row" @click="emit('analyse', [bill])">
            <span class="aia-bill-row__head">
              <span class="aia-bill-row__no">托运单号：{{ bill.id }}</span>
              <span class="aia-status" :class="'is-' + billTone(bill)">{{ bill.status }}</span>
            </span>
            <span class="aia-bill-row__main">
              <strong>{{ bill.name }}</strong>
              <time>{{ bill.datetime }}</time>
            </span>
            <span class="aia-bill-row__route">{{ bill.origin }} <i>—</i> {{ bill.destination }}</span>
          </button>
        </div>
        <button type="button" class="aia-more" @click="emit('open-select')">查看更多 <van-icon name="arrow"/></button>
      </section>

      <div class="aia-dots" aria-hidden="true"><i v-for="dot in 8" :key="dot" :class="{ 'is-active': dot === 1 }"/></div>
    </main>

    <footer class="aia-home__composer">
      <form class="aia-composer" @submit.prevent="send">
        <textarea
          v-model="input"
          rows="1"
          maxlength="500"
          aria-label="向至宝描述业务问题"
          placeholder="输入要查询货分析的业务问题..."
          @keydown.enter.exact.prevent="send"
        />
        <div class="aia-composer__tools">
          <button type="button" class="aia-icon" :aria-label="listening ? '停止语音输入' : '语音输入'" @click="toggleVoice">
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 10v4M12 7.5v9M15 10v4" stroke-linecap="round"/></svg>
          </button>
          <button type="button" class="aia-reason" :class="{ 'is-active': deepReason }" :aria-pressed="deepReason" @click="deepReason = !deepReason">深度推理</button>
          <span class="aia-spacer"/>
          <button type="button" class="aia-icon" aria-label="上传图片或文件" @click="openImage">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m20 11.5-8.3 8.3a5.1 5.1 0 0 1-7.2-7.2l8.5-8.5a3.4 3.4 0 1 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 1 1-2.4-2.4l7.9-7.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="submit" class="aia-send" :disabled="!input.trim()" aria-label="发送消息">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </form>
      <p class="aia-disclaimer">内容由AI生成，仅供参考</p>
      <p v-if="notice" class="aia-notice" role="status">{{ notice }}</p>
      <i class="aia-home-indicator"/>
    </footer>

    <AiHistoryDrawer v-if="drawer" :sessions="sessions" :groups="aiHistoryGroups" @close="drawer = false" @new-task="restart" @select="selectHistory"/>

    <div v-if="panel" class="aia-sheet-overlay" @click.self="closePanel" @keydown.esc="closePanel">
      <section ref="sheet" class="aia-sheet" role="dialog" aria-modal="true" :aria-label="panelTitle" tabindex="-1">
        <header class="aia-sheet__head"><h2>{{ panelTitle }}</h2><button type="button" aria-label="关闭面板" @click="closePanel"><van-icon name="cross"/></button></header>
        <template v-if="panel === 'image'">
          <p class="aia-sheet__hint">上传货物清单、运输需求或报价图片。</p>
          <div class="aia-sheet__upload"><button type="button" class="aia-sheet__outline" @click="cameraPicker.click()"><van-icon name="photograph"/>拍照</button><button type="button" class="aia-sheet__outline" @click="filePicker.click()"><van-icon name="photo-o"/>图片 / PDF</button></div>
          <input ref="filePicker" hidden type="file" accept="image/*,.pdf" @change="selectFile"/>
          <input ref="cameraPicker" hidden type="file" accept="image/*" capture="environment" @change="selectFile"/>
          <div v-if="fileName" class="aia-sheet__file"><img v-if="imageUrl" :src="imageUrl" alt="已上传图片预览"/><p>{{ fileName }}</p><button type="button" class="aia-sheet__link" @click="clearFile">移除</button></div>
          <p v-if="fileName" class="aia-sheet__hint">图片内容尚未识别。可手工填写，或使用示例体验识图结果。</p>
          <p v-if="fileError" class="aia-sheet__error" role="alert">{{ fileError }}</p>
          <button type="button" class="aia-sheet__primary" @click="useImageExample">体验示例识图</button>
          <button v-if="fileName" type="button" class="aia-sheet__outline" @click="openCreate()">手工整理建单信息</button>
        </template>
        <template v-else-if="panel === 'create'">
          <p class="aia-sheet__hint"><span v-if="fromExample" class="aia-sheet__badge">识图示例</span>{{ fromExample ? '以下来自示例货物清单，请核对后继续。' : '选择单据类型，核对运输信息。' }}</p>
          <div class="aia-sheet__tabs" role="group" aria-label="建单类型"><button v-for="type in ['运输需求单','订单']" :key="type" type="button" :aria-pressed="form.type === type" @click="form.type = type">{{ type }}</button></div>
          <form class="aia-sheet__form" @submit.prevent="saveDocument">
            <label>装货地<input v-model="form.origin" required maxlength="100" placeholder="请输入装货城市或地址"/></label>
            <label>卸货地<input v-model="form.destination" required maxlength="100" placeholder="请输入卸货城市或地址"/></label>
            <label>货物信息<input v-model="form.goods" required maxlength="200" placeholder="货物名称、重量或数量"/></label>
            <label>出运日期<input v-model="form.departure" type="date"/></label>
            <label>补充要求<textarea v-model="form.note" rows="2" maxlength="500" placeholder="到货时间、装卸或其他要求"/></label>
            <p v-if="formError" class="aia-sheet__error" role="alert">{{ formError }}</p>
            <p class="aia-sheet__hint">本次为建单演示，仅模拟保存，不提交真实订单。</p>
            <button class="aia-sheet__primary" type="submit">确认保存{{ form.type }}</button>
          </form>
        </template>
        <template v-else-if="panel === 'done' && created">
          <div class="aia-sheet__success"><van-icon name="passed"/><h3>{{ created.type }}已模拟保存</h3><p>{{ created.id }}</p></div>
          <dl class="aia-sheet__document"><dt>运输路线</dt><dd>{{ created.origin }} → {{ created.destination }}</dd><dt>货物信息</dt><dd>{{ created.goods }}</dd><dt>出运日期</dt><dd>{{ created.departure || '未填写' }}</dd><dt>补充要求</dt><dd>{{ created.note || '无' }}</dd></dl>
          <p class="aia-sheet__hint">演示单据仅保留在本次页面会话中，未对外提交。</p>
          <button type="button" class="aia-sheet__primary" @click="closePanel">完成</button>
          <button type="button" class="aia-sheet__outline" @click="openCreate()">再建一单</button>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AiTopBar from '../../../../shared/mobile/ai/AiTopBar.vue'
import AiHistoryDrawer from '../../../../shared/mobile/ai/AiHistoryDrawer.vue'
import { aiBills, aiHistoryGroups } from './ai-data.js'
import { billTone } from '../../../../shared/mobile/ai/ai-bill.js'
import { blankDemand } from './assistant-data.js'
import { parseRequest } from './assistant-engine.js'

const props = defineProps({ sessions: { type: Array, default: () => [] } })
const emit = defineEmits(['message', 'restore', 'restart', 'overlay', 'open-select', 'analyse', 'history-select', 'close'])
const featuredBills = aiBills.slice(0, 3)
const input = ref(''), sheet = ref(null), panel = ref(''), drawer = ref(false)
const notice = ref(''), listening = ref(false), deepReason = ref(false)
const filePicker = ref(null), cameraPicker = ref(null)
const imageUrl = ref(''), fileName = ref(''), fileError = ref(''), formError = ref(''), fromExample = ref(false)
const created = ref(null)
const emptyForm = () => ({ type: '运输需求单', origin: '', destination: '', goods: '', departure: '', note: '' })
const form = ref(emptyForm())
let recognition

const panelTitle = computed(() => ({ image: '智能识图', create: '核对建单信息', done: '建单结果' })[panel.value])
watch(panel, async value => {
  emit('overlay', !!value)
  if (value) { await nextTick(); sheet.value?.focus() }
})
function closePanel() { panel.value = ''; nextTick(() => {}) }
function restart() { input.value = ''; notice.value = ''; drawer.value = false; emit('restart') }
function selectHistory(item) {
  drawer.value = false
  if (item.session) emit('restore', item.session)
  else emit('history-select', item)
}
function send() {
  const text = input.value.trim()
  if (!text) return
  if (/建单|创建.*(需求单|订单)|生成.*(需求单|订单)/.test(text)) openCreate(text)
  else if (/识图|识别.*(图片|截图|清单)/.test(text)) openImage()
  else emit('message', text)
  input.value = ''
}
function openCreate(text = '') {
  const parsed = parseRequest(text, blankDemand())
  const cargo = text.match(/(\d+(?:\.\d+)?\s*吨[^，,。]*)/)
  form.value = { ...emptyForm(), type: /订单/.test(text) ? '订单' : '运输需求单', origin: parsed.origin, destination: parsed.destination, goods: cargo?.[1] || '', departure: parsed.departure || '' }
  fromExample.value = false
  formError.value = ''
  panel.value = 'create'
}
function openImage() { fileError.value = ''; panel.value = 'image' }
function clearFile() { if (imageUrl.value) URL.revokeObjectURL(imageUrl.value); imageUrl.value = ''; fileName.value = '' }
function selectFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  fileError.value = ''
  if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) { fileError.value = '请选择图片或 PDF 文件。'; return }
  if (file.size > 10 * 1024 * 1024) { fileError.value = '文件超过 10 MB，请选择较小的文件。'; return }
  clearFile()
  fileName.value = file.name
  if (file.type.startsWith('image/')) imageUrl.value = URL.createObjectURL(file)
}
function useImageExample() {
  form.value = { ...emptyForm(), origin: '宁波', destination: '重庆', goods: '设备，20吨' }
  fromExample.value = true
  formError.value = ''
  panel.value = 'create'
}
function saveDocument() {
  formError.value = ''
  const fields = ['origin', 'destination', 'goods']
  if (fields.some(key => !form.value[key].trim())) { formError.value = '请补充装货地、卸货地和货物信息。'; return }
  if (form.value.origin.trim() === form.value.destination.trim()) { formError.value = '请核对装卸地点，两个地点不能相同。'; return }
  created.value = { ...form.value, ...Object.fromEntries(fields.map(key => [key, form.value[key].trim()])), id: 'DEMO-' + Date.now() }
  panel.value = 'done'
}
function toggleVoice() {
  if (listening.value) { recognition?.stop(); return }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) { notice.value = '当前浏览器暂不支持语音输入，请使用文字或图片。'; return }
  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognition.onresult = event => { input.value += event.results[0][0].transcript; notice.value = '请核对识别文字后发送。' }
  recognition.onerror = () => { notice.value = '语音输入未完成，请检查麦克风权限或改用文字。'; listening.value = false }
  recognition.onend = () => { listening.value = false }
  try { recognition.start(); listening.value = true; notice.value = '正在聆听，点击麦克风停止。' }
  catch { listening.value = false; notice.value = '暂时无法开始语音输入，请改用文字。' }
}
onBeforeUnmount(() => { recognition?.abort(); clearFile(); emit('overlay', false) })
</script>
