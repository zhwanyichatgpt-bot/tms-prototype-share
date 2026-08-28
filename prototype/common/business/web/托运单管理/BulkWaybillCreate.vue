<template>
  <!-- 抽屉半透明蒙层 (Overlay) -->
  <div class="drawer-overlay" @click.self="emit('back')">
    <!-- 从右侧滑出的抽屉面板 (Drawer Panel) -->
    <div class="drawer-panel">
      <!-- 1. 抽屉标题栏 -->
      <div class="drawer-header">
        <span class="drawer-title">新增公开托运单/散杂货运输</span>
        <button class="drawer-close-btn" title="关闭" @click="emit('back')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="#86909c" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 2. 抽屉可滚动内容区 -->
      <div class="drawer-scroll-body">
        <!-- 详细 / 简易 Tab 栏 -->
        <div class="top-nav-tabs">
          <span class="tab-item" :class="{ active: currentTab === '详细' }" @click="currentTab = '详细'">详细</span>
          <span class="tab-item" :class="{ active: currentTab === '简易' }" @click="currentTab = '简易'">简易</span>
        </div>

        <!-- ============ 模块一：运输信息 ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">运输信息</span>
          </div>

          <!-- 混装单选选项 -->
          <div class="mix-row">
            <div class="field-label">是否允许货品混装</div>
            <div class="mix-radio-group">
              <label class="mix-radio-chip" :class="{ active: formData.allowMix === '允许' }">
                <input type="radio" value="允许" v-model="formData.allowMix" />
                <span class="radio-dot"></span>
                <span>允许</span>
              </label>
              <label class="mix-radio-chip plain" :class="{ active: formData.allowMix === '不允许' }">
                <input type="radio" value="不允许" v-model="formData.allowMix" />
                <span class="radio-dot"></span>
                <span>不允许</span>
              </label>
            </div>
          </div>

          <!-- 路线节点树（左侧细虚线时间轴） -->
          <div class="nodes-timeline-wrap">
            <div
              v-for="(node, nodeIdx) in transportNodes"
              :key="node.id"
              class="node-item-row"
            >
              <!-- 左侧轴线列（圆点 + 垃圾桶 + 虚线） -->
              <div class="timeline-axis-col">
                <div class="dot-trash-box">
                  <span class="axis-point-dot"></span>
                  <span
                    class="trash-btn"
                    title="删除节点"
                    :class="{ disabled: transportNodes.length <= 2 }"
                    @click="removeNode(nodeIdx)"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4" stroke="#86909c" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div v-if="nodeIdx < transportNodes.length - 1" class="axis-dash-vertical"></div>
              </div>

              <!-- 右侧节点卡片与表格主体 -->
              <div class="node-content-col">
                <!-- 节点头部单行表单 -->
                <div class="node-toolbar-row">
                  <!-- 装/卸胶囊下拉 -->
                  <div class="badge-type-tag" :class="node.type === '装' ? 'load-badge' : 'unload-badge'">
                    <span>{{ node.type }}</span>
                    <span class="arrow-down">▾</span>
                  </div>

                  <!-- 地点输入/选择 -->
                  <div class="clean-field-wrap location-flex">
                    <input class="cell-input" v-model="node.location" placeholder="马尾港" />
                    <div class="slot-icons">
                      <span class="slot-icon-btn" title="切换方向">⇄</span>
                      <span class="slot-icon-btn" title="选择地址">⊕</span>
                    </div>
                  </div>

                  <!-- 时间选择器 -->
                  <div class="clean-field-wrap time-flex">
                    <span class="time-cal-icon">📅</span>
                    <input
                      class="cell-input time-pad-input"
                      v-model="node.time"
                      :placeholder="node.type === '装' ? '请选择提货时间' : '请选择卸货时间'"
                    />
                    <span class="slot-arrow-down">▾</span>
                  </div>

                  <!-- 联系人 -->
                  <div class="clean-field-wrap contact-flex">
                    <input class="cell-input" v-model="node.contact" placeholder="联系人" />
                  </div>

                  <!-- 联系电话 -->
                  <div class="clean-field-wrap phone-flex">
                    <input class="cell-input" v-model="node.phone" placeholder="联系电话" />
                  </div>
                </div>

                <!-- 节点内货品明细表格 -->
                <div class="goods-table-border-box">
                  <table class="goods-pure-table">
                    <thead>
                      <tr>
                        <th class="th-name"><span class="star-red">*</span> 货品</th>
                        <th class="th-vol">发货体积（m³）</th>
                        <th class="th-weight">发货重量（吨）</th>
                        <th class="th-qty">发货数量</th>
                        <th class="th-price">货品单价（元）</th>
                        <th class="th-total">货品总价（元）</th>
                        <th class="th-pkg">货品包装</th>
                        <th class="th-remark">货品备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- 已录入数据行（只读） -->
                      <tr v-for="item in node.savedItems" :key="item.id" class="text-data-row">
                        <td class="td-name">{{ item.name }}</td>
                        <td class="td-vol">{{ item.volume }}</td>
                        <td class="td-weight">{{ item.weight }}</td>
                        <td class="td-qty">{{ item.quantity }}</td>
                        <td class="td-price">{{ item.unitPrice }}</td>
                        <td class="td-total">{{ item.totalPrice }}</td>
                        <td class="td-pkg">{{ item.package || '-' }}</td>
                        <td class="td-remark">{{ item.remark || '-' }}</td>
                      </tr>

                      <!-- 数据编辑录入行 -->
                      <tr class="input-edit-row">
                        <td class="td-name">
                          <select v-model="node.editItem.name" class="grid-select">
                            <option value="玉米">玉米</option>
                            <option value="小麦">小麦</option>
                            <option value="大豆">大豆</option>
                            <option value="钢材">钢材</option>
                          </select>
                        </td>
                        <td class="td-vol">
                          <input type="number" class="grid-input" v-model.number="node.editItem.volume" placeholder="0.00" />
                        </td>
                        <td class="td-weight">
                          <input type="number" class="grid-input" v-model.number="node.editItem.weight" placeholder="0.00" />
                        </td>
                        <td class="td-qty">
                          <input type="number" class="grid-input" v-model.number="node.editItem.quantity" placeholder="0" />
                        </td>
                        <td class="td-price">
                          <input type="number" class="grid-input" v-model.number="node.editItem.unitPrice" placeholder="0.00" />
                        </td>
                        <td class="td-total">
                          <input type="text" class="grid-input readonly-bg" :value="calcRowTotal(node.editItem)" readonly placeholder="0.00" />
                        </td>
                        <td class="td-pkg">
                          <select v-model="node.editItem.package" class="grid-select">
                            <option value="">请选择</option>
                            <option value="散装">散装</option>
                            <option value="袋装">袋装</option>
                            <option value="吨包">吨包</option>
                          </select>
                        </td>
                        <td class="td-remark">
                          <div class="remark-cell-wrap">
                            <input class="grid-input pad-count" v-model="node.editItem.remark" placeholder="请输入" maxlength="50" />
                            <span class="count-tip">{{ (node.editItem.remark || '').length }}/50</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- ⊕ 添加货品 -->
                  <div class="table-footer-action">
                    <span class="link-blue-btn" @click="saveAndAddGoods(node)">⊕ 添加货品</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部添加节点按钮 -->
            <div class="add-node-row">
              <span class="link-blue-btn" @click="addNewNode">⊕ 添加节点</span>
            </div>
          </div>

          <!-- 运输货品总计汇总条 -->
          <div class="summary-highlight-card">
            <div class="sum-icon">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="12" rx="2" fill="#3a65ff"/>
                <path d="M5 6H11M5 8.5H11M5 11H9" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="sum-text">
              <span class="sum-label">运输货品总计：</span>
              <span class="sum-segment">玉米（装货 <b class="val-blue">2000</b> 吨 | 卸货 <b class="val-blue">2000</b> 吨）</span>
              <span class="sum-segment">玉米（装货 <b class="val-blue">2000</b> 吨 | 卸货 <b class="val-blue">2000</b> 吨）</span>
              <span class="sum-segment">玉米（装货 <b class="val-blue">2000</b> 吨 | 卸货 <b class="val-blue">2000</b> 吨）</span>
            </div>
          </div>
        </div>

        <!-- ============ 模块二：运费设置 (对齐设计图) ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">运费设置</span>
          </div>

          <!-- 竞价模式 -->
          <div class="mix-row">
            <div class="field-label">竞价模式</div>
            <div class="mix-radio-group">
              <label class="mix-radio-chip" :class="{ active: formData.quoteMode === '竞价' }">
                <input type="radio" value="竞价" v-model="formData.quoteMode" />
                <span class="radio-dot"></span>
                <span>竞价</span>
              </label>
              <label class="mix-radio-chip plain" :class="{ active: formData.quoteMode === '抢单' }">
                <input type="radio" value="抢单" v-model="formData.quoteMode" />
                <span class="radio-dot"></span>
                <span>抢单</span>
              </label>
            </div>
          </div>

          <!-- 4 列表单行 -->
          <div class="form-grid-4">
            <!-- 期望承运商何时进行报价 -->
            <div class="form-field-item">
              <label class="field-title">期望承运商何时进行报价</label>
              <input class="cell-input" v-model="formData.quoteDeadline" placeholder="请输入报价有效期范围" />
            </div>

            <!-- 计费条件 -->
            <div class="form-field-item">
              <label class="field-title">计费条件</label>
              <div class="custom-select-wrap">
                <select v-model="formData.billingMode" class="form-select">
                  <option value="请选择计算规则">请选择计算规则</option>
                  <option value="按重量">按重量</option>
                  <option value="按体积">按体积</option>
                  <option value="按数量">按数量</option>
                </select>
                <span class="arrow-indicator">▾</span>
              </div>
            </div>

            <!-- 期望运输单价 -->
            <div class="form-field-item">
              <label class="field-title"><span class="star-red">*</span> 期望运输单价</label>
              <div class="suffix-input-wrap">
                <input class="cell-input borderless" v-model.number="formData.expectedUnitPrice" placeholder="请输入运输单价范围" />
                <span class="unit-tag">元/吨</span>
              </div>
            </div>

            <!-- 支付方式 -->
            <div class="form-field-item">
              <label class="field-title">支付方式</label>
              <div class="custom-select-wrap">
                <select v-model="formData.paymentMethod" class="form-select">
                  <option value="到付">到付</option>
                  <option value="月结">月结</option>
                  <option value="现结">现结</option>
                </select>
                <span class="arrow-indicator">▾</span>
              </div>
            </div>
          </div>

          <!-- 预估总运费胶囊卡片 -->
          <div class="freight-estimate-pill-card">
            <span class="yen-icon">¥</span>
            <span class="estimate-desc">预估总运费（ 总重量1000吨 * 20元/吨 ）</span>
            <span class="estimate-num-text">20,000.00 元</span>
          </div>
        </div>

        <!-- ============ 模块三：偏好设置 (带发布渠道选择) ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">偏好设置</span>
          </div>

          <div class="preference-layout-row">
            <!-- 左侧表单选项 -->
            <div class="pref-left-col">
              <!-- 运输方式 -->
              <div class="form-field-item">
                <label class="field-title">运输方式</label>
                <div class="mode-chips-row">
                  <div
                    class="mode-chip-box"
                    :class="{ active: formData.transportModes.includes('汽运') }"
                    @click="toggleMode('汽运')"
                  >
                    <span>汽运</span>
                    <span v-if="formData.transportModes.includes('汽运')" class="chip-corner-check">✓</span>
                  </div>
                  <div
                    class="mode-chip-box disabled"
                    :class="{ active: formData.transportModes.includes('水运') }"
                    @click="toggleMode('水运')"
                  >
                    <span>水运</span>
                  </div>
                  <div
                    class="mode-chip-box disabled"
                    :class="{ active: formData.transportModes.includes('火运') }"
                    @click="toggleMode('火运')"
                  >
                    <span>火运</span>
                  </div>
                  <div
                    class="mode-chip-box disabled"
                    :class="{ active: formData.transportModes.includes('联运') }"
                    @click="toggleMode('联运')"
                  >
                    <span>联运</span>
                  </div>
                </div>
              </div>

              <!-- 可见范围 -->
              <div class="form-field-item mt-16">
                <label class="field-title">可见范围</label>
                <div class="scope-radios-inline">
                  <label class="scope-radio-item">
                    <input type="radio" value="全平台可见" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>全平台可见</span>
                  </label>

                  <label class="scope-radio-item active-box">
                    <input type="radio" value="指定平台可见" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>指定平台可见</span>
                  </label>

                  <!-- 下拉框选择渠道 -->
                  <div class="scope-dropdown-wrap" @click="showChannelDialog = true">
                    <span class="drop-text">{{ selectedChannelSummary }}</span>
                    <span class="arrow-indicator">▾</span>
                  </div>

                  <label class="scope-radio-item">
                    <input type="radio" value="指定承运商" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>指定承运商</span>
                  </label>
                </div>
              </div>

              <!-- 单据凭证 -->
              <div class="form-field-item mt-16">
                <label class="field-title">单据凭证</label>
                <div class="voucher-chips-row">
                  <div
                    class="voucher-chip active"
                    :class="{ active: formData.vouchers.includes('装货凭证') }"
                    @click="toggleVoucher('装货凭证')"
                  >
                    <span>装货凭证</span>
                    <span class="chip-corner-check">✓</span>
                  </div>
                  <div
                    class="voucher-chip plain"
                    :class="{ active: formData.vouchers.includes('卸货凭证') }"
                    @click="toggleVoucher('卸货凭证')"
                  >
                    <span>卸货凭证</span>
                  </div>
                </div>
              </div>

              <!-- 备注 -->
              <div class="form-field-item mt-16">
                <label class="field-title">备注</label>
                <div class="pure-remark-wrap">
                  <textarea
                    class="pure-textarea"
                    v-model="formData.remark"
                    placeholder="请输入..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- 右侧：发布渠道选择卡片（完全对齐设计图） -->
            <div class="pref-right-col">
              <div class="channel-dialog-card">
                <div class="channel-card-top-title">
                  <div class="card-main-heading">发布渠道选择</div>
                  <div class="card-sub-tip">请选择您希望将托运单发布的平台渠道</div>
                </div>

                <!-- 渠道列表 -->
                <div class="channel-items-stack">
                  <!-- 渠道 1：至简物流运输平台 -->
                  <div
                    class="channel-row-item"
                    :class="{ selected: formData.selectedChannels.includes('ch1') }"
                    @click="toggleChannel('ch1')"
                  >
                    <div class="item-checkbox" :class="{ checked: formData.selectedChannels.includes('ch1') }">
                      {{ formData.selectedChannels.includes('ch1') ? '✓' : '' }}
                    </div>
                    <div class="item-logo logo-zj">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20L12 18H4L12 6" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="item-info">
                      <div class="info-title-row">
                        <span class="info-title">至简物流运输平台</span>
                        <span class="rec-badge">⏰ 推荐</span>
                      </div>
                      <div class="info-sub">注册承运商80000+家，公路公路/水...</div>
                      <div class="info-tags">
                        <span class="ch-tag-pill">全面覆盖</span>
                        <span class="ch-tag-pill">服务保障</span>
                        <span class="ch-tag-pill">高响应</span>
                      </div>
                    </div>
                  </div>

                  <!-- 渠道 2：超好运网络货运运输平台 -->
                  <div
                    class="channel-row-item"
                    :class="{ selected: formData.selectedChannels.includes('ch2') }"
                    @click="toggleChannel('ch2')"
                  >
                    <div class="item-checkbox" :class="{ checked: formData.selectedChannels.includes('ch2') }">
                      {{ formData.selectedChannels.includes('ch2') ? '✓' : '' }}
                    </div>
                    <div class="item-logo logo-chy">
                      <span class="chy-text">CHY</span>
                    </div>
                    <div class="item-info">
                      <div class="info-title-row">
                        <span class="info-title">超好运网路货运运输平台</span>
                      </div>
                      <div class="info-sub">注册承运商80000+家，公路公路/水...</div>
                      <div class="info-tags">
                        <span class="ch-tag-pill">全面覆盖</span>
                        <span class="ch-tag-pill">服务保障</span>
                        <span class="ch-tag-pill">高响应</span>
                      </div>
                    </div>
                  </div>

                  <!-- 渠道 3：至简无船承运平台 -->
                  <div
                    class="channel-row-item"
                    :class="{ selected: formData.selectedChannels.includes('ch3') }"
                    @click="toggleChannel('ch3')"
                  >
                    <div class="item-checkbox" :class="{ checked: formData.selectedChannels.includes('ch3') }">
                      {{ formData.selectedChannels.includes('ch3') ? '✓' : '' }}
                    </div>
                    <div class="item-logo logo-ship">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 14C8 18 16 18 20 14L18 9H6L4 14Z" fill="white"/>
                      </svg>
                    </div>
                    <div class="item-info">
                      <div class="info-title-row">
                        <span class="info-title">至简无船承运平台</span>
                      </div>
                      <div class="info-sub">注册承运商80000+家，公路公路/水...</div>
                      <div class="info-tags">
                        <span class="ch-tag-pill">全面覆盖</span>
                        <span class="ch-tag-pill">服务保障</span>
                        <span class="ch-tag-pill">高响应</span>
                      </div>
                    </div>
                  </div>

                  <!-- 渠道 4：至简无船承运平台 -->
                  <div
                    class="channel-row-item"
                    :class="{ selected: formData.selectedChannels.includes('ch4') }"
                    @click="toggleChannel('ch4')"
                  >
                    <div class="item-checkbox" :class="{ checked: formData.selectedChannels.includes('ch4') }">
                      {{ formData.selectedChannels.includes('ch4') ? '✓' : '' }}
                    </div>
                    <div class="item-logo logo-ship">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 14C8 18 16 18 20 14L18 9H6L4 14Z" fill="white"/>
                      </svg>
                    </div>
                    <div class="item-info">
                      <div class="info-title-row">
                        <span class="info-title">至简无船承运平台</span>
                      </div>
                      <div class="info-sub">注册承运商80000+家，公路公路/水...</div>
                    </div>
                  </div>
                </div>

                <!-- 渠道卡片底部按钮 -->
                <div class="channel-card-footer">
                  <button class="ch-footer-cancel" @click="formData.selectedChannels = []">取消</button>
                  <button class="ch-footer-confirm" @click="showChannelDialog = false">确认</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 抽屉底部固定操作按钮 -->
      <div class="drawer-footer-actions">
        <button class="footer-btn btn-plain" @click="emit('back')">取消</button>
        <button class="footer-btn btn-confirm" @click="handleSubmit">提交</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back', 'submit-success'])

