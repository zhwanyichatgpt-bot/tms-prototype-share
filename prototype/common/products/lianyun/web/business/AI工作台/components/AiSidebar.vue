<script setup>
import { ref } from 'vue'
import { asset } from '../mock-data.js'
import AiIcon from './AiIcon.vue'
defineProps({ agents: Array, sessions: Array, activeAgent: String, activeSession: String, view: String, menuId: String, collapsed: Boolean })
const emit = defineEmits(['new', 'agent', 'favorites', 'search', 'settings', 'session', 'menu', 'history-action', 'more', 'home', 'skill', 'catalog', 'tasks', 'onboarding', 'toggle'])
const historyBody = ref(null)
function menuPosition(id) {
  const row = historyBody.value?.querySelector(`[data-session="${id}"]`)
  const frame = historyBody.value?.closest('.ai-workbench-frame')?.getBoundingClientRect()
  const top = row && frame ? Math.min((row.getBoundingClientRect().bottom-frame.top)/(frame.width/1920), 760) : 650
  return { top: `${top}px` }
}
</script>
<template>
  <aside class="ai-sidebar" :class="{ 'is-collapsed': collapsed }" aria-label="AI工作台侧栏">
    <div class="ai-sidebar-heading">
      <img :src="asset('assistant-avatar.svg')" alt="至小简" />
      <span v-if="!collapsed">至小简</span>
      <button v-if="view==='home' && !collapsed" type="button" class="ai-sidebar-guide" @click="emit('onboarding')">新手导览</button>
      <button v-if="!collapsed" class="ai-icon-button" title="设置智能体" aria-label="设置智能体" @click="emit('settings')"><AiIcon name="settings" :size="18" /></button>
      <button type="button" class="ai-sidebar-toggle" :title="collapsed ? '展开侧栏' : '收起侧栏'" :aria-label="collapsed ? '展开侧栏' : '收起侧栏'" :aria-expanded="!collapsed" @click="emit('toggle')"><AiIcon name="sidebar" :size="18" /></button>
    </div>
    <button class="ai-new-chat" :title="collapsed ? '新对话' : undefined" @click="emit('new')"><AiIcon name="plus" :size="20" />新对话</button>
    <nav class="ai-agent-list" aria-label="功能导航">
      <button class="ai-sidebar-row" :class="{'is-active':view==='home'}" :title="collapsed ? '首页' : undefined" @click="emit('home')"><AiIcon name="grid" :size="16"/><span>首页</span></button>
      <button class="ai-sidebar-row" :class="{'is-active':view==='knowledge'}" :aria-current="view==='knowledge' ? 'page' : undefined" :title="collapsed ? '知识库' : undefined" @click="emit('skill','knowledge')"><AiIcon name="file" :size="16"/><span>知识库</span></button>
      <button class="ai-sidebar-row" :title="collapsed ? '专家与技能' : undefined" @click="emit('catalog')"><AiIcon name="grid" :size="16"/><span>专家与技能</span></button>
      <button class="ai-sidebar-row" :class="{'is-active':view==='tasks'}" :aria-current="view==='tasks' ? 'page' : undefined" :title="collapsed ? '定时任务' : undefined" @click="emit('tasks')"><AiIcon name="refresh" :size="16"/><span>定时任务</span></button>
      <button class="ai-sidebar-row" :class="{'is-active':view==='favorites'}" :aria-current="view==='favorites' ? 'page' : undefined" :title="collapsed ? '我的收藏' : undefined" aria-label="我的收藏" @click="emit('favorites')"><AiIcon name="star" :size="16"/><span>我的收藏</span></button>
    </nav>
    <div class="ai-history-heading"><span>历史对话</span><button class="ai-icon-button" title="搜索历史对话" aria-label="搜索历史对话" @click="emit('search')"><AiIcon name="search" :size="16" /></button></div>
    <div ref="historyBody" class="ai-history-body">
      <template v-for="group in ['置顶', '今天', '本周', '本月']" :key="group">
        <div v-if="sessions.some(s => (s.pinned ? '置顶' : s.group) === group)" class="ai-history-group">{{ group }}</div>
        <div v-for="session in sessions.filter(s => (s.pinned ? '置顶' : s.group) === group)" :key="session.id" :data-session="session.id" class="ai-history-row" :class="{ 'is-active': activeSession === session.id || menuId === session.id }">
          <button class="ai-history-open" :title="session.title" @click="emit('session', session.id)"><img :src="asset('history.svg')" alt="" /><span>{{ session.title }}</span></button>
          <button class="ai-history-more ai-icon-button" :class="{ visible: menuId === session.id }" :aria-label="`更多操作：${session.title}`" @click.stop="emit('menu', session.id)"><AiIcon name="more" :size="16" /></button>
        </div>
      </template>
      <p v-if="!sessions.length" class="ai-empty-history">暂无历史对话</p>
      <div v-if="menuId" class="ai-history-menu" :style="menuPosition(menuId)" @click.stop>
        <button v-for="item in [{key:'pin',label:sessions.find(s=>s.id===menuId)?.pinned?'取消置顶':'置顶',icon:'pin'},{key:'favorite',label:'收藏',icon:'star'},{key:'rename',label:'编辑名称',icon:'edit'},{key:'delete',label:'删除',icon:'trash'}]" :key="item.key" :class="{ danger: item.key === 'delete' }" @click="emit('history-action', item.key, menuId)"><AiIcon :name="item.icon" :size="16" />{{ item.label }}</button>
      </div>
    </div>
    <slot name="account" />
  </aside>
</template>
