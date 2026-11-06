<template>
  <section class="ly-service-page ly-contacts-page" aria-label="常用联系人">
    <div class="ly-contacts-searchbar">
      <div class="ly-contacts-search" role="search">
        <van-icon name="search" aria-hidden="true" />
        <input v-model="query" type="search" placeholder="搜索姓名、部门或手机号" aria-label="搜索联系人" />
        <button v-if="query" class="ly-contacts-clear" type="button" aria-label="清空搜索" @click="query = ''"><van-icon name="clear" /></button>
      </div>
      <button class="ly-contacts-cancel" type="button" @click="$emit('back')">取消</button>
    </div>

    <nav class="ly-contacts-tabs" role="tablist" aria-label="搜索分类">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        role="tab"
        :class="{ 'is-active': activeCategory === category }"
        :aria-selected="activeCategory === category"
        @click="selectCategory(category)"
      >
        {{ category }}
      </button>
    </nav>

    <main class="ly-contacts-results" role="tabpanel" :aria-label="activeCategory">
      <div v-if="showContacts && visibleContacts.length" class="ly-contact-list">
        <article v-for="item in visibleContacts" :key="item.id" class="ly-contact-row" :class="{ 'is-expanded': expandedId === item.id }">
          <div class="ly-contact-row-main">
            <span class="ly-contact-avatar" :class="avatarTone(item)" aria-hidden="true">{{ item.name.slice(0, 1) }}</span>
            <div class="ly-contact-body">
              <h2 class="ly-contact-name">{{ item.name }}</h2>
              <p class="ly-contact-role">{{ item.role }}</p>
              <p class="ly-contact-company">{{ companyName }}</p>
              <span v-if="item.tag" class="ly-contact-tag">{{ item.tag }}</span>
            </div>
          </div>

          <div class="ly-contact-tools">
            <button type="button" aria-label="呼叫联系人" @click="callContact(item)"><van-icon name="phone-o" /></button>
            <button type="button" aria-label="编辑联系人" @click="openEdit(item)"><van-icon name="contact" /></button>
          </div>
          <button
            class="ly-contact-expand"
            type="button"
            :aria-label="expandedId === item.id ? '收起联系人信息' : '展开联系人信息'"
            :aria-expanded="expandedId === item.id"
            @click="toggleExpanded(item.id)"
          >
            <van-icon name="arrow-down" :class="{ 'is-open': expandedId === item.id }" />
          </button>

          <div v-if="expandedId === item.id" class="ly-contact-detail">
            <p v-if="item.note">备注：{{ item.note }}</p>
            <p v-else>暂无备注信息。</p>
            <button class="danger" type="button" @click="pendingDelete = item">删除联系人</button>
          </div>
        </article>
      </div>

      <div v-else class="ly-dir-empty">
        <van-icon :name="emptyIcon" />
        <p>{{ emptyTitle }}</p>
        <small>{{ emptyHint }}</small>
      </div>
    </main>

    <van-popup
      v-model:show="formOpen"
      position="bottom"
      round
      :teleport="teleport"
      :style="{ position: 'absolute' }"
      :overlay-style="{ position: 'absolute' }"
      class="ly-dir-sheet"
    >
      <div class="ly-dir-sheet-head">
        <h2>编辑联系人</h2>
        <button type="button" aria-label="关闭联系人表单" @click="formOpen = false"><van-icon name="cross" /></button>
      </div>
      <form class="ly-dir-form" @submit.prevent="submit">
        <label class="ly-dir-field">
          <span>姓名<em>*</em></span>
          <input v-model="form.name" type="text" maxlength="20" placeholder="请输入联系人姓名" />
        </label>
        <label class="ly-dir-field">
          <span>部门 / 职务<em>*</em></span>
          <input v-model="form.role" type="text" maxlength="30" placeholder="例如：物流部 · 物流经理" />
        </label>
        <label class="ly-dir-field">
          <span>手机号<em>*</em></span>
          <input v-model="form.phone" type="tel" inputmode="tel" maxlength="11" placeholder="请输入 11 位手机号" />
        </label>
        <label class="ly-dir-field">
          <span>标签</span>
          <input v-model="form.tag" type="text" maxlength="10" placeholder="例如：常用对接（选填）" />
        </label>
        <label class="ly-dir-field">
          <span>备注</span>
          <input v-model="form.note" type="text" maxlength="40" placeholder="例如：负责宁波工厂发货（选填）" />
        </label>
        <p class="ly-dir-hint">联系人信息仅用于原型演示，不会真实发送短信或拨打电话。</p>
        <button class="ly-dir-submit" type="submit">保存联系人</button>
      </form>
    </van-popup>

    <van-popup
      :show="!!pendingDelete"
      round
      :teleport="teleport"
      :style="{ position: 'absolute' }"
      :overlay-style="{ position: 'absolute' }"
      @update:show="value => { if (!value) pendingDelete = null }"
    >
      <div class="ly-dir-confirm">
        <h2>删除联系人</h2>
        <p>确认删除「{{ pendingDelete?.name }}」？删除后不可恢复。</p>
        <div>
          <button type="button" @click="pendingDelete = null">取消</button>
          <button class="danger" type="button" @click="confirmDelete">删除</button>
        </div>
      </div>
    </van-popup>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { showToast } from 'vant'
