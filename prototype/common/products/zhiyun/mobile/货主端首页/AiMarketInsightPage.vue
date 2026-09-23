<template>
  <section class="market-page" aria-label="常运线路行情">
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="nav-bar">
      <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1>常运线路行情</h1>
      <span class="nav-placeholder"></span>
    </header>

    <main class="market-content">
      <!-- 行情对象与比较条件：只说明当前分析对象，不重复小简判断 -->
      <section class="card market-context-card">
        <div class="context-label">常运线路行情</div>
        <div class="route-line"><h2>{{ data.route }}</h2><span class="info-tag">{{ data.goods }}</span></div>
        <p class="secondary">{{ data.vehicle }} · {{ data.unit }}</p>
        <div class="context-meta">
          <span class="context-basis"><i></i>比较条件已对齐</span>
          <span>更新于 {{ data.updatedAt }}</span>
        </div>
      </section>

      <!-- 小简分析 + 近30天价格走势：图表沿用设计稿“市价对标”卡样式 -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><span>小简分析</span></div>
          <span class="card-kicker">{{ data.trend.position }}</span>
        </div>
        <p class="conclusion">{{ data.analysis.conclusion }}</p>
        <p class="secondary">{{ data.analysis.detail }}</p>

        <div class="trend-card">
          <div class="trend-head">
            <span class="trend-badge">近30天成交价</span>
            <button type="button" class="trend-alert-btn" :class="{ on: hasAlert }" @click="openAlert">
              <template v-if="hasAlert">{{ alertPrice }} {{ data.unit }} · 改</template>
              <template v-else>设个提醒</template>
            </button>
          </div>
          <svg class="trend-chart" :viewBox="`0 0 ${trend.W} ${trend.H}`" role="img" aria-label="近30天同条件成交价走势">
            <defs>
              <linearGradient id="mkBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#598bff" />
                <stop offset="100%" stop-color="rgba(166,202,254,0.75)" />
              </linearGradient>
              <linearGradient id="mkBarMine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3d61e4" />
                <stop offset="100%" stop-color="rgba(147,179,255,0.8)" />
              </linearGradient>
            </defs>
            <!-- 提醒价虚线：货主主动设置的约定，不是价格预测 -->
            <line v-if="hasAlert" class="trend-alert-line" x1="4" :y1="trend.alertY" :x2="trend.W - 4" :y2="trend.alertY" />
            <g v-for="b in trend.bars" :key="b.date">
              <rect :class="['trend-bar', { mine: b.mine }]" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="3" />
              <text class="trend-bar-value" :x="b.cx" :y="b.y - 5">{{ b.price }}</text>
              <text class="trend-x" :x="b.cx" :y="trend.H - 4">{{ b.label }}</text>
            </g>
          </svg>
          <div class="trend-legend">
            <span class="legend-item"><i class="legend-bar mine"></i>你上次成交 {{ data.lastDeal.price }}</span>
            <span class="legend-item"><i class="legend-bar"></i>同条件成交参考</span>
          </div>
        </div>

        <div class="analysis-foot">
          <p class="basis">{{ data.analysis.note }}</p>
          <p class="footer-note">参考样本：{{ data.sample.count }}笔 {{ data.goods }} 同条件成交（{{ data.reference.period }}）· 来源：{{ data.sample.sources.join('、') }}</p>
        </div>
      </section>

      <!-- 直接给钱数：按你上次的货量算，比上次省多少 -->
      <section class="card">
        <h2 class="card-title">这次大概花多少</h2>
        <label class="input-row">
          <span>运输货量</span>
          <input v-model="quantity" inputmode="decimal" placeholder="请输入" aria-label="运输货量" />
          <b>吨</b>
        </label>
        <p v-if="qtyError" class="input-error" role="alert">{{ qtyError }}</p>
        <p v-else class="basis">默认按你上次这条线的货量 {{ data.lastDeal.quantity }} 吨，可调整。</p>

        <div class="calc-result">
          <div class="result-row"><span>沿用你上次单价 {{ data.lastDeal.price }}</span><b>{{ valid ? money(lastAmount) : '—' }}</b></div>
          <div class="result-row"><span>按当前参考 {{ data.reference.min }}–{{ data.reference.max }}</span><b>{{ valid ? `${money(nowMin)}–${money(nowMax)}` : '—' }}</b></div>
          <div class="result-diff">
            <span>预计少支出</span>
            <strong :class="{ accent: valid && saveMax > 0 }">{{ valid ? saveText : '—' }}</strong>
          </div>
        </div>
        <p class="basis">{{ data.calcNote }}</p>
      </section>

      <!-- 选发布平台：同批平台按该线路价格差异排序，价低者默认勾选 -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><span class="card-title-strong">选发布平台</span></div>
          <span class="card-kicker">已选 {{ selected.length }} 个</span>
        </div>
        <p class="basis">{{ data.platformNote }}</p>
        <ul class="platform-list">
          <li v-for="p in platforms" :key="p.id">
            <button type="button" class="platform-row" :class="{ active: selected.includes(p.id) }" @click="togglePlatform(p.id)">
              <span class="pf-check" :class="{ on: selected.includes(p.id) }" aria-hidden="true">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4.2L3.6 6.8L9 1.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="pf-main">
                <span class="pf-name">{{ p.name }}</span>
                <span class="pf-fleet">{{ p.fleet }}</span>
              </span>
              <span class="pf-price">{{ valid ? money(p.total) : '—' }}</span>
            </button>
          </li>
        </ul>
      </section>

    </main>

    <footer class="market-footer">
      <p class="footer-summary">
        {{ valid ? `${data.route} · ${quantityNum}吨 · 已选 ${selected.length} 个平台` : `${data.route} · 请修正货量后继续` }}
      </p>
      <div class="footer-actions">
        <button type="button" class="wait-button" @click="openAlert">想再等等</button>
        <button type="button" class="submit-button" :disabled="!valid || !selected.length" @click="prepare">我要发这条线</button>
      </div>
      <p class="footer-note-center">下一步补充装卸货时间等信息，不会直接发布</p>
    </footer>

    <!-- 价格提醒：由货主主动设置，虚线代表约定，不是价格预测 -->
    <div v-if="showAlert" class="overlay" @click.self="showAlert = false">
      <section class="sheet">
        <div class="sheet-head"><h2>{{ hasAlert ? '修改价格提醒' : '设置价格提醒' }}</h2><button type="button" aria-label="关闭" @click="showAlert = false">×</button></div>
        <p class="secondary">这条线跌到多少时提示你？设置后按该价格通知，不构成价格预测。</p>
        <label class="input-row sheet-input">
          <span>提醒价</span>
          <input v-model="alertPrice" inputmode="decimal" placeholder="请输入" aria-label="提醒价格" />
          <b>{{ data.unit }}</b>
        </label>
        <p class="basis">当前参考为 {{ data.reference.min }}–{{ data.reference.max }} {{ data.unit }}（{{ data.reference.period }}）。</p>
        <button type="button" class="sheet-close" :disabled="!(Number(alertPrice) > 0)" @click="confirmAlert">
          {{ hasAlert ? '保存修改' : '设置提醒' }}
        </button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { marketInsight as data } from './ai-home-data.js'

