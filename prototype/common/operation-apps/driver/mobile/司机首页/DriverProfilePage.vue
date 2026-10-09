<template>
  <main class="driver-profile-page" aria-label="我的资料">
    <div class="driver-status profile-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <div class="profile-scroll">
      <header class="profile-header">
        <button type="button" aria-label="返回个人中心" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>我的资料</h1>
        <span aria-hidden="true"></span>
      </header>

      <!-- 证件异常只在需要处理时出现；全部正常则整条不渲染，避免长期占位 -->
      <section v-if="alerts.length" class="profile-alert-card" aria-label="资料待处理提醒">
        <i><van-icon name="warning-o" /></i>
        <div>
          <strong>{{ alerts.length }}项资料需要处理</strong>
          <p v-for="alert in alerts" :key="alert.key" :class="alert.tone">{{ alert.text }}</p>
        </div>
      </section>

      <!-- ① 身份信息：头像与紧急联系人即时生效，手机号走短信验证；
           姓名与身份证号属于身份证件内容，只能随证件变更走审核 -->
      <section class="profile-card profile-identity-card" aria-label="身份信息">
        <h2>身份信息</h2>
        <button type="button" class="profile-avatar-row" @click="sheet = 'avatar'">
          <img :src="identity.avatar" alt="司机头像">
          <span>
            <strong>{{ identity.name }}</strong>
            <small v-if="identity.realNameVerified">已实名 · 认证于 {{ identity.realNameTime }}</small>
            <small v-else>未实名认证</small>
          </span>
          <em>更换头像</em>
        </button>

        <button type="button" class="profile-field-row" @click="openPhoneSheet">
          <span>手机号</span>
          <strong>{{ identity.phone }}</strong>
          <van-icon name="arrow" />
        </button>

        <div class="profile-field-row readonly">
          <span>实名认证</span>
          <strong :class="{ verified: identity.realNameVerified }">
            <van-icon :name="identity.realNameVerified ? 'checked' : 'warning-o'" />{{ identity.realNameVerified ? '已认证' : '未认证' }}
          </strong>
        </div>
        <p class="profile-field-note">姓名与身份证号由实名认证结果决定，需修改请更换身份证件并提交审核。</p>
      </section>

      <!-- ② 司机证件：本页核心，每项给出状态与剩余天数，司机据此确认能否接单 -->
      <section class="profile-card" aria-label="司机证件">
        <div class="profile-card-heading">
          <h2>司机证件</h2>
          <small>修改后需审核</small>
        </div>

        <div
          v-for="cert in certificates"
          :key="cert.key"
          class="profile-cert-row"
          :class="{ focused: focusKey === cert.key }"
        >
          <i class="cert-icon"><van-icon :name="cert.icon" /></i>
          <div class="cert-content">
            <div class="cert-title">
              <strong>{{ cert.label }}</strong>
              <em :class="`tone-${certStatus(cert).tone}`">{{ certStatus(cert).text }}</em>
            </div>
            <dl class="cert-fields">
              <div v-for="field in certFields(cert)" :key="field.label">
                <dt>{{ field.label }}</dt>
                <dd>{{ field.value }}</dd>
              </div>
              <div>
                <dt>有效期</dt>
                <dd v-if="cert.expireDate">{{ cert.expireDate }} · {{ remainText(cert) }}</dd>
                <dd v-else>长期有效</dd>
              </div>
            </dl>
            <!-- 审核期间旧证继续生效；无生效值的证件不能声称原证仍在使用 -->
            <small v-if="cert.reviewState === 'reviewing'" class="cert-reviewing">{{ certReviewText(cert) }}</small>
            <small v-if="cert.reviewState === 'rejected'" class="cert-rejected">{{ cert.rejectReason }}</small>
          </div>
          <button type="button" class="cert-action" @click="openCertSheet(cert, null)">
            {{ certActionLabel(cert) }}
          </button>
        </div>

        <!-- 原型内没有真实审核后台，提供两个方向验证通过/驳回后的表现 -->
        <div v-if="reviewingCerts.length" class="profile-review-bar">
          <span>原型模拟审核</span>
          <button v-for="item in reviewingCerts" :key="item.cert.key" type="button" @click="resolveReview(item.cert, true)">
            {{ item.label }}·通过
          </button>
          <button v-for="item in reviewingCerts" :key="`${item.cert.key}-no`" type="button" class="reject" @click="resolveReview(item.cert, false)">
            {{ item.label }}·驳回
          </button>
        </div>
      </section>

      <!-- ③ 我的车辆：多车管理。车牌、车型、载重来自行驶证登记结果，
           页面不作为可编辑字段，改这些信息只能更换行驶证并提交审核 -->
      <section class="profile-card" aria-label="我的车辆">
        <div class="profile-card-heading">
          <h2>我的车辆</h2>
          <small>共 {{ vehicles.length }} 辆</small>
        </div>

        <div
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          class="profile-vehicle-row"
          :class="{ focused: isVehicleFocused(vehicle) }"
        >
          <button type="button" class="vehicle-main" @click="openVehicleSheet(vehicle)">
            <span class="vehicle-plate">
              {{ vehicle.plateNo }}
              <em v-if="vehicle.isDefault">当前</em>
            </span>
            <small>{{ vehicle.vehicleType }} · {{ vehicle.loadCapacity }} · {{ vehicle.energyType }}</small>
            <small :class="vehicleCertTone(vehicle)">{{ vehicleCertSummary(vehicle) }}</small>
          </button>
          <button v-if="!vehicle.isDefault" type="button" class="vehicle-set-default" @click="chooseDefault(vehicle)">设为当前</button>
        </div>

        <button type="button" class="profile-add-button" @click="openAddVehicle">
          <van-icon name="plus" />添加车辆
        </button>
        <p class="profile-field-note">车牌、车型和载重由行驶证登记结果决定，如需修改请更换该车行驶证。</p>
      </section>

      <!-- ④ 紧急联系人：非证件类，即时生效 -->
      <section class="profile-card" aria-label="紧急联系人">
        <div class="profile-card-heading">
          <h2>紧急联系人</h2>
          <small>修改即时生效</small>
        </div>
        <button type="button" class="profile-field-row" @click="openEmergencySheet">
          <span>{{ emergency.name }} · {{ emergency.relation }}</span>
          <strong>{{ emergency.phone }}</strong>
          <van-icon name="arrow" />
        </button>
      </section>

      <p class="profile-note">证件类信息修改后需经平台审核；审核期间原证件继续有效，不影响接单和结算。</p>
    </div>

    <!-- 头像更换：原型无法调起相机或相册，仅验证选择动作与即时生效规则 -->
    <div v-if="sheet === 'avatar'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="更换头像">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>更换头像</h2>
        <p class="profile-sheet-note">头像修改即时生效，无需审核。</p>
        <button v-for="option in avatarOptions" :key="option.key" type="button" class="profile-sheet-option" @click="chooseAvatar(option)">
          {{ option.label }}
        </button>
        <button type="button" class="profile-sheet-cancel" @click="closeSheet">取消</button>
      </aside>
    </div>

    <!-- 手机号修改：即时生效但需短信验证，验证不等于审核，不需要等待平台 -->
    <div v-if="sheet === 'phone'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="修改手机号">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>修改手机号</h2>
        <p class="profile-sheet-note">当前号码 {{ identity.phone }}，修改需短信验证，验证通过即时生效。</p>
        <label class="profile-sheet-field">
          <span>新手机号</span>
          <input v-model="phoneForm.phone" type="tel" maxlength="11" placeholder="请输入11位手机号">
        </label>
        <label class="profile-sheet-field">
          <span>验证码</span>
          <input v-model="phoneForm.code" type="tel" maxlength="6" placeholder="请输入验证码">
          <button type="button" @click="sendCode">获取验证码</button>
        </label>
        <button type="button" class="profile-sheet-confirm" @click="submitPhone">确认修改</button>
      </aside>
    </div>

    <!-- 紧急联系人：非证件类，确认即生效 -->
    <div v-if="sheet === 'emergency'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="修改紧急联系人">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>紧急联系人</h2>
        <p class="profile-sheet-note">用于运输途中突发情况联系，修改即时生效。</p>
        <label class="profile-sheet-field"><span>姓名</span><input v-model="emergencyForm.name" type="text" maxlength="12" placeholder="请输入姓名"></label>
        <label class="profile-sheet-field"><span>关系</span><input v-model="emergencyForm.relation" type="text" maxlength="6" placeholder="如 配偶"></label>
        <label class="profile-sheet-field"><span>手机号</span><input v-model="emergencyForm.phone" type="tel" maxlength="11" placeholder="请输入手机号"></label>
        <button type="button" class="profile-sheet-confirm" @click="submitEmergency">保存</button>
      </aside>
    </div>

    <!-- 证件更换：提交后进入审核中，原证件继续生效 -->
    <div v-if="sheet === 'cert'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="更换证件">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>{{ activeCert?.label }}</h2>
        <p class="profile-sheet-note">
          {{ activeCert?.no ? '提交后进入审核，审核期间原证件继续有效，不影响接单。' : '填写证件信息并上传照片，提交后进入审核，审核通过才可用于接单。' }}
        </p>
        <div class="profile-sheet-current">
          <template v-if="activeCert?.no">
            <span>当前生效</span>
            <strong>{{ activeCert.no }}</strong>
            <small v-if="activeCert.expireDate">有效期至 {{ activeCert.expireDate }}</small>
            <small v-else>长期有效</small>
          </template>
          <template v-else>
            <span>当前状态</span>
            <strong>未上传{{ activeCert?.label }}</strong>
            <small>该证件缺失会影响接单资格</small>
          </template>
        </div>
        <label v-if="!certNoFixed" class="profile-sheet-field"><span>新证件号</span><input v-model="certForm.no" type="text" placeholder="请输入新证件号"></label>
        <!-- 车辆行驶证的证件号即车牌号，改号等于换车，不在换证里处理 -->
        <p v-else class="profile-sheet-inherit">
          <van-icon name="info-o" />证件号固定为车牌号{{ activeVehicle?.plateNo }}，如需变更请添加新车
        </p>
        <label class="profile-sheet-field"><span>有效期至</span><input v-model="certForm.expireDate" type="text" placeholder="如 2027-03-15"></label>
        <button type="button" class="profile-sheet-upload"><van-icon name="photograph" />上传证件照片（原型占位）</button>
        <button type="button" class="profile-sheet-confirm" @click="submitCert">提交审核</button>
      </aside>
    </div>

    <!-- 车辆证件：单车详情，证件与车辆分开管理 -->
    <div v-if="sheet === 'vehicle'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="车辆证件">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>{{ activeVehicle?.plateNo }}</h2>
        <p class="profile-sheet-note">{{ activeVehicle?.vehicleType }} · {{ activeVehicle?.loadCapacity }} · {{ activeVehicle?.energyType }}</p>
        <div v-for="cert in activeVehicle?.certs || []" :key="cert.key" class="profile-sheet-cert">
          <div>
            <strong>{{ cert.label }}</strong>
            <em :class="`tone-${certStatus(cert).tone}`">{{ certStatus(cert).text }}</em>
            <!-- 审核中的证件，生效值仍取原值，在审值单独一行，两者不混为一谈 -->
            <small v-if="cert.no">证件号 {{ cert.no }}</small>
            <small v-if="cert.expireDate">有效期至 {{ cert.expireDate }} · {{ remainText(cert) }}</small>
            <small v-if="cert.reviewState === 'reviewing' && cert.reviewingNo" class="cert-reviewing">
              在审：{{ cert.reviewingNo }}<template v-if="cert.reviewingExpireDate"> · 有效期至 {{ cert.reviewingExpireDate }}</template>
            </small>
            <small v-if="cert.reviewState === 'reviewing'" class="cert-reviewing">{{ certReviewText(cert) }}</small>
            <small v-if="cert.reviewState === 'rejected'" class="cert-rejected">{{ cert.rejectReason }}</small>
          </div>
          <button type="button" @click="openCertSheet(cert, activeVehicle)">{{ certActionLabel(cert) }}</button>
        </div>
        <button v-if="!activeVehicle?.isDefault" type="button" class="profile-sheet-confirm" @click="chooseDefault(activeVehicle)">
          设为当前车辆
        </button>
      </aside>
    </div>

    <!-- 添加车辆：车牌等登记信息与两份证件一次性提交，证件齐全才可承运 -->
    <div v-if="sheet === 'addVehicle'" class="profile-overlay" role="presentation" @click.self="closeSheet">
      <aside class="profile-sheet" role="dialog" aria-modal="true" aria-label="添加车辆">
        <div class="profile-sheet-handle" aria-hidden="true"></div>
        <h2>添加车辆</h2>
        <p class="profile-sheet-note">填写车辆登记信息并上传两份证件，提交后进入审核，审核通过才可用于接单。</p>

        <label class="profile-sheet-field"><span>车牌号</span><input v-model="vehicleForm.plateNo" type="text" placeholder="如 闽A·1234B"></label>
        <label class="profile-sheet-field"><span>车型</span><input v-model="vehicleForm.vehicleType" type="text" placeholder="如 13米高栏"></label>
        <label class="profile-sheet-field"><span>载重</span><input v-model="vehicleForm.loadCapacity" type="text" placeholder="如 35吨"></label>
        <label class="profile-sheet-field"><span>能源类型</span><input v-model="vehicleForm.energyType" type="text" placeholder="如 柴油"></label>

        <div v-for="certMeta in VEHICLE_CERT_KEYS" :key="certMeta.key" class="profile-sheet-vehicle-cert">
          <div class="vehicle-cert-heading">
            <strong>{{ certMeta.label }}</strong>
            <em :class="{ filled: certNoOf(certMeta.key) }">{{ certNoOf(certMeta.key) ? '已填写' : '必填' }}</em>
          </div>
          <!-- 行驶证的证件号就是车牌号，直接沿用上方填写值，不再重复输入 -->
          <label v-if="certMeta.key !== 'drivingLicense'" class="profile-sheet-field">
            <span>证件号</span>
            <input v-model="certFormOf(certMeta.key).no" type="text" placeholder="请输入道路运输证号">
          </label>
          <p v-else class="profile-sheet-inherit">
            <van-icon name="info-o" />证件号取上方车牌号{{ vehicleForm.plateNo ? `：${vehicleForm.plateNo}` : '' }}
          </p>
          <label class="profile-sheet-field">
            <span>有效期至</span>
            <input v-model="certFormOf(certMeta.key).expireDate" type="text" placeholder="如 2030-06-30">
          </label>
          <button type="button" class="profile-sheet-upload" @click="uploadVehicleCert(certMeta)">
            <van-icon name="photograph" />{{ certFormOf(certMeta.key).photo ? `已选择${certMeta.label}照片` : `上传${certMeta.label}照片` }}
          </button>
        </div>

        <button type="button" class="profile-sheet-confirm" @click="submitVehicle">提交审核</button>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { showToast } from 'vant'
