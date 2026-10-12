<template>
  <div class="publish-flow" data-annotation-container="modal" :data-annotation-content="addressPickerMode || editingAddress || ruleSheetOpen || pickerTarget ? null : 'modal'">
    <div v-show="step !== 3 && !addressPickerMode && !editingAddress && !ruleSheetOpen && !pickerTarget" class="publish-map" :class="{ 'annot-zhiyunShipperHome-field-publish-address-review': step === 1 }" aria-label="福州至厦门运输路线地图">
      <img src="/zhiyun-mobile-assets/quick-publish-map-reference.png" alt="" />
      <button class="back-hotspot" type="button" aria-label="返回" @click="handleBack"></button>
      <button v-for="mode in ['load', 'unload']" :key="mode" type="button" class="address-pin" :class="`address-pin-${mode}`" @click="openAddress(mode)">
        <span class="address-pin-label">{{ mode === 'load' ? '装货点' : '卸货点' }}</span>
        <strong>{{ addresses[mode]?.name || (mode === 'load' ? '请选择装货地址' : '请选择卸货地址') }}</strong>
        <small>{{ addresses[mode] ? ([addresses[mode].contactName, addresses[mode].contactPhone].filter(Boolean).join(' ') || '联系人选填') : '点击选择地址 · 联系人选填' }}</small>
        <b>›</b>
      </button>
      <span class="route-demo-label">路线示意 · 实际里程以所选地址为准</span>

      <!-- 智运运营条：压在路线示意条下方，替换地图图内烘焙的「至小简」提示。
           第二步只保留这一条运营表达，面板内不再重复 -->
      <div v-if="step === 2" class="map-ops">
        <div class="ops-line">
          <span class="ops-badge">智运运营</span>
          <span class="ops-body">
            <span class="ops-main">{{ opsMain }}</span>
            <span class="ops-sub">{{ networkLine }}</span>
          </span>
        </div>
      </div>
    </div>

    <section v-if="step === 1" v-show="!addressPickerMode && !editingAddress && !ruleSheetOpen && !pickerTarget" class="publish-sheet form-sheet annot-zhiyunShipperHome-field-publish-transport-conditions" aria-label="填写货源计划">
      <div v-if="prefill?.targetFleet" class="prefill-banner annot-zhiyunShipperHome-rule-target-driver">
        <p class="prefill-title">定向发布 · 已选择{{ prefill.targetFleet.kind === 'driver' ? '司机' : '车队' }}</p>
        <p class="prefill-line">{{ prefill.targetFleet.name }}</p>
        <p class="prefill-note">请填写本次货源信息</p>
      </div>
      <div v-else-if="prefill?.route" class="prefill-banner">
        <p class="prefill-title">来自行情测算</p>
        <p class="prefill-line">{{ prefill.route }} · {{ prefill.goods }} · {{ prefill.quantity }}吨 · {{ prefill.price }}元/吨</p>
        <p class="prefill-note">城市级线路，请核对并补充详细装卸地址后发布</p>
      </div>
      <div v-else-if="prefill?.resumeDraft" class="prefill-banner">
        <p class="prefill-title">继续发布 · {{ prefill.resumeDraft.cargoNo }}</p>
        <p class="prefill-line">已带出该货源已填写的信息</p>
        <p class="prefill-note">请核对并补充装卸地址与时间后发布</p>
      </div>
      <div class="date-row">
        <button type="button" class="date-block" :class="{ 'date-empty': !loadDate }" @click="openPicker('load')">
          <template v-if="loadDate">
            <strong>{{ formatDate(loadDate) }}</strong>
            <span>装货日期</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>装货日期</span>
          </template>
        </button>
        <span class="duration-pill">{{ durationText }}</span>
        <button type="button" class="date-block date-block-right" :class="{ 'date-empty': !unloadDate }" @click="openPicker('unload')">
          <template v-if="unloadDate">
            <strong>{{ formatDate(unloadDate) }}</strong>
            <span>卸货日期</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>卸货日期</span>
          </template>
        </button>
      </div>

      <button type="button" class="form-row">
        <span class="form-label">货品</span>
        <span class="form-value">{{ goodsText }} <b>›</b></span>
      </button>

      <div class="form-row">
        <span class="form-label">配载方式</span>
        <div class="load-modes">
          <button
            v-for="mode in loadModes"
            :key="mode"
            type="button"
            :class="{ active: loadMode === mode }"
            @click="loadMode = mode"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <label class="form-row">
        <span class="form-label">需求重量</span>
        <span class="input-wrap">
          <input v-model="weight" inputmode="decimal" placeholder="请输入" />
          <b>吨</b>
        </span>
      </label>

      <div class="form-row road-loss-row">
        <span class="form-label">路耗容忍值</span>
        <div class="road-loss-inputs">
          <label>− <input v-model="roadLossMinus" inputmode="decimal" placeholder="选填" aria-label="允许少收吨数" /> 吨</label>
          <label>＋ <input v-model="roadLossPlus" inputmode="decimal" placeholder="选填" aria-label="允许多收吨数" /> 吨</label>
        </div>
      </div>

      <button type="button" class="form-row" @click="ruleSheetOpen = true">
        <span class="form-label">核算规则</span>
        <span class="form-value">{{ selectedRuleTemplate?.name || '选择模板' }}{{ ruleCustomized ? ' · 已调整' : '' }} <b>›</b></span>
      </button>
      <p v-if="selectedRuleTemplate" class="rule-summary">补贴 {{ subsidy || 0 }} 元 · 扣减 {{ deduction || 0 }} 元 · {{ rounding }}</p>

      <label class="form-row">
        <span class="form-label">运输单价</span>
        <span class="input-wrap price-input">
          <input v-model="price" inputmode="decimal" placeholder="请输入" />
          <b>元｜吨</b>
        </span>
      </label>

      <div class="form-row">
        <span class="form-label">是否开票</span>
        <div class="invoice-options">
          <button type="button" :class="{ active: invoiceRequired === true }" @click="invoiceRequired = true">需要开票</button>
          <button type="button" :class="{ active: invoiceRequired === false }" @click="invoiceRequired = false">无需开票</button>
        </div>
      </div>

      <p v-if="publishError" class="form-error" role="alert">{{ publishError }}</p>
    </section>

    <section v-else class="publish-sheet mode-sheet" aria-label="选择发布方式">
      <div class="mode-scroll">
        <header class="mode-head">
          <h2>选择发布方式</h2>
        </header>

        <!-- 发布方式：货主只决定是自己挑平台、还是邀请常用运力。
             运营表达统一由地图上的「智运运营」条承载，面板内不再重复 -->
        <div class="publish-modes" role="group" aria-label="发布方式">
          <button
            v-for="mode in publishModes"
            :key="mode.key"
            type="button"
            :class="{ active: publishMode === mode.key }"
            @click="publishMode = mode.key"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- 邀请我的运力：车队与个体司机合并为一份名单，勾选后发出邀请、对方自主接单 -->
        <div v-if="publishMode === 'fleet'" class="capacity-block">
          <div class="capacity-head">
            <strong>我的运力</strong>
            <span>已选 {{ selectedCapacity.length }} / {{ myCapacity.length }}</span>
          </div>
          <button
            v-for="item in myCapacity"
            :key="item.id"
            type="button"
            class="capacity-row"
            :class="{ on: selectedCapacity.includes(item.id) }"
            @click="toggleCapacity(item.id)"
          >
            <span class="capacity-avatar" aria-hidden="true">{{ item.name.slice(0, 1) }}</span>
            <span class="capacity-main">
              <span class="capacity-name-row"><strong>{{ item.name }}</strong><em>{{ item.plate }}</em></span>
              <small>{{ item.vehicle }} · {{ item.coopText }}</small>
              <small class="capacity-src">运力来源 · {{ item.platform }}｜准时率 {{ item.onTime }}</small>
            </span>
            <span class="capacity-check" :class="{ checked: selectedCapacity.includes(item.id) }">{{ selectedCapacity.includes(item.id) ? '✓' : '' }}</span>
          </button>
          <p class="capacity-note">邀请后由对方自主决定是否接单，不预先分配运力</p>
        </div>

        <!-- 公开发布：货主在公共平台池中自选。
             左竖排按运输方式筛选，右侧顶部横排决策口径 -->
        <div v-else>
          <div class="mode-body">
            <div class="mode-rail" role="tablist" aria-label="按运输方式筛选">
              <button
                v-for="tag in tagFilters"
                :key="tag.key"
                type="button"
                role="tab"
                :aria-selected="activeTag === tag.key"
                :class="{ active: activeTag === tag.key }"
                @click="selectTag(tag.key)"
              >
                <span class="rail-label">{{ tag.label }}</span>
                <span class="rail-count">{{ tag.count }}</span>
              </button>
            </div>

            <div class="mode-pane">
              <!-- 决策口径：切换后按口径重新排序并给出推荐理由，不是静态高亮 -->
              <div class="sort-tabs" role="group" aria-label="排序口径">
                <button
                  v-for="tab in sortTabs"
                  :key="tab.key"
                  type="button"
                  :class="{ active: sortKey === tab.key }"
                  @click="sortKey = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>

              <div class="platform-list" :class="{ 'annot-zhiyunShipperHome-rule-publish-platform-quota': step === 2 }">
                <PlatformSelectRow
                  v-for="platform in platformRows"
                  :key="platform.id"
                  :logo="platform.logo"
                  :logo-color="platform.color"
                  :name="platform.name"
                  :feature="platform.feature"
                  :tags="platform.biz"
                  :state="platform.stateText"
                  :state-label="platform.stateLabel"
                  :state-value="platform.stateValue"
                  state-unit=""
                  :muted="platform.quotaBlocked"
                  :meta="platform.metaText"
                  :note="platform.promise"
                  :reason="platform.reason"
                  :checked="selectedPlatforms.includes(platform.id)"
                  :selectable="!platform.quotaBlocked"
                  @select="togglePlatform(platform.id)"
                />
              </div>

              <!-- 默认只看智运推荐，展开后看该标签下的全部平台 -->
              <button v-if="hiddenCount > 0" type="button" class="expand-row" @click="expanded = true">
                查看全部 {{ filteredPlatforms.length }} 个平台 ∨
              </button>
              <button v-else-if="expanded && filteredPlatforms.length > 3" type="button" class="expand-row" @click="expanded = false">
                收起，只看智运推荐 ∧
              </button>

              <div class="select-bar">
                <button type="button" class="select-all" :class="{ on: allVisibleSelected }" @click="toggleSelectAll">
                  {{ allVisibleSelected ? '取消全选' : '全选推荐' }}
                </button>
                <span class="select-hint">已选 {{ selectedPlatforms.length }} 个平台</span>
              </div>

              <p class="filter-note">平台承接情况实时变化，以提交时为准</p>
              <p v-if="!selectedPlatforms.length" class="form-error mode-error" role="alert">请至少选择一个发布平台</p>
            </div>
          </div>
        </div>
        <p v-if="submissionError" class="form-error mode-error" role="alert">{{ submissionError }}</p>
      </div>

      <div class="confirm-bar" :class="{ 'annot-zhiyunShipperHome-rule-publish-price-estimate': step === 2 }">
        <div class="estimate-total">
          <span v-if="estimateTotal">预估 <b>{{ estimateTotal }}</b> 元</span>
          <span v-else>预估 —</span>
          <small>{{ confirmHint }}</small>
        </div>
        <button type="button" class="confirm-action" :disabled="!canPublish" @click="goSuccess">{{ confirmLabel }}</button>
      </div>
    </section>

    <!-- 第一步的操作栏：固定在面板之上，不随表单内容滚动 -->
    <div v-if="step === 1" class="primary-action-bar">
      <button type="button" class="primary-action" :disabled="!canGoStep2" @click="step = 2">
        下一步，选择发布方式
      </button>
    </div>

    <!-- 第三步：发布成功 + 推荐运力（Pixso 7:798） -->
    <PublishSuccessPage v-if="step === 3" :published="publishedInfo" @back="backToHome" />

    <AddressPickerPage
      v-if="addressPickerMode"
      :mode="addressPickerMode"
      @back="addressPickerMode = ''"
      @confirm="onAddressPicked"
      @set-alias="addressPickerMode = ''"
    />

    <div v-if="editingAddress" class="fp-overlay" data-annotation-container="drawer" @click.self="editingAddress = ''">
      <section class="fp-sheet detail-sheet annot-zhiyunShipperHome-field-publish-address-edit" data-annotation-content="drawer">
        <div class="fp-sheet-head">
          <h2>{{ editingAddress === 'load' ? '装货地址与联系人' : '卸货地址与联系人' }}</h2>
          <button type="button" aria-label="关闭" @click="editingAddress = ''">×</button>
        </div>
        <button type="button" class="detail-change" @click="changeAddress">{{ addressDraft.name || '选择地址' }} <span>更换地址 ›</span></button>
        <label class="detail-field">详细地址<input v-model.trim="addressDraft.detail" placeholder="请输入门牌号等详细地址" /></label>
        <label class="detail-field">地址联系人（选填）<input v-model.trim="addressDraft.contactName" placeholder="请输入联系人姓名" /></label>
        <label class="detail-field">联系电话（选填）<input v-model.trim="addressDraft.contactPhone" inputmode="tel" placeholder="请输入联系电话" /></label>
        <p v-if="addressError" class="form-error" role="alert">{{ addressError }}</p>
        <button type="button" class="detail-save" @click="saveAddress">保存地址信息</button>
      </section>
    </div>

    <div v-if="ruleSheetOpen" class="fp-overlay" data-annotation-container="drawer" @click.self="ruleSheetOpen = false">
      <section class="fp-sheet rule-sheet annot-zhiyunShipperHome-rule-publish-template-local" data-annotation-content="drawer">
        <div class="fp-sheet-head"><h2>核算规则</h2><button type="button" aria-label="关闭" @click="ruleSheetOpen = false">×</button></div>
        <p class="sheet-hint">选择示例模板会带入规则，本单各项仍可修改</p>
        <div class="rule-template-list">
          <button v-for="item in ruleTemplates" :key="item.id" type="button" :class="{ active: ruleTemplateId === item.id }" @click="applyRuleTemplate(item)">{{ item.name }}</button>
        </div>
        <p class="sheet-hint">运输单价已带入主表单，可直接在主表单修改</p>
        <label class="detail-field">补贴项（元）<input v-model="subsidy" inputmode="decimal" placeholder="0" /></label>
        <label class="detail-field">扣减项（元）<input v-model="deduction" inputmode="decimal" placeholder="0" /></label>
        <div class="rounding-row"><span>抹零规则</span><select v-model="rounding"><option>不抹零</option><option>抹去角分</option><option>四舍五入到元</option></select></div>
        <button type="button" class="detail-save" :disabled="!selectedRuleTemplate" @click="ruleSheetOpen = false">完成</button>
      </section>
    </div>

    <!-- 装卸货日期选择：沿用原日期列表弹层，只精确到日 -->
    <div v-if="pickerTarget" class="fp-overlay" data-annotation-container="drawer" @click.self="pickerTarget = ''">
      <section class="fp-sheet" data-annotation-content="drawer">
        <div class="fp-sheet-head">
          <h2>{{ pickerTarget === 'load' ? '选择装货日期' : '选择卸货日期' }}</h2>
          <button type="button" aria-label="关闭" @click="pickerTarget = ''">×</button>
        </div>
        <div class="date-option-list">
          <button v-for="option in dateOptions" :key="option.value" type="button" class="fp-option" @click="pickDate(option)">
            <span class="fp-option-main">{{ option.label }}</span>
            <span class="fp-option-sub">{{ option.sub }}</span>
          </button>
        </div>
        <p v-if="pickerError" class="form-error" role="alert">{{ pickerError }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import PlatformSelectRow from '../shared/PlatformSelectRow.vue'
import PublishSuccessPage from './PublishSuccessPage.vue'
import AddressPickerPage from './AddressPickerPage.vue'

const props = defineProps({ prefill: { type: Object, default: null } })
const emit = defineEmits(['back', 'published'])

const step = ref(1)
const loadModes = ['吨', '方', '车']
const loadMode = ref('吨')
const goodsText = ref(props.prefill?.goods || '普货')
const weight = ref(props.prefill?.quantity == null ? '' : String(props.prefill.quantity))
const price = ref(props.prefill?.price == null ? '' : String(props.prefill.price))
/* 首页仅传入货主确认过的地址；进入发布页后仍可点击两端地址更换或补充。 */
const addresses = ref({
  load: props.prefill?.addresses?.load ? { ...props.prefill.addresses.load } : null,
  unload: props.prefill?.addresses?.unload ? { ...props.prefill.addresses.unload } : null,
})
const addressPickerMode = ref('')
const editingAddress = ref('')
const addressDraft = ref({ name: '', detail: '', contactName: '', contactPhone: '' })
const addressError = ref('')
const roadLossMinus = ref('')
const roadLossPlus = ref('')
const invoiceRequired = ref(null)
/* 以下是可交互的原型示例模板，不代表生产环境已有配置。 */
const ruleTemplates = [
  { id: 'standard', name: '常规运输核算', price: '285', subsidy: '0', deduction: '0', rounding: '不抹零' },
  { id: 'subsidy', name: '含补贴运输核算', price: '300', subsidy: '100', deduction: '0', rounding: '四舍五入到元' },
]
const ruleTemplateId = ref('')
const ruleSheetOpen = ref(false)
const subsidy = ref('0')
const deduction = ref('0')
const rounding = ref('不抹零')
const selectedRuleTemplate = computed(() => ruleTemplates.find((item) => item.id === ruleTemplateId.value))
const ruleCustomized = computed(() => Boolean(selectedRuleTemplate.value) && (
  price.value !== selectedRuleTemplate.value.price ||
  subsidy.value !== selectedRuleTemplate.value.subsidy ||
  deduction.value !== selectedRuleTemplate.value.deduction ||
  rounding.value !== selectedRuleTemplate.value.rounding
))

const openAddress = (mode) => {
  addressError.value = ''
  if (!addresses.value[mode]) {
    addressPickerMode.value = mode
    return
  }
  addressDraft.value = { ...addresses.value[mode] }
  editingAddress.value = mode
}
const onAddressPicked = (addr) => {
  const previous = addresses.value[addr.mode]
  addressDraft.value = {
    name: addr.name,
    detail: addr.detail || '',
    contactName: previous?.name === addr.name ? previous.contactName : '',
    contactPhone: previous?.name === addr.name ? previous.contactPhone : '',
  }
  addressPickerMode.value = ''
  editingAddress.value = addr.mode
  addressError.value = ''
}
const changeAddress = () => {
  addressPickerMode.value = editingAddress.value
  editingAddress.value = ''
}
const saveAddress = () => {
  if (!addressDraft.value.name || !addressDraft.value.detail) addressError.value = '请补充详细地址'
  else if (addressDraft.value.contactPhone && !/^[+\d()\-\s]{6,20}$/.test(addressDraft.value.contactPhone)) addressError.value = '请填写有效联系电话或留空'
  else {
    addresses.value[editingAddress.value] = { ...addressDraft.value }
    editingAddress.value = ''
    addressError.value = ''
  }
}
const applyRuleTemplate = (item) => {
  ruleTemplateId.value = item.id
  price.value = item.price
  subsidy.value = item.subsidy
  deduction.value = item.deduction
  rounding.value = item.rounding
}

/* 装卸货日期默认空，选择后按日保存，不附带固定时分。 */
const loadDate = ref('')
const unloadDate = ref('')
const pickerTarget = ref('') // '' | 'load' | 'unload'
const pickerError = ref('')
const dateOptions = Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return {
    value: `${date.getFullYear()}-${month}-${day}`,
    label: `${month}月${day}日`,
    sub: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
  }
})
const formatDate = (value) => {
  const [, month, day] = value.split('-')
  return `${month}月${day}日`
}
const durationText = computed(() => {
  if (!loadDate.value || !unloadDate.value) return '待定'
  const elapsed = Date.parse(unloadDate.value) - Date.parse(loadDate.value)
  return elapsed >= 0 ? `共${Math.round(elapsed / 86400000) + 1}天` : '待核对'
})

