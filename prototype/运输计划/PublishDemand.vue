<template>
  <el-drawer
    :model-value="true"
    title="新增公开托运单/散杂货运输"
    direction="rtl"
    size="calc(100vw - 258px)"
    :append-to-body="false"
    modal-class="pd-overlay"
    class="pd-drawer"
    @close="handleCancel"
  >
    <div class="create-body">
      <!-- 运输信息 -->
      <section class="form-section">
        <h3 class="section-title">运输信息</h3>

        <div class="mix-field">
          <span class="field-label">配载方式</span>
          <div class="pill-options">
            <span class="pill-option loading" :class="{ active: form.loadingMethod === '重量' }" @click="form.loadingMethod = '重量'">
              <i class="radio-dot" />重量
            </span>
          </div>
        </div>

        <div class="node-list">
          <div v-for="node in publishNodes" :key="node.id" class="node-item">
            <span class="node-dot" />
            <div class="node-card">
              <div class="node-head">
                <span class="node-badge" :class="node.type === '装' ? 'load' : 'unload'">{{ node.type }}</span>
                <el-input v-model="node.name" readonly placeholder="马尾港" class="nf addr" />
                <el-date-picker
                  v-model="node.time"
                  type="datetime"
                  :placeholder="node.type === '装' ? '请选择提货时间' : '请选择卸货时间'"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm"
                  class="nf time"
                />
                <el-input v-model="node.contactName" readonly placeholder="联系人" class="nf" />
                <el-input v-model="node.contactPhone" readonly placeholder="联系电话" class="nf" />
              </div>
              <div class="goods-panel">
                <table class="goods-table">
                  <thead>
                    <tr>
                      <th class="c-goods">货品</th>
                      <th class="c-plan">计划运量（吨）</th>
                      <th class="c-arr">已安排运量（吨）</th>
                      <th class="c-rem">剩余可发布运量（吨）</th>
                      <th class="c-pub">本次发布运量（吨）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="goods in node.goods" :key="goods.id" class="goods-row">
                      <td class="c-goods">{{ goods.name || '-' }}</td>
                      <td class="c-plan">{{ goods.weight }}</td>
                      <td class="c-arr">{{ goods.arrangedWeight || 0 }}</td>
                      <td class="c-rem">{{ goodsRemaining(goods) }}</td>
                      <td class="c-pub">
                        <el-input v-model.number="goods.publishWeight" type="number" :min="0" :max="goodsRemaining(goods)" size="small" placeholder="0" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="transport-summary">
          <span class="summary-icon" v-html="cargoIcon" />
          <span class="summary-text">
            本次发布运量总计：<span class="summary-num">{{ totalPublishWeight }}</span> 吨
          </span>
        </div>
      </section>

      <!-- 运费设置 -->
      <section class="form-section">
        <h3 class="section-title">运费设置</h3>

        <div class="freight-mode-row">
          <div class="design-field">
            <label>竞价模式</label>
            <div class="pill-options">
              <span class="pill-option bid" :class="{ active: form.quoteMode === '竞价' }" @click="form.quoteMode = '竞价'">
                <i class="radio-dot" />竞价
              </span>
              <span class="pill-option bid" :class="{ active: form.quoteMode === '抢单' }" @click="form.quoteMode = '抢单'">
                <i class="radio-dot" />抢单
              </span>
            </div>
          </div>
        </div>

        <div class="freight-grid">
          <div class="design-field">
            <label>期望承运商何时进行报价</label>
            <el-date-picker
              v-model="form.quoteValidRange"
              type="datetimerange"
              start-placeholder="请输入报价有效期范围"
              end-placeholder="请输入报价有效期范围"
              range-separator="至"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              class="full-control"
            />
          </div>
          <div class="design-field">
            <label>计费条件</label>
            <el-select v-model="form.billingMode" class="full-control">
              <el-option v-for="option in billingModeOptions" :key="option" :label="option" :value="option" />
            </el-select>
          </div>
          <div class="design-field required-field">
            <label>期望运输单价</label>
            <el-input v-model.number="form.expectedPrice" type="number" :min="0" placeholder="请输入运输单价范围">
              <template #append>元/吨</template>
            </el-input>
          </div>
          <div class="design-field">
            <label>支付方式</label>
            <el-select v-model="form.paymentMethod" class="full-control">
              <el-option v-for="option in paymentMethodOptions" :key="option" :label="option" :value="option" />
            </el-select>
          </div>
        </div>

        <div class="estimate-strip">
          <span class="estimate-icon" v-html="freightIcon" />
          <span>预估总运费（ 本次发布运量{{ totalPublishWeight }}吨 * {{ Number(form.expectedPrice || 0) }}元/吨 ）</span>
          <strong class="estimate-num">{{ estimatedFreight }}</strong>
          <span> 元</span>
        </div>
      </section>

      <!-- 偏好设置 -->
      <section class="form-section">
        <h3 class="section-title">偏好设置</h3>

        <div class="preference-layout">
          <div class="preference-main">
            <div class="pref-field">
              <span class="field-label">可见范围</span>
              <div class="pill-options">
                <span
                  v-for="option in visibilityScopeOptions"
                  :key="option"
                  class="pill-option scope"
                  :class="{ active: form.visibilityScope === option }"
                  @click="form.visibilityScope = option"
                >
                  <i class="radio-dot" />{{ option }}
                </span>
              </div>
              <div v-if="form.visibilityScope === '指定平台可见' && channelConfirmed" class="channel-selected">
                <span class="channel-selected-label">已选择平台：</span>
                <span class="channel-selected-value">{{ form.selectedPlatforms.join('、') }}</span>
                <button type="button" class="channel-selected-edit" @click="channelConfirmed = false">修改</button>
              </div>
            </div>

            <div class="pref-field">
              <span class="field-label">单据凭证</span>
              <div class="pill-options">
                <span
                  class="pill-option voucher"
                  :class="{ active: form.vouchers.includes('装货凭证') }"
                  @click="toggleVoucher('装货凭证')"
                >
                  <span class="voucher-text">装货凭证</span>
                  <i v-if="form.vouchers.includes('装货凭证')" class="voucher-check" />
                </span>
                <span
                  class="pill-option voucher"
                  :class="{ active: form.vouchers.includes('卸货凭证') }"
                  @click="toggleVoucher('卸货凭证')"
                >
                  <span class="voucher-text">卸货凭证</span>
                  <i v-if="form.vouchers.includes('卸货凭证')" class="voucher-check" />
                </span>
              </div>
            </div>

            <div class="pref-field remark-field">
              <span class="field-label">备注</span>
              <div class="remark-wrap">
                <el-input
                  v-model="form.remark"
                  type="textarea"
                  :rows="4"
                  maxlength="200"
                  resize="none"
                  placeholder="请输入..."
                />
                <span class="remark-count">{{ form.remark.length }}/200</span>
              </div>
            </div>
          </div>

          <div v-if="form.visibilityScope === '指定平台可见' && !channelConfirmed" class="publish-channel-card">
            <h4>发布渠道选择</h4>
            <p>请选择您希望将托运单发布的平台渠道</p>
            <div
              v-for="platform in thirdPlatforms"
              :key="platform.value"
              class="channel-item"
              :class="{ active: form.selectedPlatforms.includes(platform.value) }"
              @click="togglePlatform(platform.value)"
            >
              <i class="channel-check">
                <svg v-if="form.selectedPlatforms.includes(platform.value)" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="16" height="16" fill="#366AFB" />
                  <path d="M4 8.5L7 11.5L12 5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </i>
              <span class="channel-logo" :class="platform.logoClass">{{ platform.logo }}</span>
              <div class="channel-content">
                <strong>{{ platform.name }}</strong>
                <span class="channel-desc">{{ platform.description }}</span>
                <div class="channel-tags">
                  <em>全面覆盖</em>
                  <em>服务保障</em>
                  <em>高响应</em>
                </div>
              </div>
            </div>

            <div class="channel-actions">
              <button type="button" class="channel-action-cancel" @click="clearChannels">取消</button>
              <button type="button" class="channel-action-confirm" @click="confirmChannels">确认</button>
            </div>
          </div>

          <div v-else-if="form.visibilityScope === '指定承运商'" class="carrier-card">
            <h4>指定承运商</h4>
            <p>请选择邀请参与本次竞价的承运商（可多选）</p>
            <el-select
              v-model="form.selectedCarriers"
              multiple
              placeholder="请选择承运商"
              class="full-control"
            >
              <el-option v-for="carrier in carrierOptions" :key="carrier.value" :label="carrier.label" :value="carrier.value" />
            </el-select>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button class="footer-cancel" @click="handleCancel">取消</el-button>
        <el-button type="primary" class="footer-submit" @click="handleConfirm">提交</el-button>
      </div>
    </template>

    <el-dialog
      v-model="confirmVisible"
      title="确认发布"
      width="420px"
      :append-to-body="false"
      class="pd-confirm-dialog"
      align-center
    >
      <p v-if="form.visibilityScope === '指定平台可见'" class="confirm-tip">
        确认将本次运量需求发布至选定的
        <strong>{{ form.selectedPlatforms.length }}</strong> 个平台渠道吗？
      </p>
      <p v-else-if="form.visibilityScope === '指定承运商'" class="confirm-tip">
        确认邀请选定的
        <strong>{{ form.selectedCarriers.length }}</strong> 家承运商参与竞价吗？
      </p>
      <p v-else class="confirm-tip">
        确认发布本次运量竞价需求吗？
      </p>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="doPublish">确认</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  plan: { type: Object, required: true },
})

