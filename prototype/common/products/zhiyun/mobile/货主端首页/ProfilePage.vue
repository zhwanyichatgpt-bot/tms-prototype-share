<template>
  <section class="profile-page" :data-annotation-container="previewKey ? null : 'modal'" :data-annotation-content="previewKey ? null : 'modal'" aria-label="我的资料">
    <BusinessStatusBar />
    <header class="profile-nav">
      <button type="button" aria-label="返回我的" @click="back"><van-icon name="arrow-left" /></button>
      <h1>我的资料</h1>
      <button type="button" class="edit-action" @click="editing ? save() : editing = true">{{ editing ? '保存' : '编辑' }}</button>
    </header>
    <main class="profile-scroll">
      <section class="profile-group" :class="{ 'annot-zhiyunShipperHome-field-profile-person-fields': !previewKey }" aria-labelledby="person-heading">
        <h2 id="person-heading">管理员与法人</h2>
        <div class="panel identity-panel">
          <div class="person-summary">
            <label class="person-avatar" :class="{ editable: editing }">
              <img :src="draft.avatar" alt="个人头像" />
              <span v-if="editing">更换</span>
              <input v-if="editing" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="更换头像" @change="chooseImage($event, 'avatar')" />
            </label>
            <div class="person-info">
              <input v-if="editing" v-model="draft.name" class="person-name-input" placeholder="请输入姓名" aria-label="姓名" />
              <strong v-else class="person-name">{{ draft.name }}</strong>
              <span class="person-role">{{ profile.role }}</span>
            </div>
          </div>
          <div class="field"><span>登录手机号</span><b>{{ profile.phone }}</b></div>
          <label class="field"><span>身份证号码</span><input v-if="editing" v-model="draft.idNumber" inputmode="text" maxlength="18" autocomplete="off" placeholder="请输入身份证号码" /><b v-else :class="{ empty: !draft.idNumber }">{{ maskedIdNumber }}</b></label>
          <div class="documents-heading">身份证照片</div>
          <div class="identity-grid">
            <div v-for="side in identitySides" :key="side.key" class="identity-side">
              <div class="document-label">{{ side.label }}</div>
              <button v-if="draft[side.key]" type="button" class="document-thumbnail" @click="previewKey = side.key">
                <img :src="draft[side.key]" :alt="side.label" /><span>点击预览</span>
              </button>
              <div v-else class="document-empty"><van-icon name="photo-o" /><span>未上传</span></div>
              <p v-if="draft[side.nameKey]" class="file-name">{{ draft[side.nameKey] }}</p>
              <label v-if="editing" class="upload-action">
                <van-icon name="photograph" /> {{ draft[side.key] ? '更换' : '上传' }}
                <input class="file-input" type="file" accept="image/jpeg,image/png,image/webp" :aria-label="'选择' + side.label" @change="chooseImage($event, side.key)" />
              </label>
            </div>
          </div>
          <p class="section-note">身份证号仅脱敏展示；证件变更需审核，保存不代表核验通过。</p>
        </div>
      </section>

      <section class="profile-group" :class="{ 'annot-zhiyunShipperHome-rule-profile-enterprise-certification': !previewKey }" aria-labelledby="enterprise-heading">
        <div class="section-heading"><h2 id="enterprise-heading">企业资料与认证</h2><span class="cert-status">{{ enterprise.certificationStatus }}</span></div>
        <div class="panel license-panel">
          <label v-for="field in enterpriseFields" :key="field.key" class="field" :class="{ 'long-field': field.long }">
            <span>{{ field.label }}</span>
            <b v-if="field.key === 'legalRepresentative'">{{ draft.name }}</b>
            <textarea v-else-if="editing && field.long" v-model="draft[field.key]" rows="2" :placeholder="'请输入' + field.label" />
            <input v-else-if="editing" v-model="draft[field.key]" :placeholder="'请输入' + field.label" />
            <b v-else :class="{ empty: !draft[field.key] }">{{ draft[field.key] || '未填写' }}</b>
          </label>
          <div class="enterprise-contact">
            <div class="documents-heading">企业联系方式</div>
            <label v-for="field in contactFields" :key="field.key" class="field" :class="{ 'long-field': field.long }">
              <span>{{ field.label }}</span>
              <textarea v-if="editing && field.long" v-model="draft[field.key]" rows="2" :placeholder="'请输入' + field.label" />
              <input v-else-if="editing" v-model="draft[field.key]" :type="field.key === 'contactPhone' ? 'tel' : 'text'" :placeholder="'请输入' + field.label" />
              <b v-else :class="{ empty: !draft[field.key] }">{{ draft[field.key] || '未填写' }}</b>
            </label>
          </div>
          <div class="certificate-block">
            <div class="documents-heading">营业执照</div>
            <button v-if="draft.licenseUrl" type="button" class="license-thumbnail" @click="previewKey = 'licenseUrl'">
              <img :src="draft.licenseUrl" alt="营业执照" /><span>点击预览</span>
            </button>
            <div v-else class="license-empty"><van-icon name="photo-o" /><span>未上传营业执照</span></div>
            <p v-if="draft.licenseName" class="file-name">{{ draft.licenseName }}</p>
            <label v-if="editing" class="upload-action">
              <van-icon name="photograph" /> {{ draft.licenseUrl ? '更换营业执照' : '上传营业执照' }}
              <input class="file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择营业执照图片" @change="chooseImage($event, 'licenseUrl')" />
            </label>
          </div>
          <p class="section-note">企业主体与执照变更需审核，保存不改变认证状态。</p>
        </div>
      </section>
      <div v-if="editing" class="edit-footer">
        <button type="button" class="cancel-action" @click="cancelEditing">取消</button>
        <button type="button" class="save-action" @click="save">保存资料</button>
      </div>
    </main>
    <div v-if="previewKey && draft[previewKey]" class="license-preview" data-annotation-container="drawer" data-annotation-content="drawer" role="dialog" aria-modal="true" :aria-label="previewTitle + '预览'" @click.self="previewKey = ''">
      <button type="button" aria-label="关闭预览" @click="previewKey = ''"><van-icon name="cross" /></button>
      <img :src="draft[previewKey]" :alt="previewTitle + '完整预览'" />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import BusinessStatusBar from './BusinessStatusBar.vue'