const publishMode = ref('open')
/* 货主的两种投递方式：公开发布走平台公域，邀请我的运力走货主私域。
   运营指定范围本轮不做，平台范围即公共平台池 */
const publishModes = [
  { key: 'open', label: '公开发布' },
  { key: 'fleet', label: '邀请我的运力' },
]

/* 我的运力名单：车队与个体司机合并为一份，货主只维护一份，发布时在同一处选择。
   复用首页推荐运力与司机档案的既有数据，避免另行编造 */
const myCapacity = [
  { id: 'c1', kind: 'driver', name: '李师傅', plate: '闽A·6K32', vehicle: '13米高栏 · 31吨', coopText: '合作过 6 次', onTime: '98%', platform: '象奔奔' },
  { id: 'c2', kind: 'driver', name: '王师傅', plate: '闽A·2P85', vehicle: '13米高栏 · 31吨', coopText: '合作过 3 次', onTime: '96%', platform: '金石智运' },
  { id: 'c3', kind: 'driver', name: '张师傅', plate: '闽A·8P17', vehicle: '17米平板 · 32吨', coopText: '合作过 2 次', onTime: '95%', platform: '象奔奔' },
]
const selectedCapacity = ref(['c1', 'c2'])
const toggleCapacity = (id) => {
  selectedCapacity.value = selectedCapacity.value.includes(id)
    ? selectedCapacity.value.filter((item) => item !== id)
    : [...selectedCapacity.value, id]
}