const emit = defineEmits(['back', 'open-conversation', 'prepare-cargo'])

/* 货量默认取货主上次这条线的实际货量，直接算出钱数，不再要求先填单价 */
const quantity = ref(String(data.lastDeal.quantity))
const showAlert = ref(false)
const alertPrice = ref('')
const hasAlert = ref(false)

const quantityNum = computed(() => Number(quantity.value))

/* 空值、非数字、非正数阻断测算与发布 */
const qtyError = computed(() => {
  const raw = quantity.value
  const value = Number(raw)
  if (!raw.trim()) return '请填写运输货量'
  if (!Number.isFinite(value)) return '运输货量请输入数字'
  if (value <= 0) return '运输货量需大于0'
  return ''
})
const valid = computed(() => !qtyError.value)
const qty = computed(() => (valid.value ? quantityNum.value : 0))

const money = (value) => `¥${Number(value.toFixed(2)).toLocaleString()}`

const lastAmount = computed(() => qty.value * data.lastDeal.price)
const nowMin = computed(() => qty.value * data.reference.min)
const nowMax = computed(() => qty.value * data.reference.max)
const saveMin = computed(() => lastAmount.value - nowMax.value)
const saveMax = computed(() => lastAmount.value - nowMin.value)
const saveText = computed(() =>
  saveMin.value === saveMax.value ? money(saveMin.value) : `${money(saveMin.value)}–${money(saveMax.value)}`,
)

