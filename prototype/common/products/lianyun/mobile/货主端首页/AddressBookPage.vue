<template>
  <section class="ly-service-page ly-dir-page" aria-label="地址簿">
    <header class="ly-service-nav">
      <button type="button" aria-label="返回我的" @click="$emit('back')"><van-icon name="arrow-left" /></button>
      <h1>地址簿</h1>
      <span aria-hidden="true" />
    </header>

    <main class="ly-service-content ly-dir-content">
      <p class="ly-dir-summary">共 {{ addresses.length }} 个常用地址，发布货源时可直接选择装货或卸货地址。</p>

      <div class="ly-dir-filters" role="tablist" aria-label="按地址类型筛选">
        <button
          v-for="tab in filters"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeFilter === tab.key"
          :class="['ly-dir-filter', { 'is-active': activeFilter === tab.key }]"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}<span>{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="visibleAddresses.length" class="ly-dir-list">
        <article v-for="item in visibleAddresses" :key="item.id" class="ly-dir-card">
          <div class="ly-dir-card-head">
            <h2 :title="item.name">{{ item.name }}</h2>
            <span v-if="item.isDefault" class="ly-dir-badge"><van-icon name="checked" />默认</span>
            <span :class="['ly-dir-type', item.type === '装货' ? 'load' : 'unload']">{{ item.type }}</span>
          </div>
          <p class="ly-dir-address">
            <van-icon name="location-o" />
            <span>{{ item.region }}<br />{{ item.detail }}</span>
          </p>
          <p class="ly-dir-contact">
            <van-icon name="user-o" />
            <b>{{ item.contact }}</b>
            <span>{{ item.phone }}</span>
          </p>
          <div class="ly-dir-actions">
            <button v-if="!item.isDefault" class="primary" type="button" @click="makeDefault(item)">设为默认</button>
            <button type="button" @click="openEdit(item)">编辑</button>
            <button class="danger" type="button" @click="pendingDelete = item">删除</button>
          </div>
        </article>
      </div>

      <div v-else class="ly-dir-empty">
        <van-icon name="location-o" />
        <p>{{ activeFilter === 'all' ? '暂无常用地址' : `暂无${activeFilter}地址` }}</p>
        <small>添加常用装货或卸货地址，发布货源时可直接选择。</small>
      </div>
    </main>

    <footer class="ly-dir-footer">
      <button class="ly-dir-add" type="button" @click="openCreate"><van-icon name="plus" />新增地址</button>
    </footer>

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
        <h2>{{ editingId ? '编辑地址' : '新增地址' }}</h2>
        <button type="button" aria-label="关闭地址表单" @click="formOpen = false"><van-icon name="cross" /></button>
      </div>
      <form class="ly-dir-form" @submit.prevent="submit">
        <label class="ly-dir-field">
          <span>地址名称<em>*</em></span>
          <input v-model="form.name" type="text" maxlength="20" placeholder="例如：宁波北仑工厂" />
        </label>
        <div class="ly-dir-field">
          <span>地址类型<em>*</em></span>
          <div class="ly-dir-types" role="group" aria-label="地址类型">
            <button v-for="type in ['装货', '卸货']" :key="type" type="button" :class="{ 'is-active': form.type === type }" :aria-pressed="form.type === type" @click="form.type = type">{{ type }}</button>
          </div>
        </div>
        <label class="ly-dir-field">
          <span>所在地区<em>*</em></span>
          <input v-model="form.region" type="text" maxlength="40" placeholder="省 / 市 / 区，例如：浙江省 宁波市 北仑区" />
        </label>
        <label class="ly-dir-field">
          <span>详细地址<em>*</em></span>
          <textarea v-model="form.detail" maxlength="80" rows="2" placeholder="街道、门牌号、仓库名称"></textarea>
        </label>
        <label class="ly-dir-field">
          <span>联系人<em>*</em></span>
          <input v-model="form.contact" type="text" maxlength="20" placeholder="请输入联系人姓名" />
        </label>
        <label class="ly-dir-field">
          <span>联系电话<em>*</em></span>
          <input v-model="form.phone" type="tel" inputmode="tel" maxlength="11" placeholder="请输入 11 位手机号" />
        </label>
        <p class="ly-dir-hint">保存后可返回地址列表继续新增或修改；地址数据仅用于原型演示。</p>
        <button class="ly-dir-submit" type="submit">保存地址</button>
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
        <h2>删除地址</h2>
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
import { computed, reactive, ref } from 'vue'
import { showToast } from 'vant'
import { addressBookStore, removeAddress, saveAddress, setDefaultAddress } from './address-book-store.js'

const props = defineProps({ teleport: { type: Object, default: null } })
defineEmits(['back'])

const activeFilter = ref('all')
const formOpen = ref(false)
const editingId = ref('')
const pendingDelete = ref(null)
const form = reactive({ name: '', type: '装货', region: '', detail: '', contact: '', phone: '' })

const addresses = computed(() => addressBookStore.addresses)
const filters = computed(() => [
  { key: 'all', label: '全部', count: addresses.value.length },
  { key: '装货', label: '装货', count: addresses.value.filter(item => item.type === '装货').length },
  { key: '卸货', label: '卸货', count: addresses.value.filter(item => item.type === '卸货').length },
])
const visibleAddresses = computed(() => activeFilter.value === 'all'
  ? addresses.value
  : addresses.value.filter(item => item.type === activeFilter.value))

function notify(message) {
  showToast({ message, teleport: props.teleport })
}

function resetForm() {
  Object.assign(form, { name: '', type: '装货', region: '', detail: '', contact: '', phone: '' })
  editingId.value = ''
}

function openCreate() {
  resetForm()
  form.type = activeFilter.value === '卸货' ? '卸货' : '装货'
  formOpen.value = true
}

function openEdit(item) {
  resetForm()
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    type: item.type,
    region: item.region,
    detail: item.detail,
    contact: item.contact,
    phone: item.phone,
  })
  formOpen.value = true
}

function submit() {
  const required = [
    ['name', '请填写地址名称'],
    ['region', '请填写所在地区'],
    ['detail', '请填写详细地址'],
    ['contact', '请填写联系人'],
    ['phone', '请填写联系电话'],
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
  const current = editingId.value
    ? addressBookStore.addresses.find(item => item.id === editingId.value)
    : null
  const isEditing = !!current
  saveAddress({ ...form, id: current?.id, isDefault: current?.isDefault })
  formOpen.value = false
  activeFilter.value = 'all'
  notify(isEditing ? '地址已更新' : '地址已新增')
}

function makeDefault(item) {
  setDefaultAddress(item.id)
  notify(`已将「${item.name}」设为默认地址`)
}

function confirmDelete() {
  const name = pendingDelete.value?.name
  if (!name) return
  removeAddress(pendingDelete.value.id)
  pendingDelete.value = null
  notify(`已删除「${name}」`)
}
</script>