/* 平台池：聚合接入的运力平台。id 前三个与行情页 ai-home-data 保持一致，
   确保从行情测算带入的勾选能对上。
   biz 为该平台承接的业务形态，供竖排筛选与平台行标签；业务形态是货主选平台时
   最先要问的一刀，与顶部排序口径正交。
   recommended 为智运默认收敛的推荐平台，其余折叠待展开；
   quotaBlocked 表示平台侧承接已满：行保留展示但不可勾选，不出现额度概念 */
const platforms = [
  { id: 'zhiyun', logo: '象', name: '象奔奔', feature: '适配大宗散货', biz: ['整车', '专线'], promise: '全程可视化 · 超时赔付', capacity: 240, cover: '12省', response: 15, reason: '运力足，适合大宗长途', color: '#246df7', recommended: true },
  { id: 'jinshi', logo: '金', name: '金石智运', feature: '干线网络覆盖广', biz: ['整车', '专线'], promise: '电子回单 · 在线对账', capacity: 32, cover: '8省', response: 15, reason: '回单结算省心，适合常规干线', color: '#52b8ea', recommended: true },
  { id: 'haoyun', logo: '好运', name: '超好运', feature: '运力调度灵活', biz: ['整车'], promise: '车费护航 · 响应优先', capacity: 120, cover: '6省', response: 8, reason: '接单快，适合临时急发', color: '#2389ee', recommended: true, quotaBlocked: true },
  { id: 'zhongchu', logo: '中', name: '中储智运', feature: '跨省直连网络', biz: ['整车', '专线'], promise: '运价透明 · 在线结算', capacity: 180, cover: '15省', response: 12, reason: '覆盖最广，适合跨省长线', color: '#3d6fe0' },
  { id: 'chuanhua', logo: '传', name: '传化智联', feature: '全国公路港布局', biz: ['整车', '零担', '城配'], promise: '仓配一体 · 中转便利', capacity: 210, cover: '14省', response: 18, reason: '枢纽中转，适合多段运输', color: '#0f8f6b' },
  { id: 'luge', logo: '路', name: '路歌', feature: '直采车队为主', biz: ['整车'], promise: '无中间加价 · 车源真实', capacity: 95, cover: '10省', response: 20, reason: '直采运力，适合控成本', color: '#e08b2c' },
  { id: 'fuyou', logo: '福', name: '福佑卡车', feature: '整车干线直达', biz: ['整车', '专线'], promise: '全程可视 · 时效保障', capacity: 160, cover: '11省', response: 10, reason: '时效稳定，适合赶工期', color: '#d0503a' },
  { id: 'g7', logo: 'G7', name: 'G7汇通', feature: '车联网数据驱动', biz: ['整车'], promise: '实时轨迹 · 在途可视', capacity: 88, cover: '9省', response: 22, reason: '在途可视，适合高货值', color: '#7a5cf0' },
  { id: 'rrs', logo: '日', name: '日日顺', feature: '大件物流专长', biz: ['整车', '城配'], promise: '送装一体 · 上门服务', capacity: 76, cover: '7省', response: 25, reason: '大件专长，适合家电家具', color: '#2c8fd8' },
  { id: 'zhongjiao', logo: '交', name: '中交兴路', feature: '北斗定位调度', biz: ['整车', '零担'], promise: '智能调度 · 配载优化', capacity: 130, cover: '13省', response: 16, reason: '调度精准，适合配载复杂', color: '#5b7f4a' },
  { id: 'anneng', logo: '安', name: '安能物流', feature: '零担网点密集', biz: ['零担', '城配'], promise: '小批量友好 · 快运时效', capacity: 55, cover: '6省', response: 30, reason: '零担友好，适合小批量', color: '#c2452f' },
  { id: 'puluo', logo: '普', name: '普洛斯', feature: '枢纽中转 长距省成本', biz: ['专线'], promise: '枢纽联运 · 长距优化', capacity: 40, cover: '5省', response: 28, reason: '长距省成本，适合枢纽直发', color: '#4a6ba8' },
]