const emit = defineEmits(['close', 'published', 'validate-error'])

const billingModeOptions = ['按装货重量', '按卸货重量', '按船计费']
const paymentMethodOptions = ['到付', '预付', '月结']
const visibilityScopeOptions = ['全平台可见', '指定平台可见', '指定承运商']
const thirdPlatforms = [
  { value: '至简物流运输平台', name: '至简物流运输平台', logo: '至', description: '注册承运商80000+家，覆盖公路、水运、铁路资源', logoClass: '' },
  { value: '超好运网路货运运输平台', name: '超好运网路货运运输平台', logo: 'HY', description: '注册承运商80000+家，运量响应快', logoClass: 'blue' },
  { value: '至简无船承运平台', name: '至简无船承运平台', logo: '船', description: '注册承运商80000+家，覆盖主要水路航线', logoClass: 'navy' },
  { value: '至简无船承运平台2', name: '至简无船承运平台', logo: '海', description: '注册承运商80000+家，面向水路运输承运企业', logoClass: 'cyan' },
]

const carrierOptions = [
  { value: '福建顺达物流有限公司', label: '福建顺达物流有限公司' },
  { value: '漳州港兴运输有限公司', label: '漳州港兴运输有限公司' },
  { value: '厦门远航物流有限公司', label: '厦门远航物流有限公司' },
  { value: '福州捷运运输有限公司', label: '福州捷运运输有限公司' },
]