import {
  certRemainDays,
  certReviewText,
  certStatus,
  driverCertificates,
  driverEmergencyContact,
  driverIdentity,
  driverVehicleArchives,
  addVehicleArchive,
  profileAlerts,
  resolveCertReview,
  setDefaultVehicle,
  submitCertReview,
  VEHICLE_CERT_KEYS,
} from './driver-flow-store.js'
import './driver-profile.css'

const props = defineProps({
  // 从待办进入时带证件键（如 v-3-drivingLicense 或 driving），用于定位对应证件
  focusKey: { type: String, default: '' },
})

const emit = defineEmits(['back'])

const identity = driverIdentity
const emergency = driverEmergencyContact
const certificates = driverCertificates
const vehicles = driverVehicleArchives

const sheet = ref('')
const activeCert = ref(null)
const activeVehicle = ref(null)
// 证件可能属于司机本人或某辆车，提交审核时按来源写回对应对象
const activeCertOwner = ref(null)

const phoneForm = reactive({ phone: '', code: '' })
const emergencyForm = reactive({ name: '', relation: '', phone: '' })
const certForm = reactive({ no: '', expireDate: '' })
const vehicleForm = reactive({
  plateNo: '', vehicleType: '', loadCapacity: '', energyType: '',
  // 添加车辆时两份证件一次性填写，key 与 VEHICLE_CERT_KEYS 对齐
  certs: VEHICLE_CERT_KEYS.map((meta) => ({ key: meta.key, no: '', expireDate: '', photo: '' })),
})

