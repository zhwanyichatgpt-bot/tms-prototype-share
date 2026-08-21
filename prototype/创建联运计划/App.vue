<template>
  <WorkspaceShell current-title="创建联运计划">
    <div class="page-root">
      <!-- 页面标题 -->
      <div class="page-header plan-source-anchor">
        <div>
          <h1 class="page-title">新增联运计划</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="close-entry" @click="handleCancel">
            <span class="close-arrow">←</span>
            <span class="close-text">返回联运计划</span>
          </button>
        </div>
      </div>

      <!-- 基础信息 -->
      <div class="section-card basic-info-card">
        <div class="section-header">
          <span class="section-title">基础信息</span>
          <div class="section-actions">
            <button v-if="isManualCreate" type="button" class="link-btn" @click="openWaybillDrawer">关联托运单</button>
            <button v-else type="button" class="link-btn" @click="clearWaybillRelation">解除关联</button>
          </div>
        </div>
        <div class="form-grid">
          <div v-if="!isManualCreate" class="form-field">
            <label class="field-label">关联托运单</label>
            <input class="field-input readonly" :value="waybillOrder && waybillOrder.id" disabled />
          </div>
          <div v-if="!isManualCreate" class="form-field">
            <label class="field-label">关联报价单</label>
            <button type="button" class="field-input quote-field-link" @click="openQuoteDialog">
              {{ confirmedQuote && confirmedQuote.id }}
            </button>
          </div>
          <div class="form-field" :class="{ 'field-full': isManualCreate }">
            <label class="field-label">计划名称</label>
            <input v-model="formData.planName" class="field-input" placeholder="请输入计划名称" />
          </div>
          <div class="form-field">
            <label class="field-label">托运企业</label>
            <input v-model="waybillOrder.shipperCompany" class="field-input" :class="{ readonly: !isManualCreate }" :disabled="!isManualCreate" placeholder="请输入托运企业" />
          </div>
          <div class="form-field">
            <label class="field-label">联系人</label>
            <input v-model="waybillOrder.contactName" class="field-input" :class="{ readonly: !isManualCreate }" :disabled="!isManualCreate" placeholder="请输入联系人" />
          </div>
          <div class="form-field">
            <label class="field-label">联系电话</label>
            <input v-model="waybillOrder.contactPhone" class="field-input" :class="{ readonly: !isManualCreate }" :disabled="!isManualCreate" placeholder="请输入联系电话" />
          </div>
          <div class="form-field field-full">
            <label class="field-label">备注</label>
            <textarea v-model="formData.remark" class="field-textarea" placeholder="请输入备注信息" />
          </div>
        </div>
      </div>

      <!-- 货品信息 -->
      <div class="section-card cargo-info-card">
        <div class="section-header">
          <span class="section-title">货品信息</span>
          <span v-if="!isManualCreate" class="section-extra">来源托运单，已锁定</span>
          <button v-else type="button" class="link-btn" @click="addCargoItem">+ 添加货品</button>
        </div>

        <!-- PRD 点1：配载方式三选一（列高亮驱动） -->
        <div class="stowage-row">
          <span class="stowage-label">配载方式</span>
          <div class="segmented">
            <button type="button" :class="{ active: formData.stowageMode === '按重量' }" :disabled="cargoLocked" @click="setStowageMode('按重量')">按重量</button>
            <button type="button" :class="{ active: formData.stowageMode === '按体积' }" :disabled="cargoLocked" @click="setStowageMode('按体积')">按体积</button>
            <button type="button" :class="{ active: formData.stowageMode === '按数量' }" :disabled="cargoLocked" @click="setStowageMode('按数量')">按数量</button>
          </div>
          <span class="stowage-tip">当前配载方式对应列高亮并必填，货品总价 = 货品单价 × 当前配载方式数值</span>
        </div>

        <div class="table-wrap">
          <table class="cargo-table">
            <thead>
              <tr>
                <th width="50">序号</th>
                <th>货品</th>
                <th>包装</th>
                <th width="80" :class="{ 'col-active': activeCargoColumn === 'weight' }">重量<em v-if="activeCargoColumn === 'weight'">*</em></th>
                <th width="80" :class="{ 'col-active': activeCargoColumn === 'volume' }">体积<em v-if="activeCargoColumn === 'volume'">*</em></th>
                <th width="80" :class="{ 'col-active': activeCargoColumn === 'quantity' }">数量<em v-if="activeCargoColumn === 'quantity'">*</em></th>
                <th width="90">货品单价</th>
                <th width="100">货品总价</th>
                <th v-if="isManualCreate" width="60">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in waybillOrder.cargoItems" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td v-if="!isManualCreate">{{ item.cargoName }}</td>
                <td v-else><input v-model="item.cargoName" class="table-input" placeholder="货品名称" /></td>
                <td v-if="!isManualCreate">{{ item.packageType }}</td>
                <td v-else>
                  <select v-model="item.packageType" class="table-select">
                    <option value="散装">散装</option>
                    <option value="袋装">袋装</option>
                    <option value="箱装">箱装</option>
                    <option value="桶装">桶装</option>
                  </select>
                </td>
                <td :class="{ 'col-active': activeCargoColumn === 'weight' }">
                  <template v-if="!isManualCreate">{{ item.weight }}吨</template>
                  <input v-else v-model.number="item.weight" class="table-input" type="number" placeholder="0" />
                </td>
                <td :class="{ 'col-active': activeCargoColumn === 'volume' }">
                  <template v-if="!isManualCreate">{{ item.volume }}m³</template>
                  <input v-else v-model.number="item.volume" class="table-input" type="number" placeholder="0" />
                </td>
                <td :class="{ 'col-active': activeCargoColumn === 'quantity' }">
                  <template v-if="!isManualCreate">{{ item.quantity }}{{ item.unit }}</template>
                  <input v-else v-model.number="item.quantity" class="table-input" type="number" placeholder="0" />
                </td>
                <td>
                  <template v-if="!isManualCreate">{{ item.unitPrice || 0 }}</template>
                  <input v-else v-model.number="item.unitPrice" class="table-input" type="number" placeholder="0" />
                </td>
                <td class="cargo-total">{{ formatMoney(cargoItemTotal(item)) }}</td>
                <td v-if="isManualCreate">
                  <button v-if="waybillOrder.cargoItems.length > 1" type="button" class="link-btn text-danger" @click="removeCargoItem(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 路线规划 -->
      <div class="section-card route-info-card">
        <div class="section-header">
          <span class="section-title">路线规划</span>
          <span v-if="!isManualCreate" class="section-extra">报价路线只读，执行段由系统聚合生成</span>
          <button v-else type="button" class="link-btn" @click="addRouteSegment">+ 添加执行段</button>
        </div>
        <div class="route-list route-linkage-anchor">
          <div
            v-for="(segment, index) in routeSegments"
            :key="segment.id"
            class="route-card"
            :class="{ 'has-sub-plan': segment.subPlan }"
          >
            <div class="route-toolbar">
              <div class="route-toolbar-main">
                <span class="drag-handle">⠿</span>
                <span class="route-index">执行段 {{ segment.seq }}</span>
                <span v-if="!isManualCreate" class="mode-tag" :class="getModeClass(segment.transportMode)">{{ segment.transportMode }}</span>
                <select v-else v-model="segment.transportMode" class="mode-select" @change="onSegmentFieldChange(segment)">
                  <option value="公路">公路</option>
                  <option value="铁路">铁路</option>
                  <option value="水路">水路</option>
                </select>
                <span v-if="!isManualCreate" class="carry-type-tag">{{ segment.carryForm }}</span>
                <select v-else v-model="segment.carryForm" class="carry-select">
                  <option value="散货运输">散货运输</option>
                  <option value="集装箱运输">集装箱运输</option>
                </select>
              </div>
              <div class="route-toolbar-actions">
                <button
                  v-if="!segment.subPlan"
                  type="button"
                  class="create-sub-plan-btn"
                  @click="createSubPlan(segment)"
                >创建子计划</button>
                <button
                  v-else
                  type="button"
                  class="create-sub-plan-btn created"
                  @click="viewSubPlan(segment)"
                >查看子计划</button>
                <span v-if="segment.duration && segment.duration !== '待确认'" class="duration-tag">{{ segment.duration }}</span>
                <button v-if="isManualCreate && routeSegments.length > 1" type="button" class="link-btn text-danger" @click="removeRouteSegment(index)">删除执行段</button>
              </div>
            </div>

            <!-- shared 模式：节点行 + 货物行 -->
            <div v-if="!isManualCreate" class="node-lines readonly-node-lines">
              <div
                v-for="node in segmentDisplayNodes(segment)"
                :key="`${segment.id}-${node.index}`"
                class="node-item"
              >
                <div class="node-line">
                  <button type="button" class="node-delete" disabled aria-label="删除节点"></button>
                  <span class="node-type" :class="node.kind">{{ node.shortLabel }}</span>
                  <span class="node-address" :title="node.name">
                    {{ node.name }}
                    <em v-if="node.samePoint" class="site-tag">网点</em>
                  </span>
                  <span class="node-icons">↔</span>
                  <span class="node-icons">⊕</span>
                  <input class="node-time" type="text" readonly :placeholder="nodeWorkTimePlaceholder(node)" />
                  <input class="node-contact" type="text" readonly placeholder="联系人" />
                  <input class="node-phone" type="text" readonly placeholder="联系电话" />
                </div>
                <div class="node-cargo-line">
                  <span class="cargo-label">货物</span>
                  <template v-if="nodeCargoItems(segment, node).length">
                    <span
                      v-for="item in nodeCargoItems(segment, node)"
                      :key="`${segment.id}-${node.index}-${item.cargoId}`"
                      class="cargo-chip"
                    >{{ item.cargoName }}｜{{ item.packageType }}｜{{ item.quantity }}{{ item.unit }}</span>
                  </template>
                  <span v-else class="cargo-empty">无</span>
                </div>
              </div>
            </div>

            <!-- 手工模式：起终点 + 装卸作业时间 -->
            <div v-else class="segment-detail-grid">
              <label class="segment-node-field">
                <span>起点</span>
                <input v-model="segment.from" class="point-input" placeholder="起点" @change="onSegmentFieldChange(segment)" />
              </label>
              <label>
                <span>终点</span>
                <input v-model="segment.to" class="point-input" placeholder="终点" @change="onSegmentFieldChange(segment)" />
              </label>
              <label>
                <span>装货作业时间</span>
                <input v-model="segment.loadWorkTime" class="point-input" type="datetime-local" />
              </label>
              <label>
                <span>卸货作业时间</span>
                <input v-model="segment.unloadWorkTime" class="point-input" type="datetime-local" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 费用信息 -->
      <div class="section-card fee-info-card">
        <div class="section-header">
          <span class="section-title">费用信息</span>
          <span class="section-extra">{{ isManualCreate ? '配置货主侧计划费用规则' : '已带入承运商报价，可配置货主侧费用' }}</span>
        </div>
        <div class="shipper-fee-switch">
          <span>货主费用设置</span>
          <button type="button" :class="feeConfig.enabled ? 'switch-on' : 'switch-off'" @click="feeConfig.enabled = !feeConfig.enabled"></button>
          <em>{{ feeConfig.enabled ? '已启用货主侧结算费用配置' : '无上游货主（或为本企业）时可关闭' }}</em>
        </div>
        <div v-if="feeConfig.enabled" class="fee-config-panel">
          <div class="fee-config-row">
            <label>
              <span>结算方式</span>
              <div class="segmented">
                <button type="button" :class="{ active: feeConfig.settlementMode === '整票结算' }" @click="feeConfig.settlementMode = '整票结算'">整票结算</button>
                <button type="button" :class="{ active: feeConfig.settlementMode === '分段结算' }" @click="feeConfig.settlementMode = '分段结算'">分段结算</button>
              </div>
            </label>
            <label>
              <span>是否含税</span>
              <div class="segmented small">
                <button type="button" :class="{ active: feeConfig.includeTax }" @click="feeConfig.includeTax = true">是</button>
                <button type="button" :class="{ active: !feeConfig.includeTax }" @click="feeConfig.includeTax = false">否</button>
              </div>
            </label>
            <label>
              <span>付款类型</span>
              <select v-model="feeConfig.paymentType">
                <option>预付</option>
                <option>到付</option>
                <option>月结</option>
              </select>
            </label>
            <label>
              <span>预付金额</span>
              <div class="inline-input">
                <select v-model="feeConfig.prepayType"><option>固定金额</option><option>按比例</option></select>
                <input v-model.number="feeConfig.prepayAmount" type="number" min="0" placeholder="0.00" />
              </div>
            </label>
            <label>
              <span>付款方式</span>
              <select v-model="feeConfig.paymentMethod">
                <option>银行转账</option>
                <option>线上支付</option>
                <option>承兑汇票</option>
              </select>
            </label>
          </div>
          <div class="fee-config-row">
            <label>
              <span>计算规则</span>
              <select v-model="feeConfig.calcRule">
                <option>按重量</option>
                <option>按体积</option>
                <option>按车次</option>
                <option>按箱</option>
                <option>按里程</option>
              </select>
            </label>
            <label>
              <span>计量单位</span>
              <select v-model="feeConfig.measureUnit">
                <option>吨</option>
                <option>方</option>
                <option>车</option>
                <option>箱</option>
                <option>公里</option>
              </select>
            </label>
            <label>
              <span>计费依据</span>
              <select v-model="feeConfig.billingBasis">
                <option>装货重量</option>
                <option>卸货重量</option>
                <option>报价金额</option>
                <option>计划路段</option>
              </select>
            </label>
            <label>
              <span>运输单价</span>
              <div class="inline-input"><input v-model.number="feeConfig.unitPrice" type="number" min="0" placeholder="0.00" /><em>{{ feeUnitText }}</em></div>
            </label>
            <label>
              <span>货品超耗扣罚规则</span>
              <select v-model="feeConfig.lossRule">
                <option>不启用</option>
                <option>按重量差扣罚</option>
                <option>按比例扣罚</option>
              </select>
            </label>
            <button type="button" class="quota-link" @click="feeConfig.quotaEnabled = !feeConfig.quotaEnabled">
              {{ feeConfig.quotaEnabled ? '已设置配额' : '设置配额值' }}
            </button>
          </div>
          <div class="formula-line">
            <span>{{ feeFormulaText }}</span>
            <strong>{{ formatMoney(shipperTransportAmount) }}</strong>
          </div>

          <!-- 整票结算 + 按集装箱：箱型价格明细（PRD 点6） -->
          <div v-if="feeConfig.settlementMode === '整票结算' && feeConfig.calcRule === '按箱'" class="box-price-block">
            <div class="box-price-title">箱型价格明细<span class="box-price-tip">（至少一条有效明细，箱型不可重复）</span></div>
            <table class="extra-fee-table">
              <thead>
                <tr>
                  <th width="56">序号</th>
                  <th>箱型</th>
                  <th width="140">尺寸</th>
                  <th width="160">单价(元)</th>
                  <th width="70">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in boxPriceRows" :key="row.id">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <select v-model="row.boxType" class="table-select">
                      <option value="GP">GP</option>
                      <option value="HC">HC</option>
                      <option value="RF">RF</option>
                      <option value="OT">OT</option>
                    </select>
                  </td>
                  <td>
                    <select v-model="row.boxSize" class="table-select">
                      <option value="20尺">20尺</option>
                      <option value="40尺">40尺</option>
                      <option value="45尺">45尺</option>
                    </select>
                  </td>
                  <td><input v-model.number="row.price" type="number" min="0" placeholder="0.00" /></td>
                  <td><button type="button" class="link-btn" @click="removeBoxPriceRow(idx)">删除</button></td>
                </tr>
              </tbody>
            </table>
            <button type="button" class="add-extra-btn" @click="addBoxPriceRow">⊕ 添加</button>
            <div v-if="boxPriceDuplicate" class="box-price-warn">⚠ 检测到重复箱型组合，箱型不可重复</div>
          </div>

          <!-- 分段结算：异构分段（PRD 点5） -->
          <div v-if="feeConfig.settlementMode === '分段结算'" class="segment-rule-table">
            <table class="extra-fee-table">
              <thead>
                <tr>
                  <th width="70">执行段</th>
                  <th>线路</th>
                  <th width="110">运输方式</th>
                  <th width="130">计费条件</th>
                  <th width="130">计费依据</th>
                  <th width="120">运输单价</th>
                  <th width="100">单价单位</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="seg in linkedRouteSegments" :key="`fee-${seg.id}`">
                  <td>{{ seg.seq }}</td>
                  <td>{{ seg.from }} → {{ seg.to }}</td>
                  <td>{{ seg.transportMode }}</td>
                  <td>
                    <select v-model="seg.segCalcCondition" class="table-select" @change="onSegCalcChange(seg)">
                      <option value="按重量">按重量</option>
                      <option value="按体积">按体积</option>
                      <option value="按数量">按数量</option>
                      <option value="按集装箱">按集装箱</option>
                    </select>
                  </td>
                  <td>
                    <select v-if="seg.carryForm !== '集装箱运输'" v-model="seg.segBillingBasis" class="table-select">
                      <option value="按装货口径">按装货口径</option>
                      <option value="按卸货口径">按卸货口径</option>
                    </select>
                    <span v-else class="basis-empty">—</span>
                  </td>
                  <td><input v-model.number="seg.segUnitPrice" class="table-input" type="number" min="0" placeholder="0.00" /></td>
                  <td>{{ segPriceUnitText(seg) }}</td>
                </tr>
                <tr v-if="!linkedRouteSegments.length">
                  <td colspan="7" class="drawer-empty">暂无已关联子计划的路段（分段结算仅对已关联子计划的路段开放配置）</td>
                </tr>
              </tbody>
            </table>
            <div v-if="unlinkedRouteSegments.length" class="segment-rule-warn">⚠ 存在未关联子计划的路段，生效前需先完成全部路段子计划关联</div>
          </div>
        </div>

        <!-- 其他费用（PRD 点3：计价方式联动 + 增减项） -->
        <div v-if="feeConfig.enabled" class="extra-fee-block">
          <div class="extra-title">其他费用</div>
          <table class="extra-fee-table">
            <thead>
              <tr>
                <th width="50">序号</th>
                <th>费用名称</th>
                <th width="90">费用类型</th>
                <th width="120">计价方式</th>
                <th width="110">单价</th>
                <th width="110">基数</th>
                <th width="120">金额</th>
                <th v-if="isManualCreate" width="70">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fee, index) in extraFeeRows" :key="fee.id">
                <td>{{ index + 1 }}</td>
                <td><input v-model="fee.name" placeholder="请输入" :disabled="!isManualCreate" /></td>
                <td>
                  <select v-model="fee.feeType" :disabled="!isManualCreate">
                    <option value="增项">增项</option>
                    <option value="减项">减项</option>
                  </select>
                </td>
                <td>
                  <select v-model="fee.pricingMode" :disabled="!isManualCreate">
                    <option value="整单">整单</option>
                    <option value="当前配载方式">当前配载方式</option>
                  </select>
                </td>
                <td><input v-model.number="fee.price" type="number" min="0" placeholder="0.00" :disabled="!isManualCreate" /></td>
                <td><input v-model.number="fee.basis" type="number" min="0" placeholder="0" :disabled="!isManualCreate" /></td>
                <td class="amount-cell">{{ formatMoney(extraFeeAmount(fee)) }}</td>
                <td v-if="isManualCreate"><button type="button" class="link-btn" @click="removeExtraFeeRow(index)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <button v-if="isManualCreate" type="button" class="add-extra-btn" @click="addExtraFeeRow">⊕ 添加</button>
          <div class="extra-fee-total">其他费用净值：{{ formatMoney(extraFeeNetAmount) }}</div>
        </div>
      </div>

      <!-- 附件 -->
      <div class="section-card attachment-card">
        <div class="section-header">
          <span class="section-title">附件</span>
        </div>
        <div class="upload-area">
          <button type="button" class="upload-btn">点击上传</button>
          <span class="upload-tip">支持扩展名：jpg、png、pdf，单个文件不超过 10MB</span>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="page-footer">
        <div class="footer-info">
          <span class="footer-tip">已创建 <b>{{ createdSubPlanCount }}</b> 个子计划</span>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn btn-default" @click="handleCancel">取消</button>
          <button type="button" class="btn btn-secondary" @click="handleSaveDraft">保存草稿</button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="handleSubmit">提交生效</button>
        </div>
      </div>

      <!-- 报价单详情弹窗 -->
      <el-dialog v-model="quoteDialogVisible" width="760px" class="quote-modal-wrap" :show-close="false" :append-to-body="false">
        <template #header>
          <div class="modal-header-inner">
            <span class="modal-title">报价单详情</span>
            <button type="button" class="modal-close" @click="closeQuoteDialog">×</button>
          </div>
        </template>
        <div class="quote-detail-grid">
          <div class="detail-row">
            <span class="detail-label">报价单号</span>
            <span class="detail-value">{{ confirmedQuote && confirmedQuote.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">报价模式</span>
            <span class="detail-value">{{ feeInfo.quoteMode || (confirmedQuote && confirmedQuote.quoteMode) || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">运输费用</span>
            <span class="detail-value">{{ formatMoney(feeInfo.transportTotal) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">合计金额</span>
            <span class="detail-value strong">{{ formatMoney(feeInfo.totalAmount) }}</span>
          </div>
        </div>
        <table class="quote-segment-table">
          <thead>
            <tr>
              <th width="64">小段</th>
              <th width="90">运输方式</th>
              <th>起点</th>
              <th>终点</th>
              <th width="130">承运货品</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="segment in quoteSegments" :key="`quote-detail-${segment.id}`">
              <td>{{ segment.seq }}</td>
              <td><span class="mode-tag" :class="getModeClass(segment.transportMode)">{{ segment.transportMode }}</span></td>
              <td>{{ segment.from }}</td>
              <td>{{ segment.to }}</td>
              <td>{{ segmentCargoText(segment) }}</td>
            </tr>
          </tbody>
        </table>
        <template #footer>
          <button type="button" class="btn btn-default" @click="closeQuoteDialog">关闭</button>
        </template>
      </el-dialog>

      <!-- 关联托运单抽屉（PRD 点4：筛选） -->
      <el-drawer v-model="waybillDrawerVisible" title="选择关联托运单" direction="rtl" size="760px" class="waybill-drawer-wrap" :append-to-body="false">
        <div class="drawer-filter">
          <input class="drawer-filter-input" v-model="drawerFilters.keyword" placeholder="按编号/托运企业/货类搜索" />
          <input class="drawer-filter-input datetime" v-model="drawerFilters.createDate" type="date" />
          <input class="drawer-filter-input" v-model="drawerFilters.creator" placeholder="创建人" />
          <button class="btn btn-default btn-sm" @click="resetDrawerFilter">重置</button>
        </div>
        <table class="drawer-table">
          <thead>
            <tr>
              <th width="46">选择</th>
              <th>托运单号</th>
              <th>托运企业</th>
              <th>货类</th>
              <th>主方式</th>
              <th>状态</th>
              <th width="100">创建人</th>
              <th width="110">创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredDrawerWaybills"
              :key="item.id"
              :class="{ selected: selectedDrawerWaybillId === item.id }"
              @click="selectedDrawerWaybillId = item.id"
            >
              <td><input v-model="selectedDrawerWaybillId" type="radio" :value="item.id" /></td>
              <td>{{ item.id }}</td>
              <td>{{ item.shipperCompany || '-' }}</td>
              <td>{{ item.businessType || '散杂货' }}</td>
              <td>{{ item.mainTransportMode || item.transportMode || '-' }}</td>
              <td>{{ item.status || '-' }}</td>
              <td>{{ item.creator || '-' }}</td>
              <td>{{ item.createTime || '-' }}</td>
            </tr>
            <tr v-if="!filteredDrawerWaybills.length">
              <td colspan="8" class="drawer-empty">暂无符合条件的托运单</td>
            </tr>
          </tbody>
        </table>
        <template #footer>
          <button type="button" class="btn btn-default" @click="closeWaybillDrawer">取消</button>
          <button type="button" class="btn btn-primary" @click="confirmWaybillRelation">确认关联</button>
        </template>
      </el-drawer>

      <!-- 子计划详情弹窗 -->
      <el-dialog v-model="subPlanDialogVisible" width="520px" class="subplan-modal-wrap" :show-close="false" :append-to-body="false">
        <template #header>
          <div class="modal-header-inner">
            <span class="modal-title">子计划详情</span>
            <button type="button" class="modal-close" @click="closeSubPlanDialog">×</button>
          </div>
        </template>
        <div v-if="currentSubPlan" class="sub-plan-detail">
          <div class="detail-row">
            <span class="detail-label">子计划编号</span>
            <span class="detail-value">{{ currentSubPlan.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">子计划类型</span>
            <span class="detail-value">{{ currentSubPlan.type }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value">
              <span class="status-tag" :class="getStatusClass(currentSubPlan.status)">{{ currentSubPlan.status }}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">简要信息</span>
            <span class="detail-value">{{ currentSubPlan.summary }}</span>
          </div>
        </div>
        <template #footer>
          <button type="button" class="btn btn-default" @click="closeSubPlanDialog">关闭</button>
        </template>
      </el-dialog>
    </div>
  </WorkspaceShell>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WorkspaceShell from '../../src/components/WorkspaceShell.vue'
import {
  defaultWaybillOrder,
  defaultConfirmedQuote,
  defaultRouteSegments,
  defaultFeeInfo,
  subPlanTypeMap,
} from './mock-data'

// ============ 模块级 ============
let subPlanSeq = 1

// ============ 状态 ============
const waybillOrder = ref({ cargoItems: [] })
const confirmedQuote = ref(null)
const quoteSegments = ref([])
const routeSegments = ref([])
const feeInfo = ref({})
const selectableWaybills = ref([])
const waybillDrawerVisible = ref(false)
const selectedDrawerWaybillId = ref('')
const submitting = ref(false)
const subPlanDialogVisible = ref(false)
const quoteDialogVisible = ref(false)
const currentSubPlan = ref(null)
const sourceType = ref('default') // 'default' | 'shared'

const feeConfig = reactive({
  enabled: true,
  settlementMode: '整票结算',
  includeTax: true,
  paymentType: '预付',
  prepayType: '固定金额',
  prepayAmount: 0,
  paymentMethod: '银行转账',
  calcRule: '按重量',
  measureUnit: '吨',
  billingBasis: '装货重量',
  unitPrice: 20,
  lossRule: '不启用',
  quotaEnabled: false,
})

// PRD 点3：其他费用增减项 + 计价联动
const extraFeeRows = ref([
  { id: 'extra-1', name: '拖箱费', amount: 0, feeType: '增项', pricingMode: '整单', price: 0, basis: 1 },
  { id: 'extra-2', name: '装卸费', amount: 0, feeType: '增项', pricingMode: '整单', price: 0, basis: 1 },
])

const formData = reactive({
  planName: '',
  remark: '',
  stowageMode: '按重量', // PRD 点1：配载方式
})

// PRD 点6：箱型价格明细
const boxPriceRows = ref([{ id: 'box-1', boxType: 'GP', boxSize: '20尺', price: 0 }])

// PRD 点4：抽屉筛选
const drawerFilters = reactive({ keyword: '', createDate: '', creator: '' })

// ============ computed ============
const createdSubPlanCount = computed(() => routeSegments.value.filter(seg => seg.subPlan).length)
const isManualCreate = computed(() => sourceType.value !== 'shared')

const feeUnitText = computed(() => {
  const unitMap = { 吨: '元/吨', 方: '元/方', 车: '元/车', 箱: '元/箱', 公里: '元/公里' }
  return unitMap[feeConfig.measureUnit] || '元'
})

const cargoBillingQty = computed(() => {
  return (waybillOrder.value.cargoItems || []).reduce((sum, item) => sum + Number(item.weight || item.quantity || 0), 0)
})

const shipperTransportAmount = computed(() => {
  if (!feeConfig.enabled) return 0
  if (feeConfig.settlementMode === '分段结算') {
    return routeSegments.value.reduce((sum, segment) => sum + Number(segment.segUnitPrice || segment.feeUnitPrice || 0), 0)
  }
  return cargoBillingQty.value * Number(feeConfig.unitPrice || 0)
})

const feeFormulaText = computed(() => {
  if (!feeConfig.enabled) return '未启用货主侧费用'
  if (feeConfig.settlementMode === '分段结算') return '运输计算方式：按各执行段计费规则分别计算后汇总'
  return `运输计算方式：${feeConfig.billingBasis} ${cargoBillingQty.value || 0}${feeConfig.measureUnit} * ${Number(feeConfig.unitPrice || 0)}`
})

// PRD 点1：当前配载方式对应的列
const activeCargoColumn = computed(() => {
  if (formData.stowageMode === '按体积') return 'volume'
  if (formData.stowageMode === '按数量') return 'quantity'
  return 'weight'
})

// 货品锁定：shared 或 任一路段已关联子计划
const cargoLocked = computed(() => !isManualCreate.value || routeSegments.value.some(s => s.subPlan))

// PRD 点5：已关联子计划的路段（分段结算仅对这些开放）
const linkedRouteSegments = computed(() => routeSegments.value.filter(s => s.subPlan))
const unlinkedRouteSegments = computed(() => routeSegments.value.filter(s => !s.subPlan))

// PRD 点6：箱型重复检测
const boxPriceDuplicate = computed(() => {
  const seen = new Set()
  for (const row of boxPriceRows.value) {
    const key = `${row.boxType}_${row.boxSize}`
    if (seen.has(key)) return true
    seen.add(key)
  }
  return false
})

// PRD 点4：抽屉筛选
const filteredDrawerWaybills = computed(() => {
  let list = selectableWaybills.value
  if (drawerFilters.keyword) {
    const k = drawerFilters.keyword.toLowerCase()
    list = list.filter(item =>
      (item.id && item.id.toLowerCase().includes(k)) ||
      (item.shipperCompany && item.shipperCompany.toLowerCase().includes(k)) ||
      (item.businessType && item.businessType.toLowerCase().includes(k))
    )
  }
  if (drawerFilters.createDate) {
    list = list.filter(item => (item.createTime || '').startsWith(drawerFilters.createDate))
  }
  if (drawerFilters.creator) {
    list = list.filter(item => (item.creator || '').includes(drawerFilters.creator))
  }
  return list
})

// PRD 点3：其他费用净值
const extraFeeNetAmount = computed(() => {
  return extraFeeRows.value.reduce((sum, fee) => {
    const sign = fee.feeType === '减项' ? -1 : 1
    return sum + sign * Number(fee.price || 0) * Number(fee.basis || 0)
  }, 0)
})

// ============ 初始化 ============
function readSharedData() {
  // 新仓无 hub 服务：优先读 window.sharedStorage（托运单管理页可能写入），失败返回空
  if (window.sharedStorage && typeof window.sharedStorage.readAll === 'function') {
    return window.sharedStorage.readAll()
  }
  return Promise.resolve({})
}

function loadSharedData() {
  readSharedData().then((data) => {
    selectableWaybills.value = (data.waybills || []).filter(item => item.status !== '草稿')

    // shared 模式：三件套都存在
    if (data.selectedWaybillId && data.selectedQuoteId && data.selectedOrderId) {
      const waybills = data.waybills || []
      const quotes = data.quotes || []
      const waybill = waybills.find(w => w.id === data.selectedWaybillId)
      const quote = quotes.find(q => q.id === data.selectedQuoteId)

      if (waybill && quote) {
        const cargoItems = normalizeCargoItems(waybill.cargoItems || [], waybill)
        waybillOrder.value = {
          id: waybill.id,
          shipperCompany: waybill.shipperCompany,
          contactName: waybill.contactName,
          contactPhone: waybill.contactPhone,
          remark: waybill.remark || '',
          cargoItems,
          loadNodes: waybill.loadNodes || [],
          unloadNodes: waybill.unloadNodes || [],
          containerBoxes: waybill.containerBoxes || [],
          containerNodes: waybill.containerNodes || [],
        }
        quoteSegments.value = normalizeQuoteSegments(quote.routeSegments || [], waybill)
        const effectiveQuoteSegments = quoteSegments.value.length > 0
          ? quoteSegments.value
          : buildSegmentsFromWaybill(waybill, cargoItems)
        routeSegments.value = aggregateExecutionSegments(effectiveQuoteSegments, cargoItems)
        if (waybill.businessType === '集装箱' && waybill.containerNodes && waybill.containerNodes.length) {
          enrichContainerStateTypes(routeSegments.value, waybill.containerNodes)
        }
        feeInfo.value = {
          quoteMode: quote.quoteMode || '分段报价',
          billingCondition: quote.billingBasis || '按装货口径',
          billingBasis: quote.billingBasis || '按装货口径',
          transportTotal: quote.transportTotal || 0,
          extraTotal: quote.extra || 0,
          totalAmount: quote.totalAmount || 0,
        }
        applyFeeDefaults(quote)
        confirmedQuote.value = { id: quote.id, quoteMode: quote.quoteMode }
        formData.planName = `${waybill.cargoItems?.[0]?.loadPoint || waybill.loadNodes?.[0]?.name || '起点'}-${waybill.cargoItems?.[0]?.unloadPoint || waybill.unloadNodes?.[0]?.name || '终点'}联运计划`
        formData.remark = waybill.remark || ''
        sourceType.value = 'shared'
        return
      }
    }

    // 兜底：默认数据
    useDefaultData()
  }).catch((e) => {
    console.warn('[创建联运计划] 加载共享数据失败，使用默认数据:', e)
    useDefaultData()
  })
}

function useDefaultData() {
  // 深拷贝避免响应式污染源 mock
  waybillOrder.value = JSON.parse(JSON.stringify(defaultWaybillOrder))
  confirmedQuote.value = { ...defaultConfirmedQuote }
  quoteSegments.value = normalizeQuoteSegments(defaultRouteSegments, defaultWaybillOrder)
  routeSegments.value = aggregateExecutionSegments(quoteSegments.value, defaultWaybillOrder.cargoItems)
  feeInfo.value = { ...defaultFeeInfo }
  applyFeeDefaults(defaultConfirmedQuote)
  formData.planName = '宿迁-金华公铁联运计划'
  formData.remark = defaultWaybillOrder.remark || ''
  sourceType.value = 'default'
  // 抽屉候选托运单（含筛选字段，演示用）— 深拷贝避免响应式污染源 mock
  if (!selectableWaybills.value.length) {
    selectableWaybills.value = [
      { id: 'TY20250612001', shipperCompany: '华东农业贸易有限公司', businessType: '散杂货', mainTransportMode: '多式联运', status: '待执行', creator: '张三', createTime: '2026-06-12 09:30', cargoItems: JSON.parse(JSON.stringify(defaultWaybillOrder.cargoItems)), loadNodes: [{ name: '安徽宿迁一号装货点' }], unloadNodes: [{ name: '浙江金华一号卸货点' }] },
      { id: 'TY20250613008', shipperCompany: '北方供应链公司', businessType: '集装箱', mainTransportMode: '多式联运', status: '待执行', creator: '李四', createTime: '2026-06-13 14:20', cargoItems: [{ id: 'C3', cargoName: '电子配件', packageType: '箱装', weight: 25, quantity: 5, unit: '箱', loadPoint: '北京', unloadPoint: '上海' }], containerBoxes: [{ id: 'b1', containerType: '20GP', quantity: 5 }], containerNodes: [{ nodeType: '提空', name: '北京堆场' }, { nodeType: '装货', name: '北京工厂' }, { nodeType: '卸货', name: '上海仓' }, { nodeType: '还空', name: '上海堆场' }], loadNodes: [{ name: '北京' }], unloadNodes: [{ name: '上海' }] },
    ]
  }
}

// ============ 归一化方法 ============
function normalizeCargoItems(items = [], waybill = {}) {
  const fallbackLoad = waybill.loadNodes && waybill.loadNodes[0] ? waybill.loadNodes[0] : {}
  const fallbackUnload = waybill.unloadNodes && waybill.unloadNodes.length ? waybill.unloadNodes[waybill.unloadNodes.length - 1] : {}
  return items.map((item, index) => ({
    ...item,
    cargoId: item.cargoId || item.id || `cargo-${index + 1}`,
    cargoName: item.cargoName || '货品',
    packageType: item.packageType || item.package || '散装',
    weight: Number(item.weight || item.quantity || 0),
    volume: Number(item.volume || 0),
    quantity: Number(item.quantity || item.weight || 0),
    unit: item.unit || '吨',
    unitPrice: Number(item.unitPrice || 0),
    loadPoint: item.loadPoint || item.loadNodeName || fallbackLoad.name || '',
    unloadPoint: item.unloadPoint || item.unloadNodeName || fallbackUnload.name || '',
  }))
}

function normalizeQuoteSegments(segments = [], waybill = {}) {
  return segments.map((seg, index) => ({
    id: seg.id || `quote-seg-${index + 1}`,
    seq: index + 1,
    transportMode: seg.mode || seg.transportMode || '公路',
    carryForm: seg.carryForm || (waybill.businessType === '集装箱' ? '集装箱运输' : '散货运输'),
    fromId: seg.fromId || '',
    toId: seg.toId || '',
    from: seg.from || '起点',
    to: seg.to || '终点',
    duration: seg.duration || '',
    locked: true,
    loadWorkTime: seg.loadWorkTime || '',
    unloadWorkTime: seg.unloadWorkTime || '',
    billingDimension: seg.billingDimension || (waybill.businessType === '集装箱' ? '按箱' : '按重量'),
    unitPrice: Number(seg.unitPrice || 0),
    cargoItems: normalizeCargoItems(seg.cargoItems || [], waybill),
  }))
}

// 核心聚合：连续相同 transportMode 合并
function aggregateExecutionSegments(quoteSegmentsArr = [], fallbackCargoItems = []) {
  const groups = []
  quoteSegmentsArr.forEach((seg) => {
    const current = groups[groups.length - 1]
    if (!current || current.transportMode !== seg.transportMode) {
      groups.push({
        id: `exec-${seg.seq}`,
        transportMode: seg.transportMode,
        carryForm: seg.carryForm,
        from: seg.from,
        to: seg.to,
        duration: seg.duration || '待确认',
        locked: true,
        loadWorkTime: seg.loadWorkTime || '',
        unloadWorkTime: seg.unloadWorkTime || '',
        quoteSegmentIds: [seg.id],
        quoteSegments: [{ ...seg }],
        routeNodes: [seg.from, seg.to],
        cargoItems: [...seg.cargoItems],
        feeRule: seg.billingDimension || '按重量',
        feeUnitPrice: Number(seg.unitPrice || 0),
      })
      return
    }
    current.to = seg.to
    current.duration = current.duration || '待确认'
    current.quoteSegmentIds.push(seg.id)
    current.quoteSegments.push({ ...seg })
    current.routeNodes.push(seg.to)
    current.feeUnitPrice += Number(seg.unitPrice || 0)
    if (current.carryForm !== seg.carryForm) current.carryForm = '混合运输'
    seg.cargoItems.forEach(item => {
      const key = item.cargoId || item.id || item.cargoName
      const exists = current.cargoItems.some(cargo => (cargo.cargoId || cargo.id || cargo.cargoName) === key)
      if (!exists) current.cargoItems.push(item)
    })
  })

  return groups.map((group, index) => {
    const isContainer = group.carryForm === '集装箱运输'
    return {
      ...group,
      seq: index + 1,
      cargoItems: group.cargoItems.length ? group.cargoItems : fallbackCargoItems,
      routeNodeText: group.routeNodes.join(' -> '),
      // PRD 点5：异构分段初始化（各路段独立配置）
      segCalcCondition: isContainer ? '按集装箱' : '按重量',
      segBillingBasis: isContainer ? '' : '按装货口径',
      segUnitPrice: group.feeUnitPrice || 0,
      segPriceUnit: isContainer ? '元/箱' : '元/吨',
    }
  })
}

function applyFeeDefaults(quote = {}) {
  const billingBasis = quote.billingBasis || defaultFeeInfo.billingBasis || '按装货口径'
  feeConfig.settlementMode = quote.quoteMode === '分段报价' ? '分段结算' : '整票结算'
  feeConfig.billingBasis = billingBasis.includes('卸') ? '卸货重量' : '装货重量'
  feeConfig.unitPrice = Number(quote.transportUnitPrice || 20)
  routeSegments.value.forEach(segment => {
    segment.feeRule = segment.billingDimension || segment.feeRule || '按重量'
    segment.feeUnitPrice = Number(segment.feeUnitPrice || quote.transportUnitPrice || 0)
  })
}

// ============ 托运单兜底切段 ============
function buildSegmentsFromWaybill(waybill, cargoItems = []) {
  const loadNodes = waybill.loadNodes || []
  const unloadNodes = waybill.unloadNodes || []
  const containerNodes = waybill.containerNodes || []
  const isContainer = waybill.businessType === '集装箱'

  if (isContainer && containerNodes.length >= 2) {
    return buildContainerStateSegments(containerNodes, cargoItems)
  }

  const points = [...loadNodes, ...unloadNodes]
  const normalizedPoints = points.length >= 2 ? points : [
    { id: 'manual-start', name: cargoItems[0]?.loadPoint || '起点' },
    { id: 'manual-end', name: cargoItems[0]?.unloadPoint || '终点' },
  ]
  return normalizedPoints.slice(0, -1).map((node, index) => {
    const nextNode = normalizedPoints[index + 1]
    return {
      id: `seg-${Date.now()}-${index}`,
      seq: index + 1,
      transportMode: index === 0 || index === normalizedPoints.length - 2 ? '公路' : '铁路',
      carryForm: '散货运输',
      from: node.name || node.address || '起点',
      to: nextNode.name || nextNode.address || '终点',
      duration: '待确认',
      locked: true,
      loadWorkTime: '',
      unloadWorkTime: '',
      cargoItems,
      feeRule: '按重量',
      feeUnitPrice: 0,
      segCalcCondition: '按重量',
      segBillingBasis: '按装货口径',
      segUnitPrice: 0,
      segPriceUnit: '元/吨',
    }
  })
}

function buildContainerStateSegments(containerNodes, cargoItems = []) {
  const segments = []
  for (let i = 0; i < containerNodes.length - 1; i++) {
    const fromNode = containerNodes[i]
    const toNode = containerNodes[i + 1]
    const fromType = toStateNodeType(fromNode.nodeType, 'from', i)
    const toType = toStateNodeType(toNode.nodeType, 'to', i, containerNodes.length)
    segments.push({
      id: `seg-${Date.now()}-${i}`,
      seq: i + 1,
      transportMode: i === 0 || i === containerNodes.length - 2 ? '公路' : '铁路',
      carryForm: '集装箱运输',
      from: fromType + (fromNode.name || fromNode.address || ''),
      to: toType + (toNode.name || toNode.address || ''),
      fromNodeType: fromType,
      toNodeType: toType,
      duration: '待确认',
      locked: true,
      loadWorkTime: '',
      unloadWorkTime: '',
      cargoItems,
      feeRule: '按箱',
      feeUnitPrice: 0,
      segCalcCondition: '按集装箱',
      segBillingBasis: '',
      segUnitPrice: 0,
      segPriceUnit: '元/箱',
    })
  }
  return segments
}

function toStateNodeType(origType, position, segIndex, totalSegs) {
  if (['提空', '提重', '还空', '还重'].includes(origType)) return origType
  if (origType === '装货') return position === 'from' ? '提重' : '还空'
  if (origType === '卸货') return position === 'from' ? '提重' : '还重'
  return origType
}

function enrichContainerStateTypes(segments, containerNodes) {
  segments.forEach((seg, i) => {
    const fromNode = containerNodes[i]
    if (fromNode) seg.fromNodeType = toStateNodeType(fromNode.nodeType, 'from')
    const toNode = containerNodes[i + 1] || containerNodes[containerNodes.length - 1]
    if (toNode) seg.toNodeType = toStateNodeType(toNode.nodeType, 'to')
    if (seg.routeNodes && seg.routeNodes.length) {
      seg.routeNodeStates = seg.routeNodes.map((_, idx) => {
        if (idx === 0) return seg.fromNodeType || ''
        if (idx === seg.routeNodes.length - 1) return seg.toNodeType || ''
        return ''
      })
    }
  })
}

function stripStatePrefix(text) {
  if (!text) return ''
  return String(text).replace(/^(提空|提重|还空|还重)/, '').trim()
}

// ============ 节点展示三件套 ============
function segmentDisplayNodes(segment) {
  const nodes = (segment.routeNodes && segment.routeNodes.length)
    ? segment.routeNodes
    : [segment.from, segment.to].filter(Boolean)
  const cargoItems = segment.cargoItems || []
  const stateTypes = segment.routeNodeStates || []
  const isContainer = waybillOrder.value && waybillOrder.value.containerBoxes && waybillOrder.value.containerBoxes.length > 0
  return nodes.map((name, index) => {
    const stateType = stateTypes[index]
    if (isContainer && stateType) {
      return {
        index, label: stateType, name: stripStatePrefix(name), kind: stateNodeKind(stateType),
        shortLabel: stateType, isFirst: index === 0, isLast: index === nodes.length - 1, samePoint: true,
      }
    }
    const hasLoadOperation = cargoItems.some(item => item.loadPoint === name)
    const hasUnloadOperation = cargoItems.some(item => item.unloadPoint === name)
    let label = '途经点'
    let kind = 'transit'
    if (isContainer) {
      return { index, label: '中转', name, kind: 'transit', shortLabel: '中转', isFirst: index === 0, isLast: index === nodes.length - 1, samePoint: false }
    }
    if (hasLoadOperation) label = '装货点'
    if (hasUnloadOperation) label = '卸货点'
    if (index === 0 && !hasLoadOperation && !hasUnloadOperation) label = '起点'
    if (index === nodes.length - 1 && !hasUnloadOperation) label = '卸货点'
    if (label === '装货点') kind = 'load'
    if (label === '卸货点') kind = 'unload'
    if (label === '起点') kind = 'start'
    return {
      index, label, name, kind, shortLabel: label.slice(0, 1),
      isFirst: index === 0, isLast: index === nodes.length - 1, samePoint: hasLoadOperation || hasUnloadOperation,
    }
  })
}

function stateNodeKind(stateType) {
  const map = { '提空': 'pickup-empty', '提重': 'pickup-heavy', '还空': 'return-empty', '还重': 'return-heavy' }
  return map[stateType] || 'transit'
}

function nodeCargoItems(segment, node) {
  const cargoItems = segment.cargoItems || []
  if (!cargoItems.length) return []
  if (node.label === '装货点') {
    const matched = cargoItems.filter(item => item.loadPoint === node.name)
    return matched.length ? matched : []
  }
  if (node.label === '卸货点') {
    const matched = cargoItems.filter(item => item.unloadPoint === node.name)
    return matched.length ? matched : (node.isLast ? cargoItems : [])
  }
  return cargoItems
}

function nodeWorkTimePlaceholder(node) {
  if (node.label === '装货点') return '请选择装货时间'
  if (node.label === '卸货点') return '请选择卸货时间'
  return '请选择作业时间'
}

function segmentCargoText(segment) {
  if (!segment.cargoItems || !segment.cargoItems.length) return '-'
  return segment.cargoItems.map(item => `${item.cargoName}${item.quantity}${item.unit}`).join('、')
}

// ============ 货品 CRUD ============
function addCargoItem() {
  if (!waybillOrder.value.cargoItems) waybillOrder.value.cargoItems = []
  waybillOrder.value.cargoItems.push({
    id: `cargo-${Date.now()}`,
    cargoName: '', packageType: '散装', weight: 0, volume: 0, quantity: 0, unit: '吨', unitPrice: 0,
    loadPoint: '', unloadPoint: '',
  })
}
function removeCargoItem(index) {
  if (waybillOrder.value.cargoItems.length > 1) waybillOrder.value.cargoItems.splice(index, 1)
}

// PRD 点1：配载方式切换
function setStowageMode(mode) {
  if (cargoLocked.value) return
  formData.stowageMode = mode
}

// PRD 点2：货品总价（单价 × 当前配载方式对应数值）
function cargoItemTotal(item) {
  const unitPrice = Number(item.unitPrice || 0)
  let activeValue = 0
  if (activeCargoColumn.value === 'weight') activeValue = Number(item.weight || 0)
  else if (activeCargoColumn.value === 'volume') activeValue = Number(item.volume || 0)
  else activeValue = Number(item.quantity || 0)
  return unitPrice * activeValue
}

// ============ 执行段 CRUD ============
function addRouteSegment() {
  const seq = routeSegments.value.length + 1
  routeSegments.value.push({
    id: `seg-${Date.now()}`, seq,
    transportMode: '公路', carryForm: '散货运输',
    from: '', to: '', duration: '待确认',
    locked: false, loadWorkTime: '', unloadWorkTime: '',
    cargoItems: [], feeRule: '按重量', feeUnitPrice: 0,
    segCalcCondition: '按重量', segBillingBasis: '按装货口径', segUnitPrice: 0, segPriceUnit: '元/吨',
  })
  renumberRouteSegments()
}

// PRD 点8：删除已关联子计划路段提示
function removeRouteSegment(index) {
  const seg = routeSegments.value[index]
  if (seg && seg.subPlan) {
    ElMessageBox.confirm(
      `执行段 ${seg.seq} 已关联子计划「${seg.subPlan.id}」，删除后其对应分段费用配置也会被清空，确认删除？`,
      '删除执行段',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    ).then(() => {
      routeSegments.value.splice(index, 1)
      renumberRouteSegments()
    }).catch(() => {})
    return
  }
  routeSegments.value.splice(index, 1)
  renumberRouteSegments()
}

function renumberRouteSegments() {
  routeSegments.value.forEach((seg, index) => { seg.seq = index + 1 })
}

// PRD 点9：修改已关联子计划路段核心字段提示
function onSegmentFieldChange(segment) {
  if (segment.subPlan) {
    ElMessage.warning('该执行段已关联子计划，修改核心字段可能与子计划信息不一致')
  }
}

// PRD 点5：路段计费条件变化 → 单价单位联动 + 集装箱计费依据置空
function onSegCalcChange(seg) {
  const unitMap = { '按重量': '元/吨', '按体积': '元/方', '按数量': '元/件', '按集装箱': '元/箱' }
  seg.segPriceUnit = unitMap[seg.segCalcCondition] || '元'
  if (seg.segCalcCondition === '按集装箱' || seg.carryForm === '集装箱运输') {
    seg.segBillingBasis = ''
  }
}

function segPriceUnitText(seg) {
  const unitMap = { '按重量': '元/吨', '按体积': '元/方', '按数量': '元/件', '按集装箱': '元/箱' }
  return unitMap[seg.segCalcCondition] || '元'
}

// ============ 子计划 ============
function getSubPlanType(transportMode) {
  return subPlanTypeMap[transportMode] || '子计划'
}
function createSubPlan(segment) {
  const subPlanId = `SP${String(Date.now()).slice(-8)}-${String(subPlanSeq++).padStart(3, '0')}`
  const subPlanType = getSubPlanType(segment.transportMode)
  segment.subPlan = {
    id: subPlanId,
    type: subPlanType,
    status: '草稿',
    summary: `${segment.routeNodeText || `${segment.from} → ${segment.to}`}｜${segment.transportMode}｜${segment.carryForm}`,
  }
  // 异构分段初始化（若未设置）
  if (!segment.segCalcCondition) {
    onSegCalcChange(segment)
  }
  ElMessage.success(`已创建${subPlanType}，子计划编号：${subPlanId}`)
}
function viewSubPlan(segment) {
  currentSubPlan.value = segment.subPlan
  subPlanDialogVisible.value = true
}
function closeSubPlanDialog() {
  subPlanDialogVisible.value = false
  currentSubPlan.value = null
}

// ============ 其他费用 ============
function addExtraFeeRow() {
  extraFeeRows.value.push({ id: `extra-${Date.now()}`, name: '', amount: 0, feeType: '增项', pricingMode: '整单', price: 0, basis: 1 })
}
function removeExtraFeeRow(index) {
  extraFeeRows.value.splice(index, 1)
}

// PRD 点3：其他费用金额（按增减项）
function extraFeeAmount(fee) {
  const sign = fee.feeType === '减项' ? -1 : 1
  return sign * Number(fee.price || 0) * Number(fee.basis || 0)
}

// PRD 点6：箱型明细 CRUD
function addBoxPriceRow() {
  boxPriceRows.value.push({ id: `box-${Date.now()}`, boxType: 'GP', boxSize: '20尺', price: 0 })
}
function removeBoxPriceRow(index) {
  if (boxPriceRows.value.length > 1) boxPriceRows.value.splice(index, 1)
}

// ============ 托运单抽屉 ============
function openWaybillDrawer() {
  selectedDrawerWaybillId.value = waybillOrder.value && waybillOrder.value.id ? waybillOrder.value.id : ''
  waybillDrawerVisible.value = true
}
function closeWaybillDrawer() {
  waybillDrawerVisible.value = false
}
function resetDrawerFilter() {
  drawerFilters.keyword = ''
  drawerFilters.createDate = ''
  drawerFilters.creator = ''
}
function confirmWaybillRelation() {
  const waybill = selectableWaybills.value.find(item => item.id === selectedDrawerWaybillId.value)
  if (!waybill) {
    ElMessage.warning('请选择需要关联的托运单')
    return
  }
  applyWaybillRelation(waybill)
  waybillDrawerVisible.value = false
}
function applyWaybillRelation(waybill) {
  const cargoItems = normalizeCargoItems(waybill.cargoItems || [], waybill)
  waybillOrder.value = {
    id: waybill.id,
    shipperCompany: waybill.shipperCompany,
    contactName: waybill.contactName,
    contactPhone: waybill.contactPhone,
    remark: waybill.remark || '',
    cargoItems,
    loadNodes: waybill.loadNodes || [],
    unloadNodes: waybill.unloadNodes || [],
    containerBoxes: waybill.containerBoxes || [],
    containerNodes: waybill.containerNodes || [],
  }
  confirmedQuote.value = null
  quoteSegments.value = buildSegmentsFromWaybill(waybill, cargoItems)
  routeSegments.value = aggregateExecutionSegments(quoteSegments.value, cargoItems)
  formData.planName = `${routeSegments.value[0]?.from || '起点'}-${routeSegments.value[routeSegments.value.length - 1]?.to || '终点'}联运计划`
  formData.remark = waybill.remark || ''
  sourceType.value = 'shared'
  applyFeeDefaults({})
  ElMessage.success('已关联托运单')
}
function clearWaybillRelation() {
  sourceType.value = 'default'
  confirmedQuote.value = null
  quoteSegments.value = []
  routeSegments.value = routeSegments.value.map(segment => ({ ...segment, locked: false }))
  ElMessage.success('已解除关联，字段保留可继续编辑')
}

// ============ 报价弹窗 ============
function openQuoteDialog() {
  if (!confirmedQuote.value) return
  quoteDialogVisible.value = true
}
function closeQuoteDialog() {
  quoteDialogVisible.value = false
}

// ============ 工具方法 ============
function getModeClass(mode) {
  const map = { 公路: 'road', 铁路: 'rail', 水路: 'water' }
  return map[mode] || 'road'
}
function getStatusClass(status) {
  const map = { 草稿: 'draft', 待确认: 'pending', 已确认: 'confirmed', 执行中: 'active', 已完成: 'finished' }
  return map[status] || 'draft'
}
function formatMoney(amount) {
  return `¥ ${Number(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ============ 提交校验 ============
function handleCancel() {
  ElMessage.info('返回联运计划管理页')
}

function validateDraft() {
  if (!formData.planName) return '请输入计划名称'
  return null
}

function validateSubmit() {
  if (!formData.planName) return '请输入计划名称'
  if (!waybillOrder.value.shipperCompany) return '请输入托运企业'
  if (!waybillOrder.value.contactName) return '请输入联系人'
  if (!waybillOrder.value.contactPhone) return '请输入联系电话'
  if (!waybillOrder.value.cargoItems || !waybillOrder.value.cargoItems.length) return '请至少维护一条货品'
  for (let i = 0; i < waybillOrder.value.cargoItems.length; i++) {
    const item = waybillOrder.value.cargoItems[i]
    if (!item.cargoName) return `请输入第 ${i + 1} 行货品名称`
    if (!Number(item.weight) && !Number(item.quantity)) return `请维护第 ${i + 1} 行货量`
  }
  if (!routeSegments.value.length) return '请至少维护一个执行段'
  for (let i = 0; i < routeSegments.value.length; i++) {
    const segment = routeSegments.value[i]
    if (!segment.transportMode) return `请选择第 ${i + 1} 个执行段运输方式`
    if (!segment.from || !segment.to) return `请维护第 ${i + 1} 个执行段起终点`
    if (feeConfig.enabled && feeConfig.settlementMode === '分段结算' && segment.subPlan && (!Number(segment.segUnitPrice) || Number(segment.segUnitPrice) <= 0)) {
      return `请维护第 ${i + 1} 个执行段货主结算单价`
    }
  }
  if (feeConfig.enabled && feeConfig.settlementMode === '整票结算' && (!Number(feeConfig.unitPrice) || Number(feeConfig.unitPrice) <= 0)) {
    return '请维护货主侧整票结算单价'
  }
  // PRD 点3：有费用名称时，单价和基数必须为正
  const invalidExtra = extraFeeRows.value.find(fee => fee.name && (!Number(fee.price) || Number(fee.price) <= 0))
  if (invalidExtra) return `请维护其他费用「${invalidExtra.name}」的单价`
  const invalidExtraBasis = extraFeeRows.value.find(fee => fee.name && (!Number(fee.basis) || Number(fee.basis) <= 0))
  if (invalidExtraBasis) return `请维护其他费用「${invalidExtraBasis.name}」的基数`
  return null
}

function handleSaveDraft() {
  const error = validateDraft()
  if (error) {
    ElMessage.warning(error)
    return
  }
  ElMessage.success('草稿保存成功')
}

// PRD 点7：生效时草稿子计划二次确认
function handleSubmit() {
  const error = validateSubmit()
  if (error) {
    ElMessage.warning(error)
    return
  }
  const hasDraftSubPlan = routeSegments.value.some(s => s.subPlan && s.subPlan.status === '草稿')
  if (hasDraftSubPlan) {
    ElMessageBox.confirm(
      '存在草稿状态的子计划，生效后子计划将一并进入待执行。是否继续生效？',
      '生效确认',
      { type: 'warning', confirmButtonText: '继续生效', cancelButtonText: '取消' }
    ).then(() => doSubmit()).catch(() => {})
    return
  }
  doSubmit()
}

function doSubmit() {
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    ElMessage.success('联运计划提交成功，已生效')
  }, 800)
}

// ============ 生命周期 ============
onMounted(() => {
  loadSharedData()
})
</script>

<style scoped>
/* ============ 弹窗约束回画布内（不盖外层工具栏，避让左侧目录）============ */
:deep(.el-overlay) {
  top: var(--canvas-toolbar-height, 48px);
  left: calc(var(--canvas-offset-left, 232px) + 16px);
  right: 16px;
  bottom: auto;
  height: calc(100vh - var(--canvas-toolbar-height, 48px));
  overflow: hidden;
}
:deep(.el-overlay-dialog) {
  top: var(--canvas-toolbar-height, 48px);
}
:deep(.el-drawer) {
  top: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 100% !important;
  width: 100% !important;
  display: flex;
  flex-direction: column;
}
:deep(.el-drawer__body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* ===== 全局重置（页面内） ===== */
.page-root * {
  box-sizing: border-box;
}

.page-root {
  min-height: calc(100vh - 132px);
  padding-bottom: 70px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #1d2129;
}

/* ===== 按钮 ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn-primary { background: #165dff; color: #fff; border-color: #165dff; }
.btn-primary:hover { background: #4080ff; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #e8f3ff; color: #165dff; border-color: transparent; }
.btn-secondary:hover { background: #d0e7ff; }
.btn-default { background: #fff; color: #4e5969; border-color: #c9cdd4; }
.btn-default:hover { border-color: #165dff; color: #165dff; }
.btn-sm { height: 28px; padding: 0 12px; font-size: 13px; }

/* ===== 页面标题 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 52px;
  padding: 0 20px;
  background: #fff;
  border: 1px solid #e7ebf0;
  border-bottom: none;
}
.header-actions { display: flex; align-items: center; gap: 10px; }
.page-title { font-size: 16px; font-weight: 600; color: #232b36; margin: 0; }
.close-entry {
  display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 14px;
  color: #165dff; font-size: 13px; font-weight: 600; line-height: 1; text-decoration: none;
  background: #f0f5ff; border: 1px solid #c7dcff; border-radius: 4px; transition: all 0.15s ease; cursor: pointer;
}
.close-entry:hover { background: #e0ecff; border-color: #165dff; text-decoration: underline; }
.close-arrow { font-size: 14px; font-weight: 500; }

/* ===== 区块卡片 + 区块头（主仓结构还原） ===== */
.section-card {
  background: #fff;
  border-radius: 0;
  border: 1px solid #e7ebf0;
  border-top: none;
  margin-bottom: 0;
  overflow: hidden;
  box-shadow: none;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 10px;
  border-bottom: 1px solid #f0f2f5;
}
.section-title {
  position: relative; padding-left: 14px;
  font-size: 14px; font-weight: 600; color: #202733;
}
.section-title::before {
  content: ''; position: absolute; left: 0; top: 50%;
  width: 3px; height: 16px; border-radius: 2px;
  background: #2468f2; transform: translateY(-50%);
}
.section-extra { font-size: 12px; color: #8894a4; }
.section-actions { display: flex; align-items: center; gap: 10px; }

/* ===== 表单字段 ===== */
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px; padding: 12px 20px 16px; }
.form-field { display: flex; flex-direction: column; gap: 8px; }
.field-full { grid-column: 1 / -1; }
.field-label { font-size: 13px; color: #596578; font-weight: 600; }
.field-input, .field-textarea, .table-input, .table-select, .table-select-short, .point-input {
  width: 100%; min-height: 32px; padding: 0 10px;
  border: 1px solid #d9dee8; border-radius: 2px; background: #fff;
  font-size: 14px; color: #24303d; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-input:focus, .field-textarea:focus, .table-input:focus, .table-select:focus, .table-select-short:focus, .point-input:focus {
  border-color: #2d67f4; box-shadow: 0 0 0 3px rgba(45, 103, 244, 0.1);
}
.field-input.readonly, .field-input:disabled { background: #f7f9fc; color: #97a2b1; }
.field-textarea { min-height: 68px; padding: 8px 10px; resize: vertical; }
.quote-field-link { width: 100%; justify-content: flex-start; text-align: left; border: 1px solid #d9e1ee; background: #f7f9fc; color: #2d67f4; font-weight: 600; cursor: pointer; }

/* ===== 货品表 ===== */
.stowage-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; border-bottom: 1px solid #f0f2f5;
  font-size: 13px; color: #4b5565;
}
.stowage-label { font-weight: 600; color: #596578; }
.stowage-tip { color: #8894a4; font-size: 12px; }
.table-wrap { overflow-x: auto; padding: 0 20px 16px; }
.cargo-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e7ebf0; border-radius: 0; overflow: hidden; }
.cargo-table th, .cargo-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eef2f7; font-size: 13px; }
.cargo-table th { background: #f7f9fc; color: #5a6678; font-weight: 700; }
.cargo-table th.col-active { background: #e8f3ff; color: #2d67f4; }
.cargo-table th.col-active em { color: #f53f3f; font-style: normal; margin-left: 2px; }
.cargo-table td.col-active { background: #f7fbff; }
.cargo-table tbody tr:hover { background: #fbfdff; }
.cargo-table tbody tr:last-child td { border-bottom: none; }
.table-input-group { display: flex; }
.table-input-group .table-input:first-child { border-radius: 2px 0 0 2px; }
.table-select-short { width: 78px; border-radius: 0 2px 2px 0; }
.link-btn { border: none; background: transparent; color: #2d67f4; cursor: pointer; font-size: 13px; padding: 0; }
.link-btn.text-danger { color: #f05a57; }
.cargo-total { color: #2d67f4; font-weight: 600; }

/* ===== 路线规划 ===== */
.route-info-card { padding-bottom: 14px; }
.route-list { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 12px 18px 12px 38px; }
.route-list::before {
  content: ''; position: absolute; left: 22px; top: 36px; bottom: 20px; width: 2px;
  background: linear-gradient(180deg, #dbe6ff 0%, #edf3ff 100%);
}
.route-card { position: relative; padding: 8px 10px 10px; border: 1px solid #e7ebf0; border-radius: 0; background: #fff; box-shadow: none; }
.route-card::before {
  content: ''; position: absolute; left: -22px; top: 18px; width: 8px; height: 8px;
  border-radius: 50%; background: #2d67f4; box-shadow: 0 0 0 6px #edf3ff;
}
.route-card.has-sub-plan::before { background: #1ea25d; box-shadow: 0 0 0 6px #eaf9ef; }
.route-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; margin-bottom: 6px; }
.route-toolbar-main, .route-toolbar-actions { display: flex; align-items: center; gap: 6px; min-width: 0; }
.route-toolbar-main { flex: 1; overflow: hidden; }
.route-toolbar-actions { flex-shrink: 0; flex-wrap: wrap; }
.drag-handle { color: #a7b0bf; font-size: 14px; line-height: 1; }
.route-index {
  height: 22px; padding: 0 9px; border-radius: 2px; background: #edf3ff; color: #2d67f4;
  display: inline-flex; align-items: center; font-size: 12px; font-weight: 700;
}
.mode-tag, .carry-type-tag, .carry-select, .duration-tag {
  height: 22px; padding: 0 9px; border-radius: 2px;
  display: inline-flex; align-items: center; font-size: 12px; font-weight: 600;
}
.mode-tag { color: #fff; }
.mode-tag.road { background: #23b187; }
.mode-tag.rail { background: #5b7cf0; }
.mode-tag.water { background: #45a7e8; }
.mode-select { width: 78px; height: 24px; border: 1px solid #d9e1ee; border-radius: 2px; background: #fff; color: #344054; font-size: 12px; }
.carry-type-tag, .carry-select, .duration-tag { background: #f4f7fb; color: #677486; }
.carry-select { width: 98px; border: 1px solid #d9e1ee; font-weight: 400; }
.create-sub-plan-btn { height: 24px; padding: 0 10px; border: 1px solid #2d67f4; border-radius: 2px; color: #fff; background: #2d67f4; font-size: 12px; cursor: pointer; }
.create-sub-plan-btn.created { color: #2d67f4; background: #edf3ff; }

/* ===== 节点行（shared 模式） ===== */
.node-lines { display: grid; gap: 0; padding-left: 28px; padding-right: 12px; }
.readonly-node-lines { padding-top: 4px; padding-bottom: 8px; }
.node-item { min-width: 0; }
.node-line {
  min-height: 34px; display: grid;
  grid-template-columns: 24px 28px minmax(220px, 1fr) 28px 38px 160px 112px 128px;
  align-items: center; gap: 6px; padding: 4px 0;
  border-bottom: 1px solid #edf0f5; background: #fafafa;
}
.node-line:first-child { border-top: 1px solid #edf0f5; }
.node-delete { width: 18px; height: 18px; border: 1px solid #dce3ee; background: #fff; color: #8b95a5; font-size: 0; margin-left: 4px; }
.node-delete::before { content: '×'; font-size: 12px; line-height: 1; }
.node-type {
  width: auto; min-width: 40px; padding: 0 8px; height: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 4px; color: #1d2129; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.node-type.load { background: #e8f3ff; }
.node-type.unload { background: #d0e7ff; }
.node-type.start, .node-type.transit { background: #f2f3f5; }
.node-type.pickup-empty { background: #f2f3f5; }
.node-type.pickup-heavy { background: #e8ffea; }
.node-type.return-empty { background: #f2f3f5; }
.node-type.return-heavy { background: #fff3e8; }
.node-address {
  height: 26px; display: inline-flex; align-items: center; gap: 6px;
  padding: 0 8px; border: 1px solid #dce3ee; background: #fff; color: #2f3a4a;
  font-size: 12px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.site-tag {
  width: 24px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  background: #2f2f2f; color: #fff; font-size: 11px; font-style: normal;
}
.node-icons { color: #4f5c6e; font-size: 13px; }
.node-time, .node-contact, .node-phone {
  height: 26px; width: 100%; padding: 0 8px;
  border: 1px solid #dce3ee; background: #fff; color: #2f3a4a;
  font-size: 12px; outline: none;
}
.node-cargo-line {
  min-height: 30px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  padding: 4px 0 6px 56px; background: #fafafa; border-bottom: 1px solid #edf0f5;
}
.cargo-label { color: #677486; font-size: 12px; }
.cargo-chip {
  min-height: 22px; padding: 0 10px; display: inline-flex; align-items: center;
  border: 1px solid #edf0f5; background: #fff; color: #4b5565; font-size: 12px;
}
.cargo-empty { color: #9aa6b6; font-size: 12px; }

/* ===== 手工模式执行段详情 ===== */
.segment-detail-grid {
  display: grid; grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) 180px 180px;
  gap: 12px; padding: 10px 18px 8px 28px; border-top: 1px solid #edf0f5;
}
.segment-detail-grid label { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.segment-detail-grid label span { color: #7b8794; font-size: 12px; }

/* ===== 费用信息 ===== */
.shipper-fee-switch { height: 34px; display: flex; align-items: center; gap: 10px; padding: 0 18px; color: #4b5565; font-size: 13px; }
.switch-on { position: relative; width: 36px; height: 18px; border: 0; border-radius: 12px; background: #2d67f4; cursor: pointer; }
.switch-on::after { content: ''; position: absolute; right: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; }
.switch-off { position: relative; width: 36px; height: 18px; border: 0; border-radius: 12px; background: #c9d1dc; cursor: pointer; }
.switch-off::after { content: ''; position: absolute; left: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; }
.shipper-fee-switch em { color: #8b95a5; font-style: normal; }

.fee-config-panel { margin: 0 18px 16px; padding: 14px 16px 12px; background: #f7f8fa; border: 1px solid #edf0f5; }
.fee-config-row { display: grid; grid-template-columns: 130px 110px 115px 220px 150px 90px; gap: 16px; align-items: end; margin-bottom: 13px; }
.fee-config-row label > span { display: block; margin-bottom: 6px; color: #6b7482; font-size: 12px; }
.fee-config-row select, .fee-config-row input { width: 100%; height: 28px; border: 1px solid #dce3ee; background: #fff; color: #344054; font-size: 12px; outline: none; }

.segmented { display: flex; height: 28px; }
.segmented button { min-width: 62px; padding: 0 10px; border: 1px solid #e1e6ef; background: #fff; color: #687487; font-size: 12px; cursor: pointer; }
.segmented button + button { margin-left: -1px; }
.segmented button:disabled { cursor: not-allowed; opacity: 0.6; }
.segmented button.active { position: relative; z-index: 1; border-color: #2d67f4; color: #2d67f4; background: #f7fbff; }
.segmented.small button { min-width: 42px; }

.inline-input { display: grid; grid-template-columns: 96px 1fr; }
.inline-input em {
  height: 28px; padding: 0 8px; display: inline-flex; align-items: center;
  border: 1px solid #dce3ee; border-left: 0; background: #fff; color: #6b7482; font-size: 12px; font-style: normal;
}
.quota-link { align-self: center; border: 0; background: transparent; color: #2d67f4; font-size: 12px; text-decoration: none; cursor: pointer; }

.formula-line { height: 28px; display: flex; align-items: center; gap: 8px; color: #526072; font-size: 12px; }
.formula-line::before {
  content: '√'; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 3px; color: #fff; background: #2d67f4;
}
.formula-line strong { color: #2d67f4; font-weight: 700; }

/* 箱型价格明细（PRD 点6） */
.box-price-block { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #edf0f5; }
.box-price-title { color: #4b5565; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.box-price-tip { color: #8894a4; font-size: 12px; font-weight: 400; }
.box-price-warn { margin-top: 6px; color: #f53f3f; font-size: 12px; }

/* 分段结算异构表（PRD 点5） */
.segment-rule-table { margin-top: 10px; }
.segment-rule-warn { margin-top: 8px; color: #e37300; font-size: 12px; }
.basis-empty { color: #c0c4cc; }

/* ===== 其他费用表 ===== */
.extra-fee-block { padding: 0 18px 18px; }
.extra-title { margin-bottom: 8px; color: #4b5565; font-size: 13px; font-weight: 600; }
.extra-fee-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; }
.extra-fee-table th, .extra-fee-table td { height: 34px; padding: 0 10px; border: 1px solid #e5e9f0; text-align: left; color: #4b5565; }
.extra-fee-table th { background: #f5f6f8; color: #394456; font-weight: 600; }
.extra-fee-table input, .extra-fee-table select { width: 100%; height: 26px; border: 1px solid #dce3ee; padding: 0 8px; outline: none; font-size: 12px; }
.amount-cell { color: #2d67f4; font-weight: 600; }
.add-extra-btn { margin-top: 8px; border: 0; background: transparent; color: #2d67f4; font-size: 12px; cursor: pointer; }
.extra-fee-total { margin-top: 10px; padding: 8px 10px; background: #f2f6ff; border-radius: 4px; font-size: 13px; color: #2d67f4; font-weight: 600; }

/* ===== 附件 ===== */
.attachment-card { padding-bottom: 18px; }
.upload-area {
  min-height: 92px; margin: 12px 20px 16px;
  border: 1px dashed #cfd9e7;
  background: linear-gradient(180deg, #fafcff 0%, #f5f8fc 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
}
.upload-btn { min-width: 120px; height: 32px; border: 1px solid #d6e1f2; border-radius: 2px; background: #fff; color: #526273; font-size: 14px; cursor: pointer; }
.upload-tip { font-size: 12px; color: #8b97a7; }

/* ===== 底部操作栏 ===== */
.page-footer {
  position: fixed; left: 92px; right: 28px; bottom: 0;
  min-height: 58px; padding: 0 26px;
  background: #fff; border: 1px solid #e7ebf0;
  box-shadow: 0 -2px 8px rgba(31, 41, 55, 0.04);
  display: flex; align-items: center; justify-content: space-between; z-index: 30;
}
.footer-info { font-size: 14px; color: #556273; }
.footer-tip b { color: #2d67f4; }
.footer-actions { display: flex; gap: 10px; }

/* ===== 弹窗/抽屉内部样式 ===== */
.modal-header-inner { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.modal-title { font-size: 18px; font-weight: 700; color: #232b36; }
.modal-close {
  width: 34px; height: 34px; border: none; border-radius: 10px;
  background: #f5f7fb; color: #738094; font-size: 22px; cursor: pointer;
}
.quote-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin-bottom: 14px; }
.detail-row { display: flex; gap: 12px; }
.detail-label { min-width: 90px; color: #667487; font-size: 14px; }
.detail-value { color: #232f3c; font-size: 14px; }
.detail-value.strong { color: #2d67f4; font-weight: 700; }
.quote-segment-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.quote-segment-table th, .quote-segment-table td { padding: 8px 10px; border: 1px solid #eef2f7; text-align: left; }
.quote-segment-table th { background: #f7f9fc; color: #5a6678; font-weight: 700; }

.status-tag {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 56px; height: 22px; padding: 0 12px;
  border-radius: 12px; font-size: 12px; font-weight: 600;
}
.status-draft { background: #f1f4f8; color: #5f6b7a; }
.status-pending { background: #fff2df; color: #e37300; }
.status-confirmed { background: #eaf9ef; color: #1ea25d; }
.status-active { background: #eaf1ff; color: #2d67f4; }
.status-finished { background: #eaf8ff; color: #0c94cb; }

.sub-plan-detail { display: grid; gap: 14px; }

/* 抽屉筛选区 */
.drawer-filter { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.drawer-filter-input { height: 28px; padding: 0 10px; border: 1px solid #dce3ee; border-radius: 2px; font-size: 13px; outline: none; min-width: 150px; }
.drawer-filter-input.datetime { min-width: 140px; }
.drawer-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }
.drawer-table th, .drawer-table td { padding: 0 10px; border: 1px solid #e5e9f0; color: #344054; text-align: left; height: 38px; }
.drawer-table th { background: #f5f6f8; font-weight: 600; }
.drawer-table tr.selected td { background: #f3f7ff; }
.drawer-table tbody tr { cursor: pointer; }
.drawer-empty { text-align: center; color: #8b95a5; }

/* ===== 响应式 ===== */
@media (max-width: 1200px) {
  .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fee-config-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .node-line { grid-template-columns: 24px 28px minmax(160px, 1fr) 28px 44px; }
  .node-time, .node-contact, .node-phone { display: none; }
}
</style>

<style>
/* el-dialog / el-drawer 圆角与宽度覆盖（全局，非 scoped） */
.quote-modal-wrap .el-dialog { width: 760px !important; border-radius: 20px !important; overflow: hidden; box-shadow: 0 28px 60px rgba(17, 36, 71, 0.16) !important; }
.subplan-modal-wrap .el-dialog { border-radius: 20px !important; overflow: hidden; }
.quote-modal-wrap .el-dialog__header, .subplan-modal-wrap .el-dialog__header,
.quote-modal-wrap .el-dialog__body, .subplan-modal-wrap .el-dialog__body,
.quote-modal-wrap .el-dialog__footer, .subplan-modal-wrap .el-dialog__footer { padding: 18px 22px; }
.quote-modal-wrap .el-dialog__header, .subplan-modal-wrap .el-dialog__header { border-bottom: 1px solid #eef2f7; }
.quote-modal-wrap .el-dialog__footer, .subplan-modal-wrap .el-dialog__footer { border-top: 1px solid #eef2f7; border-bottom: none; }
.waybill-drawer-wrap .el-drawer { width: 760px !important; box-shadow: -8px 0 28px rgba(17, 36, 71, 0.12) !important; }
.waybill-drawer-wrap .el-drawer__body { padding: 16px 20px; }
</style>