const publishNodes = reactive((props.plan.nodes || []).map((node, nodeIndex) => ({
  ...node,
  id: `${node.type}-${nodeIndex}`,
  goods: (node.goods || []).map((goods, goodsIndex) => ({
    ...goods,
    id: `${nodeIndex}-${goodsIndex}`,
    publishWeight: 0,
  })),
})))

const form = reactive({
  quoteMode: '竞价',
  quoteValidRange: [],
  billingMode: '按装货重量',
  expectedPrice: null,
  paymentMethod: '到付',
  loadingMethod: '重量',
  visibilityScope: '全平台可见',
  vouchers: ['装货凭证'],
  selectedPlatforms: [],
  selectedCarriers: [],
  remark: '',
})

const channelConfirmed = ref(false)

watch(() => form.visibilityScope, () => {
  channelConfirmed.value = false
})

function toggleVoucher(value) {
  const idx = form.vouchers.indexOf(value)
  if (idx >= 0) form.vouchers.splice(idx, 1)
  else form.vouchers.push(value)
}

function togglePlatform(value) {
  const idx = form.selectedPlatforms.indexOf(value)
  if (idx >= 0) form.selectedPlatforms.splice(idx, 1)
  else form.selectedPlatforms.push(value)
}

function clearChannels() {
  form.selectedPlatforms.splice(0)
  channelConfirmed.value = true
}