const certFormOf = (key) => vehicleForm.certs.find((item) => item.key === key)

// 行驶证的证件号即车牌号，不单独填写，校验与提交都取车牌号
function certNoOf(key) {
  if (key === 'drivingLicense') return vehicleForm.plateNo.trim()
  return certFormOf(key)?.no.trim() || ''
}

// 证件展示字段按证件类型区分：不同证件登记项不同，不做成通用键值对
function certFields(cert) {
  const fields = [{ label: '证件号', value: cert.no }]
  if (cert.key === 'idcard') {
    fields.push({ label: '姓名', value: cert.owner })
  }
  if (cert.key === 'driving') {
    fields.push({ label: '准驾车型', value: cert.driveClass })
    fields.push({ label: '初次领证', value: cert.firstIssueDate })
    fields.push({ label: '发证日期', value: cert.issueDate })
  }
  if (cert.key === 'qualification') {
    fields.push({ label: '办理身份', value: cert.applyIdentity })
    fields.push({ label: '从业资格', value: cert.qualificationType })
    fields.push({ label: '发证日期', value: cert.issueDate })
  }
  if (cert.issueOrg) fields.push({ label: '发证机关', value: cert.issueOrg })
  return fields
}

const alerts = computed(() => profileAlerts())

// 待办的车辆证件聚焦键形如 v-3-drivingLicense，需按车辆前缀匹配整行
function isVehicleFocused(vehicle) {
  return Boolean(props.focusKey) && props.focusKey.startsWith(`${vehicle.id}-`)
}

