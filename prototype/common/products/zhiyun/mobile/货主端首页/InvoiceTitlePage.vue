<template>
  <section class="title-page" aria-label="开票抬头管理">
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <!-- 抬头列表 -->
    <template v-if="!editing">
      <header class="nav-bar">
        <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>开票抬头</h1>
        <span class="nav-spacer"></span>
      </header>

      <main class="title-content">
        <p class="list-note">维护常用抬头后，申请开票时可直接选用，无需重复填写。</p>

        <article
          v-for="item in titles"
          :key="item.id"
          class="card title-card"
          :class="{ picked: pickMode && pickedId === item.id }"
          @click="onCardClick(item)"
        >
          <div class="row-between">
            <h3 class="card-title">
              {{ item.name }}
              <span class="type-tag" :class="item.type === '企业' ? 'is-company' : 'is-person'">{{ item.type }}</span>
            </h3>
            <span v-if="item.isDefault" class="default-tag">默认</span>
          </div>
          <p class="secondary">{{ titleCaption(item) }}</p>
          <p class="secondary">{{ item.email }}</p>

          <div v-if="!pickMode" class="title-actions">
            <button v-if="!item.isDefault" type="button" class="cargo-action" @click.stop="setDefault(item)">设为默认</button>
            <button type="button" class="cargo-action" @click.stop="edit(item)">编辑</button>
            <button type="button" class="cargo-action danger" @click.stop="remove(item)">删除</button>
          </div>
        </article>

        <div v-if="!titles.length" class="empty-state">
          <span>¥</span>
          <p>暂无开票抬头<br />新增后申请开票可直接选用</p>
        </div>
      </main>

      <div class="bottom-bar">
        <button type="button" class="bottom-btn" @click="add">新增抬头</button>
      </div>
    </template>

    <!-- 新增 / 编辑表单 -->
    <template v-else>
      <header class="nav-bar">
        <button type="button" class="back-button" aria-label="返回" @click="cancelEdit">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>{{ draft.id ? '编辑抬头' : '新增抬头' }}</h1>
        <span class="nav-spacer"></span>
      </header>

      <main class="title-content">
        <section class="card form-card">
          <h3 class="card-title">抬头类型</h3>
          <div class="title-switch" role="group" aria-label="抬头类型">
            <button type="button" :class="{ active: draft.type === '企业' }" @click="draft.type = '企业'">企业</button>
            <button type="button" :class="{ active: draft.type === '个人' }" @click="draft.type = '个人'">个人</button>
          </div>

          <template v-if="draft.type === '企业'">
            <label class="field"><span>企业名称<i>*</i></span><input v-model="draft.name" type="text" placeholder="请输入" /></label>
            <label class="field"><span>纳税人识别号<i>*</i></span><input v-model="draft.taxNo" type="text" placeholder="请输入" /></label>
            <label class="field"><span>收票邮箱<i>*</i></span><input v-model="draft.email" type="text" placeholder="请输入" /></label>
            <p class="field-note">开具增值税普通发票仅需企业名称与纳税人识别号；开具专用发票时才需补充地址、电话与开户信息。</p>
            <label class="field"><span>注册地址</span><input v-model="draft.address" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>注册电话</span><input v-model="draft.phone" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>开户行</span><input v-model="draft.bank" type="text" placeholder="开具专用发票时填写" /></label>
            <label class="field"><span>开户账号</span><input v-model="draft.account" type="text" placeholder="开具专用发票时填写" /></label>
          </template>
          <template v-else>
            <label class="field"><span>姓名<i>*</i></span><input v-model="draft.name" type="text" placeholder="请输入" /></label>
            <label class="field"><span>联系电话<i>*</i></span><input v-model="draft.phone" type="text" placeholder="请输入" /></label>
            <label class="field"><span>收票邮箱<i>*</i></span><input v-model="draft.email" type="text" placeholder="请输入" /></label>
          </template>

          <label class="switch-row">
            <span>设为默认抬头</span>
            <button type="button" class="switch" :class="{ on: draft.isDefault }" role="switch" :aria-checked="draft.isDefault" @click="draft.isDefault = !draft.isDefault">
              <i></i>
            </button>
          </label>
        </section>

        <div class="apply-actions">
          <button type="button" class="cargo-action wide" @click="cancelEdit">取消</button>
          <button type="button" class="submit-action wide" @click="save">保存</button>
        </div>
      </main>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { invoiceTitles, titleCaption } from './invoice-data.js'

const props = defineProps({
  /* pick：从开票表单进来选抬头，选中即回填；manage：从发票页进来维护 */
  mode: { type: String, default: 'manage' },
  currentId: { type: String, default: '' },
})
const emit = defineEmits(['back', 'pick', 'changed'])

/* 直接使用共享抬头列表：保存后开票页无需刷新即可看到 */
const titles = invoiceTitles
const editing = ref(false)
const draft = ref(blank())
const pickedId = ref(props.currentId)

const pickMode = computed(() => props.mode === 'pick')

function blank() {
  return {
    id: '', type: '企业', name: '', taxNo: '', email: '',
    address: '', phone: '', bank: '', account: '', isDefault: false,
  }
}

function onCardClick(item) {
  if (!pickMode.value) return
  pickedId.value = item.id
  emit('pick', { ...item })
}

function add() {
  draft.value = blank()
  editing.value = true
}

