<template>
  <section class="risk-page" aria-label="货品安全进展">
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="nav-bar">
      <button type="button" class="back-button" aria-label="返回" @click="goBack">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1>货品安全进展</h1>
      <span class="nav-placeholder"></span>
    </header>

    <main class="risk-content">
      <section class="risk-status">
        <span class="risk-badge">{{ event.confirmation }}风险</span>
        <h2>{{ ownerFeedback ? '你已反馈现场核实结果，等待平台确认' : '货品安全核查中' }}</h2>
        <p>{{ event.needActionText }}</p>
        <p class="status-promise">平台核实有结果后将第一时间通知你</p>
      </section>

      <!-- 货主参与核实：反馈仅作为材料提供给平台，风险确认结论仍由平台出具 -->
      <section class="card owner-act-card">
        <p class="owner-act-title">你也可以参与核实</p>
        <div class="owner-act-actions">
          <button type="button" class="owner-act-btn" :disabled="ownerFeedback" @click="confirmDialog = true">
            {{ ownerFeedback ? '已反馈现场核实结果' : '我已现场核实货品正常' }}
          </button>
          <button type="button" class="owner-act-btn ghost" @click="expedite">申请平台加急复核</button>
        </div>
        <p class="owner-act-note">你的反馈会作为核查材料提供给平台；风险确认结论仍由平台出具。</p>
      </section>

      <!-- 小简分析：与首页卡头同一套写法（card-author + card-kicker） -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><span>小简分析</span></div>
          <span class="card-kicker">{{ event.analysisUpdatedAt }}更新</span>
        </div>
        <p class="conclusion">{{ event.analysis.conclusion }}</p>
        <div v-for="(point, index) in event.analysis.points" :key="point.title" class="evidence-item">
          <b>{{ index + 1 }}</b>
          <div><strong>{{ point.title }}</strong><p>{{ point.detail }}</p></div>
        </div>
        <div class="next-step">
          <strong>建议平台下一步</strong>
          <p>{{ event.analysis.nextStep }}</p>
        </div>
        <div class="card-footer-row">
          <button type="button" class="footer-link" @click="showEvidence = true">查看核对依据</button>
          <span class="footer-note">核查由平台继续跟进，无需你重复发起</span>
        </div>
      </section>

      <!-- 地图：提醒位置与车辆最新位置分开标记，附定位时间 -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><span>位置与轨迹</span></div>
          <span class="card-kicker">示意地图</span>
        </div>
        <template v-if="event.location.available">
          <div class="map-visual">
            <img src="/zhiyun-mobile-assets/map-embedded.png" alt="模拟地图" />
            <span class="map-line" aria-hidden="true"></span>
            <span class="map-pin event-pin">提醒位置</span>
            <span class="map-pin latest-pin">车辆最新位置</span>
          </div>
          <div class="card-footer-row">
            <span class="footer-note">定位更新 {{ event.location.updatedAt }}<em v-if="event.location.stale">（更新延迟）</em></span>
            <button type="button" class="footer-link" @click="showTrack = true">查看完整轨迹</button>
          </div>
        </template>
        <p v-else class="list-empty">暂无可用定位，平台未能获取该车辆位置，未生成实时车辆点。</p>
      </section>

      <!-- 关联运输：车牌用于识别事件车辆 -->
      <section class="card">
        <div class="route-line"><h2>{{ event.route }}</h2><span class="inline-goods">{{ event.goods }} · {{ event.weight }}</span></div>
        <p class="secondary">{{ event.driver }} · {{ event.plate }}</p>
        <div class="card-footer-row">
          <span class="footer-note">车牌用于识别本次事件车辆</span>
          <button type="button" class="cargo-action" @click="showWaybillGap = true">运单详情</button>
        </div>
      </section>

      <!-- 平台处理时间线：最新在前，标明来源 -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><span>平台处理进展</span></div>
          <span class="card-kicker">最新在前</span>
        </div>
        <ol class="timeline">
          <li v-for="item in timeline" :key="item.time" class="timeline-item">
            <time>{{ item.time }}</time>
            <i aria-hidden="true"></i>
            <div class="timeline-body">
              <strong>{{ item.title }}</strong>
              <p><em>{{ item.source }}</em> · {{ item.detail }}</p>
              <div v-if="item.photos" class="photos">
                <button v-for="(photo, index) in event.photos" :key="index" type="button" aria-label="查看照片" @click="photoIndex = index">
                  <img :src="photo" alt="现场照片（模拟）" />
                </button>
              </div>
            </div>
          </li>
        </ol>
        <p v-if="!event.photos.length" class="list-empty">该事件暂未取得现场材料，平台未上传照片。</p>
        <button v-if="event.photos.length" type="button" class="footer-link photo-entry" @click="photoIndex = 0">查看现场照片</button>
      </section>

    </main>

    <footer class="risk-footer">
      <button type="button" class="ask-button" @click="ask">问小简</button>
      <button type="button" class="submit-button" @click="contact">联系平台</button>
    </footer>

    <div v-if="notice" class="notice" role="status">{{ notice }}<button type="button" @click="notice = ''">×</button></div>

    <div v-if="confirmDialog" class="overlay" @click.self="confirmDialog = false">
      <section class="sheet">
        <div class="sheet-head"><h2>反馈现场核实结果</h2><button type="button" aria-label="关闭" @click="confirmDialog = false">×</button></div>
        <p>确认你已现场查看货品，外观无异常？</p>
        <p>该反馈将作为核查材料提供给平台，风险确认结论仍由平台核查出具。</p>
        <div class="result-actions">
          <button type="button" class="ask-button" @click="confirmDialog = false">再想想</button>
          <button type="button" class="submit-button" @click="submitFeedback">确认反馈</button>
        </div>
      </section>
    </div>

    <div v-if="showEvidence" class="overlay" @click.self="showEvidence = false">
      <section class="sheet">
        <h2>核对依据</h2>
        <div v-for="item in event.analysis.basis" :key="item.label" class="summary-row">
          <span>{{ item.label }}</span><b>{{ item.text }}</b>
        </div>
        <button type="button" class="sheet-close" @click="showEvidence = false">知道了</button>
      </section>
    </div>

    <div v-if="showTrack" class="overlay" @click.self="showTrack = false">
      <section class="sheet">
        <div class="sheet-head"><h2>完整轨迹</h2><button type="button" aria-label="关闭" @click="showTrack = false">×</button></div>
        <div class="track-visual"><img src="/zhiyun-mobile-assets/map-embedded.png" alt="模拟完整轨迹" /><span class="map-pin event-pin">提醒位置</span><span class="map-pin latest-pin">车辆最新位置</span></div>
        <p>{{ event.location.trackNote }}</p>
        <button type="button" class="sheet-close" @click="showTrack = false">返回安全进展</button>
      </section>
    </div>

    <div v-if="photoIndex !== null" class="photo-viewer" role="dialog" aria-label="现场照片">
      <button type="button" class="photo-close" aria-label="关闭" @click="photoIndex = null">×</button>
      <img :src="event.photos[photoIndex]" alt="现场照片（模拟）" @click.stop />
      <div class="photo-actions">
        <button v-for="(photo, index) in event.photos" :key="index" type="button" :class="{ active: photoIndex === index }" @click.stop="photoIndex = index">{{ index + 1 }}</button>
      </div>
    </div>

    <div v-if="showWaybillGap" class="overlay" @click.self="showWaybillGap = false">
      <section class="sheet">
        <h2>运单详情</h2>
        <div class="summary-row"><span>线路</span><b>{{ event.route }}</b></div>
        <div class="summary-row"><span>货品</span><b>{{ event.goods }} · {{ event.weight }}</b></div>
        <div class="summary-row"><span>司机车辆</span><b>{{ event.driver }} · {{ event.plate }}</b></div>
        <p class="gap-note">当前原型未建设可复用的运单详情页，以上为该事件关联运输的只读摘要。</p>
        <button type="button" class="sheet-close" @click="showWaybillGap = false">知道了</button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { riskEvent } from './ai-home-data.js'

