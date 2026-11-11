<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({ updates: { type: Array, required: true }, signInStatus: Object })
const emit = defineEmits(['close', 'explore', 'sign-in'])
const activeIndex = ref(0)
const activeUpdate = computed(() => props.updates[activeIndex.value])
const grouped = computed(() => props.updates.length > 1)
let swipeStart = null

function goTo(index) {
  activeIndex.value = Math.max(0, Math.min(index, props.updates.length - 1))
}

watch(() => props.updates.map(update => update.id), (ids, oldIds) => {
  const current = ids.indexOf(oldIds[activeIndex.value])
  goTo(current === -1 ? activeIndex.value : current)
})

function startSwipe(event) {
  if (!grouped.value || !event.isPrimary || event.button !== 0) return
  swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function finishSwipe(event) {
  if (swipeStart?.id !== event.pointerId) return
  const dx = event.clientX - swipeStart.x
  const dy = event.clientY - swipeStart.y
  swipeStart = null
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    goTo(activeIndex.value + (dx < 0 ? 1 : -1))
  }
}

function switchWithKeyboard(event) {
  if (!grouped.value || event.target.tagName === 'SELECT') return
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  goTo(activeIndex.value + (event.key === 'ArrowRight' ? 1 : -1))
}
</script>

<template>
  <section class="zx-update-notice" aria-label="至小简提示" @keydown="switchWithKeyboard">
    <button class="zx-update-close" type="button" aria-label="关闭至小简提示" @click="emit('close')">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
    </button>

    <div
      class="zx-update-viewport"
      :class="{ 'can-swipe': grouped }"
      @pointerdown="startSwipe"
      @pointerup="finishSwipe"
      @pointercancel="swipeStart = null"
      @lostpointercapture="swipeStart = null"
    >
      <div class="zx-update-track" :style="{ transform: 'translateX(' + (-100 * activeIndex) + '%)' }" aria-live="polite">
        <article
          v-for="(update, index) in updates"
          :key="update.id"
          class="zx-update-item"
          :inert="index !== activeIndex"
          :aria-hidden="index !== activeIndex ? 'true' : undefined"
        >
          <h3 :title="update.title">{{ update.title }}</h3>
          <p :title="update.text">{{ update.text }}</p>
        </article>
      </div>
    </div>

    <footer class="zx-update-footer">
      <nav v-if="grouped" class="zx-update-controls" aria-label="切换功能更新">
        <div v-if="updates.length <= 5" class="zx-update-dots">
          <button
            v-for="(update, index) in updates"
            :key="update.id"
            type="button"
            :aria-label="'第 ' + (index + 1) + ' 条，' + update.title"
            :aria-current="index === activeIndex ? 'true' : undefined"
            @click="goTo(index)"
          ><span /></button>
        </div>
        <template v-else>
          <button type="button" class="zx-update-arrow" aria-label="上一条更新" :disabled="activeIndex === 0" @click="goTo(activeIndex - 1)">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 4-4 4 4 4" /></svg>
          </button>
          <label class="zx-update-jump">
            <span aria-hidden="true">{{ activeIndex + 1 }} / {{ updates.length }}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
            <select aria-label="跳转到指定更新" :value="activeIndex" @change="goTo(Number($event.target.value))">
              <option v-for="(update, index) in updates" :key="update.id" :value="index">{{ index + 1 }}. {{ update.title }}</option>
            </select>
          </label>
          <button type="button" class="zx-update-arrow" aria-label="下一条更新" :disabled="activeIndex === updates.length - 1" @click="goTo(activeIndex + 1)">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg>
          </button>
        </template>
      </nav>
      <template v-if="signInStatus && activeUpdate?.activityTarget !== 'sign-in'">
        <span v-if="signInStatus.signed" class="zx-update-sign-in is-signed">今日已签到</span>
        <button v-else type="button" class="zx-update-sign-in" @click="emit('sign-in')">
          签到 +{{ signInStatus.points }}
        </button>
      </template>
      <button v-if="activeUpdate" type="button" class="zx-update-action" @click="emit('explore', activeUpdate)">
        {{ activeUpdate.action || '了解能力' }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.zx-update-notice {
  position: absolute;
  right: 0;
  bottom: 108px;
  box-sizing: border-box;
  width: min(252px, calc(100vw - 48px));
  height: 112px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e3e6ed;
  border-radius: 12px;
  box-shadow: 0 4px 16px #25375515;
  color: #1c2230;
}
.zx-update-close {
  position: absolute;
  z-index: 1;
  top: 5px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}
.zx-update-close:hover, .zx-update-arrow:hover:not(:disabled) { background: #f2f4f8; }
.zx-update-notice svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.zx-update-viewport { flex: 1; min-height: 0; overflow: hidden; }
.zx-update-viewport.can-swipe { touch-action: pan-y; user-select: none; cursor: grab; }
.zx-update-viewport.can-swipe:active { cursor: grabbing; }
.zx-update-track { display: flex; transition: transform 220ms ease; }
.zx-update-item { box-sizing: border-box; flex: 0 0 100%; min-width: 0; padding: 11px 11px 3px; }
.zx-update-item h3 {
  margin: 0;
  padding-right: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}
.zx-update-item p {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 2px 0 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: #606873;
  font-size: 12px;
  line-height: 17px;
}
.zx-update-footer { display: flex; align-items: flex-end; gap: 6px; padding: 2px 10px 9px; }
.zx-update-action {
  margin-left: auto;
  flex: none;
  padding: 3px 9px;
  border: 0;
  border-radius: 6px;
  background: #222630;
  color: #fff;
  font: inherit;
  font-size: 11px;
  line-height: 18px;
  cursor: pointer;
}
.zx-update-action:hover { background: #383d48; }
.zx-update-sign-in {
  flex: none;
  padding: 3px 6px;
  border: 0;
  border-radius: 6px;
  background: #edf1ff;
  color: #3349b2;
  font: inherit;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}
button.zx-update-sign-in { cursor: pointer; }
button.zx-update-sign-in:hover { background: #e1e7ff; }
.zx-update-sign-in.is-signed { background: #edf6ef; color: #306443; }
.zx-update-controls, .zx-update-dots { display: flex; align-items: center; }
.zx-update-dots button {
  display: grid;
  place-items: center;
  width: 16px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}
.zx-update-dots span { width: 4px; height: 4px; border-radius: 4px; background: #ccd3de; }
.zx-update-dots [aria-current="true"] span { width: 11px; background: #4359cd; }
.zx-update-arrow, .zx-update-jump {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #515d73;
}
.zx-update-arrow { width: 22px; padding: 0; cursor: pointer; }
.zx-update-arrow:disabled { color: #b1b9c7; cursor: default; }
.zx-update-jump { position: relative; gap: 2px; padding: 0 3px; font-size: 11px; font-variant-numeric: tabular-nums; }
.zx-update-jump select { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
.zx-update-jump:focus-within, button:focus-visible { outline: 2px solid #5266d7; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) {
  .zx-update-track { transition: none; }
}
</style>