const props = defineProps({
  profile: { type: Object, required: true },
  enterprise: { type: Object, required: true },
})
const emit = defineEmits(['back', 'save'])
const source = () => ({ ...props.profile, ...props.enterprise })
const draft = ref({ ...source() })
const editing = ref(false)
const previewKey = ref('')
const temporaryUrls = new Set()
const identitySides = [
  { key: 'idFrontUrl', nameKey: 'idFrontName', label: '身份证人像面' },
  { key: 'idBackUrl', nameKey: 'idBackName', label: '身份证国徽面' },
]
const maskedIdNumber = computed(() => {
  const number = draft.value.idNumber?.trim()
  return number ? `${number.slice(0, 3)}***********${number.slice(-4)}` : '未填写'
})
const previewTitle = computed(() => previewKey.value === 'licenseUrl' ? '营业执照' : identitySides.find(side => side.key === previewKey.value)?.label || '证件')
const enterpriseFields = [
  { key: 'fullName', label: '企业全称' },
  { key: 'shortName', label: '企业简称' },
  { key: 'creditCode', label: '统一社会信用代码' },
  { key: 'legalRepresentative', label: '法定代表人' },
  { key: 'registeredAddress', label: '注册地址', long: true },
]
const contactFields = [
  { key: 'contactAddress', label: '联系地址', long: true },
  { key: 'contactName', label: '联系人' },
  { key: 'contactPhone', label: '联系电话' },
]
const clearTemporaryImages = () => {
  temporaryUrls.forEach(url => URL.revokeObjectURL(url))
  temporaryUrls.clear()
}
const chooseImage = (event, key) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('请选择 JPG、PNG 或 WebP 图片')
    return
  }
  const oldUrl = draft.value[key]
  if (temporaryUrls.has(oldUrl)) {
    URL.revokeObjectURL(oldUrl)
    temporaryUrls.delete(oldUrl)
  }
  const url = URL.createObjectURL(file)
  temporaryUrls.add(url)
  draft.value[key] = url
  const nameKey = key === 'licenseUrl' ? 'licenseName' : identitySides.find(side => side.key === key)?.nameKey
  if (nameKey) draft.value[nameKey] = file.name
}
const hasChanges = computed(() => JSON.stringify(draft.value) !== JSON.stringify(source()))
const discardConfirmed = async () => {
  if (!hasChanges.value) return true
  try {
    await showConfirmDialog({ title: '放弃修改？', message: '未保存的资料和附件将不保留。', confirmButtonText: '放弃修改', cancelButtonText: '继续编辑' })
    return true
  } catch { return false }
}
const cancelEditing = async () => {
  if (!await discardConfirmed()) return
  clearTemporaryImages()
  draft.value = { ...source() }
  editing.value = false
}
const back = async () => {
  if (previewKey.value) { previewKey.value = ''; return }
  if (await discardConfirmed()) emit('back')
}
const save = () => {
  if (!draft.value.name?.trim() || !draft.value.fullName?.trim()) {
    showToast(!draft.value.name?.trim() ? '请填写姓名' : '请填写企业全称')
    return
  }
  const data = Object.fromEntries(Object.entries(draft.value).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
  data.legalRepresentative = data.name
  const personal = Object.fromEntries(Object.keys(props.profile).map(key => [key, data[key]]))
  const enterprise = Object.fromEntries(Object.keys(props.enterprise).map(key => [key, data[key]]))
  emit('save', { personal, enterprise })
  /* 保存后的图片交由父页面管理；取消或离开时只回收未保存的临时图片。 */
  temporaryUrls.delete(data.avatar)
  temporaryUrls.delete(data.licenseUrl)
  temporaryUrls.delete(data.idFrontUrl)
  temporaryUrls.delete(data.idBackUrl)
  clearTemporaryImages()
  draft.value = { ...data }
  editing.value = false
  showToast('资料已保存（原型演示）')
}
onBeforeUnmount(clearTemporaryImages)
</script>

<style scoped>
.profile-page { position: absolute; inset: 0; z-index: 30; background: linear-gradient(180deg, #edf4ff 0, #f4f7fc 230px); color: #18213a; overflow: hidden; }
:deep(.ios-bar) { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
.profile-nav { height: 44px; display: grid; grid-template-columns: 60px 1fr 60px; align-items: center; background: transparent; }
.profile-nav h1 { margin: 0; text-align: center; font-size: 17px; }
button { border: 0; cursor: pointer; font: inherit; }
.profile-nav button { height: 44px; background: transparent; font-size: 20px; }
.profile-nav .edit-action { color: #3265ff; font-size: 14px; }
.profile-scroll { position: absolute; inset: 88px 0 0; overflow-y: auto; padding: 16px 14px 30px; }
.profile-group + .profile-group { margin-top: 20px; }
h2 { font-size: 14px; margin: 0 4px 10px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.section-heading h2 { margin-bottom: 0; }
.panel { border-radius: 14px; background: white; padding: 0 14px; }
.field { min-height: 50px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f0f2f6; position: relative; }
.field:last-child { border: 0; }
.field > span:first-child { flex: 0 0 auto; font-size: 13px; }
.field b { flex: 1; text-align: right; font-size: 13px; font-weight: 400; overflow-wrap: anywhere; }
.field .empty { color: #a5adba; }
.field input:not(.file-input), .field textarea { width: 0; flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; font-size: 13px; color: #18213a; text-align: right; padding: 14px 0; outline-color: #3265ff; }
input::placeholder, textarea::placeholder { color: #b0b7c4; }
.long-field { align-items: flex-start; padding: 15px 0; }
.long-field textarea { padding: 0; resize: vertical; }
.person-summary { display: flex; align-items: center; gap: 12px; min-height: 84px; border-bottom: 1px solid #f0f2f6; }
.person-avatar { width: 54px; height: 54px; flex: 0 0 54px; border-radius: 50%; position: relative; overflow: hidden; }
.person-avatar img { width: 100%; height: 100%; object-fit: cover; }
.person-avatar.editable { cursor: pointer; }
.person-avatar span { position: absolute; bottom: 0; left: 0; right: 0; padding: 2px 0; background: #18213a99; color: white; font-size: 10px; text-align: center; }
.person-info { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 5px; }
.person-name { font-size: 16px; }
.person-name-input { width: 100%; padding: 4px 0; border: 0; border-bottom: 1px solid #c9d7ff; font: inherit; font-size: 16px; font-weight: 600; outline-color: #3265ff; }
.person-role { font-size: 11px; color: #7e89a0; }
.file-input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
.section-note { margin: 0; padding: 10px 0 14px; font-size: 11px; line-height: 1.5; color: #8b95a9; }
.identity-panel, .license-panel { padding-bottom: 0; }
.identity-panel > .field { border-bottom: 1px solid #f0f2f6; }
.documents-heading { font-size: 13px; font-weight: 600; padding: 14px 0 10px; }
.identity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.document-label { margin-bottom: 8px; color: #66738e; font-size: 11px; }
.cert-status { margin-right: 4px; padding: 3px 8px; border-radius: 20px; background: #eafaf4; color: #11a776; font-size: 11px; }
.certificate-block { border-top: 1px solid #f0f2f6; }
.license-empty, .license-thumbnail, .document-empty, .document-thumbnail { width: 100%; border: 1px dashed #d5deee; border-radius: 10px; background: #f8faff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: #929eb3; font-size: 11px; overflow: hidden; }
.license-empty, .license-thumbnail { height: 126px; }
.document-empty, .document-thumbnail { height: 96px; }
.license-empty .van-icon, .document-empty .van-icon { font-size: 26px; }
.license-thumbnail, .document-thumbnail { position: relative; border-style: solid; }
.license-thumbnail img, .document-thumbnail img { width: 100%; height: 100%; object-fit: contain; }
.license-thumbnail span, .document-thumbnail span { position: absolute; bottom: 0; width: 100%; background: #18213a99; color: white; padding: 4px; text-align: center; }
.upload-action { position: relative; display: flex; justify-content: center; align-items: center; gap: 6px; border: 1px solid #c9d7ff; border-radius: 8px; color: #3265ff; padding: 8px; margin-top: 8px; font-size: 12px; }
.file-name { color: #8b95a9; font-size: 11px; overflow-wrap: anywhere; }
.edit-footer { display: flex; gap: 10px; margin-top: 24px; }
.edit-footer button { border-radius: 10px; height: 44px; }
.cancel-action { flex: 1; color: #66738e; background: white; }
.save-action { flex: 2; color: white; background: #3265ff; }
.license-preview { position: absolute; inset: 0; z-index: 40; background: #101725ee; display: flex; align-items: center; justify-content: center; padding: 16px; }
.license-preview img { max-width: 100%; max-height: 85%; object-fit: contain; }
.license-preview button { position: absolute; top: 22px; right: 18px; color: white; background: transparent; font-size: 24px; }
</style>
