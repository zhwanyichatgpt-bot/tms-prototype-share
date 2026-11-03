<template>
  <van-popup v-model:show="open" :duration="0" position="bottom" round :teleport="teleport" :style="{position:'absolute'}" :overlay-style="{position:'absolute',top:'-44px',height:'calc(100% + 44px)',background:'rgba(0,0,0,.5)'}" class="lyf-edit-sheet">
    <header class="lyf-edit-heading"><h2>修改运输需求</h2><button type="button" aria-label="关闭需求修改" @click="open=false"><van-icon name="cross"/></button><p>调整运输条件，为你匹配合适方案</p></header>
    <RouteQueryForm ref="queryForm" edit-design v-model:mode="mode" :teleport="teleport" query-label="更新运输方案" @query="$emit('query',$event)"/>
    <p v-if="error" class="lyf-edit-error" role="alert">{{ error }}</p>
  </van-popup>
</template>
<script setup>
import { ref, nextTick } from 'vue'
import RouteQueryForm from './RouteQueryForm.vue'
defineProps({teleport:{default:null},error:String})
const open=defineModel('show',{default:false})
const mode=defineModel('mode',{default:'all'})
defineEmits(['query'])
const queryForm=ref(null)
async function prefill(demand){await nextTick();queryForm.value?.prefill(demand)}
defineExpose({prefill})
</script>