/* 网络规模：由平台池汇总。压成一行文案，不占版面、不抢平台列表的视觉重心 */
const networkLine = computed(() => (
  `${platforms.length} 个平台 · ${platforms.reduce((sum, p) => sum + p.capacity, 0).toLocaleString()} 辆运力 · 最快 ${Math.min(...platforms.map((p) => p.response))} 分钟响应`
))

/* 智运运营条：页面里智运自己的发声，讲清智运替货主做了什么 */
const opsMain = computed(() => (
  publishMode.value === 'fleet'
    ? '按你的选择向常用运力发出邀请，对方自主接单'
    : '已按本单线路为你收敛可用平台'
))

/* 竖排筛选：按业务形态收敛，决定右侧看到哪一批平台。
   业务形态是公路货运的通用分法，不随平台增减变化；全部为默认 */
const bizFilters = ['全部', '整车', '零担', '专线', '城配']
const tagFilters = computed(() => bizFilters.map((label) => ({
  key: label,
  label,
  count: label === '全部'
    ? platforms.length
    : platforms.filter((p) => p.biz.includes(label)).length,
})))
const activeTag = ref('全部')
/* 展开后查看全部平台；默认只看智运收敛的推荐平台 */
const expanded = ref(false)

/* 决策口径：切换后平台按该口径重新排序，智能推荐为默认。
   排序依据为原型示例，不代表已上线的运营策略。 */