import { addressBookStore, removeContact, saveContact } from './address-book-store.js'
import { mineProfile } from './mine-data.js'

const props = defineProps({ teleport: { type: Object, default: null } })
defineEmits(['back'])

const contacts = computed(() => addressBookStore.contacts)
const companyName = mineProfile.enterpriseName
const categories = ['综合', '联系人', '群组', '应用', '消息', '部门']
const categoryIcons = { 群组: 'friends-o', 应用: 'apps-o', 消息: 'chat-o', 部门: 'cluster-o' }
const activeCategory = ref('联系人')
const query = ref('')
const expandedId = ref('')
const formOpen = ref(false)
const editingId = ref('')
const pendingDelete = ref(null)
const form = reactive({ name: '', role: '', phone: '', tag: '', note: '' })
const tones = ['tone-blue', 'tone-green', 'tone-orange', 'tone-purple']

const showContacts = computed(() => activeCategory.value === '综合' || activeCategory.value === '联系人')
const visibleContacts = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return contacts.value.filter(item => {
    const haystack = [item.name, item.role, item.phone, item.tag, item.note].filter(Boolean).join(' ').toLowerCase()
    return !keyword || haystack.includes(keyword)
  })
})
const emptyIcon = computed(() => {
  if (showContacts.value) return contacts.value.length ? 'search' : 'friends-o'
  return categoryIcons[activeCategory.value] || 'search'
})
const emptyTitle = computed(() => {
  if (showContacts.value) return contacts.value.length ? '没有找到匹配的联系人' : '暂无常用联系人'
  return `暂无${activeCategory.value}内容`
})
const emptyHint = computed(() => {
  if (showContacts.value) return contacts.value.length ? '换个姓名、部门或手机号试试。' : '该账号下还没有常用联系人。'
  return '该分类下暂无内容。'
})

watch(query, value => {
  if (value && !showContacts.value) activeCategory.value = '联系人'
})
watch(visibleContacts, list => {
  if (expandedId.value && !list.some(item => item.id === expandedId.value)) expandedId.value = ''
})

function notify(message) {
  showToast({ message, teleport: props.teleport })
}

function avatarTone(item) {
  const total = [...String(item.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tones[total % tones.length]
}

function selectCategory(category) {
  activeCategory.value = category
  expandedId.value = ''
}

function toggleExpanded(id) {
  expandedId.value = expandedId.value === id ? '' : id
}

function callContact(item) {
  notify(`正在呼叫 ${item.name} ${item.phone}（原型演示）`)
}

function resetForm() {
  Object.assign(form, { name: '', role: '', phone: '', tag: '', note: '' })
  editingId.value = ''
}

function openEdit(item) {
  resetForm()
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    role: item.role,
    phone: item.phone,
    tag: item.tag || '',
    note: item.note || '',
  })
  formOpen.value = true
}

function submit() {
  const required = [
    ['name', '请填写联系人姓名'],
    ['role', '请填写部门或职务'],
    ['phone', '请填写手机号'],
  ]
  for (const [field, message] of required) {
    if (!String(form[field] || '').trim()) {
      notify(message)
      return
    }
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
    notify('请填写正确的 11 位手机号')
    return
  }
  saveContact({ ...form, id: editingId.value })
  formOpen.value = false
  expandedId.value = ''
  notify('联系人已更新')
}

function confirmDelete() {
  const name = pendingDelete.value?.name
  if (!name) return
  removeContact(pendingDelete.value.id)
  if (expandedId.value === pendingDelete.value.id) expandedId.value = ''
  pendingDelete.value = null
  notify(`已删除「${name}」`)
}
</script>
