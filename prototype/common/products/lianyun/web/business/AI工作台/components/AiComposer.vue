<script setup>
import { computed, ref } from 'vue'
import { ElPopover } from 'element-plus'
import { scopeTags, asset } from '../mock-data.js'
import AiIcon from './AiIcon.vue'
const props = defineProps({ modelValue: String, model: Object, agents: Array, selectedTags: Array, deep: Boolean, attachments: Array, quote: Object, showTags: Boolean, showModel: Boolean, generating: Boolean, homepage: Boolean, documentSkill: Boolean, supplementSkill: Boolean, contextPlaceholder: String, knowledgeScope: String, expertName: String, referenceSkills: Array })
const emit = defineEmits(['update:modelValue','tag','deep','model','files','remove-file','remove-quote','submit','stop','choose-skill','knowledge','remove-document-skill','remove-supplement-skill','remove-knowledge'])
const fileInput = ref(null)
const modelOpen = ref(false)
const skillPickerOpen = ref(false)
const selectedSkill = computed(() => props.supplementSkill ? 'waybill-supplement' : props.documentSkill ? 'documents' : '')
const tagOffset = ref(0)
const tags = computed(() => [...scopeTags.slice(tagOffset.value), ...scopeTags.slice(0,tagOffset.value)])
const canSubmit = computed(() => props.supplementSkill || props.modelValue?.trim() || (!props.documentSkill && props.attachments?.length))
function chooseFiles(event) { emit('files', Array.from(event.target.files || [])); event.target.value = '' }
function keydown(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if(canSubmit.value && !props.generating) emit('submit') } }
</script>
<template>
  <div class="ai-composer-wrap" :class="{ 'with-tags': showTags }">
    <div v-if="showTags" class="ai-scope-tags"><button v-for="tag in tags" :key="tag" :class="{ selected: selectedTags.includes(tag) }" :aria-pressed="selectedTags.includes(tag)" @click="emit('tag',tag)">{{ tag }}</button><button class="ai-tag-refresh" @click="tagOffset=(tagOffset+1)%scopeTags.length">换一批 <AiIcon name="refresh" :size="14" /></button></div>
    <form class="ai-composer" :class="{ 'has-files': attachments?.length || quote || documentSkill || supplementSkill || knowledgeScope || expertName, 'is-expanded': modelValue?.length > 70 }" @submit.prevent="canSubmit && !generating && emit('submit')">
      <div v-if="attachments?.length || quote || documentSkill || supplementSkill || knowledgeScope || expertName" class="ai-composer-context">
        <div v-if="expertName" class="ai-quote-chip ai-expert-identity"><AiIcon name="user" :size="16" /><span>专家 · {{ expertName }}</span></div>
        <div v-if="documentSkill" class="ai-quote-chip ai-document-skill"><AiIcon name="chart" :size="16" /><span>单据分析</span><button type="button" aria-label="移除单据分析技能" @click="emit('remove-document-skill')"><AiIcon name="close" :size="13" /></button></div>
        <div v-if="supplementSkill" class="ai-quote-chip ai-document-skill"><AiIcon name="file" :size="16" /><span>运单补录</span><button type="button" aria-label="移除运单补录技能" @click="emit('remove-supplement-skill')"><AiIcon name="close" :size="13" /></button></div>
        <div v-if="quote" class="ai-quote-chip"><AiIcon name="quote" :size="16" /><span>{{ quote.text }}</span><button type="button" aria-label="移除引用" @click="emit('remove-quote')"><AiIcon name="close" :size="13" /></button></div>
        <div v-if="knowledgeScope" class="ai-quote-chip"><AiIcon name="file" :size="16" /><span>知识范围 · {{ knowledgeScope }}</span><button type="button" aria-label="移除知识范围" @click="emit('remove-knowledge')"><AiIcon name="close" :size="13" /></button></div>
        <div v-for="file in attachments" :key="file.id" class="ai-file-chip"><AiIcon name="file" :size="15" /><span>{{ file.name }}</span><button type="button" :aria-label="`移除附件：${file.name}`" @click="emit('remove-file',file.id)"><AiIcon name="close" :size="13" /></button></div>
      </div>
      <textarea :value="modelValue" aria-label="向至小简提问" :placeholder="contextPlaceholder || (documentSkill ? '告诉至小简要分析哪张系统单据，例如：分析托运单 WT202409030001' : supplementSkill ? '上传运输明细，或告诉我需要补录哪些运输记录' : homepage ? '描述你的需求，或添加资料，让至小简帮你开始…' : '输入信息，助手将为你分析')" rows="2" @input="emit('update:modelValue',$event.target.value)" @keydown="keydown" />
      <div class="ai-composer-footer"><div class="ai-composer-options">
        <button v-if="homepage && !documentSkill" type="button" class="ai-input-tool" @click="fileInput.click()"><AiIcon name="attach" :size="16"/>添加资料</button>
        <button v-if="!documentSkill" type="button" class="ai-input-tool" @click="emit('knowledge')"><AiIcon name="file" :size="16"/>引用知识</button>
        <ElPopover
          v-if="referenceSkills?.length && !expertName"
          v-model:visible="skillPickerOpen"
          placement="top-start"
          trigger="click"
          :width="296"
          :teleported="false"
        >
          <template #reference>
            <button type="button" class="ai-input-tool ai-choose-skill" :aria-expanded="skillPickerOpen">
              <AiIcon name="grid" :size="16" />选择能力
            </button>
          </template>
          <section class="ai-skill-picker" aria-label="可引用的技能">
            <p>引用技能</p>
            <button v-for="skill in referenceSkills" :key="skill.id" type="button"
              :aria-pressed="selectedSkill === skill.id"
              @click="skillPickerOpen = false; emit('choose-skill', skill.id)"
            >
              <img :src="asset(skill.icon)" alt="" />
              <span><strong>{{ skill.name }}</strong><small>{{ skill.description }}</small></span>
              <span v-if="selectedSkill === skill.id" class="ai-skill-picker-current">已引用</span>
            </button>
          </section>
        </ElPopover>
        <div v-if="showModel" class="ai-model-picker"><button type="button" class="ai-model-button" :aria-expanded="modelOpen" @click="modelOpen=!modelOpen"><AiIcon name="chart" :size="18" />{{ model.model }}<AiIcon name="down" :size="12" /></button><div v-if="modelOpen" class="ai-model-menu"><button type="button" @click="modelOpen=false;emit('model',null)"><AiIcon name="plus" :size="16" />新对话</button><button v-for="agent in agents" :key="agent.id" type="button" :class="{ selected: model.id===agent.id }" @click="emit('model',agent.id);modelOpen=false"><AiIcon name="chart" :size="18" />{{ agent.model }}<span v-if="agent.id==='analysis'" class="ai-hot">HOT</span></button></div></div>
        <button v-if="!homepage" type="button" class="ai-deep-button" :class="{ selected: deep }" :aria-pressed="deep" @click="emit('deep')">深度推理</button>
      </div><div class="ai-composer-actions"><input ref="fileInput" type="file" hidden multiple @change="chooseFiles" /><button v-if="!homepage && !documentSkill" type="button" class="ai-icon-button" title="上传图片或文件" aria-label="上传图片或文件" @click="fileInput.click()"><AiIcon name="attach" :size="23" /></button><button v-if="generating" type="button" class="ai-send-button" aria-label="停止生成" title="停止生成" @click="emit('stop')"><AiIcon name="stop" :size="16" /></button><button v-else type="submit" class="ai-send-button" :disabled="!canSubmit" title="发送" aria-label="发送问题"><img :src="asset('send.svg')" width="16" height="18" alt="" /></button></div></div>
    </form>
  </div>
</template>

<style scoped>
.ai-choose-skill[aria-expanded="true"] { color: #3a65ff !important; border-color: #5275ff !important; background: #f3f6ff !important; }
.ai-skill-picker > p { margin: 0 8px 6px; color: #68738a; font-size: 12px; }
.ai-skill-picker > button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border: 0; border-radius: 8px; background: transparent; text-align: left; cursor: pointer; }
.ai-skill-picker > button:hover, .ai-skill-picker > button:focus-visible, .ai-skill-picker > button[aria-pressed="true"] { background: #f3f6ff; }
.ai-skill-picker img { width: 28px; height: 28px; flex: none; }
.ai-skill-picker strong, .ai-skill-picker small { display: block; }
.ai-skill-picker strong { color: #333; font-size: 14px; line-height: 20px; }
.ai-skill-picker small { color: #68738a; font-size: 12px; line-height: 18px; }
.ai-skill-picker-current { margin-left: auto; flex: none; color: #3a65ff; font-size: 12px; }
</style>