const sortTabs = [
  { key: 'recommend', label: '智能推荐' },
  { key: 'response', label: '响应最快' },
  { key: 'capacity', label: '运力最足' },
]
const sortKey = ref('recommend')
/* 默认沿用行情页勾选的平台；未从行情页进入时给一个可用的初始选择 */
const selectedPlatforms = ref(props.prefill?.platformIds?.length ? [...props.prefill.platformIds] : ['zhiyun', 'jinshi'])

const togglePlatform = (id) => {
  selectedPlatforms.value = selectedPlatforms.value.includes(id)
    ? selectedPlatforms.value.filter((item) => item !== id)
    : [...selectedPlatforms.value, id]
}

/* 非正数或空值阻断发布衔接，避免带着无效货量算钱 */
const weightNum = computed(() => Number(weight.value))
const weightError = computed(() => {
  const raw = weight.value
  if (!String(raw).trim()) return '请填写需求重量'
  if (!Number.isFinite(Number(raw))) return '需求重量请输入数字'
  if (Number(raw) <= 0) return '需求重量需大于0'
  return ''
})
const roadLossError = computed(() => {
  if ([roadLossMinus.value, roadLossPlus.value].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) return '路耗范围请输入非负数或留空'
  return ''
})
const roadLossSummary = computed(() => {
  if (roadLossMinus.value === '' && roadLossPlus.value === '') return '未设置'
  return `−${roadLossMinus.value || 0}/＋${roadLossPlus.value || 0} 吨`
})
const publishError = computed(() => {
  if (!addresses.value.load || !addresses.value.unload) return '请分别填写装货、卸货地址'
  if (!loadDate.value || !unloadDate.value) return '请选择装货和卸货日期'
  if (unloadDate.value < loadDate.value) return '卸货日期不能早于装货日期'
  if (weightError.value) return weightError.value
  if (roadLossError.value) return roadLossError.value
  if (!selectedRuleTemplate.value) return '请选择核算规则模板'
  if (!Number.isFinite(Number(price.value)) || Number(price.value) <= 0) return '运输单价需大于0'
  if ([subsidy.value, deduction.value].some((value) => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) return '补贴项和扣减项请输入非负数'
  if (invoiceRequired.value === null) return '请选择是否开票'
  return ''
})
const canGoStep2 = computed(() => !publishError.value)

/* 底部条随投递方式联动：邀请模式下勾的是人、不是平台，校验与文案都要跟着变 */
const canPublish = computed(() => (
  publishMode.value === 'fleet' ? selectedCapacity.value.length > 0 : selectedPlatforms.value.length > 0
))
const confirmLabel = computed(() => (publishMode.value === 'fleet' ? '发出邀请' : '确认发布'))
const confirmHint = computed(() => {
  if (publishMode.value === 'fleet') return `将向 ${selectedCapacity.value.length} 位常用运力发出邀请，对方自主接单`
  return `已选 ${selectedPlatforms.value.length} 个平台`
})

/* 预估总价 = 货量 × 货主填写的运输单价，所有平台一致；不再按平台分别报价 */
const priceNum = computed(() => Number(price.value))
/* 各口径下的排序依据；推荐理由与平台绑定（见 platforms.reason），
   切换口径只改变排序，不再改理由，避免各行同话或一换口径就跳变 */
const sortRules = {
  recommend: (p) => p.capacity / 240 + (60 - p.response) / 60,
  response: (p) => -p.response,
  capacity: (p) => p.capacity,
}

/* 平台行构造：按标签筛选 → 按口径排序 → 已满平台排末位 */
const mapPlatformRow = (p) => ({
  ...p,
  stateLabel: p.quotaBlocked ? '' : '预计司机接单',
  stateValue: p.quotaBlocked ? '' : `${p.response}分钟`,
  stateText: p.quotaBlocked ? '接单已满' : '',
  metaText: p.quotaBlocked
    ? `今日承接已满 · 可改用${platforms.find((item) => !item.quotaBlocked)?.name || '其他平台'}`
    : `运力${p.capacity}辆｜覆盖${p.cover}`,
  reason: p.quotaBlocked ? '' : p.reason,
})
/* 竖排筛选：在平台池中按业务形态收敛 */
const filteredPlatforms = computed(() => (
  activeTag.value === '全部'
    ? platforms
    : platforms.filter((p) => p.biz.includes(activeTag.value))
))
/* 默认只展示智运收敛的推荐平台，展开后展示该标签下的全部平台 */
const visiblePlatforms = computed(() => (
  expanded.value ? filteredPlatforms.value : filteredPlatforms.value.filter((p) => p.recommended)
))
const hiddenCount = computed(() => filteredPlatforms.value.length - visiblePlatforms.value.length)

const platformRows = computed(() => {
  const score = sortRules[sortKey.value] || sortRules.recommend
  /* 不可选平台固定排末位，不参与口径排序 */
  return [...visiblePlatforms.value]
    .sort((a, b) => {
      if (a.quotaBlocked !== b.quotaBlocked) return a.quotaBlocked ? 1 : -1
      return score(b) - score(a)
    })
    .map(mapPlatformRow)
})

/* 批量操作：仅按当前标签下的推荐平台生效，避免一键选中未展开的平台 */
const selectableVisible = computed(() => visiblePlatforms.value.filter((p) => !p.quotaBlocked))
const allVisibleSelected = computed(() => (
  selectableVisible.value.length > 0
  && selectableVisible.value.every((p) => selectedPlatforms.value.includes(p.id))
))
const toggleSelectAll = () => {
  const ids = selectableVisible.value.map((p) => p.id)
  selectedPlatforms.value = allVisibleSelected.value
    ? selectedPlatforms.value.filter((id) => !ids.includes(id))
    : Array.from(new Set([...selectedPlatforms.value, ...ids]))
}
/* 切换标签时收起展开态，回到「智运推荐」的默认视图 */
const selectTag = (key) => {
  activeTag.value = key
  expanded.value = false
}
const estimateTotal = computed(() => {
  if (weightNum.value <= 0 || !Number.isFinite(priceNum.value) || priceNum.value <= 0) return ''
  return (weightNum.value * priceNum.value).toLocaleString()
})

/* 成功页展示实际发布信息：货主填写的单价即发布单价 */
const publishedInfo = computed(() => ({
  publishMode: publishMode.value,
  platformNames: platforms.filter((item) => selectedPlatforms.value.includes(item.id)).map((item) => item.name),
  invitedNames: myCapacity.filter((item) => selectedCapacity.value.includes(item.id)).map((item) => item.name),
  goods: goodsText.value,
  quantity: weightNum.value > 0 ? weightNum.value : '',
  price: priceNum.value > 0 ? priceNum.value : '',
  loadDate: loadDate.value,
  unloadDate: unloadDate.value,
  loadAddress: addresses.value.load,
  unloadAddress: addresses.value.unload,
  roadLossMinus: roadLossMinus.value,
  roadLossPlus: roadLossPlus.value,
  ruleTemplate: selectedRuleTemplate.value?.name,
  subsidy: subsidy.value,
  deduction: deduction.value,
  rounding: rounding.value,
  invoiceRequired: invoiceRequired.value,
}))

const openPicker = (target) => {
  pickerTarget.value = target
  pickerError.value = ''
}
const pickDate = (option) => {
  if (pickerTarget.value === 'unload' && loadDate.value && option.value < loadDate.value) {
    pickerError.value = '卸货日期不能早于装货日期'
    return
  }
  if (pickerTarget.value === 'load') {
    loadDate.value = option.value
  } else {
    unloadDate.value = option.value
  }
  pickerTarget.value = ''
}

const handleBack = () => {
  if (step.value === 2) {
    step.value = 1
    return
  }
  emit('back')
}

// 两种投递方式分别校验，公开发布保留已上线的平台可用性复核。
const submissionError = ref('')
const goSuccess = () => {
  submissionError.value = ''
  if (publishError.value || !canPublish.value) return
  if (publishMode.value === 'open') {
    const changedPlatforms = selectedPlatforms.value.filter((id) => !platforms.some((p) => p.id === id && !p.quotaBlocked))
    if (changedPlatforms.length) {
      const names = changedPlatforms.map((id) => platforms.find((p) => p.id === id)?.name || id)
      selectedPlatforms.value = selectedPlatforms.value.filter((id) => !changedPlatforms.includes(id))
      submissionError.value = `${names.join('、')}当前不可承接，请重新核对发布平台`
      return
    }
  }
  step.value = 3
}

const backToHome = () => {
  step.value = 1
  emit('back')
}
</script>

<style scoped>
.publish-flow {
  position: absolute;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  background: #f5f7fb;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.publish-map {
  position: absolute;
  inset: 0 0 auto;
  height: 406px;
  overflow: hidden;
  background: #e9f1fb;
}

.publish-map > img {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 812px;
  object-fit: fill;
}

.back-hotspot {
  position: absolute;
  left: 7px;
  top: 42px;
  width: 34px;
  height: 42px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.address-pin {
  position: absolute;
  z-index: 1;
  width: 174px;
  min-height: 58px;
  padding: 10px 20px 7px 10px;
  border: 0;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(42, 69, 111, 0.2);
  text-align: left;
  color: #2b3444;
  cursor: pointer;
}
.address-pin-load { top: 88px; right: 17px; }
.address-pin-unload { top: 276px; left: 16px; }
.address-pin-label {
  position: absolute;
  bottom: 100%;
  left: 0;
  padding: 3px 8px;
  border-radius: 6px 6px 0 0;
  background: #3866ff;
  color: #fff;
  font-size: 10px;
}
.address-pin-unload .address-pin-label { background: #20b99e; }
.address-pin strong, .address-pin small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.address-pin strong { font-size: 12px; line-height: 17px; }
.address-pin small { margin-top: 2px; color: #8a91a1; font-size: 10px; }
.address-pin b { position: absolute; right: 8px; top: 17px; color: #8a91a1; font-size: 18px; font-weight: 400; }
.route-demo-label { position: absolute; z-index: 1; top: 192px; left: 50%; transform: translateX(-50%); padding: 4px 7px; border-radius: 3px; background: #3c4655; color: #fff; white-space: nowrap; font-size: 10px; }

/* 地图底部的智运运营条：地图底图是整页截图，底部烘焙着旧版「至小简」提示；
   用一条实底横带覆盖该区域，第二步只保留这一条运营表达 */
.map-ops {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  padding: 6px 12px 8px;
  background: #f0f5ff;
}
.map-ops .ops-line {
  margin-bottom: 0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(20, 40, 90, 0.08);
}

.publish-sheet {
  position: absolute;
  left: 0;
  right: 0;
  top: 405px;
  bottom: 0;
  z-index: 2;
  box-sizing: border-box;
  border-radius: 20px 20px 0 0;
  background: #fff;
  /* 内容超出面板高度时滚动 */
  overflow-y: auto;
  scrollbar-width: none;
}
.publish-sheet::-webkit-scrollbar { display: none; }

/* 表单面板底部止于固定操作栏上沿（操作栏高 79px + 底距 20px） */
.form-sheet {
  bottom: 99px;
  padding: 24px 29px 20px;
}

.prefill-banner{margin-bottom:10px;padding:9px 11px;border-radius:8px;background:#eef4ff}
.prefill-title{margin:0;color:#3a65ff;font-size:11px;font-weight:700}
.prefill-line{margin:3px 0 0;color:#1f2a3d;font-size:13px;font-weight:600}
.prefill-note{margin:2px 0 0;color:#747c8c;font-size:11px}

.date-row {
  position: relative;
  height: 72px;
  display: flex;
  justify-content: space-between;
}

.date-block {
  width: 128px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #333;
  text-align: left;
}

.date-block-right { text-align: right; }
.date-block strong {
  display: block;
  font-size: 20px;
  line-height: 27px;
  font-weight: 500;
}
.date-block span {
  display: block;
  margin-top: 3px;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.duration-pill {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 58px;
  height: 20px;
  border: 1px solid #d8dce6;
  border-radius: 11px;
  color: #596171;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.duration-pill::before,
.duration-pill::after {
  content: '';
  position: absolute;
  top: 9px;
  width: 30px;
  height: 1px;
  background: #e5e7ed;
}
.duration-pill::before { right: 58px; }
.duration-pill::after { left: 58px; }

.form-row {
  width: 100%;
  height: 51px;
  padding: 0;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  color: #333;
  text-align: left;
}
.form-label {
  font-size: 16px;
  font-weight: 500;
}
.form-value {
  font-size: 14px;
  color: #333;
}
.form-value b {
  margin-left: 5px;
  color: #999;
  font-size: 19px;
  font-weight: 400;
}

.load-modes {
  display: flex;
  gap: 8px;
}
.load-modes button {
  width: 38px;
  height: 27px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: #f5f5f6;
  color: #555;
  font-size: 13px;
}
.load-modes button.active {
  border: 1px solid #3866ff;
  background: #edf2ff;
  color: #3866ff;
}

.input-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
}
.input-wrap input {
  width: 70px;
  padding: 0 6px 0 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #333;
  font: inherit;
  text-align: right;
}
.input-wrap input::placeholder { color: #aaa; }
.input-wrap b { font-weight: 500; }
.price-input input { width: 66px; }
.road-loss-row { height: 55px; }
.road-loss-inputs { display: flex; align-items: center; gap: 6px; }
.road-loss-inputs label { display: flex; align-items: center; gap: 3px; color: #596171; font-size: 11px; white-space: nowrap; }
.road-loss-inputs input { width: 38px; padding: 5px 2px; border: 1px solid #e1e6ef; border-radius: 4px; outline-color: #3866ff; text-align: center; font-size: 12px; }
.road-loss-inputs input::placeholder { color: #aaa; font-size: 10px; }
.rule-summary { margin: -6px 0 4px; color: #8a91a1; text-align: right; font-size: 10px; }
.invoice-options { display: flex; gap: 6px; }
.invoice-options button { padding: 6px 8px; border: 1px solid transparent; border-radius: 5px; background: #f5f5f6; color: #555; font-size: 11px; }
.invoice-options button.active { border-color: #3866ff; background: #edf2ff; color: #3866ff; }

.primary-action-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  z-index: 3;
  height: 79px;
  padding: 15px 28px 16px;
  box-sizing: border-box;
  border-top: 1px solid #edf0f5;
  background: #fff;
}
.primary-action {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 6px;
  background: #3866ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.primary-action:disabled {
  background: #b9c4d9;
  cursor: not-allowed;
}

/* 未选择时间时的占位态 */
.date-block.date-empty strong { color: #b6bcc8; }
.date-block.date-empty span { color: #b6bcc8; }

.form-error {
  margin: 2px 0 0;
  color: #d56b34;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
}

/* 面板本身不分栏：内容区滚动、确认栏固定在下沿，两者互不遮挡 */
.mode-sheet {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 16px;
}
.mode-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.mode-scroll::-webkit-scrollbar { display: none; }
.mode-head h2 {
  margin: 0;
  color: #252b3a;
  font-size: 17px;
  line-height: 23px;
  font-weight: 700;
}
.mode-head p {
  margin: 3px 0 6px;
  color: #747c8c;
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
}

/* 智运运营条：一行讲清智运替货主做了什么，规模作副行辅助。
   压扁成窄条，把版面留给平台列表 */
.ops-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f0f5ff;
}
.ops-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  background: #3866ff;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  font-weight: 700;
}
.ops-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ops-main {
  color: #2b3a5c;
  font-size: 11px;
  line-height: 15px;
  font-weight: 600;
}
.ops-sub {
  color: #6b7896;
  font-size: 10px;
  line-height: 14px;
  font-weight: 500;
}

/* 发布方式：两个投递方式并列，独立横排，不进标签竖排 */
.publish-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.publish-modes button {
  height: 40px;
  padding: 0 4px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: #f2f4f8;
  color: #3d4555;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.publish-modes button.active {
  border-color: #3866ff;
  background: #eef3ff;
  color: #3866ff;
}

/* 我的运力：车队与个体司机合并为一份名单，勾选后发出邀请 */
.capacity-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.capacity-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.capacity-head strong {
  color: #252b3a;
  font-size: 13px;
  font-weight: 700;
}
.capacity-head span {
  color: #747c8c;
  font-size: 11px;
}
.capacity-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border: 1px solid #e8ecf3;
  border-radius: 9px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.capacity-row.on {
  border-color: #3866ff;
  background: #f7faff;
}
.capacity-avatar {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8eefb;
  color: #3866ff;
  font-size: 13px;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.capacity-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.capacity-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.capacity-name-row strong {
  color: #252b3a;
  font-size: 14px;
  font-weight: 700;
}
.capacity-name-row em {
  color: #8a91a1;
  font-size: 10px;
  font-style: normal;
}
.capacity-main small {
  color: #747c8c;
  font-size: 10px;
  line-height: 14px;
}
.capacity-main .capacity-src {
  color: #9aa3b5;
}
.capacity-check {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border: 1px solid #d9dde6;
  border-radius: 5px;
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}
.capacity-check.checked {
  border-color: #3866ff;
  background: #3866ff;
}
.capacity-note {
  margin: 1px 0 0;
  color: #8a91a1;
  font-size: 10px;
  line-height: 14px;
}

/* 决策口径：横排次级，切换后重新排序，不是静态高亮 */
.sort-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.sort-tabs::-webkit-scrollbar { display: none; }
.sort-tabs button {
  flex-shrink: 0;
  height: 27px;
  padding: 0 11px;
  border: 0;
  border-radius: 14px;
  background: #f2f4f8;
  color: #596171;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.sort-tabs button.active {
  background: #eef3ff;
  color: #3866ff;
}

/* 左竖排按运输方式筛选，右侧内容区顶部横排口径 */
.mode-body {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.mode-rail {
  flex: 0 0 66px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #f5f7fb;
  overflow: hidden;
}
.mode-rail button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 9px 4px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: #596171;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.rail-count {
  color: #9aa3b5;
  font-size: 9px;
  line-height: 12px;
  font-weight: 500;
}
.mode-rail button.active {
  border-left-color: #3866ff;
  background: #fff;
  color: #3866ff;
}
.mode-rail button.active .rail-count { color: #3866ff; }
.mode-pane {
  flex: 1;
  min-width: 0;
}

/* 展开全部平台 / 收起 */
.expand-row {
  width: 100%;
  margin-top: 6px;
  padding: 8px 0;
  border: 0;
  border-radius: 7px;
  background: #f5f7fb;
  color: #3866ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

/* 批量选择：规模下勾选平台不宜逐个点 */
.select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
}
.select-all {
  height: 27px;
  padding: 0 12px;
  border: 1px solid #d6e2fb;
  border-radius: 14px;
  background: #fff;
  color: #3866ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.select-all.on {
  border-color: #3866ff;
  background: #eef3ff;
}
.select-hint {
  color: #747c8c;
  font-size: 10px;
}

.platform-list { margin-top: 7px; }
.mode-error { margin: 4px 0 0; }
.filter-note { margin: 5px 0 0; color: #8a91a1; font-size: 10px; line-height: 14px; }

/* 固定在面板下沿，与滚动内容分离 */
.confirm-bar {
  flex: 0 0 49px;
  margin-top: 8px;
  display: flex;
  overflow: hidden;
  border-radius: 6px;
}
.estimate-total {
  width: 190px;
  padding: 7px 12px;
  box-sizing: border-box;
  background: #555762;
  color: #fff;
}
.estimate-total span {
  display: block;
  font-size: 10px;
  line-height: 17px;
}
.estimate-total b { font-size: 16px; }
.estimate-total small {
  display: block;
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  line-height: 12px;
}
.confirm-action {
  flex: 1;
  border: 0;
  background: #3866ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.confirm-action:disabled { background: #b9c4d9; cursor: not-allowed; }

/* 装卸货时间弹层：与二级页底部弹层同一套 */
.fp-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: flex-end; background: rgba(0, 0, 0, 0.4); }
.fp-sheet { width: 100%; background: #fff; border-radius: 12px 12px 0 0; padding: 16px 16px 20px; box-sizing: border-box; }
.fp-sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.fp-sheet-head h2 { margin: 0; color: #252b3a; font-size: 16px; font-weight: 700; }
.fp-sheet-head button { border: 0; background: none; color: #747c8c; font-size: 20px; line-height: 1; cursor: pointer; }
.date-option-list { max-height: 340px; overflow-y: auto; }
.fp-option { width: 100%; height: 52px; padding: 0; border: 0; border-top: 1px solid #eef2f6; display: flex; align-items: center; justify-content: space-between; background: transparent; cursor: pointer; }
.fp-option-main { color: #252b3a; font-size: 15px; font-weight: 600; }
.fp-option-sub { color: #747c8c; font-size: 12px; }
.detail-sheet, .rule-sheet { padding-bottom: 28px; }
.detail-change { width: 100%; margin: 8px 0; padding: 12px 0; border: 0; border-bottom: 1px solid #eef2f6; background: transparent; text-align: left; color: #252b3a; font-size: 14px; font-weight: 600; }
.detail-change span { float: right; color: #3866ff; font-size: 12px; font-weight: 400; }
.detail-field { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #eef2f6; color: #333; font-size: 13px; white-space: nowrap; }
.detail-field input { min-width: 0; width: 60%; padding: 8px 0; border: 0; outline: 0; text-align: right; font: inherit; }
.detail-save { width: 100%; height: 46px; margin-top: 16px; border: 0; border-radius: 6px; background: #3866ff; color: #fff; font-size: 15px; font-weight: 600; }
.detail-save:disabled { background: #b9c4d9; }
.sheet-hint { margin: 6px 0 10px; color: #8a91a1; font-size: 11px; line-height: 16px; }
.rule-template-list { display: flex; gap: 8px; }
.rule-template-list button { flex: 1; min-height: 38px; border: 1px solid #e1e6ef; border-radius: 5px; background: #fff; color: #3d4555; font-size: 12px; }
.rule-template-list button.active { border-color: #3866ff; background: #edf2ff; color: #3866ff; }
.rounding-row { display: flex; align-items: center; justify-content: space-between; height: 46px; border-bottom: 1px solid #eef2f6; color: #333; font-size: 13px; }
.rounding-row select { max-width: 60%; border: 0; background: #fff; color: #333; font: inherit; text-align: right; }
</style>
