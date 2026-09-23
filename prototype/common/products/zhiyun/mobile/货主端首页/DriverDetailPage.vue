<template>
  <div class="driver-detail" aria-label="司机详情">
    <div class="driver-status">
      <span class="driver-status-time">9:41</span>
      <span class="driver-status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="driver-nav">
      <button type="button" class="driver-back" aria-label="返回运力列表" @click="emit('back')">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1>司机详情</h1>
      <span class="driver-nav-hold"></span>
    </header>

    <div class="driver-scroll">
      <main class="driver-body">
        <!-- ① 是谁的车：头像 + 姓名 + 核验来源 + 唯一推荐百分比 -->
        <section class="driver-hero">
          <div class="driver-hero-main">
            <img class="driver-avatar" :src="driver.photo" alt="" />
            <div class="driver-hero-text">
              <h2 class="driver-hero-name">{{ driver.name }}</h2>
              <p class="driver-verified">运力来源 · {{ profile.platform }}</p>
            </div>
          </div>
          <div class="driver-hero-foot">
            <p class="driver-match"><strong>{{ driver.rate }}</strong><span>推荐</span></p>
            <p class="driver-match-note">{{ profile.matchNote }}</p>
          </div>
        </section>

        <!-- ② 能干什么活：每项都是「数据 + 结论」，口径对齐发布货源时要填的字段 -->
        <section class="driver-card">
          <div class="driver-card-head">
            <h3>能干什么活</h3>
            <span>{{ driver.vehicle }} · {{ driver.load }}</span>
          </div>

          <ul class="ability">
            <li>
              <p class="ability-label">常跑线路</p>
              <p class="ability-value">
                <span class="ability-route">{{ routeEnds[0] }}<i aria-hidden="true">→</i>{{ routeEnds[1] }}</span>
                <b>{{ driver.trips }} 趟</b>
              </p>
              <p class="ability-note">{{ profile.routeNote }}</p>
            </li>
            <li>
              <p class="ability-label">车型与载重</p>
              <p class="ability-value"><span>{{ driver.vehicle }} · {{ driver.load }}</span></p>
              <p class="ability-note">{{ profile.vehicleNote }}</p>
            </li>
            <li>
              <p class="ability-label">实际承运过</p>
              <p class="ability-value ability-goods">
                <span v-for="goods in goodsList" :key="goods">{{ goods }}</span>
              </p>
              <p class="ability-note">{{ profile.goodsNote }}</p>
            </li>
          </ul>
        </section>

        <!-- ③ 跑得怎么样：与车队详情同一组指标，口径一致 -->
        <section class="driver-card">
          <div class="driver-card-head">
            <h3>跑得怎么样</h3>
            <span>平台记录</span>
          </div>
          <div class="driver-metrics">
            <div><strong>{{ stats.orders }}</strong><span>履约单</span></div>
            <div><strong>{{ stats.onTimeRate }}</strong><span>准时率</span></div>
            <div><strong>{{ stats.goodRate }}</strong><span>货主好评率</span></div>
          </div>
          <div class="driver-signals">
            <p :class="{ 'is-warn': stats.complaints !== '0' }">
              <i aria-hidden="true">·</i>有责投诉 <b>{{ stats.complaints }} 次</b>
            </p>
            <p :class="{ 'is-warn': stats.loss !== '0' }">
              <i aria-hidden="true">·</i>货损记录 <b>{{ stats.loss }} 次</b>
            </p>
          </div>
        </section>

        <!-- ④ 你和 TA：本平台独有，来源平台不知道货主与司机的重复合作 -->
        <section class="driver-card">
          <div class="driver-card-head">
            <h3>你和 TA</h3>
            <span>本平台记录</span>
          </div>
          <p v-if="driver.coop" class="driver-coop">
            <i aria-hidden="true">✓</i>你与 TA {{ driver.coop }}
          </p>
          <p class="driver-last">最近一次合作 {{ profile.lastCoop }}</p>
        </section>
      </main>
    </div>

    <div class="driver-actions">
      <button type="button" class="driver-follow" :aria-pressed="followed" @click="toggleFollow">
        <span aria-hidden="true">{{ followed ? '★' : '☆' }}</span>{{ followed ? '已加入' : '加为常用' }}
      </button>
      <button type="button" class="driver-publish" @click="emit('target-publish', driver)">定向发布货源</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { driverProfiles } from './mock-data.js'

// 以下「核验结果 / 承运记录 / 履约指标」均为原型 Mock：正式接入后由运力来源平台提供。
// 「你和 TA 的合作」为本平台独有数据。
const props = defineProps({ driver: { type: Object, required: true } })
const emit = defineEmits(['back', 'target-publish'])

const profile = computed(() => driverProfiles[props.driver.id] || {})
const stats = computed(() => profile.value.stats || {})

const followed = ref(false)
const followKey = computed(() => `zhiyun:driver-follow:${props.driver.id}`)
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

const routeEnds = computed(() => props.driver.route.split('→').map((part) => part.trim()))
const goodsList = computed(() => props.driver.goods.split('、'))
</script>