const currentTab = ref('详细')
const showChannelDialog = ref(true)

const formData = reactive({
  allowMix: '允许',
  quoteMode: '竞价',
  quoteDeadline: '',
  billingMode: '请选择计算规则',
  expectedUnitPrice: 20,
  paymentMethod: '到付',
  transportModes: ['汽运'],
  visibilityScope: '指定平台可见',
  selectedChannels: ['ch1'],
  vouchers: ['装货凭证'],
  remark: '',
})

const selectedChannelSummary = computed(() => {
  if (formData.selectedChannels.length === 0) return '请选择可见平台'
  if (formData.selectedChannels.includes('ch1')) return '至简物流运输平台'
  return `已选 ${formData.selectedChannels.length} 个平台`
})

function toggleMode(m) {
  const idx = formData.transportModes.indexOf(m)
  if (idx > -1) {
    if (formData.transportModes.length > 1) formData.transportModes.splice(idx, 1)
  } else {
    formData.transportModes.push(m)
  }
}

function toggleVoucher(v) {
  const idx = formData.vouchers.indexOf(v)
  if (idx > -1) formData.vouchers.splice(idx, 1)
  else formData.vouchers.push(v)
}

function toggleChannel(chId) {
  const idx = formData.selectedChannels.indexOf(chId)
  if (idx > -1) formData.selectedChannels.splice(idx, 1)
  else formData.selectedChannels.push(chId)
}

