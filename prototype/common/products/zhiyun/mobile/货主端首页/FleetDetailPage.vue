<template>
  <div class="fleet-detail" aria-label="车队详情">
    <div class="fleet-status">
      <span class="fleet-status-time">9:41</span>
      <span class="fleet-status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="fleet-nav">
      <button type="button" class="fleet-back" aria-label="返回运力列表" @click="emit('back')">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1>车队详情</h1>
      <span class="fleet-nav-hold"></span>
    </header>

    <div class="fleet-scroll">
      <main class="fleet-body">
        <!-- ① 车队是谁 + 唯一服务评分；运力来源平台全页只在这里说一次 -->
        <section class="fleet-hero">
          <div class="fleet-hero-tags">
            <span class="fleet-kind">物流车队</span>
            <span class="fleet-origin">运力来源 · {{ carrier.platform }}</span>
          </div>
          <h2 class="fleet-hero-name">{{ carrier.name }}</h2>
          <div class="fleet-hero-foot">
            <p class="fleet-score"><strong>{{ serviceScore }}</strong><span>服务评分</span></p>
            <p class="fleet-score-note">评分由运力来源平台提供<br />与列表推荐排序无关</p>
          </div>
        </section>

        <!-- ② 能不能拉我这批货：线路、货品、车型与规模一轮说清 -->
        <section class="fleet-card">
          <div class="fleet-card-head">
            <h3>运输能力</h3>
            <span>平台历史承运记录</span>
          </div>

          <p class="fleet-fact-label">常跑线路</p>
          <div class="fleet-line" aria-label="常跑线路示意">
            <span class="fleet-dot fleet-dot-from"></span>
            <strong>{{ routeEnds[0] }}</strong>
            <span class="fleet-line-track"></span>
            <span class="fleet-dot fleet-dot-to"></span>
            <strong>{{ routeEnds[1] }}</strong>
          </div>

          <p class="fleet-fact-label">常运货品</p>
          <div class="fleet-goods"><span v-for="goods in goodsList" :key="goods">{{ goods }}</span></div>

          <div class="fleet-scale">
            <div class="fleet-scale-head">
              <p class="fleet-fact-label fleet-fact-label-inline">车型与规模</p>
              <p class="fleet-scale-total">共 {{ vehicleCount }} 辆车 · {{ driverCount }} 名司机</p>
            </div>
            <div class="fleet-bar" aria-hidden="true">
              <span
                v-for="(item, index) in vehicleMix"
                :key="item.type"
                :class="`fleet-bar-part mix-${index}`"
                :style="{ flexGrow: item.count }"
              ></span>
            </div>
            <ul class="fleet-mix">
              <li v-for="(item, index) in vehicleMix" :key="item.type">
                <i :class="`mix-${index}`"></i>
                <span>{{ item.type }}</span>
                <b>{{ item.count }} 辆</b>
              </li>
            </ul>
            <p class="fleet-note">登记车辆数量不代表当前可用运力</p>
          </div>
        </section>

        <!-- ③ 信不信得过：合作事实在前，平台履约数据在后 -->
        <section class="fleet-card">
          <div class="fleet-card-head">
            <h3>合作与履约</h3>
            <span>平台记录</span>
          </div>
          <p v-if="carrier.coop" class="fleet-coop"><i aria-hidden="true">✓</i>你与 TA {{ carrier.coop }}</p>
          <div class="fleet-metrics">
            <div><strong>{{ carrier.detail?.completedOrders || '—' }}</strong><span>平台履约单</span></div>
            <div><strong>{{ carrier.detail?.onTimeRate || '—' }}</strong><span>准时率</span></div>
            <div><strong>{{ carrier.detail?.positiveReviews || '—' }}</strong><span>货主好评</span></div>
          </div>
        </section>

        <!-- ④ 资质与保障 -->
        <section class="fleet-card">
          <div class="fleet-card-head">
            <h3>资质与保障</h3>
          </div>
          <ul class="fleet-certs">
            <li v-for="item in certificates" :key="item"><i aria-hidden="true">✓</i>{{ item }}</li>
          </ul>
        </section>
      </main>
    </div>

    <div class="fleet-actions">
      <button type="button" class="fleet-follow" :aria-pressed="followed" @click="toggleFollow">
        <span aria-hidden="true">{{ followed ? '★' : '☆' }}</span>{{ followed ? '已关注' : '关注' }}
      </button>
      <button type="button" class="fleet-publish" @click="emit('target-publish', carrier)">定向发布货源</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// 以下「服务评分 / 履约数据 / 资质项」均为原型 Mock：正式接入后由运力来源平台提供，不表示平台已具备该数据能力。
