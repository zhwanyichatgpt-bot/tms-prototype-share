<template>
  <div class="aia-drawer-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <aside class="aia-drawer" role="dialog" aria-modal="true" aria-label="历史记录">
      <header class="aia-drawer__head">
        <template v-if="!searching">
          <h2>历史记录</h2>
          <button type="button" class="aia-drawer__search" aria-label="搜索历史记录" @click="startSearch"><van-icon name="search"/></button>
        </template>
        <div v-else class="aia-drawer__field">
          <van-icon name="search"/>
          <input ref="searchInput" v-model="query" type="search" placeholder="搜索历史记录" aria-label="搜索历史记录"/>
          <button type="button" aria-label="关闭搜索" @click="closeSearch"><van-icon name="cross"/></button>
        </div>
      </header>

      <template v-if="!searching">
        <button type="button" class="aia-new-task" @click="emit('new-task')">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M4 4.5h16v12H9.6L4 20.5z" stroke-linejoin="round"/>
            <path d="M12 7.8v5M9.5 10.3h5" stroke-linecap="round"/>
          </svg>
          开启新任务
        </button>
        <hr class="aia-drawer__rule"/>
      </template>

      <div class="aia-drawer__scroll">
        <section v-for="group in visibleGroups" :key="group.key" class="aia-history-group">
          <h3>{{ group.label }}</h3>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="aia-history-row"
            :class="{ 'is-pinned': item.pinned, 'is-active': item.active }"
            @click="emit('select', item)"
          >
            <van-icon name="chat-o" class="aia-history-row__icon"/>
            <span>{{ item.title }}</span>
            <van-icon v-if="item.pinned" name="bookmark-o" class="aia-history-row__pin"/>
          </button>
        </section>
        <p v-if="!visibleGroups.length" class="aia-drawer__empty">没有找到相关记录</p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'select', 'new-task'])
const searching = ref(false)
const query = ref('')
const searchInput = ref(null)

// 本次会话产生的 AI 记录补进“本周”，与设计稿的历史分组保持一致。
const allGroups = computed(() => {
  const live = props.sessions.map(session => ({ id: `live-${session.id}`, title: session.title, session }))
  if (!live.length) return props.groups
  return props.groups.map(group => group.key === 'week' ? { ...group, items: [...live, ...group.items] } : group)
})

const visibleGroups = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return allGroups.value
  return allGroups.value
    .map(group => ({ ...group, items: group.items.filter(item => item.title.toLowerCase().includes(keyword)) }))
    .filter(group => group.items.length)
})

async function startSearch() {
  searching.value = true
  await nextTick()
  searchInput.value?.focus()
}
function closeSearch() {
  searching.value = false
  query.value = ''
}
</script>
