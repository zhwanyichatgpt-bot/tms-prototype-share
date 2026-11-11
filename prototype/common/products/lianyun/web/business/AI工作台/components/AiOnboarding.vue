<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import mascotPoses from '../../托运单管理/详情/assets/xiaojian-inspector-poses.png'
import AiGuideSpotlight from './AiGuideSpotlight.vue'

const props = defineProps({ workspace: { type: Object, required: true } })
const emit = defineEmits(['close', 'complete', 'learn'])

const stops = [
  { target: '.ai-sidebar', title: '左侧导航', text: '在这里开新对话，也能找回历史对话、查看知识库和专家与技能。', pose: '334 96 334 384' },
  { target: '.ai-capability-panel', title: '推荐能力', text: '这里放的是推荐给你的能力。看到适合的可以直接用，也可以点「全部能力」继续找。', pose: '1338 497 334 384' },
  { target: '.ai-view-home .ai-composer', title: '向至小简提问', text: '有需求就直接告诉我。也可以在这里添加资料、引用知识或选择能力。', pose: '350 493 334 384' },
  { target: '.ai-results-panel', title: '工作成果', text: '做完的报告、方案等会出现在这里，下次回来还能找到。', pose: '1014 497 334 384' },
]
const index = ref(0)
const stop = computed(() => {
  const current = stops[index.value]
  return current ? { ...current, label: `认识工作台 · ${index.value + 1} / ${stops.length}` } : null
})
const finished = computed(() => index.value === stops.length)
const firstTopic = ref(null)

watch(finished, async complete => {
  if (!complete) return
  await nextTick()
  firstTopic.value?.focus({ preventScroll: true })
})

function next() {
  index.value += 1
  if (finished.value) emit('complete')
}
</script>

<template>
  <section v-if="finished" class="ai-guide-invitation" aria-label="新手导览">
    <svg class="ai-guide-inline-mascot" viewBox="1014 497 334 384" role="img" aria-label="至小简">
      <image :href="mascotPoses" width="1672" height="941" preserveAspectRatio="none" />
    </svg>
    <div>
      <h2>接下来想了解什么？</h2>
      <p>选一个方向继续了解，也可以留在首页自己逛逛。</p>
      <div class="ai-guide-inline-actions">
        <button ref="firstTopic" type="button" class="ai-guide-topic" @click="emit('learn', '技能')">学习使用技能</button>
        <button type="button" class="ai-guide-topic" @click="emit('learn', '专家')">了解专家</button>
        <button type="button" class="ai-guide-topic" @click="emit('learn', '知识库')">了解知识库</button>
        <button type="button" class="ai-guide-text-button" @click="emit('close')">先自己逛逛</button>
      </div>
    </div>
  </section>
  <AiGuideSpotlight
    v-if="stop"
    :workspace="props.workspace"
    :step="stop"
    :primary-label="index === stops.length - 1 ? '完成导览' : '下一步'"
    :can-go-back="index > 0"
    @close="emit('close')"
    @back="index -= 1"
    @continue="next"
  />
</template>

<style scoped>
.ai-guide-invitation{display:flex;align-items:center;gap:14px;margin-top:14px;padding:10px 16px;border:1px solid #e0e8fb;border-radius:12px;background:linear-gradient(105deg,#f0f5ff,#fbfcff)}
.ai-guide-inline-mascot{width:54px;height:62px;flex:none;filter:drop-shadow(0 3px 4px #283d7030)}
.ai-guide-invitation h2{font-size:15px;font-weight:600;color:#253762}
.ai-guide-invitation p{margin-top:2px;color:#52627f;font-size:13px}
.ai-guide-inline-actions{display:flex;gap:8px;margin-top:7px}
.ai-guide-inline-actions button{padding:4px 9px;border:1px solid transparent;border-radius:6px;font-size:12px;line-height:18px;white-space:nowrap}
.ai-guide-inline-actions .ai-guide-topic{border-color:#cddafa;background:#fff;color:#3655bb}
.ai-guide-topic:hover{background:#edf2ff}
.ai-guide-text-button{background:none;color:#52627f}
.ai-guide-text-button:hover{background:#edf2ff}
.ai-guide-primary{background:#3d60ed;color:#fff}
.ai-guide-primary:hover{background:#2d4fd4}
</style>