const props = defineProps({ carrier: { type: Object, required: true } })
const emit = defineEmits(['back', 'target-publish'])

const followed = ref(false)
const followKey = computed(() => `zhiyun:fleet-follow:${props.carrier.id}`)
watch(followKey, (key) => {
  try { followed.value = window.localStorage.getItem(key) === '1' }
  catch { followed.value = false }
}, { immediate: true })
const toggleFollow = () => {
  followed.value = !followed.value
  try {
    if (followed.value) window.localStorage.setItem(followKey.value, '1')
    else window.localStorage.removeItem(followKey.value)
  } catch { /* 本地存储不可用时保持当前页面状态 */ }
}

const serviceScore = computed(() => props.carrier.detail?.serviceScore || '—')
const vehicleCount = computed(() => props.carrier.fleet?.match(/\d+(?=\s*辆车)/)?.[0] || '—')
const driverCount = computed(() => props.carrier.fleet?.match(/\d+(?=\s*名司机)/)?.[0] || '—')
const vehicleMix = computed(() => props.carrier.vehicleMix || [])
const routeEnds = computed(() => props.carrier.route.split('→').map((part) => part.trim()))
const goodsList = computed(() => props.carrier.goods.split('、'))
const certificates = computed(() => props.carrier.detail?.certificates || ['平台认证承运商'])
</script>