const emit = defineEmits(['back', 'open-conversation'])
const event = riskEvent
const showEvidence = ref(false)
const showTrack = ref(false)
const showWaybillGap = ref(false)
const photoIndex = ref(null)
const notice = ref('')
const ownerFeedback = ref(false)
const confirmDialog = ref(false)
let noticeTimer

/* 时间线最新在前；货主反馈后插入一条记录，但不改变平台核查状态 */
const timeline = computed(() => {
  if (!ownerFeedback.value) return event.timeline
  return [
    { time: '11:02', title: '货主反馈现场核实结果', source: '货主', detail: '已现场查看货品，外观无异常。作为核查材料供平台参考。' },
    ...event.timeline,
  ]
})

function showNotice(text) {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => { notice.value = '' }, 4000)
}
function goBack() {
  emit('back')
}
function ask() {
  emit('open-conversation', { context: 'risk', from: 'risk' })
}
function contact() {
  showNotice(`联系平台：${event.contactPhone}（人工服务 9:00–18:00）· 原型不实际外呼`)
}
function expedite() {
  showNotice('已提交加急复核申请，平台将优先处理')
}
function submitFeedback() {
  ownerFeedback.value = true
  confirmDialog.value = false
  showNotice('已提交你的反馈，平台核查时会参考')
}
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<style scoped>
/* 版式与字号沿用二级页既有规范（AiPublishAdjustPage / AiHomePage / CargoSourcePage） */
.risk-page{position:absolute;inset:0;background:#eff1f9;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.risk-page *{box-sizing:border-box}
.risk-page button{font-family:inherit;cursor:pointer}

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

.risk-content{position:absolute;top:88px;bottom:84px;left:0;right:0;overflow-y:auto;padding:4px 16px 16px;scrollbar-width:none}
.risk-content::-webkit-scrollbar{display:none}

/* 状态区 */
.risk-status{padding:2px 2px 10px}
.risk-badge{display:inline-block;padding:2px 7px;border-radius:4px;background:#fff4e9;color:#a36122;font-size:10px;line-height:16px;font-weight:600}
.risk-status h2{margin:7px 0 0;font-size:16px;line-height:22px;font-weight:700;color:#1f2a3d}
.risk-status p{margin:2px 0 0;color:#747c8c;font-size:12px}
.status-promise{margin-top:4px!important;color:#3a65ff!important;font-weight:600}

/* 货主参与核实：反馈不等于风险确认 */
.owner-act-card{padding:12px 14px}
.owner-act-title{margin:0 0 8px;font-size:13px;font-weight:700;color:#252b3a}
.owner-act-actions{display:flex;gap:8px}
.owner-act-btn{flex:1;height:38px;border:1px solid #3a65ff;border-radius:8px;background:#3a65ff;color:#fff;font-size:13px;font-weight:600}
.owner-act-btn:disabled{border-color:#b9c4d9;background:#e8ecf4;color:#8a96ad}
.owner-act-btn.ghost{background:#fff;color:#3a65ff}
.owner-act-note{margin:7px 0 0;color:#8a91a1;font-size:10px;line-height:15px}

/* 卡片：与二级页 .card 同一套数值 */
.card{background:#fff;border-radius:10px;padding:14px;margin-bottom:8px}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.card-author{display:flex;align-items:center;gap:5px;color:#666;font-size:11px}
.card-author img{width:22px;height:22px;object-fit:contain}
.card-title-strong{color:#252b3a;font-size:15px;font-weight:700}
.card-kicker{color:#8a96ad;font-size:10px}
.conclusion{margin:0 0 2px;font-size:14px;line-height:20px;font-weight:500;color:#333}

.evidence-item{display:flex;gap:9px;margin-top:10px}
.evidence-item>b{width:18px;height:18px;flex-shrink:0;border-radius:50%;background:#eaf2ff;color:#3974d8;font-size:11px;font-weight:700;text-align:center;line-height:18px}
.evidence-item strong{font-size:13px;color:#252b3a}
.evidence-item p{margin:2px 0 0;color:#666;font-size:12px;line-height:19px}
.next-step{margin-top:10px;padding-top:9px;border-top:1px solid #eef2f6}
.next-step strong{display:block;color:#3a65ff;font-size:12px;font-weight:600}
.next-step p{margin:3px 0 0;color:#666;font-size:12px;line-height:19px}
.card-footer-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #eef0f4}
.card-footer-row:has(.footer-link){justify-content:flex-end}
.footer-link{border:0;background:none;color:#3a65ff;font-size:13px;font-weight:500;padding:0}
.footer-note{color:#8a91a1;font-size:10px}
.footer-note em{color:#d56b34;font-style:normal}

/* 位置与轨迹 */
.map-visual{position:relative;height:150px;border-radius:8px;overflow:hidden}
.map-visual img{width:100%;height:100%;object-fit:cover}
.map-line{position:absolute;left:24%;top:47%;width:48%;height:4px;border-radius:2px;background:#3a65ff;transform:rotate(-9deg)}
.map-pin{position:absolute;padding:2px 7px;border-radius:10px;font-size:10px;line-height:16px;font-weight:600;white-space:nowrap}
.event-pin{left:9%;top:26%;background:#fff;border:1.5px solid #f3a91b;color:#7a5210}
.latest-pin{right:7%;bottom:24%;background:#3a65ff;color:#fff}
.list-empty{margin:0;padding:16px 10px;border-radius:7px;background:#f4f5f9;color:#8a91a1;font-size:12px;text-align:center;line-height:19px}

/* 关联运输 */
.route-line{display:flex;align-items:center;gap:7px}
.route-line h2{margin:0;font-size:15px;line-height:20px;font-weight:600;color:#252b3a}
.inline-goods{font-size:11px;color:#666}
.secondary{margin:4px 0 0;color:#666;font-size:11px;line-height:17px}
.cargo-action{min-width:82px;height:30px;padding:0 12px;border:1px solid #d9dce3;border-radius:16px;background:#fff;color:#333;font-size:13px;font-weight:600}

/* 时间线 */
.timeline{list-style:none;margin:0;padding:0}
.timeline-item{position:relative;display:grid;grid-template-columns:38px 10px 1fr;gap:8px;padding:9px 0}
.timeline-item time{color:#8a91a1;font-size:11px;line-height:18px}
.timeline-item>i{position:relative;width:7px;height:7px;margin-top:5px;border-radius:50%;background:#3a65ff}
.timeline-item>i::after{content:'';position:absolute;left:3px;top:9px;width:1px;height:calc(100% + 26px);background:#e2e6ee}
.timeline-item:last-child>i::after{display:none}
.timeline-body strong{font-size:13px;color:#252b3a}
.timeline-body p{margin:2px 0 0;color:#8a91a1;font-size:11px;line-height:18px}
.timeline-body em{color:#3974d8;font-style:normal}
.photos{display:flex;gap:7px;margin-top:6px}
.photos button{padding:0;border:0;background:none}
.photos img{display:block;width:104px;height:62px;object-fit:cover;border-radius:6px}
.photo-entry{margin-top:8px}

/* 底部操作栏：与调整页 ask/submit 同一套 */
.risk-footer{position:absolute;bottom:16px;left:0;right:0;display:flex;gap:8px;padding:8px 12px 12px;background:#fff;box-shadow:0 -1px 0 #eef2f6}
.risk-footer button{height:44px;border-radius:8px;font-size:15px;font-weight:700}
.ask-button{width:96px;flex-shrink:0;border:1px solid #3a65ff;background:#fff;color:#3a65ff}
.submit-button{flex:1;border:0;background:#3a65ff;color:#fff}
.result-actions{display:flex;gap:8px;margin-top:14px}
.result-actions button{height:44px;border-radius:8px;font-size:15px;font-weight:700}

.notice{position:absolute;bottom:72px;left:24px;right:24px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(51,51,51,.92);color:#fff;font-size:12px;z-index:6}
.notice button{border:0;background:none;color:#fff;font-size:16px;line-height:1;padding:0}

/* 弹层：与调整页 overlay/sheet 同一套 */
.overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;background:rgba(0,0,0,.4)}
.sheet{width:100%;max-height:84%;overflow-y:auto;background:#fff;border-radius:12px 12px 0 0;padding:16px 16px 20px}
.sheet h2{margin:0 0 4px;font-size:16px;font-weight:700;color:#252b3a}
.sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.sheet-head h2{margin:0}
.sheet-head button{border:0;background:none;font-size:20px;line-height:1;color:#747c8c}
.sheet p{margin:6px 0 0;font-size:12px;color:#747c8c;line-height:19px}
.summary-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eef2f6;font-size:13px}
.summary-row:last-of-type{border-bottom:0}
.summary-row span{flex-shrink:0;color:#747c8c}
.summary-row b{font-weight:700;color:#252b3a;text-align:right}
.gap-note{margin:10px 0 0;padding:10px;border-radius:7px;background:#f4f5f9;color:#747c8c;font-size:11px;line-height:18px}
.sheet-close{width:100%;height:42px;margin-top:14px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}
.track-visual{position:relative;height:210px;margin-top:8px;border-radius:8px;overflow:hidden}
.track-visual img{width:100%;height:100%;object-fit:cover}

/* 照片查看 */
.photo-viewer{position:absolute;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.88)}
.photo-close{position:absolute;right:16px;top:48px;border:0;background:none;color:#fff;font-size:24px;line-height:1}
.photo-viewer img{max-width:92%;max-height:66%;object-fit:contain;border-radius:6px}
.photo-actions{display:flex;gap:8px;margin-top:18px}
.photo-actions button{width:30px;height:30px;border:1px solid rgba(255,255,255,.45);border-radius:50%;background:none;color:#fff;font-size:12px}
.photo-actions button.active{background:#3a65ff;border-color:#3a65ff}
</style>
