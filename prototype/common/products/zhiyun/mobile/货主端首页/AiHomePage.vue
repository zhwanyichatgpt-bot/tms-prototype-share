<template>
  <section class="ai-home" aria-label="小简AI首页">
    <div class="status-bar" aria-hidden="true">
      <span>9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M.5 3.5a11.5 11.5 0 0 1 16 0M3.4 6.6a7.3 7.3 0 0 1 10.2 0M6.3 9.5a3.1 3.1 0 0 1 4.4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="workbench-bar">
      <button class="header-icon menu-button" type="button" aria-label="会话菜单" @click="showNotice('会话菜单暂未在本轮原型中展开')"><img src="/zhiyun-mobile-assets/ai-workbench/menu.svg" alt="" /></button>
      <button class="scope-pill" type="button" aria-label="业务范围：小简AI" @click="showNotice('当前业务范围：小简AI')">小简AI <img src="/zhiyun-mobile-assets/ai-workbench/chevron.svg" alt="" /></button>
      <span class="bar-spacer"></span>
      <button class="header-icon" type="button" aria-label="设置" @click="showNotice('设置暂未在本轮原型中展开')"><img src="/zhiyun-mobile-assets/ai-workbench/settings.svg" alt="" /></button>
      <button class="header-icon" type="button" aria-label="新对话" @click="openConversation"><img src="/zhiyun-mobile-assets/ai-workbench/new-chat.svg" alt="" /></button>
      <button class="header-icon close-button" type="button" aria-label="关闭小简AI" @click="emit('close')"><img src="/zhiyun-mobile-assets/ai-workbench/close.svg" alt="" /></button>
    </header>

    <main ref="scrollArea" class="workbench-content">
      <div class="assistant-intro">
        <img src="/zhiyun-mobile-assets/ai-workbench/mascot.png" alt="小简AI" />
        <div>
          <p>小简为你主动发现</p>
          <h1>这单货预计还差 {{ planForecast.vehicleGap }} 车</h1>
          <span>我整理了 3 种处理方式，你可以直接比较。</span>
        </div>
      </div>

      <section class="response-panel" aria-labelledby="cargo-title">
        <div class="panel-caption"><strong>当前货源</strong><span>6月18日 15:20</span></div>
        <div class="cargo-details">
          <h2 id="cargo-title">{{ planForecast.route }} <small>{{ planForecast.goods }} · {{ planForecast.quantity }}</small></h2>
          <p>{{ planForecast.loadAddress }} → {{ planForecast.unloadAddress }}</p>
          <p>待接单 {{ planForecast.remaining }}，要求 {{ planForecast.deadline }} 完成。</p>
        </div>

        <div class="response-title">
          <h2>小简的处理方案</h2>
          <span>3 种方案</span>
        </div>

        <section class="solution" aria-labelledby="option-invite">
          <h3 id="option-invite">方案一 · 优先邀请匹配车辆 <span>推荐</span></h3>
          <p>已找到 7 辆匹配车，建议先邀请 5 辆，预计可补齐 4 车；运输单价不变。</p>
          <p class="secondary-text">推荐理由：4 辆合作运力优先，另有 1 辆备选，不影响已接单运输。</p>
          <ul class="vehicle-list">
            <li v-for="candidate in visibleCandidates" :key="candidate.id">
              <strong>{{ candidate.driver }} · {{ candidate.plate }}</strong>
              <span>{{ candidate.team }} · {{ candidate.capacity }}吨</span>
            </li>
          </ul>
          <button class="row-action" type="button" @click="inviteAction">
            {{ showAllCandidates ? '向这 5 辆车发送邀请' : '查看全部 5 辆推荐车' }}
            <img src="/zhiyun-mobile-assets/ai-workbench/row-arrow.svg" alt="" />
          </button>
        </section>

        <section class="solution" aria-labelledby="option-publish">
          <h3 id="option-publish">方案二 · 扩大范围补车</h3>
          <p>将剩余 {{ planForecast.remaining }} 同步发布到象奔奔、至简智运，覆盖更多可接单运力。</p>
          <p class="secondary-text">适合合作车辆未补齐时使用；接单时间以实际响应为准。</p>
          <button class="row-action" type="button" @click="showNotice('已模拟选择向两个平台发布剩余 100 吨')">选择扩大范围 <img src="/zhiyun-mobile-assets/ai-workbench/row-arrow.svg" alt="" /></button>
        </section>

        <section class="solution" aria-labelledby="option-reschedule">
          <h3 id="option-reschedule">方案三 · 调整发运安排</h3>
          <p>已接单的 {{ planForecast.accepted }} 照常发运；剩余 {{ planForecast.remaining }} 改排下一批。</p>
          <p class="secondary-text">当前批次不再补车；剩余货量将延后发运，交付时间需重新确认。</p>
          <button class="row-action" type="button" @click="showNotice('已模拟选择调整发运安排，交付时间待确认')">选择调整安排 <img src="/zhiyun-mobile-assets/ai-workbench/row-arrow.svg" alt="" /></button>
        </section>
      </section>
      <p class="ai-disclaimer">内容由AI生成，仅供参考</p>
    </main>

    <form class="composer" @submit.prevent="openConversation">
      <input v-model="question" aria-label="向小简提问" placeholder="还想了解什么？问问小简" />
      <div class="composer-controls">
        <button class="composer-icon voice-button" type="button" aria-label="语音输入" @click="showNotice('语音输入暂未在本轮原型中展开')"><img src="/zhiyun-mobile-assets/ai-workbench/voice.svg" alt="" /></button>
        <span class="reasoning-pill">深度推理</span>
        <span class="composer-spacer"></span>
        <button class="composer-icon attachment-button" type="button" aria-label="添加附件" @click="showNotice('附件上传暂未在本轮原型中展开')"><img src="/zhiyun-mobile-assets/ai-workbench/attachment.svg" alt="" /></button>
        <button class="composer-icon send-button" type="submit" aria-label="发送问题"><span><img src="/zhiyun-mobile-assets/ai-workbench/send.svg" alt="" /></span></button>
      </div>
    </form>
    <div v-if="notice" class="page-notice" role="status">{{ notice }}</div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { dispatchSuggestion, planForecast } from './ai-home-data.js'