function confirmChannels() {
  if (!form.selectedPlatforms.length) {
    ElMessage.warning('请至少选择一个发布平台')
    return
  }
  channelConfirmed.value = true
  ElMessage.success(`已确认发布渠道选择（${form.selectedPlatforms.length} 个平台）`)
}

function goodsRemaining(goods) {
  return Math.max(0, Number(goods.weight || 0) - Number(goods.arrangedWeight || 0))
}

const totalPublishWeight = computed(() => publishNodes
  .flatMap(node => node.goods)
  .reduce((sum, goods) => sum + Number(goods.publishWeight || 0), 0))

const estimatedFreight = computed(() => (totalPublishWeight.value * Number(form.expectedPrice || 0))
  .toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

const cargoIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.0497 0C12.0708 0 13.6558 0 14.9027 0.150757C16.1759 0.305908 17.196 0.627808 18.0345 1.34351C18.2579 1.53467 18.4659 1.7431 18.6565 1.96692C19.3722 2.80402 19.6941 3.8241 19.8492 5.09882C20 6.3457 20 7.9292 20 9.95026L20 10.0497C20 12.0708 20 13.6558 19.8492 14.9027C19.6956 16.1759 19.3722 17.196 18.6565 18.0345C18.4658 18.2578 18.2578 18.4658 18.0345 18.6565C17.196 19.3722 16.1759 19.6942 14.9027 19.8492C13.6543 20 12.0708 20 10.0497 20L9.95023 20C7.92917 20 6.34567 20 5.09879 19.8492C3.8241 19.6956 2.80405 19.3722 1.96692 18.6565C1.74301 18.4648 1.53372 18.257 1.34348 18.0345C0.627838 17.196 0.305847 16.1759 0.150757 14.9027C0 13.6543 0 12.0708 0 10.0497L0 9.95026C0 7.9292 0 6.3457 0.150757 5.09882C0.305847 3.8241 0.627838 2.80402 1.34348 1.96692C1.53519 1.74304 1.74301 1.53375 1.96692 1.34351C2.80405 0.627808 3.8241 0.305908 5.09879 0.150757C6.34567 0 7.92917 0 9.95023 0L10.0497 0ZM13.192 5.15625L6.80682 5.15625C6.20773 5.15625 5.69995 5.60449 5.62564 6.19897L4.71231 13.5056C4.66998 13.8442 4.77524 14.1852 5.0011 14.441C5.22696 14.6969 5.55222 14.8436 5.89346 14.8436L14.1053 14.8436C14.4466 14.8436 14.7719 14.6969 14.9977 14.441C15.2235 14.1852 15.3288 14.8442 15.2865 13.5056L14.3732 6.19897C14.2989 5.60449 13.7911 5.15625 13.192 5.15625ZM6.93616 6.49316L13.0626 6.49316L13.9393 13.5067L6.05948 13.5067L6.93616 6.49316Z" fill="#3A65FF"/><path d="M8.37305 9.62402C8.37305 9.62402 8.73428 10.3465 9.99859 10.3465C11.2629 10.3465 11.6241 9.62402 11.6241 9.62402" stroke="#F2F7FF" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const freightIcon = `<svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4027 0.650742C14.1558 0.5 12.5708 0.5 10.5498 0.5L10.4502 0.5C8.42916 0.5 6.84567 0.5 5.59878 0.650742C4.32408 0.805878 3.30404 1.12784 2.46692 1.84348C2.24301 2.03374 2.03519 2.24302 1.84348 2.46693C1.12783 3.30404 0.805862 4.3241 0.650742 5.59879C0.5 6.84567 0.5 8.42917 0.5 10.4502L0.5 10.5498C0.5 12.5708 0.5 14.1543 0.650742 15.4027C0.805862 16.6759 1.12783 17.696 1.84348 18.5345C2.03373 18.757 2.24301 18.9648 2.46692 19.1565C3.30404 19.8722 4.32408 20.1956 5.59878 20.3493C6.84567 20.5 8.42916 20.5 10.4502 20.5L10.5498 20.5C12.5708 20.5 14.1543 20.5 15.4027 20.3493C16.6759 20.1941 17.696 19.8722 18.5345 19.1565C18.7578 18.9658 18.9658 18.7578 19.1565 18.5345C19.8722 17.696 20.1956 16.6759 20.3493 15.4027C20.5 14.1558 20.5 12.5708 20.5 10.5498L20.5 10.4502C20.5 8.42917 20.5 6.84567 20.3493 5.59879C20.1941 4.3241 19.8722 3.30404 19.1565 2.46693C18.9659 2.24313 18.7579 2.03468 18.5345 1.84348C17.696 1.12784 16.6759 0.805878 15.4027 0.650742ZM8.28867 5.12107C8.44526 5.84402 9.12286 7.43777 10.5 8.33342C11.8786 7.43777 12.5547 5.84402 12.7128 5.12107C12.7988 4.7262 13.1887 4.47589 13.5836 4.56198C13.9784 4.64806 14.2287 5.03793 14.1426 5.43279C13.9363 6.37673 13.0948 8.43001 11.2317 9.60226L11.2317 9.56504L12.9396 9.56504C13.3438 9.56504 13.6714 9.89266 13.6714 10.2968C13.6714 10.7009 13.3438 11.0285 12.9396 11.0285L11.2317 11.0285L11.2317 15.7238C11.2317 16.1279 10.9041 16.4556 10.5 16.4556C10.0959 16.4556 9.76825 16.1279 9.76825 15.7238L9.76825 11.0285L8.06183 11.0285C7.65769 11.0285 7.33009 10.7009 7.33009 10.2968C7.33009 9.89266 7.65769 9.56504 8.06183 9.56504L9.76825 9.56504L9.76825 9.60226C7.90524 8.43001 7.06519 6.37673 6.85884 5.43132C6.79662 5.17329 6.87901 4.90179 7.07413 4.72186C7.26926 4.54191 7.54654 4.48174 7.79868 4.56463C8.05085 4.64751 8.23836 4.86044 8.28867 5.12107Z" fill="#3A65FF"/></svg>`

function validate() {
  const goodsList = publishNodes.flatMap(node => node.goods)
  if (!goodsList.some(g => Number(g.publishWeight || 0) > 0)) return '请填写本次发布运量（必须大于0）'
  for (const goods of goodsList) {
    const pw = Number(goods.publishWeight || 0)
    if (pw < 0) return `货品「${goods.name || '未命名'}」本次发布运量不能小于0`
    if (pw > goodsRemaining(goods)) return `货品「${goods.name || '未命名'}」本次发布运量不能超过剩余可发布运量 ${goodsRemaining(goods)} 吨`
  }
  if (!form.quoteValidRange || form.quoteValidRange.length !== 2) return '请选择报价时间'
  if (!form.billingMode) return '请选择计费条件'
  if (!form.expectedPrice || form.expectedPrice <= 0) return '请输入期望运输单价'
  if (form.visibilityScope === '指定平台可见' && (!form.selectedPlatforms || form.selectedPlatforms.length === 0)) return '请选择一个发布平台'
  if (form.visibilityScope === '指定承运商' && (!form.selectedCarriers || form.selectedCarriers.length === 0)) return '请至少选择一家承运商'
  return ''
}

function handleConfirm() {
  const message = validate()
  if (message) {
    emit('validate-error', message)
    return
  }
  confirmVisible.value = true
}

const confirmVisible = ref(false)

function doPublish() {
  confirmVisible.value = false
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const goods = publishNodes.flatMap(node => node.goods)
    .filter(g => Number(g.publishWeight || 0) > 0)
    .map(g => ({ name: g.name, publishWeight: Number(g.publishWeight || 0) }))

  const record = {
    biddingNo: `JJ${stamp}${String(now.getTime()).slice(-3)}`,
    planNo: props.plan.planNo || '',
    publishTime: timeStr,
    goods,
    totalPublishWeight: totalPublishWeight.value,
    unit: '吨',
    visibilityScope: form.visibilityScope,
    targets: form.visibilityScope === '指定平台可见' ? [...form.selectedPlatforms] : form.visibilityScope === '指定承运商' ? [...form.selectedCarriers] : [],
    quoteStart: form.quoteValidRange && form.quoteValidRange[0] ? form.quoteValidRange[0] : '',
    quoteEnd: form.quoteValidRange && form.quoteValidRange[1] ? form.quoteValidRange[1] : '',
    billingMode: form.billingMode,
    expectedPrice: Number(form.expectedPrice || 0),
    paymentMethod: form.paymentMethod,
    status: '报价中',
    quotes: [],
    confirmedCarrier: null,
    confirmedPrice: null,
    dispatchNo: null,
  }
  emit('published', record)
}

function handleCancel() {
  emit('close')
}
</script>

<style scoped>
:deep(.pd-overlay) {
  top: var(--canvas-toolbar-height, 48px);
  left: calc(var(--canvas-offset-left, 232px) + 16px);
  right: 16px;
  bottom: auto;
  height: calc(100vh - var(--canvas-toolbar-height, 48px));
  overflow: hidden;
}

:deep(.pd-drawer) {
  top: 0 !important;
  bottom: 0 !important;
  height: 100% !important;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.pd-drawer .el-drawer__header) {
  height: 56px;
  padding: 0 24px;
  margin-bottom: 0;
  border-bottom: 1px solid #eef1f5;
  color: #333;
  font-size: 16px;
  font-weight: 700;
  flex: 0 0 auto;
}

:deep(.pd-drawer .el-drawer__body) {
  flex: 1;
  min-height: 0;
  padding: 0 24px;
  overflow-y: auto;
}

:deep(.pd-drawer .el-drawer__footer) {
  padding: 12px 24px;
  border-top: 1px solid #eef1f5;
  background: #fff;
  flex: 0 0 auto;
}

.create-body { padding: 0 8px 40px; }

/* ===== 区块标题 ===== */
.form-section { margin-bottom: 26px; }
.section-title {
  position: relative;
  margin: 0 0 16px;
  padding-left: 12px;
  color: #333;
  font-size: 16px;
  font-weight: 700;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: #3a65ff;
  transform: translateY(-50%);
}

/* ===== 字段标签（设计稿统一 14px #333）===== */
.field-label,
.design-field label {
  color: #333;
  font-size: 14px;
}
.design-field { display: flex; flex-direction: column; gap: 8px; }
.required-field label::before { content: '* '; color: #f14335; }
.nf,
.full-control { width: 100% !important; }

/* 输入占位符统一为设计稿 #ccc */
:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) { color: #ccc; }

/* ===== 选项块（单选/复选 pill）===== */
.pill-options {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}
.pill-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 28px;
  border-radius: 2px;
  background: #f6f6f6;
  color: #20273a;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
}
.pill-option.active {
  background: rgba(58, 101, 255, 0.06);
  color: #3a65ff;
  font-weight: 700;
}
/* 固定宽度（对齐设计稿） */
.pill-option.bid { width: 75px; }
.pill-option.loading { width: 75px; }
.pill-option.scope { padding: 0 12px; }
/* 单据凭证：等宽块，文字居左 + 勾选框靠右（选中时显示蓝色方块+白色对勾） */
.pill-option.voucher {
  width: 102px;
  justify-content: space-between;
  padding: 0 10px 0 12px;
}
.pill-option.voucher.active {
  background: rgba(54, 106, 251, 0.05);
  color: #366afb;
}
.voucher-text { overflow: hidden; white-space: nowrap; }
/* 单选圆点 */
.radio-dot {
  position: relative;
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background: #fff;
  flex: 0 0 auto;
}
.pill-option.active .radio-dot {
  border-color: #366afb;
  background: #366afb;
}
.pill-option.active .radio-dot::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
}
/* 复选勾选框（单据凭证，选中显示蓝色方块+白色对勾） */
.voucher-check {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: #3a65ff;
  flex: 0 0 auto;
}
.voucher-check::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 2px;
  width: 6px;
  height: 9px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