// 节点数据
const transportNodes = ref([
  {
    id: 'node-1',
    type: '装',
    location: '马尾港',
    time: '',
    contact: '',
    phone: '',
    savedItems: [
      { id: 'item-1-1', name: '玉米', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '备注备注信息备注信息' },
      { id: 'item-1-2', name: '小麦', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '-' },
    ],
    editItem: { name: '玉米', volume: '', weight: '', quantity: '', unitPrice: '', package: '', remark: '' }
  },
  {
    id: 'node-2',
    type: '卸',
    location: '马尾港',
    time: '',
    contact: '',
    phone: '',
    savedItems: [
      { id: 'item-2-1', name: '玉米', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '', remark: '备注备注信息备注信息' },
      { id: 'item-2-2', name: '小麦', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '-' },
    ],
    editItem: { name: '玉米', volume: '', weight: '', quantity: '', unitPrice: '', package: '', remark: '' }
  }
])

function calcRowTotal(item) {
  const w = Number(item.weight) || 0
  const p = Number(item.unitPrice) || 0
  if (!w || !p) return '0.00'
  return (w * p).toFixed(2)
}

function saveAndAddGoods(node) {
  if (node.editItem.weight || node.editItem.quantity) {
    node.savedItems.push({
      id: `item-${Date.now()}`,
      name: node.editItem.name || '玉米',
      volume: node.editItem.volume || '-',
      weight: node.editItem.weight || '-',
      quantity: node.editItem.quantity || '-',
      unitPrice: node.editItem.unitPrice || '-',
      totalPrice: calcRowTotal(node.editItem),
      package: node.editItem.package || '-',
      remark: node.editItem.remark || '-'
    })
    node.editItem = { name: '玉米', volume: '', weight: '', quantity: '', unitPrice: '', package: '', remark: '' }
    ElMessage.success('已添加货品')
  } else {
    ElMessage.info('请先填写当前行货品的数据')
  }
}

