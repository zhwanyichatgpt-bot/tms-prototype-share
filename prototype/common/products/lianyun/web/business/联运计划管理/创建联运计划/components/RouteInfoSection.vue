<script setup>
import { ref } from 'vue'
import { routeCombos, routeCards, routeSegments as mockSegments } from '../mock-data'

const activeCombo = ref('铁水')
const channel = ref('')
const channelRoute = ref('')
const segments = ref(mockSegments.map(s => ({ ...s })))
const activeRouteCard = ref('r1')
const routeTab = ref('transport') // transport=运输路线查询 history=历史线路查询

function addNode(seg) {
  seg.nodes.push({ type: '', address: '富邦总部大楼', isSite: true, workTime: '', contact: '', phone: '', cargoItems: [{ text: '粮食丨玉米 | 30吨丨30m³' }] })
}
function removeNode(seg, i) {
  if (seg.nodes.length > 1) seg.nodes.splice(i, 1)
}
function addSegment() {
  const n = segments.value.length + 1
  segments.value.push({
    id: `seg${Date.now()}`, name: `路程${n}`, mode: '汽运', cargoType: '散杂货', planName: '',
    nodes: [
      { type: '装', address: '富邦总部大楼', isSite: true, workTime: '', contact: '', phone: '', cargoItems: [{ text: '粮食丨玉米 | 30吨丨30m³' }] },
      { type: '卸', address: '富邦总部大楼', isSite: true, workTime: '', contact: '', phone: '', cargoItems: [{ text: '粮食丨玉米 | 30吨丨30m³' }] },
    ],
    operations: [],
  })
}
function useRoute(card) {
  activeRouteCard.value = card.id
}
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
            <div class="cp-input-wrap cp-seg-plan">
              <input v-model="seg.planName" class="cp-input" type="text" placeholder="计划名称" />
              <span class="cp-seg-plan-ic">✕</span>
            </div>
            <button type="button" class="cp-icon-btn" title="设置">⚙</button>
          </div>

          <!-- 节点 -->
          <div class="cp-nodes">
            <div v-for="(node, ni) in seg.nodes" :key="ni" class="cp-node">
              <button type="button" class="cp-node-del" @click="removeNode(seg, ni)">✕</button>
              <span class="cp-node-badge" :class="node.type === '卸' ? 'unload' : 'load'">{{ node.type || '·' }}</span>
              <span class="cp-node-swap">⇄</span>
              <div class="cp-node-addr">
                <span class="cp-node-addr-text">{{ node.address }}</span>
                <span v-if="node.isSite" class="cp-site-tag">网点</span>
              </div>
              <span class="cp-node-add">⊕</span>
              <div class="cp-input-wrap cp-node-time">
                <span class="cp-cal-ic">📅</span>
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
              <button type="button" class="cp-node-del">✕</button>
            </div>
            <div v-for="(node, ni) in op.nodes" :key="ni" class="cp-node cp-op-node">
              <button type="button" class="cp-node-del">✕</button>
              <div class="cp-node-addr">
                <span class="cp-node-addr-text">{{ node.address }}</span>
                <span v-if="node.isSite" class="cp-site-tag">网点</span>
              </div>
              <span class="cp-node-swap">⇄</span>
              <span class="cp-node-add">⊕</span>
              <div class="cp-input-wrap cp-node-time">
                <span class="cp-cal-ic">📅</span>
                <input class="cp-input" type="text" placeholder="请选择预计作业时间" />
                <span class="cp-caret">▾</span>
              </div>
              <div class="cp-input-wrap cp-node-contact"><input class="cp-input" type="text" placeholder="作业联系人" /></div>
              <div class="cp-input-wrap cp-node-phone"><input class="cp-input" type="text" placeholder="联系电话" /></div>
              <div class="cp-node-cargo">
                <span class="cp-node-cargo-label">货物</span>
                <span v-for="(c, ci) in node.cargoItems" :key="ci" class="cp-cargo-chip">{{ c.text }}</span>
              </div>
            </div>
            <button type="button" class="cp-add-btn">添加节点</button>
          </div>
        </div>

        <button type="button" class="cp-add-seg-btn" @click="addSegment">添加路程</button>
      </div>

      <!-- 右：运输路线查询 -->
      <aside class="cp-route-aside">
        <div class="cp-aside-tabs">
          <button type="button" class="cp-aside-tab" :class="{ on: routeTab === 'transport' }" @click="routeTab = 'transport'">运输路线查询</button>
          <button type="button" class="cp-aside-tab" :class="{ on: routeTab === 'history' }" @click="routeTab = 'history'">历史线路查询</button>
        </div>
        <div class="cp-aside-endpoints">
          <span class="cp-endpoint">始发地</span>
          <span class="cp-endpoint-swap">⇄</span>
          <span class="cp-endpoint">目的地</span>
        </div>
        <div class="cp-combo-tabs">
          <button
            v-for="c in routeCombos" :key="c" type="button"
            class="cp-combo-tab" :class="{ on: activeCombo === c }"
            @click="activeCombo = c"
          >{{ c }}</button>
        </div>

        <div class="cp-route-cards">
          <div
            v-for="card in routeCards" :key="card.id"
            class="cp-route-card" :class="{ on: activeRouteCard === card.id }"
          >
            <div class="cp-rc-head">
              <span class="cp-rc-city">{{ card.from }}</span>
              <span class="cp-rc-arrow">→</span>
              <span class="cp-rc-city">{{ card.to }}</span>
              <span class="cp-rc-price">￥{{ card.price }}<em>{{ card.unit }}</em></span>
            </div>
            <div class="cp-rc-tags">
              <span v-for="t in card.tags" :key="t" class="cp-rc-tag">{{ t }}</span>
            </div>
            <div class="cp-rc-row"><span class="cp-rc-label">{{ card.departLabel }}</span><span>{{ card.depart }}</span></div>
            <div class="cp-rc-row"><span class="cp-rc-label">{{ card.cargoLabel }}</span><span>{{ card.cargo }}</span></div>
            <div class="cp-rc-foot">
              <button type="button" class="cp-rc-more">更多信息</button>
              <button type="button" class="cp-rc-use" @click="useRoute(card)">使用路线</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