const props = defineProps({
  entry: { type: String, default: '' },
  restoreState: { type: Object, default: () => ({ scrollTop: 0 }) },
})
const emit = defineEmits(['open-conversation', 'close'])
const scrollArea = ref(null)
const question = ref('')
const showAllCandidates = ref(false)
const notice = ref('')
let noticeTimer

const recommendedCandidates = dispatchSuggestion.candidates.slice(0, 5)
const visibleCandidates = computed(() => showAllCandidates.value ? recommendedCandidates : recommendedCandidates.slice(0, 2))

function showNotice(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3000)
}
function inviteAction() {
  if (!showAllCandidates.value) showAllCandidates.value = true
  else showNotice('已模拟向选中的 5 辆车发送邀请')
}
function openConversation() {
  emit('open-conversation', { context: 'question', detail: question.value.trim(), scrollTop: scrollArea.value?.scrollTop || 0 })
  question.value = ''
}
onMounted(async () => {
  await nextTick()
  if (props.restoreState.scrollTop && scrollArea.value) scrollArea.value.scrollTop = props.restoreState.scrollTop
})
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<style scoped>
.ai-home {
  position: absolute; inset: 0; color: #333;
  background: linear-gradient(180deg, #e9f2ff 0%, #f2f6ff 55%, #f3f5fc 100%);
  font: 13px/1.65 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
}
.ai-home * { box-sizing: border-box; }
.ai-home button, .ai-home input { font: inherit; }
.ai-home button { cursor: pointer; }
.ai-home button:focus-visible, .ai-home input:focus-visible { outline: 2px solid #3a65ff; outline-offset: 2px; }
.status-bar { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; color: #171b21; font-size: 15px; font-weight: 700; }
.status-icons { display: flex; align-items: center; gap: 5px; }
.status-icons svg:first-child { fill: currentColor; }
.battery { position: relative; width: 23px; height: 12px; border: 2px solid #171b21; border-radius: 2px; }
.battery::before { content: ''; position: absolute; inset: 1px; background: #171b21; }
.battery::after { content: ''; position: absolute; right: -4px; top: 3px; width: 2px; height: 4px; background: #171b21; }
.workbench-bar { height: 44px; padding: 0 16px; display: flex; align-items: center; }
.header-icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; padding: 0; border: 0; background: none; }
.header-icon img { display: block; width: 100%; height: 100%; }
.menu-button { margin-right: 14px; }
.scope-pill { display: flex; align-items: center; justify-content: space-between; flex: none; width: 126px; height: 32px; padding: 0 8px; border: 0; border-radius: 16px; background: #ffffff66; color: #333; font-size: 16px; text-align: left; }
.scope-pill img { width: 10px; height: 10px; }
.bar-spacer, .composer-spacer { flex: 1; }
.header-icon + .header-icon { margin-left: 12px; }
.close-button { width: 29px; height: 29px; margin-left: 16px; }
.workbench-content { position: absolute; inset: 98px 0 230px; overflow-y: auto; padding: 8px 15px 22px; scrollbar-width: none; }
.workbench-content::-webkit-scrollbar { display: none; }
.assistant-intro { display: flex; align-items: center; gap: 11px; margin: 0 1px 13px; }
.assistant-intro img { flex: none; width: 57px; height: 57px; object-fit: contain; }
.assistant-intro p { margin: 0; color: #858e9c; font-size: 11px; }
.assistant-intro h1 { margin: 1px 0; color: #333; font-size: 17px; line-height: 23px; font-weight: 600; }
.assistant-intro span { display: block; color: #858e9c; font-size: 11px; }
.response-panel { padding: 15px 15px 4px; border-radius: 14px; background: #fff; }
.panel-caption { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 10px; }
.panel-caption strong { font-size: 14px; font-weight: 600; }
.panel-caption span { color: #999; font-size: 10px; }
.cargo-details { padding-bottom: 14px; border-bottom: 1px solid #e8ebf0; }
.cargo-details h2 { margin: 0 0 6px; font-size: 17px; line-height: 24px; font-weight: 600; }
.cargo-details h2 small { margin-left: 4px; color: #858e9c; font-size: 11px; font-weight: 400; white-space: nowrap; }
.cargo-details p { margin: 3px 0 0; color: #5b6573; font-size: 12px; line-height: 19px; }
.response-title { display: flex; align-items: baseline; justify-content: space-between; padding: 14px 0 0; }
.response-title h2 { margin: 0; font-size: 15px; font-weight: 600; }
.response-title span { color: #999; font-size: 11px; }
.solution { padding: 13px 0; border-bottom: 1px solid #e8ebf0; }
.solution:last-child { border-bottom: 0; }
.solution h3 { margin: 0 0 7px; font-size: 14px; line-height: 21px; font-weight: 600; }
.solution h3 span { margin-left: 4px; color: #3a65ff; font-size: 11px; font-weight: 400; }
.solution p { margin: 0 0 6px; font-size: 13px; line-height: 21px; }
.solution .secondary-text { color: #858e9c; font-size: 11px; line-height: 18px; }
.vehicle-list { margin: 9px 0 0; padding: 0; list-style: none; }
.vehicle-list li { display: flex; justify-content: space-between; gap: 6px; padding: 6px 0; border-top: 1px solid #e8ebf0; font-size: 11px; }
.vehicle-list strong { font-weight: 500; white-space: nowrap; }
.vehicle-list span { color: #858e9c; text-align: right; }
.row-action { display: flex; justify-content: space-between; align-items: center; width: 100%; min-height: 35px; padding: 5px 0 0; border: 0; background: transparent; color: #3a65ff; text-align: left; font-size: 12px; }
.row-action img { width: 8px; height: 8px; opacity: .8; }
.ai-disclaimer { margin: 11px 0 0; color: #999; text-align: center; font-size: 10px; }
.composer { position: absolute; left: 10px; right: 10px; bottom: 130px; height: 92px; padding: 11px 12px 9px; border-radius: 14px; background: #fff; }
.composer input { display: block; width: 100%; height: 31px; padding: 0 1px; border: 0; outline: 0; background: none; color: #333; font-size: 14px; }
.composer input::placeholder { color: #999; }
.composer-controls { display: flex; align-items: center; gap: 11px; height: 33px; margin-top: 5px; }
.composer-icon { display: grid; place-items: center; flex: none; width: 30px; height: 30px; padding: 0; border: 0; background: none; }
.composer-icon img { display: block; width: 100%; height: 100%; }
.voice-button { width: 24px; height: 24px; }
.reasoning-pill { padding: 4px 12px; border: 1px solid #e3e3e3; border-radius: 14px; color: #333; font-size: 13px; line-height: 20px; }
.send-button span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: #dadada; }
.send-button img { width: 16px; height: 16px; }
.page-notice { position: absolute; z-index: 4; left: 30px; right: 30px; bottom: 230px; padding: 9px 12px; border-radius: 8px; background: #273040e6; color: #fff; text-align: center; font-size: 11px; }
</style>