function addNewNode() {
  transportNodes.value.push({
    id: `node-${Date.now()}`,
    type: '卸',
    location: '',
    time: '',
    contact: '',
    phone: '',
    savedItems: [],
    editItem: { name: '玉米', volume: '', weight: '', quantity: '', unitPrice: '', package: '', remark: '' }
  })
}

function removeNode(idx) {
  if (transportNodes.value.length <= 2) {
    ElMessage.warning('至少需要保留一个装货和一个卸货节点')
    return
  }
  transportNodes.value.splice(idx, 1)
}

function handleSubmit() {
  ElMessage.success('托运单已成功提交！')
  emit('submit-success', {
    id: `TY${Date.now().toString().slice(-9)}`,
    businessType: '散杂货',
    publishMode: '公开托运',
    tradeType: '公开托运',
    transportTypeTag: '散杂货运输',
    modeTag: formData.quoteMode,
    transportMode: formData.transportModes[0] || '公路运输',
    shipperCompany: '楹联集运站',
    contactName: '张经理',
    contactPhone: '138****0000',
    status: '竞价中',
    countdownType: '距离竞价结束',
    countdownDays: '36',
    countdownHours: '03',
    countdownMinutes: '37',
    countdownSeconds: '06',
    cargoName: '玉米',
    cargoQtyStr: '2000 吨',
    cargoIndex: 1,
    expectedPrice: '20元/吨',
    billingTag: '重量',
    requirementText: formData.allowMix === '允许' ? '公开拆分货运数量' : '禁止混装',
    route: '马尾港 -> 阳逻港',
    loadCity: '福建省-福州市',
    loadPoint: '马尾港',
    loadTime: '2026-09-23 00:00:00',
    unloadCity: '湖北省-武汉市',
    unloadPoint: '阳逻港',
    unloadTime: '2026-10-01 00:00:00',
    nodeCount: transportNodes.value.length,
  })
}
</script>

