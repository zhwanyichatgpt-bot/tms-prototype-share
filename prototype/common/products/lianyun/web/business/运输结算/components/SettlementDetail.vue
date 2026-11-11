<script setup>
/**
 * 结算单详情 —— 按真实系统全屏抽屉复刻（2026-11-08 抓取）
 * 结构：面包屑 + 结算单概览卡 + 基础信息（左侧计划/运单、右侧计费明细）+ 底部操作
 */
import { computed, ref } from 'vue'

const props = defineProps({
  row: { type: Object, required: true },
  draft: { type: Object, default: null },
  embedded: Boolean,
})

const emit = defineEmits(['close', 'notice'])

const asset = (name) => `/transport-settlement-assets/${name}`

/* 计划分组展开状态 */
const expanded = ref(true)
const planChecked = ref(false)
const waybillChecked = ref(false)

/* 运单明细（真实数据抓取自 JS2611050016） */
const sampleWaybill = {
  planName: 'Test-热轧卷板（Q355B） QYCG-2611051046261474',
  no: '2611051047587630',
  driver: '蓝霜',
  phone: '18172395685',
  plate: '闽A22Q7L',
  payStatus: '已打款',
  settleFreight: '￥5535',
  baseFreight: '￥5550',
  roadLoss: '￥15',
  otherDeduction: '￥0',
  subsidy: '￥0',
}

/* 路耗明细 */
const sampleRoadLossRows = [
  { index: 1, goods: '其他 | 热轧卷板（Q355B）', weight: '100', price: '150', amount: '-', subWaybill: '-' },
]

const money = value => '￥' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const groups = computed(() => props.draft ? props.draft.plans.map(plan => ({
  id: plan.id, planName: `${plan.name} | ${plan.number}`,
  rows: props.draft.rows.filter(item => item.planId === plan.id).map(item => ({
    no: item.id, driver: item.driver, phone: item.phone, plate: item.plate, payStatus: '未打款',
    settleFreight: money(item.amount), baseFreight: money(item.basic), roadLoss: money(item.loss), otherDeduction: '￥0.00', subsidy: '￥0.00',
  })),
})) : [{ id: 'sample', planName: sampleWaybill.planName, rows: [sampleWaybill] }])
const roadLossRows = computed(() => props.draft ? props.draft.rows.filter(item => item.loss > 0).map((item, index) => ({
  index: index + 1, goods: item.goods, weight: (item.loss / item.goodsPrice * 1000).toFixed(2),
  price: item.goodsPrice, amount: money(item.loss), subWaybill: item.id,
})) : sampleRoadLossRows)

function togglePlan() {
  planChecked.value = !planChecked.value
  waybillChecked.value = planChecked.value
}

function markPaid() {
  emit('notice', '标记打款功能待接入')
}
</script>