// 车辆行驶证的号码就是车牌号，换证时不允许改号，只更新有效期
const certNoFixed = computed(() => activeCert.value?.key === 'drivingLicense' && Boolean(activeCertOwner.value))

// 审核中的证件汇总：司机证件与车辆证件一起给出模拟审核入口
const reviewingCerts = computed(() => {
  const list = []
  certificates.forEach((cert) => {
    if (cert.reviewState === 'reviewing') list.push({ cert, label: cert.label })
  })
  vehicles.forEach((vehicle) => {
    vehicle.certs.forEach((cert) => {
      if (cert.reviewState === 'reviewing') list.push({ cert, label: `${vehicle.plateNo}${cert.label}` })
    })
  })
  return list
})

const avatarOptions = [
  { key: 'camera', label: '拍照' },
  { key: 'album', label: '从相册选择' },
  { key: 'default', label: '恢复默认头像' },
]

function remainText(cert) {
  const remain = certRemainDays(cert.expireDate)
  if (remain === null) return ''
  if (remain < 0) return `已过期 ${Math.abs(remain)} 天`
  return `剩余 ${remain} 天`
}

// 无生效证件的显示「上传」，已有生效值的是「更换」；被驳回复原为上传或更换
function certActionLabel(cert) {
  if (cert.reviewState === 'reviewing') return '查看'
  if (cert.reviewState === 'rejected') return cert.no ? '重新提交' : '重新上传'
  return cert.no ? '更换' : '上传'
}

