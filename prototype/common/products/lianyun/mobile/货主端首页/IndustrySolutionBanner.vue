<template>
  <div class="industry-banner" :class="{'ib-compact':compact}" role="region" aria-roledescription="轮播" aria-label="行业解决方案">
    <VanSwipe ref="swipe" :show-indicators="false" :loop="true" :duration="reducedMotion ? 0 : 260" @change="activeIndex=$event">
      <VanSwipeItem v-for="(solution,index) in industrySolutions" :key="solution.id">
        <article class="ib-card" role="group" aria-roledescription="幻灯片" :aria-label="`${index+1} / ${industrySolutions.length}：${solution.kicker}`" :inert="index!==activeIndex">
          <p class="ib-kicker">{{ solution.kicker }}</p>
          <h2 class="ib-title">{{ solution.title }}</h2>
          <p class="ib-subtitle">{{ solution.sub }}</p>
          <div v-if="!compact" class="ib-tags"><span v-for="tag in solution.tags" :key="tag">{{ tag }}</span></div>
          <div v-if="!compact" class="ib-capabilities">
            <div v-for="feature in solution.features" :key="feature[1]" class="ib-capability">
              <TransportIcon v-if="['train','truck','ship'].includes(feature[0])" :mode="feature[0]==='train'?'rail':feature[0]==='ship'?'water':'road'"/>
              <VanIcon v-else :name="feature[0]==='people'?'friends-o':feature[0]==='warehouse'?'shop-o':'bag-o'" aria-hidden="true"/>
              <strong>{{ feature[1] }}</strong><span>{{ feature[2] }}</span>
            </div>
          </div>
          <div class="ib-bottom"><p v-if="!compact" class="ib-scope"><strong>{{ solution.scope }}</strong><span>{{ solution.scopeText }}</span></p><button class="ib-cta" @click="$emit('solution',solution)">{{ solution.cta }}<VanIcon name="arrow" aria-hidden="true"/></button></div>
        </article>
      </VanSwipeItem>
    </VanSwipe>
    <div class="ib-controls">
      <div class="ib-indicators"><button v-for="(solution,index) in industrySolutions" :key="solution.id" :aria-label="`查看第${index+1}张：${solution.kicker}`" :aria-pressed="index===activeIndex" @click="swipe?.swipeTo(index)"><span/></button></div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Icon as VanIcon, Swipe as VanSwipe, SwipeItem as VanSwipeItem } from 'vant'
import TransportIcon from './TransportIcon.vue'
import { industrySolutions } from './industry-solutions.js'

defineProps({compact:Boolean})
defineEmits(['solution'])
const swipe=ref(null), activeIndex=ref(0), reducedMotion=ref(false)
let motionPreference
function syncMotionPreference(){reducedMotion.value=motionPreference.matches}
onMounted(()=>{motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');syncMotionPreference();motionPreference.addEventListener('change',syncMotionPreference)})
onBeforeUnmount(()=>motionPreference?.removeEventListener('change',syncMotionPreference))
</script>

<style scoped>
.industry-banner.ib-compact .ib-card{min-height:138px;padding:12px 14px}
.industry-banner.ib-compact .ib-title{font-size:17px;line-height:24px}
.industry-banner.ib-compact .ib-subtitle{font-size:12px;line-height:18px;margin-bottom:0}
.industry-banner.ib-compact .ib-bottom{position:absolute;right:12px;bottom:12px;padding:0}
.industry-banner.ib-compact .ib-cta{min-height:36px;padding:6px 9px;font-size:11px}
.industry-banner.ib-compact .ib-note{margin-top:10px;padding-right:100px;font-size:10px}
.industry-banner.ib-compact .ib-controls{margin-top:0}
.industry-banner.ib-compact .ib-indicators button{min-height:28px}

.industry-banner{color:#173969}
.ib-card{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;height:100%;min-height:324px;padding:16px;border:1px solid #d5e4fa;border-radius:12px;background:linear-gradient(120deg,#ecf4ff,#edf6ff 55%,#dceaff);display:flex;flex-direction:column}
.ib-card::before{content:'';position:absolute;z-index:-1;top:0;right:-20px;width:60%;height:116px;background:url('/lianyun-mobile-assets/home-banner-v1.png') right center/auto 116px no-repeat;opacity:.22;mask-image:linear-gradient(to right,transparent,#000)}
.industry-banner .ib-kicker{margin:0 0 5px;font-size:11px;font-weight:600;letter-spacing:.06em;color:#315c91}
.industry-banner .ib-title{margin:0 0 5px;font-size:21px;font-weight:700;line-height:1.4;letter-spacing:-.03em;color:#173969}
.ib-subtitle{min-height:36px;margin:0;font-size:12px;line-height:1.5;color:#3e587c}
.ib-tags{display:flex;flex-wrap:wrap;gap:5px;margin:11px 0}
.ib-tags span{font-size:11px;line-height:1.5;border:1px solid #bed1ef;background:#ffffff9c;padding:3px 6px;border-radius:4px;color:#315381}
.ib-capabilities{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;background:#ffffffb0;border-radius:8px;padding:10px 6px}
.ib-capability{min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;font-size:11px;line-height:1.5;color:#3e587c}
.ib-capability:not(:last-child){border-right:1px solid #d6e2f2}
.industry-banner .ib-capability strong{font-size:14px;font-weight:600;color:#1d4b88}
.ib-capability svg,.ib-capability :deep(.van-icon){width:20px;height:20px;font-size:20px;color:#2e65d2;margin-bottom:3px}
.ib-bottom{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:10px}
.ib-scope{min-width:0;margin:0;font-size:11px;line-height:1.6;color:#3e587c}
.industry-banner .ib-scope strong{display:block;font-weight:600;color:#3e587c}
.industry-banner .ib-cta{background:var(--ly-brand,#3157ee);color:white;border-radius:7px;min-height:44px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 11px;white-space:nowrap}
.ib-cta :deep(.van-icon){font-size:14px}
.ib-note{font-size:10px;color:#526789;margin:8px 0 0;line-height:1.5}
.ib-controls{display:flex;align-items:center;justify-content:center;margin-top:8px}
.ib-indicators{display:flex;justify-content:center;flex:1;min-width:0}
.industry-banner .ib-indicators button{min-height:44px;min-width:0;width:44px;display:flex;justify-content:center;align-items:center;padding:0}
.ib-indicators span{width:6px;height:6px;border-radius:4px;background:#a7b4cc;transition:width .16s,background-color .16s}
.ib-indicators [aria-pressed='true'] span{width:18px;background:var(--ly-brand,#3157ee)}
.industry-banner button:focus-visible{outline:3px solid #2452d6;outline-offset:2px}
.industry-banner button:active{filter:brightness(.94)}
.industry-banner :deep(.van-swipe__track){align-items:stretch}
.industry-banner :deep(.van-swipe-item){height:auto}
:global(.ly-industry-catalog-action){margin-top:10px}
@media(prefers-reduced-motion:reduce){.ib-indicators span{transition:none}}
</style>