<template>
  <div class="tsd-root" :class="{ 'is-embedded': embedded }">
    <!-- 抽屉头部：面包屑 + 返回列表 -->
    <header class="tsd-header">
      <div class="tsd-crumb">
        <span class="tsd-crumb-parent">{{ embedded ? '运输结算' : '汽运结算' }}</span>
        <span class="tsd-crumb-sep" />
        <span class="tsd-crumb-current">{{ draft ? '运输结算单详情' : '托运企业-散杂货详情' }}</span>
      </div>
      <button class="tsd-back" type="button" @click="emit('close')">
        <span class="tsd-back-icon" />
        {{ embedded ? '返回工作台' : '返回列表' }}
      </button>
    </header>

    <div class="tsd-body">
      <div class="tsd-content">
        <!-- 结算单概览 -->
        <section class="tsd-summary">
          <img class="tsd-summary-icon" :src="asset('detail-doc.png')" alt="" />
          <div class="tsd-summary-main">
            <div class="tsd-summary-title">
              <span>结算单号: {{ row.id }}</span>
              <span class="tsd-tag green">{{ row.status }}</span>
            </div>
            <div class="tsd-desc-grid">
              <div class="tsd-desc-item"><span class="tsd-desc-label">结算总额</span><span>{{ row.total }}</span></div>
              <div class="tsd-desc-item"><span class="tsd-desc-label">结算对象</span><span>{{ draft?.settleObject || '托运企业' }}</span></div>
              <div class="tsd-desc-item"><span class="tsd-desc-label">结算企业</span><span>{{ draft?.party || 'TMS3.0货主（测试）' }}</span></div>
              <div class="tsd-desc-item"><span class="tsd-desc-label">结算日期</span><span>{{ row.settleAt }}</span></div>
              <div class="tsd-desc-item"><span class="tsd-desc-label">核算人</span><span>{{ row.creator }}</span></div>
              <div class="tsd-desc-item"><span class="tsd-desc-label">创建时间</span><span>{{ row.createdAt }}</span></div>
              <div class="tsd-desc-item wide"><span class="tsd-desc-label">备注</span><span>{{ row.remark }}</span></div>
            </div>
          </div>
        </section>

        <div class="tsd-main">
          <!-- 左侧：基础信息 -->
          <div class="tsd-left">
            <div class="tsd-section-title">基础信息</div>

            <div v-for="group in groups" :key="group.id" class="tsd-plan">
              <div class="tsd-plan-head">
                <span class="tsd-caret" :class="{ collapsed: !expanded }" @click="expanded = !expanded" />
                <span v-if="!embedded" class="tsd-checkbox" :class="{ checked: planChecked }" @click="togglePlan" />
                <span class="tsd-plan-name">{{ group.planName }}</span>
              </div>

              <div v-for="waybill in group.rows" v-show="expanded" :key="waybill.no" class="tsd-waybill">
                <span v-if="!embedded" class="tsd-checkbox" :class="{ checked: waybillChecked }" @click="waybillChecked = !waybillChecked" />
                <div class="tsd-waybill-info">
                  <span class="tsd-file-icon"><img :src="asset('detail-file.png')" alt="" /></span>
                  <div class="tsd-waybill-text">
                    <div class="tsd-waybill-no">
                      <span>{{ waybill.no }}</span>
                      <img class="tsd-clip" :src="asset('detail-paperclip.png')" alt="" />
                      <span class="tsd-tag inner">内部</span>
                    </div>
                    <div class="tsd-waybill-sub">
                      {{ waybill.driver }} | {{ waybill.phone }} | {{ waybill.plate }}
                    </div>
                  </div>
                </div>

                <div class="tsd-metric">
                  <div class="tsd-metric-label">打款状态</div>
                  <span class="tsd-tag green">{{ waybill.payStatus }}</span>
                </div>
                <div class="tsd-metric">
                  <div class="tsd-metric-label">核算运费</div>
                  <div class="tsd-metric-value">{{ waybill.settleFreight }}</div>
                </div>
                <div class="tsd-metric">
                  <div class="tsd-metric-label">基础运费</div>
                  <div class="tsd-metric-value">{{ waybill.baseFreight }}</div>
                </div>
                <div class="tsd-metric">
                  <div class="tsd-metric-label">路耗</div>
                  <div class="tsd-metric-value">{{ waybill.roadLoss }}</div>
                </div>
                <div class="tsd-metric">
                  <div class="tsd-metric-label">其他扣减</div>
                  <div class="tsd-metric-value">{{ waybill.otherDeduction }}</div>
                </div>
                <div class="tsd-metric">
                  <div class="tsd-metric-label">补贴金额</div>
                  <div class="tsd-metric-value">{{ waybill.subsidy }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：计费明细 -->
          <aside class="tsd-right">
            <div class="tsd-block">
              <div class="tsd-section-title">计费类型</div>
              <div class="tsd-desc-columns">
                <div class="tsd-desc-item"><span class="tsd-desc-label">计费类型</span><span>单位</span></div>
                <div class="tsd-desc-item"><span class="tsd-desc-label">费用模版</span><span>-</span></div>
              </div>
            </div>

            <div class="tsd-block">
              <div class="tsd-section-title">基础运费</div>
              <div class="tsd-desc-columns single">
                <div class="tsd-desc-item"><span class="tsd-desc-label">合计运费</span><span>{{ row.baseFreight }}</span></div>
              </div>
              <div class="tsd-desc-columns single">
                <div class="tsd-desc-item">
                  <span class="tsd-desc-label">计算规则</span>
                  <span>{{ draft ? '按各运单已确认的计价量与单价汇总，详见核算运单。' : '基础运费：装货重量37吨*150元/吨=5550.00元' }}</span>
                </div>
              </div>
            </div>

            <div class="tsd-block">
              <div class="tsd-section-title">补贴费用</div>
              <div class="tsd-empty">
                <img :src="asset('empty-box.png')" alt="" />
                <p>暂无数据</p>
              </div>
            </div>

            <div class="tsd-block">
              <div class="tsd-section-title">扣减费用</div>
              <div class="tsd-desc-columns single">
                <div class="tsd-desc-item"><span class="tsd-desc-label">合计扣减</span><span>{{ row.deduction === '-' ? 0 : row.deduction }}</span></div>
              </div>

              <p class="tsd-sub-title">路耗</p>
              <div class="tsd-table-wrap">
                <table class="tsd-table">
                  <colgroup>
                    <col style="width: 60px" />
                    <col style="width: 150px" />
                    <col style="width: 100px" />
                    <col style="width: 100px" />
                    <col style="width: 100px" />
                    <col style="width: 160px" />
                    <col style="width: 120px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>货品</th>
                      <th>损耗（kg）</th>
                      <th>货品单价</th>
                      <th>路耗(元)</th>
                      <th>关联子运单</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in roadLossRows" :key="item.index">
                      <td>{{ item.index }}</td>
                      <td>{{ item.goods }}</td>
                      <td>{{ item.weight }}</td>
                      <td>{{ item.price }}</td>
                      <td>{{ item.amount }}</td>
                      <td>{{ item.subWaybill }}</td>
                      <td><button class="tsd-link" type="button" @click="emit('notice', draft ? '当前示例：正差额超过允许损耗 0.3 吨的部分，按货品单价扣减。' : '路耗规则待接入')">查看路耗规则</button></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>合计</td>
                      <td />
                      <td />
                      <td />
                      <td>{{ draft ? money(draft.loss) : '0 元' }}</td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p class="tsd-sub-title other">其他扣减</p>
              <div class="tsd-empty">
                <img :src="asset('empty-box.png')" alt="" />
                <p>暂无数据</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <footer class="tsd-footer">
      <button class="ts-btn plain" type="button" @click="emit('close')">{{ embedded ? '返回工作台' : '取消' }}</button>
      <button v-if="!embedded" class="ts-btn primary" type="button" style="width: 86px" @click="markPaid">标记打款</button>
    <span v-if="embedded" class="tsd-created-note">已创建 · {{ draft.count }} 条运单 · 演示数据</span>
    </footer>
  </div>
</template>