/* ===== 配载方式 ===== */
.mix-field {
  margin-bottom: 20px;
}
.mix-field .field-label {
  display: block;
  margin-bottom: 10px;
}

/* ===== 节点列表(时间线) ===== */
.node-list {
  position: relative;
  margin-top: 8px;
  padding-left: 36px;
}
.node-list::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 18px;
  bottom: 34px;
  width: 2px;
  background: #c7d2e3;
}
.node-item { position: relative; margin-bottom: 18px; }
.node-dot {
  position: absolute;
  left: -28px;
  top: 14px;
  z-index: 1;
  width: 8px;
  height: 8px;
  border: 2px solid #8aa5d8;
  border-radius: 50%;
  background: #fff;
}
.node-card {
  min-width: 0;
  border: 1px solid #e6ebf2;
  background: #fff;
}

/* 节点标题行（地址较宽、时间/联系人/联系电话等宽、间距均匀，对齐设计稿） */
.node-head {
  display: grid;
  grid-template-columns: 44px minmax(160px, 1.9fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr);
  gap: 16px;
  align-items: center;
  padding: 9px 10px;
}
/* 节点字段统一 28px（对齐设计稿） */
.node-head :deep(.el-input__wrapper),
.node-head :deep(.el-date-editor .el-input__wrapper) {
  height: 28px;
  min-height: 28px;
}
.node-head :deep(.el-date-editor) {
  height: 30px;
  min-width: 0;
  width: 100% !important;
  --el-input-height: 30px;
  --el-date-editor-width: 100%;
}
.node-head :deep(.el-input__inner) {
  height: 28px;
  line-height: 28px;
  font-size: 14px;
}
.node-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 24px;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 700;
}
.node-badge.load { background: #e7ebf7; color: #3e4e83; }
.node-badge.unload { background: #3a65ff; color: #fff; }

/* 货品表格 */
.goods-panel { padding: 0 10px 10px; }
.goods-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #ebebeb;
}
.goods-table th,
.goods-table td {
  padding: 8px 10px;
  border-right: 1px solid #ebebeb;
  border-bottom: 1px solid #ebebeb;
  color: #333;
  font-size: 14px;
  text-align: left;
  overflow: hidden;
}
.goods-table thead th {
  background: #fff;
  color: #333;
  font-weight: 700;
}
.goods-table .c-goods { width: 20%; font-weight: 700; }
.goods-table .c-plan { width: 20%; }
.goods-table .c-arr { width: 20%; }
.goods-table .c-rem { width: 20%; }
.goods-table .c-pub { width: 20%; }
.goods-table .c-pub :deep(.el-input) { width: 100%; }
/* 隐藏原生数字输入框的上下箭头，保持简洁可直接输入 */
.goods-table :deep(input[type='number'])::-webkit-outer-spin-button,
.goods-table :deep(input[type='number'])::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.goods-table :deep(input[type='number']) {
  -moz-appearance: textfield;
}

/* 运输货品总计 */
.transport-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f2f7ff 0%, #f8f9ff 100%);
  color: #333;
  font-size: 16px;
  font-weight: 500;
}
.summary-icon,
.estimate-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.summary-icon svg,
.estimate-icon svg { display: block; }
.summary-num {
  color: #3a65ff;
  font-weight: 700;
}

