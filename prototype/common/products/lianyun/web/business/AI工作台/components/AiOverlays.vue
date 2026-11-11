<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { asset } from '../mock-data.js'
import AiIcon from './AiIcon.vue'
const props = defineProps({ type: String, sessions: Array, agents: Array, target: Object, feedbackKind: String })
const emit = defineEmits(['close','session','save-order','rename','delete','feedback','agent'])
const query = ref(''), name = ref(''), order = ref([]), feedbackTags = ref([]), comment = ref(''), dragging = ref(null)
const dialog = ref(null)
let returnFocus
const results = computed(() => props.sessions.filter(s => !query.value.trim() || `${s.title} ${s.messages.map(m=>m.text||m.answer?.title||'').join(' ')}`.toLowerCase().includes(query.value.trim().toLowerCase())))
const tags = computed(() => props.feedbackKind==='like' ? ['内容正确','回答准确','格式规范'] : ['内容不准确','没有帮助','格式不规范'])
watch(() => props.type, async type => {
  if(!type){returnFocus?.focus();return}
  returnFocus=document.activeElement;query.value='';name.value=props.target?.title||'';order.value=props.agents.map(a=>a.id);feedbackTags.value=[];comment.value=''
  await nextTick();dialog.value?.querySelector('input, textarea, button')?.focus()
})
function move(from,to){ if(to<0 || to>=order.value.length)return;const next=[...order.value];next.splice(to,0,next.splice(from,1)[0]);order.value=next }
function toggleTag(tag){feedbackTags.value=feedbackTags.value.includes(tag)?feedbackTags.value.filter(t=>t!==tag):[...feedbackTags.value,tag]}
function keydown(event){
  if(!props.type)return
  if(event.key==='Escape'){event.preventDefault();emit('close')}
  if(event.key==='Tab'){
    const els=Array.from(dialog.value?.querySelectorAll('button:not([disabled]),input,textarea,[tabindex="0"]')||[]).filter(e=>e.offsetParent!==null)
    if(!els.length)return
    if(event.shiftKey&&document.activeElement===els[0]){event.preventDefault();els.at(-1).focus()}
    else if(!event.shiftKey&&document.activeElement===els.at(-1)){event.preventDefault();els[0].focus()}
  }
}
watch(() => props.type,type=>{window.removeEventListener('keydown',keydown);if(type)window.addEventListener('keydown',keydown)})
onUnmounted(()=>window.removeEventListener('keydown',keydown))
</script>
<template>
  <div v-if="type" class="ai-overlay" :class="{'ai-popover-overlay':type==='agents'}" @click.self="emit('close')">
    <section ref="dialog" class="ai-dialog" :class="`ai-dialog-${type}`" role="dialog" :aria-modal="type!=='agents'" :aria-label="{search:'搜索历史对话',agents:'默认智能体排序',rename:'编辑名称',delete:'删除对话',feedback:'回答反馈',more:'更多智能体'}[type]">
      <header><h2>{{ {search:'搜索',agents:'默认智能体排序',rename:'编辑名称',delete:'删除对话',feedback:feedbackKind==='like'?'谢谢认可，我们会继续优化进步':'感谢反馈，我们会继续改进',more:'更多智能体'}[type] }}<small v-if="type==='agents'">（拖拽排序）</small></h2><button class="ai-icon-button" aria-label="关闭弹窗" @click="emit('close')"><AiIcon name="close" :size="20" /></button></header>
      <template v-if="type==='search'"><label class="ai-search-input"><AiIcon name="search" :size="18" /><input v-model="query" placeholder="搜索历史对话" aria-label="搜索历史对话关键字" /></label><div class="ai-search-results"><template v-for="group in ['置顶','今天','本周','本月']" :key="group"><small v-if="results.some(s=>(s.pinned?'置顶':s.group)===group)">{{ group }}</small><button v-for="session in results.filter(s=>(s.pinned?'置顶':s.group)===group)" :key="session.id" @click="emit('session',session.id)"><AiIcon name="chat" :size="16" /><span>{{ session.title }}</span></button></template><p v-if="!results.length" class="ai-empty">没有找到相关对话</p></div></template>
      <template v-else-if="type==='agents'"><ol class="ai-sort-list"><li v-for="(id,index) in order" :key="id" draggable="true" tabindex="0" :aria-label="`${index+1} ${agents.find(a=>a.id===id).name}，使用上下方向键排序`" @dragstart="dragging=index" @dragover.prevent @drop.prevent="move(dragging,index);dragging=null" @keydown.up.prevent="move(index,index-1)" @keydown.down.prevent="move(index,index+1)"><small>{{ index+1 }}</small><img :src="asset(agents.find(a=>a.id===id).icon)" alt="" /><span>{{ agents.find(a=>a.id===id).name }}</span><em v-if="index===0" class="ai-default">默认</em><AiIcon name="grip" :size="17" /></li></ol><footer><button @click="emit('close')">取消</button><button class="ai-primary" @click="emit('save-order',order)">保存</button></footer></template>
      <template v-else-if="type==='rename'"><input v-model="name" class="ai-name-input" aria-label="对话名称" maxlength="80" @keydown.enter="name.trim()&&emit('rename',name.trim())" /><footer><button @click="emit('close')">取消</button><button class="ai-primary" :disabled="!name.trim()" @click="emit('rename',name.trim())">保存</button></footer></template>
      <template v-else-if="type==='delete'"><p class="ai-delete-description">确定删除“{{ target?.title }}”吗？对应的收藏记录也会移除。</p><footer><button @click="emit('close')">取消</button><button class="ai-primary ai-delete-confirm" @click="emit('delete')">删除</button></footer></template>
      <template v-else-if="type==='feedback'"><div class="ai-feedback-body"><div class="ai-feedback-tags"><button v-for="tag in tags" :key="tag" :class="{selected:feedbackTags.includes(tag)}" :aria-pressed="feedbackTags.includes(tag)" @click="toggleTag(tag)">{{ tag }}<span v-if="feedbackTags.includes(tag)">◢</span></button></div><textarea v-model="comment" placeholder="更多建议反馈" aria-label="更多建议反馈" rows="4" /><footer><button @click="emit('close')">取消</button><button class="ai-primary" @click="emit('feedback',{tags:feedbackTags,comment})">确认</button></footer></div></template>
      <div v-else-if="type==='more'" class="ai-more-agents"><button v-for="agent in agents" :key="agent.id" @click="emit('agent',agent.id)"><img :src="asset(agent.icon)" alt="" /><span>{{ agent.name }}<small>{{ agent.description }}</small></span><AiIcon name="chevron" /></button></div>
    </section>
  </div>
</template>
