<template>
  <section class="ly-service-page ly-requests-page" aria-label="我的服务需求">
    <header class="ly-service-nav"><button aria-label="返回" @click="back"><van-icon name="arrow-left"/></button><h1>{{ editing ? '填写服务需求' : selected ? '需求详情' : '我的服务需求' }}</h1><span/></header>
    <main class="ly-service-content">
      <p class="ly-request-boundary">本机体验记录 · 未向企业发送，不会产生真实订单</p>
      <p v-if="requestStore.storageError" class="ly-request-warning" role="alert">本机存储不可用，请勿关闭页面；需求暂保留在当前会话。</p>
      <section v-if="editing" class="ly-detail-card">
        <h2>{{ editingTarget.title }}</h2><p class="ly-detail-muted">{{ editingTarget.providerName }} · {{ editingTarget.context }}</p>
        <van-form @submit="save"><van-field v-model="text" label="需求说明" type="textarea" rows="5" maxlength="500" show-word-limit placeholder="说明货物、数量、服务地点和期望时间" :rules="[{validator:value=>Boolean(value.trim()),message:'请填写需求说明'}]"/><van-button block type="primary" native-type="submit">保存并核对</van-button></van-form>
      </section>
      <template v-else-if="selected">
        <section class="ly-detail-card"><div class="ly-detail-card-heading"><h2>{{ selected.title }}</h2><span class="ly-status-pill">{{ requestStatus[selected.status] }}</span></div><p class="ly-detail-muted">{{ selected.context }}</p><dl><dt>服务企业</dt><dd>{{ selected.providerName }}</dd><dt>需求内容</dt><dd class="ly-request-text">{{ selected.text }}</dd><dt>更新时间</dt><dd>{{ formatTime(selected.updatedAt) }}</dd></dl></section>
        <section class="ly-detail-card"><h2>办理进展</h2><ol class="ly-guide-steps"><li v-for="(event,index) in selected.history" :key="index"><h3>{{ event.title }}</h3><p>{{ formatTime(event.time) }}</p></li></ol><p class="ly-detail-muted">{{ selected.status==='submitted' ? '尚无企业回复。收到报价后应核对服务范围、计价单位与费用包含项。' : selected.status==='withdrawn' ? '该需求已撤回，可修改后重新确认。' : '请核对服务范围和需求内容，再确认提交。' }}</p></section>
        <section v-if="confirming" class="ly-detail-card ly-confirm-box" role="region" aria-label="确认服务需求"><h2>{{ confirming==='submitted'?'确认这份需求？':'撤回这份需求？' }}</h2><p class="ly-detail-muted">{{ confirming==='submitted'?'确认后将在本机记录为待回复；此体验环境不对外发送。':'撤回后保留记录，不再列为待回复。' }}</p><div class="ly-inline-actions"><button @click="confirming=''">暂不操作</button><button class="primary" @click="changeRequestStatus(selected,confirming);confirming=''">确认{{ confirming==='submitted'?'提交':'撤回' }}</button></div></section>
      </template>
      <template v-else>
        <div class="ly-filters" aria-label="需求状态"><button v-for="tab in filters" :key="tab.id" :class="{active:filter===tab.id}" @click="filter=tab.id">{{ tab.name }} {{ count(tab.id) }}</button></div>
        <button v-for="item in visibleItems" :key="item.id" class="ly-detail-card ly-request-row" @click="selectedId=item.id"><span class="ly-detail-card-heading"><strong>{{ item.title }}</strong><small class="ly-status-pill">{{ requestStatus[item.status] }}</small></span><span class="ly-detail-muted">{{ item.providerName }}</span><span class="ly-request-preview">{{ item.text }}</span><small>{{ formatTime(item.updatedAt) }} · 查看进展 ›</small></button>
        <div v-if="!visibleItems.length" class="ly-empty"><van-icon name="orders-o"/><p>{{ filter==='all'?'还没有服务需求':'暂无此状态的需求' }}</p><small>找到合适的运输或配套服务后，可在详情中发起需求。</small><button class="ly-text-button" @click="$emit('browse')">去找服务</button></div>
      </template>
    </main>
    <footer v-if="selected && !editing && !confirming" class="ly-service-actions"><template v-if="selected.status==='draft'"><button @click="edit">修改需求</button><button class="primary" @click="confirming='submitted'">确认提交</button></template><template v-else-if="selected.status==='submitted'"><button @click="confirming='withdrawn'">撤回需求</button><button class="primary" @click="$emit('source',selected)">查看原服务</button></template><template v-else><button @click="$emit('source',selected)">查看原服务</button><button class="primary" @click="changeRequestStatus(selected,'draft');edit()">重新编辑</button></template></footer>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { requestStore, requestStatus, saveServiceRequest, changeRequestStatus } from './platform-requests.js'
const props=defineProps({ target:Object })
const emit=defineEmits(['back','browse','source'])
const selectedId=ref(''), editing=ref(Boolean(props.target)), text=ref(''), confirming=ref(''), filter=ref('all')
const selected=computed(()=>requestStore.items.find(item=>item.id===selectedId.value))
const editingTarget=computed(()=>selected.value||props.target)
const filters=[{id:'all',name:'全部'},{id:'draft',name:'待确认'},{id:'submitted',name:'待回复'},{id:'withdrawn',name:'已撤回'}]
const visibleItems=computed(()=>requestStore.items.filter(item=>filter.value==='all'||item.status===filter.value))
const count=id=>requestStore.items.filter(item=>id==='all'||item.status===id).length
const formatTime=value=>new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})
function save(){const record=saveServiceRequest(editingTarget.value,text.value,selected.value?.id);selectedId.value=record.id;editing.value=false}
function edit(){text.value=selected.value.text;editing.value=true}
function back(){if(confirming.value)confirming.value='';else if(editing.value&&selected.value)editing.value=false;else if(editing.value)emit('back');else if(selected.value)selectedId.value='';else emit('back')}
</script>