/* ===== 运费设置 ===== */
.freight-mode-row { margin-top: 4px; }
.freight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 40px;
  align-items: end;
  margin-top: 16px;
}
/* 运费字段输入框统一尺寸：28px 高、填满列宽（对齐设计稿） */
.freight-grid :deep(.el-input__wrapper),
.freight-grid :deep(.el-select__wrapper) {
  height: 28px;
  min-height: 28px;
}
.freight-grid :deep(.el-input__inner) {
  height: 28px;
  line-height: 28px;
  font-size: 14px;
}
.freight-grid :deep(.el-date-editor) {
  width: 100% !important;
  --el-date-editor-width: 100%;
}
.freight-grid :deep(.el-select) { width: 100% !important; }
.estimate-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  margin-top: 14px;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}
.estimate-num {
  color: #3a65ff;
  font-weight: 700;
  font-family: 'Douyin Sans-Bold', 'PingFang SC', sans-serif;
}

/* ===== 偏好设置 ===== */
.preference-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 440px;
  gap: 40px;
}
.preference-main { min-width: 0; }
.pref-field { margin-bottom: 20px; }
.pref-field .field-label {
  display: block;
  margin-bottom: 10px;
}

/* 发布渠道选择（设计稿为带边框卡片） */
.publish-channel-card {
  min-width: 0;
  padding: 16px 20px 20px;
  border: 1px solid #ebebeb;
  border-radius: 4px;
  box-sizing: border-box;
}
.publish-channel-card h4 {
  margin: 0 0 6px;
  color: #333;
  font-size: 16px;
  font-weight: 700;
}
.publish-channel-card > p {
  margin: 0 0 14px;
  color: #333;
  font-size: 14px;
}
.channel-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  height: 90px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 4px;
  background: #f7f7f7;
  box-sizing: border-box;
  cursor: pointer;
}
.channel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 32px;
  margin-top: 8px;
}
.channel-action-cancel {
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #333;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
}
.channel-action-cancel:hover { color: #3a65ff; }
.channel-action-confirm {
  width: 80px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: #3a65ff;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}
.channel-action-confirm:hover { background: #2f56e8; }
/* 指定承运商选择卡片 */
.carrier-card {
  min-width: 0;
  padding: 16px 20px 20px;
  border: 1px solid #ebebeb;
  border-radius: 4px;
  box-sizing: border-box;
}
.carrier-card h4 {
  margin: 0 0 6px;
  color: #333;
  font-size: 16px;
  font-weight: 700;
}
.carrier-card > p {
  margin: 0 0 14px;
  color: #333;
  font-size: 14px;
}
.carrier-card :deep(.el-select) { width: 100%; }
/* 已选平台：纯文本展示在可见范围下方（无边框盒子） */
.channel-selected {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  color: #333;
  font-size: 14px;
  line-height: 24px;
}
.channel-selected-label { flex: 0 0 auto; }
.channel-selected-value {
  color: #3a65ff;
  font-weight: 700;
}
.channel-selected-edit {
  flex: 0 0 auto;
  padding: 0;
  border: none;
  background: transparent;
  color: #3a65ff;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
}
.channel-selected-edit:hover { text-decoration: underline; }
.channel-check {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 2px;
}
.channel-check svg { display: block; }
.channel-logo {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #165dff;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.channel-logo.blue { background: #3f7cff; }
.channel-logo.navy { background: #31578a; }
.channel-logo.cyan { background: #168aad; }
.channel-content {
  min-width: 0;
  flex: 1;
}
.channel-content strong {
  display: block;
  margin-bottom: 2px;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-content .channel-desc {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-tags {
  display: flex;
  gap: 6px;
}
.channel-tags em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 2px;
  background: #ebeff7;
  color: #808cb6;
  font-size: 12px;
  font-weight: 700;
  font-style: normal;
}

/* 备注 */
.remark-field { margin-top: 4px; }
.remark-wrap { position: relative; }
.remark-wrap :deep(.el-textarea__inner) {
  border-radius: 4px;
  color: #333;
  font-size: 14px;
  line-height: 24px;
  padding: 8px 12px 24px;
  background: #fff;
}
.remark-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  color: #ccc;
  font-size: 14px;
  line-height: 24px;
}

/* 底部按钮 */
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
.modal-footer .footer-cancel {
  width: 64px;
  height: 32px;
  padding: 0;
  border: 1px solid #d5d9e0;
  border-radius: 2px;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 700;
}
.modal-footer .footer-cancel:hover { border-color: #3a65ff; color: #3a65ff; }
.modal-footer .footer-submit {
  width: 64px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: #3a65ff;
  color: #fff;
  font-size: 16px;
}
.modal-footer .footer-submit:hover { background: #2f56e8; }

/* 确认发布对话框 */
.confirm-tip {
  margin: 0;
  color: #333;
  font-size: 14px;
  line-height: 24px;
}
.confirm-tip strong { color: #3a65ff; font-weight: 700; }
:deep(.pd-confirm-dialog) .el-dialog__header {
  color: #333;
  font-size: 16px;
  font-weight: 700;
}
:deep(.pd-confirm-dialog) .el-dialog__footer .el-button--primary {
  background: #3a65ff;
  border-color: #3a65ff;
}
:deep(.pd-confirm-dialog) .el-dialog__footer .el-button--primary:hover {
  background: #2f56e8;
  border-color: #2f56e8;
}

@media (max-width: 1400px) {
  .preference-layout { grid-template-columns: minmax(0, 1fr) 380px; gap: 24px; }
}
@media (max-width: 1100px) {
  .freight-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .preference-layout { grid-template-columns: minmax(0, 1fr); }
}
</style>