function edit(item) {
  draft.value = { ...item }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function save() {
  const required = draft.value.type === '企业'
    ? [draft.value.name, draft.value.taxNo, draft.value.email]
    : [draft.value.name, draft.value.phone, draft.value.email]
  if (required.some(value => !String(value || '').trim())) {
    emit('changed', '请填写完整的必填信息')
    return
  }
  if (draft.value.isDefault) {
    titles.forEach(item => { item.isDefault = false })
  }
  const index = titles.findIndex(item => item.id === draft.value.id)
  if (index >= 0) {
    titles[index] = { ...draft.value }
    emit('changed', '抬头已更新')
  } else {
    /* 第一条抬头自动成为默认 */
    const isFirst = titles.length === 0
    titles.push({ ...draft.value, id: `T${Date.now()}`, isDefault: draft.value.isDefault || isFirst })
    emit('changed', '抬头已新增')
  }
  editing.value = false
}

function setDefault(item) {
  titles.forEach(row => { row.isDefault = row.id === item.id })
  emit('changed', '已设为默认抬头')
}

function remove(item) {
  const index = titles.findIndex(row => row.id === item.id)
  if (index >= 0) titles.splice(index, 1)
  /* 删掉默认抬头后，由第一条顶上，避免开票时无默认可带 */
  if (item.isDefault && titles.length) titles[0].isDefault = true
  emit('changed', '抬头已删除')
}
</script>

<style scoped>
.title-page{position:absolute;inset:0;z-index:6;background:#eff1f9;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.title-page *{box-sizing:border-box}
.title-page button{font-family:inherit;cursor:pointer}

.nav-bar{position:relative;z-index:2;height:44px;display:flex;align-items:center;padding:0 12px}
.nav-bar h1{margin:0 0 0 6px;font-size:17px;font-weight:600;color:#333}
.back-button{width:32px;height:32px;border:0;background:none;display:flex;align-items:center;justify-content:center;padding:0}
.nav-spacer{width:32px;height:32px}

/* iOS 状态栏：沿用发票页写法 */
.status-bar{position:relative;z-index:2;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}

.title-content{position:absolute;top:88px;bottom:74px;left:0;right:0;z-index:2;overflow-y:auto;padding:12px 16px 24px;scrollbar-width:none}
.title-content::-webkit-scrollbar{display:none}

.card{position:relative;z-index:2;background:#fff;border-radius:10px;padding:14px;margin-bottom:8px;box-shadow:0 1px 6px rgba(96,116,166,.08)}
.card-title{margin:0;font-size:15px;line-height:20px;font-weight:700;color:#252b3a}
.secondary{margin:4px 0 0;color:#666;font-size:11px;line-height:17px}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:8px}
.list-note{position:relative;z-index:2;margin:0 0 10px;color:#8a91a1;font-size:11px;line-height:17px}

.type-tag{margin-left:6px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;vertical-align:1px}
.type-tag.is-company{background:#eaf2ff;color:#3974d8}
.type-tag.is-person{background:#f0f2f6;color:#626b78}
.default-tag{flex-shrink:0;padding:2px 8px;border-radius:4px;background:#e8f6ee;color:#2f9c62;font-size:10px;font-weight:600}

.title-card.picked{border:1px solid #3a65ff;background:#f5f8ff}
.title-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f0f2f6}
.cargo-action{min-width:62px;height:30px;padding:0 12px;flex-shrink:0;border:1px solid #d9dce3;border-radius:16px;background:#fff;color:#333;font-size:13px;font-weight:600}
.cargo-action.danger{color:#d05252;border-color:#f2d6d6}
.submit-action{min-width:82px;height:30px;padding:0 14px;flex-shrink:0;border:0;border-radius:16px;background:#3a65ff;color:#fff;font-size:13px;font-weight:600}
.wide{flex:1;min-width:0;height:42px;border-radius:8px;font-size:15px;font-weight:700}
.apply-actions{display:flex;gap:10px;margin-top:14px}

.form-card{margin-top:0}
.title-switch{display:flex;gap:8px;margin:10px 0 4px}
.title-switch button{padding:5px 16px;border:1px solid #d9dce3;border-radius:15px;background:#fff;color:#626b78;font-size:13px}
.title-switch button.active{border-color:#3a65ff;background:#eef3ff;color:#2f61f6;font-weight:600}

.field{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #f0f2f6}
.field:last-of-type{border-bottom:0}
.field span{flex-shrink:0;width:96px;color:#333;font-size:13px}
.field span i{color:#e35d5d;font-style:normal;margin-left:2px}
.field input{flex:1;min-width:0;border:0;background:none;color:#252b3a;font-size:13px;text-align:right;font-family:inherit;outline:none}
.field input::placeholder{color:#bfc5d0}
.field-note{margin:10px 0 0;padding:9px 10px;border-radius:7px;background:#f4f5f9;color:#747c8c;font-size:11px;line-height:17px}

.switch-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #f0f2f6;font-size:13px;color:#333}
.switch{position:relative;width:44px;height:24px;flex-shrink:0;border:0;border-radius:12px;background:#d9dce3;padding:0;transition:background .2s}
.switch i{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}
.switch.on{background:#3a65ff}
.switch.on i{left:22px}

.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;padding:0 24px;text-align:center;color:#abb0b8}
.empty-state span{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#e3e8f0;color:#8f99a8;font-size:22px}
.empty-state p{margin:10px 0 0;font-size:13px;line-height:19px}

.bottom-bar{position:absolute;bottom:0;left:0;right:0;z-index:3;display:flex;padding:12px 16px 18px;background:#fff;border-top:1px solid #eef0f4}
.bottom-btn{flex:1;height:44px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}
</style>
