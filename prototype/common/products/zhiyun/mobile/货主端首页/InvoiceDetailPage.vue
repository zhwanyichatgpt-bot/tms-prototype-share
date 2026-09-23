<template>
  <section class="invoice-detail" :class="heroClass" aria-label="开票详情">
    <!-- 蓝色渐变 Hero：状态栏 + 胶囊 + 导航 + 大标题 -->
    <div class="hero">
      <div class="status-bar">
        <span class="status-time">9:41</span>
        <span class="status-icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#fff"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#fff"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#fff"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#fff"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#fff"/></svg>
          <span class="battery"></span>
        </span>
      </div>

      <header class="nav-bar">
        <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
          <svg width="11" height="19" viewBox="0 0 11 19" fill="none"><path d="M9.4 1.4L1.8 9.5l7.6 8.1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>开票详情</h1>
        <span class="nav-placeholder"></span>
      </header>

      <div class="hero-status">
        <h2 class="hero-title">{{ record.status }}</h2>
        <p class="hero-desc">{{ statusDesc }}</p>
      </div>
    </div>

    <main class="detail-content">
      <!-- 申请信息 -->
      <section class="card">
        <div class="row"><span>开票金额</span><b class="amount">{{ money(record.amount) }}</b></div>
        <div class="row"><span>抬头类型</span><b>{{ record.titleType }}</b></div>
        <div class="row"><span>申请编号</span><b>{{ record.applyNo }}</b></div>
        <div class="row"><span>申请时间</span><b>{{ record.applyTime }}</b></div>
      </section>

      <!-- 抬头信息：默认3行，展开看全部 -->
      <section class="card">
        <template v-if="record.titleType === '企业'">
          <div class="row"><span>企业名称</span><b>{{ record.title.name }}</b></div>
          <div class="row"><span>纳税人识别号</span><b>{{ record.title.taxNo }}</b></div>
          <div class="row"><span>收票邮箱</span><b>{{ record.title.email }}</b></div>
          <template v-if="titleOpen">
            <div class="row"><span>注册地址</span><b>{{ record.title.address }}</b></div>
            <div class="row"><span>注册电话</span><b>{{ record.title.phone }}</b></div>
            <div class="row"><span>开户行</span><b>{{ record.title.bank }}</b></div>
            <div class="row"><span>开户账号</span><b>{{ record.title.account }}</b></div>
          </template>
        </template>
        <template v-else>
          <div class="row"><span>姓名</span><b>{{ record.title.name }}</b></div>
          <div class="row"><span>联系电话</span><b>{{ record.title.phone }}</b></div>
          <div class="row"><span>收票邮箱</span><b>{{ record.title.email }}</b></div>
        </template>

        <button v-if="record.titleType === '企业'" type="button" class="expand-toggle" @click="titleOpen = !titleOpen">
          {{ titleOpen ? '收起' : '展开' }}
          <svg class="expand-icon" :class="{ open: titleOpen }" width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1l5 5 5-5" stroke="#8a91a1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </section>

      <!-- 关联运单：整行进二级页 -->
      <section class="card waybill-entry" @click="notice = '原型演示：关联运单列表页未接入'">
        <span class="waybill-label">关联运单</span>
        <span class="waybill-right">
          <span class="waybill-count">{{ record.waybillCount }} 个</span>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1.5 1.5L6.5 7l-5 5.5" stroke="#a7adb8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </section>

      <!-- 处理记录 -->
      <section class="card timeline-card">
        <div v-for="(step, index) in timelineAsc" :key="index" class="tl-item" :class="{ last: index === timelineAsc.length - 1 }">
          <div class="tl-time" :class="{ active: index === 0 }">
            <div class="tl-hms">{{ step.hms }}</div>
            <div class="tl-ymd">{{ step.ymd }}</div>
          </div>
          <div class="tl-axis">
            <span class="tl-dot" :class="{ active: index === 0 }"></span>
          </div>
          <div class="tl-body">
            <div class="tl-title" :class="{ active: index === 0 }">{{ step.title }}</div>
            <div v-if="step.reason" class="tl-reason">{{ step.reason }}</div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部按钮：仅驳回态显示 -->
    <div v-if="record.status === '已驳回'" class="bottom-actions">
      <button type="button" class="btn-secondary" @click="notice = '原型演示：取消申请流程未接入'">取消申请</button>
      <button type="button" class="btn-primary" @click="emit('reapply', record)">重新申请</button>
    </div>

    <div v-if="notice" class="notice" role="status">{{ notice }}<button type="button" @click="notice = ''">×</button></div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['back', 'reapply'])