const platforms = computed(() => data.platforms.map((p) => ({ ...p, total: qty.value * p.price })))
const selected = ref(data.platforms.filter((p) => p.recommended).map((p) => p.id))
function togglePlatform(id) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id]
}

/* 走势柱状图：沿用设计稿“市价对标”的蓝渐变柱 + 提醒价虚线 */
const trend = computed(() => {
  const pts = data.trend.points
  const prices = pts.map((p) => p.price)
  const alertNum = Number(alertPrice.value)
  const hasTrendAlert = hasAlert.value && Number.isFinite(alertNum) && alertNum > 0
  const rawHi = Math.max(...prices)
  const rawLo = Math.min(...prices, hasTrendAlert ? alertNum : prices[prices.length - 1])
  const span = rawHi - rawLo || Math.max(rawHi * 0.1, 1)
  /* 基线留出余量，最低价也要有可见柱高 */
  const top = rawHi + span * 0.15
  const bottom = rawLo - span * 0.35
  const W = 300
  const H = 104
  const padX = 14
  const padTop = 20
  const padBottom = 20
  const slot = (W - padX * 2) / pts.length
  const w = Math.min(slot * 0.52, 30)
  const y = (v) => padTop + ((top - v) / (top - bottom)) * (H - padTop - padBottom)
  const base = H - padBottom
  const labels = ['5/19', '5/26', '6/5', '6/12', '今天']
  return {
    W,
    H,
    alertY: hasTrendAlert ? y(alertNum) : 0,
    bars: pts.map((p, i) => {
      const cx = padX + slot * i + slot / 2
      return { ...p, cx, x: cx - w / 2, w, y: y(p.price), h: base - y(p.price), label: labels[i] || '' }
    }),
  }
})

function openAlert() {
  if (!alertPrice.value) alertPrice.value = String(data.trend.suggestAlert)
  showAlert.value = true
}
function confirmAlert() {
  if (!(Number(alertPrice.value) > 0)) return
  hasAlert.value = true
  showAlert.value = false
}

/** 把货主选中的平台与货量带进发布流程 */
function prepare() {
  if (!valid.value || !selected.value.length) return
  const picked = platforms.value.filter((p) => selected.value.includes(p.id))
  emit('prepare-cargo', {
    route: data.route,
    goods: data.goods,
    quantity: quantityNum.value,
    price: picked.length ? Math.min(...picked.map((p) => p.price)) : data.reference.max,
    platforms: picked.map((p) => ({ id: p.id, name: p.name, price: p.price, total: p.total })),
    platformIds: selected.value,
  })
}
</script>

