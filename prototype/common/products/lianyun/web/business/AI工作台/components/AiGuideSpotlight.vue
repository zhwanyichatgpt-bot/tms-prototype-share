<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import mascotPoses from '../../托运单管理/详情/assets/xiaojian-inspector-poses.png'
import AiIcon from './AiIcon.vue'

const props = defineProps({
  workspace: { type: Object, required: true },
  step: { type: Object, required: true },
  primaryLabel: { type: String, required: true },
  canGoBack: Boolean,
})
const emit = defineEmits(['close', 'back', 'continue'])
const titleId = useId()
const descriptionId = useId()
const dialog = ref(null)
const card = ref(null)
const primary = ref(null)
const spotlight = ref(null)
const position = ref(null)
let frameId

const clamp = (value, min, max) => Math.max(min, Math.min(value, max))
function placeCard() {
  if (!card.value) return
  const target = props.workspace.querySelector(props.step.target)
  if (!target) {
    spotlight.value = null
    position.value = null
    return
  }
  const rect = target.getBoundingClientRect()
  const width = document.documentElement.clientWidth
  const height = document.documentElement.clientHeight
  const edge = 16
  const gap = 20
  const left = clamp(rect.left - 4, 4, width - 4)
  const right = clamp(rect.right + 4, left, width - 4)
  const top = clamp(rect.top - 4, 4, height - 4)
  const bottom = clamp(rect.bottom + 4, top, height - 4)
  spotlight.value = { left: left + 'px', top: top + 'px', width: right - left + 'px', height: bottom - top + 'px' }

  const { width: cardWidth, height: cardHeight } = card.value.getBoundingClientRect()
  const centerX = clamp((left + right - cardWidth) / 2, edge, width - cardWidth - edge)
  const centerY = clamp((top + bottom - cardHeight) / 2, edge, height - cardHeight - edge)
  const choices = [
    [right + gap, centerY], [left - cardWidth - gap, centerY],
    [centerX, bottom + gap], [centerX, top - cardHeight - gap],
  ]
  const fit = choices.find(([x, y]) => x >= edge && y >= edge && x + cardWidth <= width - edge && y + cardHeight <= height - edge)
  position.value = fit ? { left: fit[0] + 'px', top: fit[1] + 'px' } : { left: centerX + 'px', top: centerY + 'px' }
}

function schedulePlacement() {
  cancelAnimationFrame(frameId)
  frameId = requestAnimationFrame(placeCard)
}

async function focusStep() {
  await nextTick()
  if (!dialog.value) return
  props.workspace.querySelector(props.step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  placeCard()
  primary.value?.focus({ preventScroll: true })
}

watch(() => props.step.target, focusStep)
onMounted(() => {
  dialog.value.showModal()
  focusStep()
  window.addEventListener('resize', schedulePlacement)
  window.addEventListener('scroll', schedulePlacement, true)
})

onBeforeUnmount(() => {
  dialog.value?.close()
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', schedulePlacement)
  window.removeEventListener('scroll', schedulePlacement, true)
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="ai-onboarding" :aria-labelledby="titleId" :aria-describedby="descriptionId" @cancel.prevent="emit('close')">
      <div v-if="spotlight" class="ai-guide-spotlight" :style="spotlight" aria-hidden="true"></div>
      <div v-else class="ai-guide-shade" aria-hidden="true"></div>
      <section ref="card" class="ai-guide-card" :class="{ 'is-positioned': position }" :style="position">
        <button class="ai-guide-close" type="button" aria-label="关闭导览" @click="emit('close')"><AiIcon name="close" :size="18" /></button>
        <div class="ai-guide-mascot">
          <svg :viewBox="step.pose || '1338 497 334 384'" role="img" aria-label="至小简">
            <image :href="mascotPoses" width="1672" height="941" preserveAspectRatio="none" />
          </svg>
        </div>
        <div class="ai-guide-content" aria-live="polite">
          <span class="ai-guide-kicker">{{ step.label }}</span>
          <h2 :id="titleId">{{ step.title }}</h2>
          <p :id="descriptionId">{{ step.text }}</p>
        </div>
        <footer class="ai-guide-actions">
          <button class="ai-guide-text-button" type="button" @click="emit('close')">跳过导览</button>
          <div>
            <button v-if="canGoBack" type="button" class="ai-guide-back" @click="emit('back')">上一步</button>
            <button ref="primary" type="button" class="ai-guide-primary" autofocus @click="emit('continue')">{{ primaryLabel }}</button>
          </div>
        </footer>
      </section>
    </dialog>
  </Teleport>
</template>

<style scoped>
.ai-onboarding{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:hidden;font:14px/1.6 'PingFang SC','Microsoft YaHei',sans-serif;color:#172344}
.ai-onboarding::backdrop{background:transparent}
.ai-guide-shade{position:absolute;inset:0;background:#15213c59}
.ai-guide-spotlight{position:absolute;border-radius:14px;box-shadow:0 0 0 2px #7d9aff,0 0 0 200vmax #15213c85;pointer-events:none}
.ai-guide-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(344px,calc(100% - 32px));padding:22px;box-sizing:border-box;border:1px solid #dce5fa;border-radius:18px;background:#fff;box-shadow:0 18px 54px #17284c40}
.ai-guide-card.is-positioned{transform:none}
.ai-guide-mascot{float:left;width:58px;height:66px;margin:0 12px 0 0;display:grid;place-items:center;background:#edf3ff;border-radius:14px}
.ai-guide-mascot svg{width:48px;height:55px;filter:drop-shadow(0 3px 4px #283d7030)}
.ai-guide-content{min-width:0}
.ai-guide-kicker{display:block;color:#4263ce;font-size:12px;font-weight:600}
.ai-guide-content h2{margin:1px 20px 0 0;font-size:20px;line-height:1.4;font-weight:650}
.ai-guide-content p{margin:16px 0 0;clear:both;color:#52627f;font-size:14px;line-height:1.65}
.ai-guide-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:18px}
.ai-guide-actions>div{display:flex;align-items:center;gap:8px}
.ai-guide-card button{font:inherit;cursor:pointer}
.ai-guide-close,.ai-guide-text-button{border:0;background:none;color:#52627f}
.ai-guide-close{position:absolute;top:10px;right:10px;width:32px;height:32px;display:grid;place-items:center;border-radius:8px}
.ai-guide-close:hover,.ai-guide-text-button:hover{background:#edf2ff}
.ai-guide-actions button{padding:6px 10px;border-radius:7px;font-size:13px;white-space:nowrap}
.ai-guide-primary{border:1px solid #3d60ed;background:#3d60ed;color:#fff}
.ai-guide-primary:hover{background:#2d4fd4}
.ai-guide-back{border:1px solid #dce5fa;background:#fff;color:#354775}
.ai-guide-card button:focus-visible{outline:2px solid #486df4;outline-offset:2px}
</style>