<style scoped>
/* ============ 抽屉半透明遮罩蒙层 (Overlay) ============ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============ 右侧滑出面板 (Drawer Panel) ============ */
.drawer-panel {
  width: 1480px;
  height: 100vh;
  background: #ffffff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* 1. 抽屉标题栏 */
.drawer-header {
  height: 54px;
  padding: 0 28px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}
.drawer-close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.drawer-close-btn:hover svg path {
  stroke: #1f2329;
}

/* 2. 抽屉滚动内容区 */
.drawer-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 40px;
}

/* 详细 / 简易 Tab */
.top-nav-tabs {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 24px;
}
.tab-item {
  font-size: 15px;
  color: #64748b;
  padding-bottom: 8px;
  cursor: pointer;
  position: relative;
}
.tab-item.active {
  color: #3a65ff;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3a65ff;
}

/* 模块通用样式 */
.section-block {
  margin-bottom: 32px;
}
.section-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.blue-bar {
  width: 3px;
  height: 16px;
  background: #3a65ff;
  border-radius: 2px;
}
.section-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

/* 混装单选 */
.mix-row {
  margin-bottom: 20px;
}
.field-label {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 8px;
}
.mix-radio-group {
  display: flex;
  gap: 16px;
}
.mix-radio-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 16px;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #e0e2e6;
  color: #4e5969;
}
.mix-radio-chip input { display: none; }
.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #c9cdd4;
  position: relative;
}
.mix-radio-chip.active {
  background: #f0f5ff;
  border-color: #3a65ff;
  color: #3a65ff;
}
.mix-radio-chip.active .radio-dot {
  border-color: #3a65ff;
}
.mix-radio-chip.active .radio-dot::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #3a65ff;
  border-radius: 50%;
}
.mix-radio-chip.plain {
  border-color: transparent;
  padding-left: 4px;
}