<style scoped>
.fleet-detail{position:absolute;inset:0;z-index:100;overflow:hidden;background:#eff3fa;color:#252b3a;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif}
.fleet-scroll{position:absolute;top:88px;bottom:76px;left:0;right:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
.fleet-scroll::-webkit-scrollbar{display:none}
.fleet-status{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.fleet-status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.fleet-status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}
.fleet-nav{height:44px;display:flex;align-items:center;padding:0 12px}
.fleet-back{width:32px;height:32px;display:grid;place-items:center;border:0;background:none;padding:0;cursor:pointer}
.fleet-nav h1{flex:1;margin:0;font-size:17px;font-weight:600;text-align:center;color:#333}
.fleet-nav-hold{width:32px}

/* 身份区：品牌深蓝通栏，压住页面顶部，右下大圆角 */
.fleet-hero{margin:0 0 10px;padding:16px 20px 22px;background:linear-gradient(158deg,#1c63ff 0%,#0f3fc4 100%);border-radius:0 0 22px 22px;color:#fff}
.fleet-hero-tags{display:flex;align-items:center;gap:8px}
.fleet-kind{padding:3px 9px;border-radius:5px;background:rgba(255,255,255,.22);font-size:11px;font-weight:600;letter-spacing:.5px}
.fleet-origin{font-size:11px;color:rgba(255,255,255,.72)}
.fleet-hero-name{margin:12px 0 0;font-size:22px;line-height:30px;font-weight:700;letter-spacing:.2px}
.fleet-hero-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.2)}
.fleet-score{display:flex;align-items:baseline;gap:7px;margin:0}
.fleet-score strong{font-size:38px;line-height:40px;font-weight:700;letter-spacing:-.5px}
.fleet-score span{font-size:12px;color:rgba(255,255,255,.82)}
.fleet-score-note{margin:0;text-align:right;font-size:10px;line-height:15px;color:rgba(255,255,255,.6)}

.fleet-body{padding:0 16px 20px}
.fleet-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:10px}
.fleet-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.fleet-card-head h3{margin:0;font-size:16px;line-height:24px;font-weight:700;color:#1a2540}
.fleet-card-head>span{font-size:10px;color:#9aa4b8}

/* 运输能力：线路 → 货品 → 规模，各一段，总数只出现一轮 */
.fleet-fact-label{margin:16px 0 8px;font-size:11px;color:#8a96ad}
.fleet-fact-label-inline{margin:0}
.fleet-line{display:flex;align-items:center;gap:8px}
.fleet-line strong{font-size:17px;font-weight:600;color:#1a2540;white-space:nowrap}
.fleet-dot{width:9px;height:9px;flex:none;border-radius:50%}
.fleet-dot-from{background:#165dff;box-shadow:0 0 0 4px rgba(22,93,255,.14)}
.fleet-dot-to{background:#00b3a4;box-shadow:0 0 0 4px rgba(0,179,164,.14)}
.fleet-line-track{flex:1;min-width:24px;height:0;border-top:1px dashed #b9c8e4}
.fleet-goods{display:flex;flex-wrap:wrap;gap:6px}
.fleet-goods span{padding:5px 11px;border-radius:6px;background:#eef3ff;color:#3f63b8;font-size:12px}
.fleet-scale{margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6}
.fleet-scale-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.fleet-scale-total{margin:0;font-size:12px;color:#4c5c78}
.fleet-bar{display:flex;gap:3px;height:8px;margin-top:11px;border-radius:4px;overflow:hidden}
.fleet-bar-part{flex-basis:0;min-width:6px;border-radius:2px}
.fleet-mix{display:flex;flex-wrap:wrap;gap:8px 18px;margin:10px 0 0;padding:0;list-style:none}
.fleet-mix li{display:flex;align-items:center;gap:6px;font-size:12px;color:#5d6b85}
.fleet-mix i{width:8px;height:8px;flex:none;border-radius:2px}
.fleet-mix b{color:#1a2540;font-size:13px;font-weight:600}
.fleet-note{margin:10px 0 0;font-size:10px;color:#a3abb9}
.mix-0{background:#165dff}
.mix-1{background:#00b3a4}
.mix-2{background:#7b61ff}
.mix-3{background:#f5a623}

/* 合作与履约 */
.fleet-coop{display:flex;align-items:center;gap:7px;margin:14px 0 0;padding:9px 12px;border-radius:8px;background:#eef8f5;color:#0f7a6b;font-size:12px}
.fleet-coop i{display:grid;place-items:center;width:15px;height:15px;flex:none;border-radius:50%;background:#00b3a4;color:#fff;font-size:10px;font-style:normal}
.fleet-metrics{display:grid;grid-template-columns:repeat(3,1fr);margin-top:14px}
.fleet-metrics>div+div{border-left:1px solid #eef1f6;padding-left:14px}
.fleet-metrics strong{display:block;font-size:20px;line-height:26px;font-weight:700;color:#1a2540}
.fleet-metrics span{font-size:11px;color:#8a96ad}

/* 资质与保障 */
.fleet-certs{display:grid;grid-template-columns:1fr 1fr;gap:11px 10px;margin:13px 0 0;padding:0;list-style:none}
.fleet-certs li{display:flex;align-items:center;gap:7px;font-size:12px;color:#3f4b63}
.fleet-certs i{display:grid;place-items:center;width:15px;height:15px;flex:none;border-radius:50%;background:#165dff;color:#fff;font-size:10px;font-style:normal}

.fleet-actions{position:absolute;bottom:0;left:0;right:0;box-sizing:border-box;height:76px;display:flex;align-items:center;gap:14px;padding:0 20px;background:#fff;border-top:1px solid #e8edf7}
.fleet-follow{width:46px;flex:none;border:0;background:none;padding:0;color:#5d6b85;font-size:11px;cursor:pointer}
.fleet-follow span{display:block;font-size:26px;line-height:28px;color:#b6bfd0}
.fleet-follow[aria-pressed='true']{color:#165dff}
.fleet-follow[aria-pressed='true'] span{color:#165dff}
.fleet-publish{flex:1;height:46px;border:0;border-radius:10px;background:#165dff;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
</style>