<style scoped>
/* 版式与字号沿用二级页既有规范（AiPublishAdjustPage / AiHomePage / CargoSourcePage） */
.market-page{position:absolute;inset:0;background:#eff1f9;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.market-page *{box-sizing:border-box}
.market-page button,.market-page input{font-family:inherit;cursor:pointer}

.status-bar{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}

.nav-bar{height:44px;display:flex;align-items:center;padding:0 12px}
.back-button{width:32px;height:32px;border:0;background:none;display:flex;align-items:center;justify-content:center;padding:0}
.nav-placeholder{width:32px;height:32px}
.nav-bar h1{flex:1;margin:0;font-size:17px;font-weight:600;text-align:center;color:#333}

.market-content{position:absolute;top:88px;bottom:120px;left:0;right:0;overflow-y:auto;padding:4px 16px 16px;scrollbar-width:none}
.market-content::-webkit-scrollbar{display:none}

.card{background:#fff;border-radius:10px;padding:14px;margin-bottom:8px}
.card-title{margin:0 0 6px;font-size:15px;font-weight:700;color:#252b3a}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.card-author{display:flex;align-items:center;gap:5px;color:#666;font-size:11px}
.card-author img{width:22px;height:22px;object-fit:contain}
.card-title-strong{color:#252b3a;font-size:15px;font-weight:700}
.card-kicker{color:#8a96ad;font-size:10px}
.route-line{display:flex;align-items:center;gap:7px}
.route-line h2{margin:0;font-size:15px;line-height:20px;font-weight:600;color:#252b3a}
.info-tag{padding:2px 6px;border-radius:4px;background:#eaf2ff;color:#3974d8;font-size:10px;line-height:16px}
.conclusion{margin:0;font-size:14px;line-height:20px;font-weight:500;color:#333}
.secondary{margin:3px 0 0;color:#666;font-size:12px;line-height:19px}
.basis{margin:4px 0 0;color:#8a91a1;font-size:11px;line-height:17px}
.card-footer-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid #eef0f4}
.footer-note{color:#8a91a1;font-size:10px;line-height:15px}

.context-label{margin-bottom:5px;color:#3a65ff;font-size:11px;line-height:16px;font-weight:700}
.context-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #eef0f4;color:#a0a7b5;font-size:10px;line-height:15px}
.context-basis{display:inline-flex;align-items:center;gap:4px;color:#747c8c}
.context-basis i{width:6px;height:6px;border-radius:50%;background:#36c1ab}

/* 走势图柱状图卡：沿用设计稿“市价对标”的渐变底、蓝柱与虚线基准 */
.trend-card{margin-top:10px;padding:9px 8px 6px;border-radius:12px;background:linear-gradient(180deg,#eff2fc 0%,rgba(239,242,252,.2) 100%);border:1px solid #fff}
.trend-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.trend-badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:5px;background:linear-gradient(135deg,#3d61e4 0%,#93b3ff 100%);color:#fff;font-size:11px;font-weight:700}
.trend-alert-btn{display:inline-flex;align-items:center;height:20px;padding:0 8px;border:1px dashed #a9bce8;border-radius:10px;background:#fff;color:#5b76a8;font-size:10px;font-weight:600;white-space:nowrap}
.trend-alert-btn.on{border-style:solid;border-color:#3a65ff;background:rgba(58,101,255,.1);color:#3a65ff}
.trend-chart{display:block;width:100%;height:auto;margin-top:2px}
.trend-bar{fill:url(#mkBar)}
.trend-bar.mine{fill:url(#mkBarMine)}
.trend-bar-value{fill:#333;font-size:9.5px;font-weight:700;text-anchor:middle}
.trend-alert-line{stroke:#7c97f6;stroke-width:1.5;stroke-dasharray:6 4;stroke-linecap:round}
.trend-x{fill:#a2a8b4;font-size:9px;text-anchor:middle}
.trend-legend{display:flex;align-items:center;gap:14px;padding:0 2px 2px}
.legend-item{display:inline-flex;align-items:center;gap:5px;color:#666;font-size:10px}
.legend-bar{width:9px;height:9px;border-radius:2px;display:inline-block;background:linear-gradient(180deg,#598bff,rgba(166,202,254,.75))}
.legend-bar.mine{background:linear-gradient(180deg,#3d61e4,rgba(147,179,255,.8))}
.analysis-foot{margin-top:6px}

/* 输入与测算 */
.input-row{display:flex;align-items:center;gap:8px;height:44px;margin-bottom:8px;padding:0 12px;border:1px solid #e2e6ee;border-radius:8px;background:#fff}
.input-row>span{flex:0 0 84px;color:#333;font-size:14px}
.input-row input{flex:1;min-width:0;border:0;outline:0;background:none;color:#252b3a;font-size:15px;font-weight:600;text-align:right;cursor:text}
.input-row input::placeholder{color:#b6bcc8;font-weight:400}
.input-row>b{flex:0 0 auto;color:#747c8c;font-size:11px;font-weight:400}
.input-error{margin:0 0 8px;color:#d56b34;font-size:11px;font-weight:600}
.calc-result{background:#eef4ff;border-radius:7px;padding:10px 12px}
.result-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:3px 0;font-size:13px;color:#4a5263}
.result-row b{color:#252b3a;font-weight:500;white-space:nowrap}
.result-diff{display:flex;align-items:baseline;justify-content:space-between;margin-top:6px;padding-top:7px;border-top:1px solid #d8e3f6}
.result-diff span{color:#333;font-size:13px;font-weight:600}
.result-diff strong{color:#a2a8b4;font-size:19px;line-height:22px;font-weight:700;white-space:nowrap}
.result-diff strong.accent{color:#3a65ff}

/* 平台勾选行 */
.platform-list{list-style:none;margin:8px 0 0;padding:0}
.platform-list li + li{margin-top:7px}
.platform-row{width:100%;display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #e2e6ee;border-radius:8px;background:#fff;text-align:left}
.platform-row.active{border-color:#3a65ff;background:#f4f8ff}
.pf-check{flex:0 0 16px;width:16px;height:16px;border-radius:50%;border:1.5px solid #cbd3e0;background:#fff;display:inline-flex;align-items:center;justify-content:center}
.pf-check.on{border-color:#3a65ff;background:#3a65ff}
.pf-check svg{opacity:0}
.pf-check.on svg{opacity:1}
.pf-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.pf-name{color:#252b3a;font-size:14px;font-weight:600}
.pf-fleet{color:#8a91a1;font-size:10px;line-height:14px}
.pf-price{flex-shrink:0;color:#3a65ff;font-size:15px;font-weight:700;white-space:nowrap}

/* 底部操作栏：与调整页同一套 */
.market-footer{position:absolute;bottom:16px;left:0;right:0;padding:8px 12px 12px;background:#fff;box-shadow:0 -1px 0 #eef2f6}
.footer-summary{margin:0 0 8px;color:#747c8c;font-size:10px}
.footer-actions{display:flex;gap:8px}
.footer-actions button{height:44px;border-radius:8px;font-size:15px;font-weight:700}
.wait-button{width:104px;flex-shrink:0;border:1px solid #3a65ff;background:#fff;color:#3a65ff}
.submit-button{flex:1;border:0;background:#3a65ff;color:#fff}
.submit-button:disabled{background:#b9c4d9}
.footer-note-center{margin:7px 0 0;text-align:center;color:#9aa3b3;font-size:10px}

/* 弹层：与调整页同一套 */
.overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;background:rgba(0,0,0,.4)}
.sheet{width:100%;max-height:84%;overflow-y:auto;background:#fff;border-radius:12px 12px 0 0;padding:16px 16px 20px}
.sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.sheet h2{margin:0;font-size:16px;font-weight:700;color:#252b3a}
.sheet-head button{border:0;background:none;font-size:20px;line-height:1;color:#747c8c}
.sheet-input{margin-top:10px}
.sheet-close{width:100%;height:42px;margin-top:14px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}
.sheet-close:disabled{background:#b9c4d9}
</style>