function closeSheet() {
  sheet.value = ''
  activeCert.value = null
  activeVehicle.value = null
  activeCertOwner.value = null
}

function openPhoneSheet() {
  phoneForm.phone = ''
  phoneForm.code = ''
  sheet.value = 'phone'
}

function openEmergencySheet() {
  emergencyForm.name = emergency.name
  emergencyForm.relation = emergency.relation
  emergencyForm.phone = emergency.phoneFull
  sheet.value = 'emergency'
}

function openCertSheet(cert, vehicle) {
  activeCert.value = cert
  activeCertOwner.value = vehicle
  // 行驶证号码固定为车牌号，回填时用车辆车牌而不是证件号
  certForm.no = certNoFixed.value
    ? vehicle.plateNo
    : (cert.reviewState === 'reviewing' ? cert.reviewingNo : cert.no)
  certForm.expireDate = cert.reviewState === 'reviewing'
    ? (cert.reviewingExpireDate || cert.expireDate)
    : cert.expireDate
  sheet.value = 'cert'
}

function openVehicleSheet(vehicle) {
  activeVehicle.value = vehicle
  sheet.value = 'vehicle'
}

function openAddVehicle() {
  Object.assign(vehicleForm, { plateNo: '', vehicleType: '', loadCapacity: '', energyType: '' })
  vehicleForm.certs.forEach((item) => Object.assign(item, { no: '', expireDate: '', photo: '' }))
  sheet.value = 'addVehicle'
}

function chooseAvatar(option) {
  // 原型只有一个司机头像资源，选择动作与规则在此验证，图片本身不替换
  showToast(option.key === 'default' ? '已恢复默认头像' : `${option.label}，头像已更新（即时生效）`)
  closeSheet()
}

function sendCode() {
  if (!/^1\d{10}$/.test(phoneForm.phone)) {
    showToast('请输入正确的11位手机号')
    return
  }
  showToast(`验证码已发送至 ${phoneForm.phone.slice(0, 3)}****${phoneForm.phone.slice(-4)}`)
}