const titleOpen = ref(false)
const notice = ref('')

const heroClass = computed(() => ({
  '待开票': 'is-pending',
  '开票中': 'is-doing',
  '已开票': 'is-done',
  '已驳回': 'is-reject',
}[props.record.status] || 'is-doing'))

const statusDesc = computed(() => ({
  '待开票': '开票申请已提交，等待开票方受理。',
  '开票中': '开票方正在处理，请耐心等待。',
  '已开票': '电子发票已开具，请前往收票邮箱查收。',
  '已驳回': '开票申请未通过，请修改后重新提交',
}[props.record.status] || ''))

function money(value) {
  return `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* 时间轴：把 "06-08 16:40" 拆成 hms / ymd；倒序（最新在最上） */
const timelineAsc = computed(() => {
  const list = (props.record.timeline || []).map(step => {
    const raw = step.time || ''
    const [ymd = '', hms = ''] = raw.split(' ')
    const isReject = step.title === '平台驳回'
    return {
      title: step.title,
      hms: hms ? (hms.length === 5 ? `${hms}:21` : hms) : '12:14:21',
      ymd: ymd ? `2026-${ymd}` : '2026-02-10',
      reason: isReject ? `驳回原因：${step.detail || props.record.rejectReason || '开票信息有误，请核对后重新提交。'}` : '',
    }
  })
  return list.reverse()
})
</script>

<style scoped>
.invoice-detail{position:absolute;inset:0;z-index:7;background:#f3f4f8;color:#252b3a;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5;display:flex;flex-direction:column}
.invoice-detail *{box-sizing:border-box}
.invoice-detail button{font-family:inherit;cursor:pointer}

/* ===== Hero：状态色渐变 ===== */
.hero{position:relative;flex-shrink:0;color:#fff;padding-bottom:38px}
.is-doing .hero,.is-pending .hero{background:linear-gradient(180deg,#3d7bff 0%,#5e97ff 60%,#7eb2ff 100%)}
.is-done .hero{background:linear-gradient(180deg,#3d7bff 0%,#5e97ff 60%,#7eb2ff 100%)}
.is-reject .hero{background:linear-gradient(180deg,#8b95ad 0%,#a3adc2 60%,#bcc4d4 100%)}

.status-bar{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px}
.status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(255,255,255,.55);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#fff;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(255,255,255,.55);border-radius:.7px}

.nav-bar{position:relative;height:44px;display:flex;align-items:center;padding:0 8px}
.back-button{width:36px;height:36px;border:0;background:none;display:flex;align-items:center;justify-content:center;padding:0}
.nav-bar h1{flex:1;margin:0;font-size:17px;font-weight:600;text-align:center;color:#fff;letter-spacing:.5px}
.nav-placeholder{width:36px;height:36px}

.hero-status{padding:14px 20px 0}
.hero-title{margin:0;font-size:26px;font-weight:700;line-height:36px;color:#fff;letter-spacing:.5px}
.hero-desc{margin:6px 0 0;font-size:13px;line-height:20px;color:rgba(255,255,255,.85)}

/* ===== 内容区 ===== */
.detail-content{position:relative;flex:1;overflow-y:auto;padding:0 14px 20px;margin-top:-22px;scrollbar-width:none}
.detail-content::-webkit-scrollbar{display:none}

.card{background:#fff;border-radius:12px;padding:16px 16px;margin-bottom:10px;box-shadow:0 1px 2px rgba(21,34,66,.03)}

.row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:7px 0;font-size:14px;line-height:22px}
.row:first-child{padding-top:0}
.row:last-child{padding-bottom:0}
.row + .row{margin-top:8px}
.row span{flex-shrink:0;color:#8a91a1;font-size:13px}
.row b{font-weight:500;color:#252b3a;text-align:right;word-break:break-all;font-size:14px}
.row b.amount{color:#3d7bff;font-weight:600;font-size:15px}

/* 抬头信息展开/收起 */
.expand-toggle{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;margin-top:12px;padding:8px 0 0;border:0;border-top:1px solid #f2f3f7;background:none;color:#8a91a1;font-size:13px}
.expand-icon{transition:transform .2s}
.expand-icon.open{transform:rotate(180deg)}

/* 关联运单整行 */
.waybill-entry{display:flex;align-items:center;justify-content:space-between;padding:16px;cursor:pointer}
.waybill-label{font-size:14px;font-weight:600;color:#252b3a}
.waybill-right{display:flex;align-items:center;gap:8px}
.waybill-count{padding:3px 10px;border-radius:12px;background:#f3f4f8;color:#5c6472;font-size:12px;line-height:16px}

/* ===== 时间轴 ===== */
.timeline-card{padding:18px 16px 14px}
.tl-item{display:flex;gap:12px;position:relative}
.tl-time{flex-shrink:0;width:70px;text-align:left;padding-top:1px}
.tl-hms{font-size:14px;font-weight:600;color:#252b3a;line-height:20px;white-space:nowrap}
.tl-ymd{font-size:11px;color:#a7adb8;line-height:16px;margin-top:1px;white-space:nowrap}
.tl-time.active .tl-hms{color:#3d7bff}
.tl-time.active .tl-ymd{color:#3d7bff;opacity:.7}

.tl-axis{position:relative;flex-shrink:0;width:14px;display:flex;justify-content:center}
.tl-dot{position:relative;z-index:1;margin-top:5px;width:9px;height:9px;border-radius:50%;background:#fff;border:2px solid #c9ced9}
.tl-dot.active{width:11px;height:11px;margin-top:4px;background:#3d7bff;border-color:#3d7bff;box-shadow:0 0 0 3px rgba(61,123,255,.15)}
.tl-item:not(.last) .tl-axis::after{content:'';position:absolute;top:18px;bottom:-8px;left:50%;width:1.5px;transform:translateX(-50%);background:#e6e9f0}

.tl-body{flex:1;min-width:0;padding-bottom:18px}
.tl-item.last .tl-body{padding-bottom:0}
.tl-title{font-size:14px;font-weight:600;color:#252b3a;line-height:20px}
.tl-title.active{color:#3d7bff}
.tl-reason{margin-top:8px;padding:10px 12px;border-radius:8px;background:#f6f7fa;color:#8a91a1;font-size:12px;line-height:18px}

/* ===== 底部按钮（仅驳回） ===== */
.bottom-actions{flex-shrink:0;display:flex;gap:12px;padding:12px 16px calc(14px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #f0f1f5}
.btn-secondary{width:110px;height:44px;border:1px solid #d6dae2;border-radius:8px;background:#fff;color:#252b3a;font-size:15px;font-weight:600}
.btn-primary{flex:1;height:44px;border:0;border-radius:8px;background:#3d7bff;color:#fff;font-size:15px;font-weight:600}

.notice{position:absolute;bottom:80px;left:24px;right:24px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(37,43,58,.94);color:#fff;font-size:12px;z-index:6}
.notice button{border:0;background:none;color:#fff;font-size:16px;line-height:1;padding:0}
</style>