/* 节点时间轴 */
.nodes-timeline-wrap {
  position: relative;
  padding-left: 4px;
}
.node-item-row {
  display: flex;
  gap: 12px;
  position: relative;
}
.timeline-axis-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
}
.dot-trash-box {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
}
.axis-point-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9cdd4;
}
.trash-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.trash-btn:hover svg path {
  stroke: #f53f3f;
}
.trash-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.axis-dash-vertical {
  flex: 1;
  width: 1px;
  border-left: 1px dashed #d9d9d9;
  margin: 4px 0;
}

.node-content-col {
  flex: 1;
  margin-bottom: 22px;
}

/* 节点表单头部行 */
.node-toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.badge-type-tag {
  height: 32px;
  padding: 0 10px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}
.badge-type-tag.load-badge {
  background: #f0f2f5;
  color: #4e5969;
}
.badge-type-tag.unload-badge {
  background: #3a65ff;
  color: #ffffff;
}
.arrow-down { font-size: 10px; }

.clean-field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.cell-input {
  width: 100%;
  height: 32px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  padding: 0 10px;
  font-size: 13px;
  color: #1f2329;
  outline: none;
  box-sizing: border-box;
  background: #ffffff;
}
.cell-input:focus { border-color: #3a65ff; }
.cell-input.borderless { border: none; }

.location-flex { flex: 3; }
.time-flex { flex: 3; }
.contact-flex { flex: 2; }
.phone-flex { flex: 2; }

.slot-icons {
  position: absolute;
  right: 8px;
  display: flex;
  gap: 6px;
  color: #86909c;
}
.slot-icon-btn { cursor: pointer; font-size: 14px; }
.slot-icon-btn:hover { color: #3a65ff; }

.time-cal-icon {
  position: absolute;
  left: 8px;
  font-size: 12px;
}
.time-pad-input {
  padding-left: 28px;
  padding-right: 20px;
}
.slot-arrow-down {
  position: absolute;
  right: 8px;
  color: #86909c;
  font-size: 10px;
  pointer-events: none;
}

/* 货品明细表格 */
.goods-table-border-box {
  border: 1px solid #eef1f5;
  border-radius: 3px;
  background: #ffffff;
}
.goods-pure-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.goods-pure-table th {
  background: #f8f9fb;
  color: #4e5969;
  font-weight: 500;
  text-align: left;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid #eef1f5;
  box-sizing: border-box;
}
.star-red { color: #f53f3f; }
.goods-pure-table td {
  height: 38px;
  padding: 4px 12px;
  box-sizing: border-box;
  color: #1f2329;
  border-bottom: 1px solid #f8f9fb;
}

.th-name, .td-name { width: 140px; }
.th-vol, .td-vol { width: 120px; }
.th-weight, .td-weight { width: 120px; }
.th-qty, .td-qty { width: 100px; }
.th-price, .td-price { width: 110px; }
.th-total, .td-total { width: 110px; }
.th-pkg, .td-pkg { width: 110px; }
.th-remark, .td-remark { flex: 1; }

.grid-input {
  width: 100%;
  height: 28px;
  border: 1px solid #e0e2e6;
  border-radius: 2px;
  padding: 0 8px;
  font-size: 13px;
  color: #1f2329;
  outline: none;
  box-sizing: border-box;
  background: #ffffff;
}
.grid-input:focus { border-color: #3a65ff; }
.grid-input.readonly-bg {
  background: #f7f8fa;
  border-color: transparent;
}
.grid-select {
  width: 100%;
  height: 28px;
  border: 1px solid #e0e2e6;
  border-radius: 2px;
  padding: 0 8px;
  font-size: 13px;
  color: #1f2329;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}
.remark-cell-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.grid-input.pad-count { padding-right: 42px; }
.count-tip {
  position: absolute;
  right: 6px;
  font-size: 11px;
  color: #86909c;
}

.table-footer-action {
  padding: 8px 12px;
  border-top: 1px solid #f2f4f8;
}
.link-blue-btn {
  color: #3a65ff;
  font-size: 13px;
  cursor: pointer;
}
.link-blue-btn:hover { text-decoration: underline; }

.add-node-row {
  padding-left: 44px;
  margin-top: 10px;
}

/* 汇总条 */
.summary-highlight-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 12px 16px;
  background: #f0f5ff;
  border-radius: 4px;
}
.sum-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #1f2329;
}
.sum-label { color: #4e5969; }
.val-blue { color: #3a65ff; font-weight: 600; }

/* ============ 模块二：运费设置 ============ */
.form-grid-4 {
  display: grid;
  grid-template-columns: 240px 240px 240px 180px;
  gap: 20px;
  align-items: flex-end;
}

.form-field-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-title {
  font-size: 13px;
  color: #4e5969;
}

.custom-select-wrap {
  position: relative;
}
.form-select {
  width: 100%;
  height: 32px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  padding: 0 24px 0 10px;
  font-size: 13px;
  color: #1f2329;
  outline: none;
  background: #ffffff;
  appearance: none;
  box-sizing: border-box;
}
.arrow-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #86909c;
  font-size: 10px;
  pointer-events: none;
}

.suffix-input-wrap {
  display: flex;
  align-items: center;
  height: 32px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  background: #ffffff;
  box-sizing: border-box;
}
.unit-tag {
  padding: 0 10px;
  font-size: 12px;
  color: #86909c;
  background: #f7f8fa;
  border-left: 1px solid #e0e2e6;
  height: 100%;
  display: flex;
  align-items: center;
}

.freight-estimate-pill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 8px 14px;
  background: #f0f5ff;
  border-radius: 4px;
  width: fit-content;
}
.yen-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3a65ff;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.estimate-desc {
  font-size: 13px;
  color: #4e5969;
}
.estimate-num-text {
  font-size: 14px;
  color: #3a65ff;
  font-weight: 600;
}

/* ============ 模块三：偏好设置与渠道卡片 ============ */
.preference-layout-row {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.pref-left-col {
  flex: 1;
  max-width: 680px;
}

.pref-right-col {
  width: 480px;
  flex-shrink: 0;
}

/* 运输方式 */
.mode-chips-row {
  display: flex;
  gap: 12px;
}
.mode-chip-box {
  position: relative;
  height: 32px;
  padding: 0 18px;
  border: 1px solid #e0e2e6;
  background: #ffffff;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
}
.mode-chip-box.active {
  border-color: #3a65ff;
  color: #3a65ff;
  background: #f0f5ff;
}
.mode-chip-box.disabled {
  background: #f7f8fa;
  color: #86909c;
}
.chip-corner-check {
  position: absolute;
  right: 2px;
  bottom: 0;
  font-size: 10px;
  color: #3a65ff;
  font-weight: 700;
}

/* 可见范围行 */
.scope-radios-inline {
  display: flex;
  align-items: center;
  gap: 16px;
}
.scope-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
}
.scope-radio-item input { display: none; }
.scope-radio-item.active-box {
  height: 30px;
  padding: 0 12px;
  background: #f0f5ff;
  border: 1px solid #3a65ff;
  border-radius: 3px;
  color: #3a65ff;
}
.scope-radio-item.active-box .radio-dot {
  border-color: #3a65ff;
}
.scope-radio-item.active-box .radio-dot::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #3a65ff;
  border-radius: 50%;
}

.scope-dropdown-wrap {
  position: relative;
  width: 150px;
  height: 30px;
  border: 1px solid #e0e2e6;
  background: #ffffff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  padding: 0 24px 0 10px;
  cursor: pointer;
  box-sizing: border-box;
}
.drop-text {
  font-size: 12px;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 单据凭证 */
.voucher-chips-row {
  display: flex;
  gap: 12px;
}
.voucher-chip {
  position: relative;
  height: 30px;
  padding: 0 16px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
}
.voucher-chip.active {
  border: 1px solid #3a65ff;
  background: #f0f5ff;
  color: #3a65ff;
}
.voucher-chip.plain {
  background: #f7f8fa;
  color: #4e5969;
  border: 1px solid transparent;
}

/* 备注 */
.pure-remark-wrap {
  width: 100%;
}
.pure-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  padding: 8px 12px;
  font-size: 13px;
  color: #1f2329;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
}
.pure-textarea:focus {
  border-color: #3a65ff;
}

/* ============ 右侧发布渠道选择弹窗卡片 (Popover/Card) ============ */
.channel-dialog-card {
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 20px;
}
.channel-card-top-title {
  margin-bottom: 14px;
}
.card-main-heading {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.card-sub-tip {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.channel-items-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.channel-row-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fbfcfd;
  border: 1px solid #f2f4f8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.channel-row-item.selected {
  background: #f7f9ff;
  border-color: #d0e0ff;
}

.item-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #c9cdd4;
  border-radius: 2px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #ffffff;
  flex-shrink: 0;
}
.item-checkbox.checked {
  background: #3a65ff;
  border-color: #3a65ff;
}

.item-logo {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-zj { background: #3a65ff; }
.logo-chy { background: #165dff; color: #ffffff; font-weight: 700; font-size: 10px; }
.logo-ship { background: #00b42a; }

.item-info {
  flex: 1;
  min-width: 0;
}
.info-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.info-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
}
.rec-badge {
  font-size: 10px;
  padding: 1px 6px;
  background: #ffece8;
  color: #f53f3f;
  border-radius: 10px;
}
.info-sub {
  font-size: 11px;
  color: #86909c;
  margin: 3px 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-tags {
  display: flex;
  gap: 6px;
}
.ch-tag-pill {
  font-size: 10px;
  padding: 1px 6px;
  background: #f2f3f5;
  color: #4e5969;
  border-radius: 2px;
}

.channel-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f2f4f8;
}
.ch-footer-cancel {
  border: none;
  background: transparent;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
}
.ch-footer-confirm {
  height: 28px;
  padding: 0 16px;
  border: none;
  background: #3a65ff;
  color: #ffffff;
  font-size: 13px;
  border-radius: 3px;
  cursor: pointer;
}

/* 3. 抽屉底部操作栏 */
.drawer-footer-actions {
  height: 60px;
  padding: 0 28px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  background: #ffffff;
  flex-shrink: 0;
}
.footer-btn {
  height: 34px;
  padding: 0 24px;
  font-size: 13px;
  border-radius: 3px;
  cursor: pointer;
}
.btn-plain {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #4e5969;
}
.btn-confirm {
  border: none;
  background: #3a65ff;
  color: #ffffff;
}
.btn-confirm:hover {
  background: #5982ff;
}

.mt-16 { margin-top: 16px; }
</style>
