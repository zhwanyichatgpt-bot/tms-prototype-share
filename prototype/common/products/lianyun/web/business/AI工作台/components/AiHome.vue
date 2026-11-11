<script setup>
import { computed, ref } from 'vue'
import { ElDialog } from 'element-plus'
import { asset } from '../mock-data.js'
import { skills } from '../skill-data.js'

const props = defineProps({ results: { type: Array, default: () => [] }, promotion: Object, suggestions: { type: Array, default: () => [] } })
const emit = defineEmits(['skill', 'run', 'catalog', 'promotion', 'suggestion'])
const featured = [
  { id: 'settlement-recon', summary: '按货主和计划汇总运单，核对后创建结算单' },
  { id: 'documents', summary: '分析托运单、运单，生成业务报告' },
  { id: 'transport-team', summary: '设计物流指标，拆解成本与库存周转' },
].map(card => ({ ...skills.find(skill => skill.id === card.id), ...card }))
const showAll = ref(false)
const visibleSuggestions = computed(() => props.suggestions.filter(item => !item.completed).slice(0, 3))
function openSuggestion(item) { showAll.value = false; emit('suggestion', item.id) }
</script>
<template>
  <section class="ai-home ai-home-v2">
    <div class="ai-welcome"><h1>Hi , 我是你的AI助手至小简</h1><p>查业务、分析单据、获取专业建议</p></div>
    <slot name="onboarding" />
    <section v-if="promotion" class="ai-home-promotion" aria-label="推荐积分活动">
      <img :src="asset('assistant-avatar.svg')" alt="" />
      <div class="ai-promotion-copy">
        <span>成长任务</span>
        <h2>分析一张托运单，领 {{ promotion.points }} 积分</h2>
      </div>
      <button type="button" class="ai-promotion-action" @click="emit('promotion')">
        {{ promotion.status === '待领取' ? '领取奖励' : '去完成' }}
      </button>
    </section>
    <div class="ai-discovery-v2">
      <section class="ai-capability-panel">
        <header>
          <h2>推荐能力</h2>
          <button class="ai-panel-link" @click="emit('catalog', 'skills')">全部能力</button>
        </header>
        <div class="ai-capability-list">
          <button v-for="skill in featured" :key="skill.id" class="ai-capability-card" @click="emit('skill', skill.id)">
            <img :src="asset(skill.icon)" alt="" />
            <div>
              <h3>{{ skill.name }}</h3>
              <p>{{ skill.summary }}</p>
            </div>
          </button>
        </div>
      </section>
      <section class="ai-results-panel ai-suggestions-panel" aria-label="建议办理">
        <header>
          <h2>建议办理</h2>
          <button class="ai-panel-link" @click="showAll=true">全部建议</button>
        </header>
        <div class="ai-suggestion-list">
          <article v-for="item in visibleSuggestions" :key="item.id" class="ai-suggestion-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <footer><span>{{ item.scope }}</span><button class="ai-suggestion-action" @click="openSuggestion(item)">{{ item.action }}</button></footer>
          </article>
          <div v-if="!visibleSuggestions.length" class="ai-suggestion-empty">暂无需要优先办理的事项<button @click="showAll=true">查看全部建议与办理结果</button></div>
        </div>
      </section>
    </div>
    <ElDialog v-model="showAll" title="全部办理建议" width="min(720px, 92vw)" append-to-body>
      <div class="ai-suggestion-dialog">
        <article v-for="item in suggestions" :key="item.id" class="ai-suggestion-card">
          <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
          <footer><span>{{ item.completed ? '已生成结果' : item.scope }}</span><button class="ai-suggestion-action" @click="openSuggestion(item)">{{ item.completed ? '查看结果' : item.action }}</button></footer>
        </article>
      </div>
    </ElDialog>
  </section>
</template>

<style scoped>
.ai-home-promotion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 8px 14px;
  border: 1px solid #e0e6ff;
  border-radius: 12px;
  background: #f6f8ff;
}
.ai-home-promotion img { flex: none; width: 44px; height: 44px; object-fit: contain; }
.ai-promotion-copy { flex: 1 1 150px; min-width: 0; }
.ai-promotion-copy span { color: #52689d; font-size: 12px; }
.ai-promotion-copy h2 { color: #253654; font-size: 15px; font-weight: 600; }
.ai-home-promotion .ai-promotion-action {
  flex: none;
  padding: 5px 12px;
  border-radius: 7px;
  background: #e6edff;
  color: #294ac6;
  font-weight: 600;
}
.ai-home-promotion .ai-promotion-action:hover { background: #dce5ff; }
</style>

<style scoped>
.ai-suggestions-panel { padding-bottom: 16px; }
.ai-suggestion-list { display: grid; gap: 8px; }
.ai-suggestion-list .ai-suggestion-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 5px 12px; padding: 10px 12px; }
.ai-suggestion-list .ai-suggestion-card h3 { grid-column: 1; }
.ai-suggestion-list .ai-suggestion-card p { grid-column: 1; margin: 0; }
.ai-suggestion-list .ai-suggestion-card footer { grid-column: 2; grid-row: 1 / 3; align-self: center; gap: 8px; }
.ai-suggestion-list .ai-suggestion-card footer>span { display: none; }
.ai-suggestion-card { min-width: 0; padding: 12px 14px; border: 1px solid #edf0f6; border-radius: 10px; background: #fff; text-align: left; }
.ai-suggestion-card h3 { margin: 0; color: #3d4050; font-size: 14px; line-height: 21px; font-weight: 600; }
.ai-suggestion-card p { margin: 5px 0 9px; color: #737988; font-size: 12px; line-height: 19px; }
.ai-suggestion-card footer { display: flex; align-items: center; gap: 10px; }
.ai-suggestion-card footer>span { flex: 1; color: #909499; font-size: 12px; }
.ai-suggestion-card .ai-suggestion-action { flex: none; color: #3a65ff; background: #f0f4ff; border-radius: 4px; padding: 5px 9px; font-size: 12px; line-height: 18px; }
.ai-suggestion-card .ai-suggestion-action:hover { background: #e5ecff; }
.ai-suggestion-dialog { display: grid; gap: 12px; }
.ai-suggestion-empty { padding: 40px 12px; text-align: center; color: #737988; font-size: 14px; }
.ai-suggestion-empty button { display: block; margin: 12px auto 0; color: #3a65ff; }
</style>