function submitPhone() {
  if (!/^1\d{10}$/.test(phoneForm.phone)) {
    showToast('请输入正确的11位手机号')
    return
  }
  if (!/^\d{4,6}$/.test(phoneForm.code)) {
    showToast('请输入收到的验证码')
    return
  }
  identity.phone = `${phoneForm.phone.slice(0, 3)}****${phoneForm.phone.slice(-4)}`
  identity.phoneFull = phoneForm.phone
  showToast('手机号已更新')
  closeSheet()
}

function submitEmergency() {
  if (!emergencyForm.name.trim()) {
    showToast('请输入联系人姓名')
    return
  }
  if (!/^1\d{10}$/.test(emergencyForm.phone)) {
    showToast('请输入正确的11位手机号')
    return
  }
  emergency.name = emergencyForm.name.trim()
  emergency.relation = emergencyForm.relation.trim() || '其他'
  emergency.phone = `${emergencyForm.phone.slice(0, 3)}****${emergencyForm.phone.slice(-4)}`
  emergency.phoneFull = emergencyForm.phone
  showToast('紧急联系人已保存')
  closeSheet()
}

function submitCert() {
  if (!certForm.no.trim()) {
    showToast('请输入新证件号')
    return
  }
  submitCertReview(activeCert.value, { newNo: certForm.no.trim(), expireDate: certForm.expireDate.trim() })
  showToast('已提交审核，审核期间原证件继续有效')
  closeSheet()
}

function resolveReview(cert, approved) {
  resolveCertReview(cert, approved)
  showToast(approved ? '模拟审核通过，新证件已生效' : '模拟审核驳回，已通知司机重新提交')
}

function chooseDefault(vehicle) {
  if (!vehicle) return
  setDefaultVehicle(vehicle.id)
  showToast(`${vehicle.plateNo} 已设为当前车辆`)
  closeSheet()
}

function uploadVehicleCert(certMeta) {
  // 原型无法调起相机或相册，仅记录已选择照片并如实说明
  certFormOf(certMeta.key).photo = `${certMeta.label}.jpg`
  showToast(`已选择${certMeta.label}照片（原型占位，未真实上传）`)
}

function submitVehicle() {
  if (!vehicleForm.plateNo.trim()) {
    showToast('请输入车牌号')
    return
  }
  const missing = VEHICLE_CERT_KEYS.filter((meta) => !certNoOf(meta.key))
  if (missing.length) {
    // 证件是承运资格的前提，缺件不允许提交，避免产生无法接单的车辆
    showToast(`请填写${missing.map((meta) => meta.label).join('和')}信息`)
    return
  }
  addVehicleArchive({
    plateNo: vehicleForm.plateNo.trim(),
    vehicleType: vehicleForm.vehicleType.trim() || '待补充',
    loadCapacity: vehicleForm.loadCapacity.trim() || '待补充',
    energyType: vehicleForm.energyType.trim() || '待补充',
    certs: VEHICLE_CERT_KEYS.map((meta) => ({
      key: meta.key,
      no: certNoOf(meta.key),
      expireDate: certFormOf(meta.key).expireDate.trim(),
    })),
  })
  showToast('车辆已提交，证件审核通过后可用于接单')
  closeSheet()
}

// 车辆证照摘要：把该车所有证件的状态压成一行，司机不必点进去逐张确认。
// 审核中优先于「待补充」：新车已提交证件时不该显示成什么都没做。
function vehicleCertSummary(vehicle) {
  const states = vehicle.certs.map((cert) => certStatus(cert).tone)
  if (states.includes('reviewing')) return '证件审核中'
  if (states.includes('rejected')) return '证件审核未通过'
  if (vehicle.certs.some((cert) => !cert.no)) return '证照待补充'
  if (states.includes('expired')) return '存在过期证件，暂不可承运'
  if (states.includes('expiring')) return '有证件即将到期'
  return '证照齐全'
}

function vehicleCertTone(vehicle) {
  const states = vehicle.certs.map((cert) => certStatus(cert).tone)
  if (states.includes('expired') || states.includes('rejected')) return 'tone-expired'
  if (states.includes('reviewing') || states.includes('expiring')) return 'tone-expiring'
  if (vehicle.certs.some((cert) => !cert.no)) return 'tone-expired'
  return 'tone-valid'
}
</script>