<style scoped>
.driver-detail{position:absolute;inset:0;z-index:100;overflow:hidden;background:#eff3fa;color:#252b3a;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif}
.driver-scroll{position:absolute;top:88px;bottom:76px;left:0;right:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
.driver-scroll::-webkit-scrollbar{display:none}
.driver-status{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.driver-status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.driver-status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}
.driver-nav{height:44px;display:flex;align-items:center;padding:0 12px}
.driver-back{width:32px;height:32px;display:grid;place-items:center;border:0;background:none;padding:0;cursor:pointer}
.driver-nav h1{flex:1;margin:0;font-size:17px;font-weight:600;text-align:center;color:#333}
.driver-nav-hold{width:32px}

/* 身份区：与车队详情同一套品牌蓝通栏，司机用头像替代企业名 */
.driver-hero{margin:0 0 10px;padding:16px 20px 20px;background:linear-gradient(158deg,#1c63ff 0%,#0f3fc4 100%);border-radius:0 0 22px 22px;color:#fff}
.driver-hero-main{display:flex;align-items:center;gap:13px}
.driver-avatar{width:56px;height:56px;flex:none;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.5)}
.driver-hero-text{min-width:0}
.driver-hero-name{margin:0;font-size:22px;line-height:29px;font-weight:700;letter-spacing:.2px}
.driver-verified{margin:5px 0 0;font-size:11px;color:rgba(255,255,255,.72)}
.driver-hero-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.2)}
.driver-match{display:flex;align-items:baseline;gap:7px;margin:0;flex:0 0 auto;white-space:nowrap}
.driver-match strong{font-size:36px;line-height:38px;font-weight:700;letter-spacing:-.5px}
.driver-match span{font-size:12px;color:rgba(255,255,255,.82);white-space:nowrap}
.driver-match-note{flex:1;min-width:0;margin:0;text-align:right;font-size:10px;line-height:15px;color:rgba(255,255,255,.6)}

.driver-body{padding:0 16px 20px}
.driver-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:10px}
.driver-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.driver-card-head h3{margin:0;font-size:16px;line-height:24px;font-weight:700;color:#1a2540}
.driver-card-head>span{font-size:10px;color:#9aa4b8}

/* 能干什么活：每项 = 数据行 +一句结论，结论用浅蓝底与数据区分 */
.ability{margin:16px 0 0;padding:0;list-style:none}
.ability li+li{margin-top:15px;padding-top:15px;border-top:1px solid #eef1f6}
.ability-label{margin:0;font-size:11px;color:#8a96ad}
.ability-value{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 0}
.ability-value>span{font-size:17px;font-weight:600;color:#1a2540}
.ability-route{display:inline-flex;align-items:center;gap:7px}
.ability-route i{font-size:13px;font-style:normal;font-weight:400;color:#9aa4b8}
.ability-value b{font-size:13px;font-weight:600;color:#165dff}
.ability-goods{justify-content:flex-start;flex-wrap:wrap;gap:6px}
.ability-goods span{padding:5px 11px;border-radius:6px;background:#eef3ff;color:#3f63b8;font-size:12px;font-weight:400}
.ability-note{margin:6px 0 0;padding:7px 10px;border-radius:7px;background:#f4f7fd;font-size:11px;line-height:16px;color:#5d6b85}

/* 跑得怎么样：与车队详情同为三列横排，异常项转橙红 */
.driver-metrics{display:grid;grid-template-columns:repeat(3,1fr);margin-top:14px}
.driver-metrics>div+div{border-left:1px solid #eef1f6;padding-left:14px}
.driver-metrics strong{display:block;font-size:20px;line-height:26px;font-weight:700;color:#1a2540}
.driver-metrics span{font-size:11px;color:#8a96ad}
.driver-signals{display:flex;gap:10px;margin-top:14px;padding-top:13px;border-top:1px solid #eef1f6}
.driver-signals p{display:flex;align-items:center;gap:5px;margin:0;font-size:11px;color:#8a96ad}
.driver-signals i{width:5px;height:5px;flex:none;border-radius:50%;background:#00b3a4;font-style:normal}
.driver-signals b{font-size:12px;font-weight:600;color:#3f4b63}
.driver-signals .is-warn i{background:#f5a623}
.driver-signals .is-warn b{color:#c47d09}

/* 你和 TA */
.driver-coop{display:flex;align-items:center;gap:7px;margin:14px 0 0;padding:9px 12px;border-radius:8px;background:#eef8f5;color:#0f7a6b;font-size:12px}
.driver-coop i{display:grid;place-items:center;width:15px;height:15px;flex:none;border-radius:50%;background:#00b3a4;color:#fff;font-size:10px;font-style:normal}
.driver-last{margin:9px 0 0;font-size:11px;color:#8a96ad}

.driver-actions{position:absolute;bottom:0;left:0;right:0;box-sizing:border-box;height:76px;display:flex;align-items:center;gap:14px;padding:0 20px;background:#fff;border-top:1px solid #e8edf7}
.driver-follow{width:60px;flex:none;border:0;background:none;padding:0;color:#5d6b85;font-size:11px;cursor:pointer}
.driver-follow span{display:block;font-size:24px;line-height:26px;color:#b6bfd0}
.driver-follow[aria-pressed='true']{color:#165dff}
.driver-follow[aria-pressed='true'] span{color:#165dff}
.driver-publish{flex:1;height:46px;border:0;border-radius:10px;background:#165dff;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
</style>
