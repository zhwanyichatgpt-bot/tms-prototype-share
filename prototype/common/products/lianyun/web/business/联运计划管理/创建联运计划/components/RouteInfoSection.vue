<script setup>
import { ref } from 'vue'
import { routeSegments as mockSegments } from '../mock-data'

const channel = ref('')
const channelRoute = ref('')
const segments = ref(structuredClone(mockSegments))

function addNode(seg) {
  seg.nodes.push({ type: '', address: '富邦总部大楼', isSite: true, workTime: '', contact: '', phone: '', cargoItems: [{ text: '粮食丨玉米 | 30吨丨30m³' }] })
}
function removeNode(seg, i) {
  if (seg.nodes.length > 1) seg.nodes.splice(i, 1)
}
function applyRoute(route) {
  const goods = segments.value[0]?.nodes[0]?.cargoItems || []
  const points = route.via ? [route.from, route.via, route.to] : [route.from, route.to]
  segments.value = route.modes.map((mode, index) => ({
    id: crypto.randomUUID(), name: `路程${index + 1}`, mode, cargoType: route.cargoType || '散杂货', planName: '', operations: [],
    nodes: ['装', '卸'].map((type, nodeIndex) => ({ type, address: points[index + nodeIndex], isSite: false, workTime: '', contact: '', phone: '', cargoItems: goods.map(item => ({ ...item })) })),
  }))
}
defineExpose({ segments, applyRoute })
</script>

<template>
  <section class="cp-section cp-route-section">
    <h3 class="cp-section-title">路线信息</h3>

    <!-- 报价方案 -->
    <div class="cp-quote-row">
      <span class="cp-quote-label">报价方案</span>
      <span class="cp-quote-sub">对应托运单报价方案</span>
      <div class="cp-input-wrap cp-quote-select">
        <select v-model="channel" class="cp-input cp-select">
          <option value="" disabled>运输通道</option>
          <option>运输通道</option>
        </select>
        <span class="cp-caret">▾</span>
      </div>
      <div class="cp-input-wrap cp-quote-select">
        <select v-model="channelRoute" class="cp-input cp-select">
          <option value="" disabled>通道路线</option>
          <option>通道路线</option>
        </select>
        <span class="cp-caret">▾</span>
      </div>
    </div>
    <div class="cp-route-body">
      <!-- 左：路程段 -->
      <div class="cp-segments">
        <div v-for="(seg, si) in segments" :key="seg.id" class="cp-segment">
          <!-- 段头 -->
          <div class="cp-seg-head">
            <span class="cp-seg-drag">⠿</span>
            <span class="cp-seg-name">{{ seg.name }}</span>
            <div class="cp-seg-mode-tag" :class="seg.mode === '水运' ? 'water' : (seg.mode === '铁运' ? 'rail' : 'road')">
              <span class="cp-seg-mode-ic"></span>
              <select v-model="seg.mode" class="cp-seg-mode-select">
                <option>汽运</option><option>水运</option><option>铁运</option>
              </select>
              <span class="cp-seg-mode-caret">▾</span>
            </div>
            <div class="cp-input-wrap cp-seg-type">
              <select v-model="seg.cargoType" class="cp-input cp-select">
                <option>散杂货</option><option>集装箱</option>
              </select>
              <span class="cp-caret">▾</span>
            </div>
            <div v-if="!seg.createPlan" class="cp-input-wrap cp-seg-plan">
              <input v-model="seg.planName" class="cp-input" type="text" placeholder="计划名称" />
              <span class="cp-seg-plan-ic">✕</span>
            </div>
            <details v-if="seg.createPlan" class="cp-plan-menu" open><summary>创建计划<span class="cp-caret">▾</span></summary><div><button type="button" @click="seg.createPlan=false">运输计划</button><button type="button" @click="seg.createPlan=false">托运计划</button></div></details>
            <button type="button" class="cp-icon-btn" aria-label="路程设置" />
          </div>

          <!-- 节点 -->
          <div class="cp-nodes">
            <div v-for="(node, ni) in seg.nodes" :key="ni" class="cp-node">
              <button type="button" class="cp-node-del" aria-label="删除运输节点" @click="removeNode(seg, ni)" />
              <span class="cp-node-badge" :class="node.type === '卸' ? 'unload' : 'load'">{{ node.type || '·' }}</span>
              <span class="cp-node-swap" aria-hidden="true" />
              <div class="cp-node-addr">
                <span class="cp-node-addr-text">{{ node.address }}</span>
                <span v-if="node.isSite" class="cp-site-tag">网点</span>
              </div>
              <span class="cp-node-add" aria-hidden="true" />
              <div class="cp-input-wrap cp-node-time">
                <span class="cp-cal-ic" aria-hidden="true" />
                <input v-model="node.workTime" class="cp-input" type="text" placeholder="请选择作业时间" />
                <span class="cp-caret">▾</span>
              </div>
              <div class="cp-input-wrap cp-node-contact"><input v-model="node.contact" class="cp-input" type="text" placeholder="联系人" /></div>
              <div class="cp-input-wrap cp-node-phone"><input v-model="node.phone" class="cp-input" type="text" placeholder="联系电话" /></div>
              <!-- 货物 -->
              <div class="cp-node-cargo">
                <span class="cp-node-cargo-label">货物</span>
                <span v-for="(c, ci) in node.cargoItems" :key="ci" class="cp-cargo-chip">{{ c.text }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="cp-add-btn" @click="addNode(seg)">添加节点</button>

          <!-- 散改集 / 集改散作业 -->
          <div v-for="op in seg.operations" :key="op.id" class="cp-operation">
            <div class="cp-op-head">
              <span class="cp-op-name">{{ op.name }}</span>
              <span class="cp-caret">▾</span>
              <button type="button" class="cp-node-del" aria-label="删除作业" @click="seg.operations.splice(seg.operations.indexOf(op),1)" />
            </div>
            <div v-for="(node, ni) in op.nodes" :key="ni" class="cp-node cp-op-node">
              <button type="button" class="cp-node-del" aria-label="删除作业节点" @click="op.nodes.splice(ni,1)" />
              <div class="cp-node-addr">
                <span class="cp-node-addr-text">{{ node.address }}</span>
                <span v-if="node.isSite" class="cp-site-tag">网点</span>
              </div>
              <span class="cp-node-swap" aria-hidden="true" />
              <span class="cp-node-add" aria-hidden="true" />
              <div class="cp-input-wrap cp-node-time">
                <span class="cp-cal-ic" aria-hidden="true" />
                <input v-model="node.workTime" class="cp-input" type="text" placeholder="请选择预计作业时间" />
                <span class="cp-caret">▾</span>
              </div>
              <div class="cp-input-wrap cp-node-contact"><input v-model="node.contact" class="cp-input" type="text" placeholder="作业联系人" /></div>
              <div class="cp-input-wrap cp-node-phone"><input v-model="node.phone" class="cp-input" type="text" placeholder="联系电话" /></div>
              <div class="cp-node-cargo">
                <span class="cp-node-cargo-label">货物</span>
                <span v-for="(c, ci) in node.cargoItems" :key="ci" class="cp-cargo-chip">{{ c.text }}</span>
              </div>
            </div>
            <button type="button" class="cp-add-btn">添加节点</button>
          </div>
        </div>


      </div>

      <!-- 右：运输路线查询 -->

    </div>
  </section>
</template>
