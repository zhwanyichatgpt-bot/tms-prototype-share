<script setup>
import { computed, nextTick, ref } from 'vue'
import AiGuideSpotlight from './AiGuideSpotlight.vue'

const props = defineProps({
  step: { type: String, required: true },
  workspace: { type: Object, required: true },
})
const emit = defineEmits(['finish'])

const steps = {
  'choose-skill': {
    target: '.ai-catalog-grid > button:first-child', action: '去选技能',
    label: '技能入门', title: '先选一个适合当前工作的技能',
    text: '卡片会告诉你它能帮你做什么。想看一份托运单报告，可以先选「单据分析」。',
  },
  'choose-expert': {
    target: '.ai-catalog-grid > button:first-child', action: '去选专家',
    label: '专家入门', title: '按你想解决的问题选择专家',
    text: '先查看专家的能力和提问示例。例如建立物流指标，可以召唤「大宗运输物流专家」。',
  },
  documents: {
    target: '.ai-composer textarea', action: '去输入',
    label: '技能入门', title: '指定系统里的单据',
    text: '在下方输入托运单号后发送。想先体验，可以输入「分析托运单 WT202409030001」。报告会出现在对话里。',
  },
  skill: {
    target: '.ai-upload-zone', action: '去准备资料',
    label: '技能入门', title: '准备资料，说清你想得到什么',
    text: '按下方提示添加资料、补充要求，再开始处理。完成后可以从首页「工作成果」找回结果。',
  },
  expert: {
    target: 'textarea[aria-label="技能问题"]', action: '去填写',
    label: '专家团入门', title: '把业务背景和要做的决定告诉专家团',
    text: '可以说清货物、起终点和交付要求，再问你想比较的方案。也可以点「使用示例问题」看看怎么问。',
  },
}
const knowledgeSteps = [
  {
    target: '.knowledge-directory', title: '选择知识库',
    text: '个人知识库存放自己的资料。企业知识库用于浏览和问答，内容由管理中心维护。',
  },
  {
    target: '.knowledge-content', title: '浏览文件夹和文档',
    text: '点击文件夹继续浏览，点击文档阅读内容。打开资料后，可以主动将提问范围缩小到这个文件夹或这篇文档。',
  },
  {
    target: '.knowledge-composer', title: '基于知识库提问',
    text: '确认提问范围后发送，系统会新建一条对话。你可以在对话里继续追问，或点开引用核对出处。',
  },
]
const index = ref(0)
const isKnowledge = computed(() => props.step === 'knowledge')
const guide = computed(() => isKnowledge.value
  ? { ...knowledgeSteps[index.value], label: `知识库入门 · ${index.value + 1}/3`, action: index.value < 2 ? '下一步' : '完成' }
  : steps[props.step])

async function continueLearning() {
  if (isKnowledge.value && index.value < knowledgeSteps.length - 1) {
    index.value += 1
    return
  }
  const { workspace } = props
  const selector = guide.value.target
  emit('finish')
  await nextTick()
  const target = workspace.querySelector(selector)
  const control = target?.matches('button, input, textarea') ? target : target?.querySelector('textarea, input') || target?.querySelector('button, [tabindex="0"]')
  control?.focus({ preventScroll: true })
}
</script>

<template>
  <AiGuideSpotlight
    v-if="guide"
    :workspace="workspace"
    :step="guide"
    :primary-label="guide.action"
    :can-go-back="isKnowledge && index > 0"
    @close="emit('finish')"
    @back="index -= 1"
    @continue="continueLearning"
  />
</template>
