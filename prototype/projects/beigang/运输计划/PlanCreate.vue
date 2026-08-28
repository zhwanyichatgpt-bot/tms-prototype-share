<template>
  <!-- 基于 Element Plus 生产级 el-drawer 抽屉组件 (彻底锁定底层滚动，消除双滚动条) -->
  <el-drawer
    :model-value="true"
    title="新增水运计划"
    direction="rtl"
    size="calc(100vw - 180px)"
    :append-to-body="true"
    :lock-scroll="true"
    modal-class="water-plan-drawer-overlay"
    class="water-plan-drawer"
    @close="handleCancel"
  >
    <!-- 抽屉表单主内容区 (唯一的内部滚动区域) -->
    <div class="create-content-body">
      <!-- 1. 基础信息 (第一行4列，第二行2列，严格对齐图1) -->
      <div class="section-block first-section">
        <div class="section-header">
          <span class="blue-bar"></span>
          <span class="section-title-text">基础信息</span>
        </div>

        <div class="form-grid-basic">
          <!-- 第一行第1列：关联托运单 -->
          <div class="form-item">
            <label class="form-label">关联托运单</label>
            <el-select
              v-model="form.consignmentNo"
              placeholder="请选择托运单"
              class="custom-select"
              clearable
              filterable
            >
              <el-option v-for="item in consignmentOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <!-- 第一行第2列：计划名称 (必填) -->
          <div class="form-item required">
            <label class="form-label"><span class="star">*</span>计划名称</label>
            <el-input v-model="form.planName" placeholder="请输入" class="custom-input" />
          </div>

          <!-- 第一行第3列：托运企业 -->
          <div class="form-item">
            <label class="form-label">托运企业</label>
            <el-select v-model="form.shipperCompany" placeholder="请选择" class="custom-select" clearable filterable>
              <el-option v-for="item in shipperOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </div>

          <!-- 第一行第4列：联系人 -->
          <div class="form-item">
            <label class="form-label">联系人</label>
            <el-input v-model="form.contactPerson" placeholder="请输入" class="custom-input" />
          </div>

          <!-- 第二行第1列：联系电话 -->
          <div class="form-item">
            <label class="form-label">联系电话</label>
            <el-input v-model="form.contactPhone" placeholder="请输入" class="custom-input" />
          </div>

          <!-- 第二行第2列：备注 (仅占1列) -->
          <div class="form-item">
            <label class="form-label">备注</label>
            <el-input v-model="form.remark" placeholder="请输入" class="custom-input" />
          </div>
        </div>
      </div>

      <!-- 2. 收发信息 (水运航线港口与货品明细) -->
      <div class="section-block">
        <div class="section-header">
          <span class="blue-bar"></span>
          <span class="section-title-text">收发信息</span>
        </div>

        <!-- 业务模式与配载方式选择行 -->
        <div class="shipping-mode-row">
          <div class="mode-group">
            <span class="mode-label">业务模式</span>
            <div class="mode-radios">
              <label class="custom-radio" :class="{ active: form.businessMode === '整船' }">
                <input type="radio" value="整船" v-model="form.businessMode" />
                <span class="radio-indicator"></span>
                <span class="radio-text">整船</span>
              </label>
              <label class="custom-radio" :class="{ active: form.businessMode === '拼船' }">
                <input type="radio" value="拼船" v-model="form.businessMode" />
                <span class="radio-indicator"></span>
                <span class="radio-text">拼船</span>
              </label>
            </div>
            <div class="mode-hint">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="hint-icon">
                <circle cx="7" cy="7" r="6.25" stroke="#86909C" stroke-width="1.5" />
                <path d="M7 6.2V10M7 4V4.6" stroke="#86909C" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <span>{{ form.businessMode === '整船' ? '不允许该计划的货品跟其它计划货品混合同一辆船里运输' : '允许该计划的货品跟其它计划货品混合同一辆船里运输' }}</span>
            </div>
          </div>

          <div class="stowage-group">
            <span class="mode-label">配载方式</span>
            <div class="mode-radios">
              <label class="custom-radio" :class="{ active: form.stowageMethod === '按重量' }">
                <input type="radio" value="按重量" v-model="form.stowageMethod" />
                <span class="radio-indicator"></span>
                <span class="radio-text">按重量</span>
              </label>
              <label class="custom-radio" :class="{ active: form.stowageMethod === '按体积' }">
                <input type="radio" value="按体积" v-model="form.stowageMethod" />
                <span class="radio-indicator"></span>
                <span class="radio-text">按体积</span>
              </label>
              <label class="custom-radio" :class="{ active: form.stowageMethod === '按数量' }">
                <input type="radio" value="按数量" v-model="form.stowageMethod" />
                <span class="radio-indicator"></span>
                <span class="radio-text">按数量</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 水运起/途/止港口与装卸货品列表 (严格对齐图1) -->
        <div class="waterway-tree-container">
          <div
            v-for="(node, nodeIdx) in portNodes"
            :key="node.id"
            class="tree-node-wrapper"
          >
            <!-- 节点左侧指示器与连线 (起/途/终 徽标) -->
            <div class="node-timeline-col">
              <div
                class="node-badge-box"
                :class="node.type === '起' ? 'port-start' : (node.type === '终' ? 'port-end' : 'port-mid')"
              >
                {{ node.type }}
              </div>

              <!-- 垂直虚线/连线与中间加号 (在起止之间插入途经港) -->
              <div v-if="nodeIdx < portNodes.length - 1" class="timeline-line dashed">
                <button
                  class="timeline-add-node-btn"
                  title="在中间插入途经港口"
                  @click="insertPortNode(nodeIdx)"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#2F65EE" stroke-width="1.2" fill="#FFFFFF"/>
                    <path d="M6 3.5V8.5M3.5 6H8.5" stroke="#2F65EE" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 节点主体内容 -->
            <div class="node-main-col">
              <!-- 港口地址行 (地址框 + 抵港时间 + 离港时间 + 联系人 + 联系电话) -->
              <div class="node-address-row">
                <!-- 地址选择框 -->
                <div class="addr-box-wrapper" @click.stop>
                  <div class="addr-box-260" @click="openAddressDropdown(nodeIdx)">
                    <input
                      type="text"
                      v-model="node.address"
                      placeholder="请选择地址"
                      class="addr-pure-input"
                    />
                    <span class="net-tag" v-if="node.address">网点</span>
                    <span class="addr-icon-btn" title="切换地址" @click.stop="openAddressDropdown(nodeIdx)">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5H11M11 5L8.5 2.5M11 5L8.5 7.5M11 9H3M3 9L5.5 6.5M3 9L5.5 11.5" stroke="#86909C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span class="addr-icon-btn" title="添加" @click.stop="insertPortNode(nodeIdx)">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="#86909C" stroke-width="1.2"/>
                        <path d="M7 4.5V9.5M4.5 7H9.5" stroke="#86909C" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                    </span>
                  </div>

                  <!-- 常用港口/地址下拉弹窗 -->
                  <div v-if="activeAddressDropdownIdx === nodeIdx" class="addr-dropdown-popover" @click.stop>
                    <div class="addr-search-bar">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="addr-search-ico">
                        <circle cx="6.5" cy="6.5" r="4.8" stroke="#333842" stroke-width="1.5"/>
                        <path d="M10.2 10.2L14.2 14.2" stroke="#333842" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      <input
                        type="text"
                        v-model="addressSearchKeyword"
                        placeholder="请输入关键词"
                        class="addr-search-input"
                      />
                    </div>

                    <div class="addr-list-scroll">
                      <div
                        v-for="item in filteredAddresses()"
                        :key="item.id"
                        class="addr-list-item"
                        :class="{ active: node.address === item.name }"
                        @click="selectAddress(node, item)"
                      >
                        <div class="item-left-num">{{ item.id }}</div>
                        <div class="item-mid-info">
                          <div class="item-title-row">
                            <span class="item-main-name">{{ item.name }}</span>
                            <span v-if="item.tag" class="net-tag">{{ item.tag }}</span>
                          </div>
                          <div class="item-sub-address">{{ item.address }}</div>
                        </div>
                        <div class="item-right-radio">
                          <span class="pop-radio" :class="{ checked: node.address === item.name }"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 抵港时间 -->
                <div class="field-item port-time-item">
                  <span class="field-label-text">抵港时间</span>
                  <el-date-picker
                    v-model="node.arriveTime"
                    type="datetime"
                    placeholder="选择时间"
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    class="node-date-picker"
                  />
                </div>

                <!-- 离港时间 -->
                <div class="field-item port-time-item">
                  <span class="field-label-text">离港时间</span>
                  <el-date-picker
                    v-model="node.departTime"
                    type="datetime"
                    placeholder="选择时间"
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    class="node-date-picker"
                  />
                </div>

                <!-- 联系人 -->
                <div class="field-item port-contact-item">
                  <span class="field-label-text">联系人</span>
                  <el-input v-model="node.contact" placeholder="请输入" class="node-field-input" />
                </div>

                <!-- 联系电话 -->
                <div class="field-item port-phone-item">
                  <span class="field-label-text">联系电话</span>
                  <el-input v-model="node.phone" placeholder="请输入" class="node-field-input" />
                </div>
              </div>

              <!-- 港口货品明细卡片组 (支持配置 装货货品 与 卸货货品) -->
              <div class="port-goods-cards-wrap">
                <div
                  v-for="(table, tblIdx) in node.goodsTables"
                  :key="tblIdx"
                  class="port-goods-card"
                >
                  <div class="goods-panel-header">
                    <div class="goods-panel-title">{{ table.type }}</div>
                    <button
                      v-if="node.goodsTables.length > 1"
                      class="delete-table-btn"
                      @click="handleRemoveGoodsTable(node, tblIdx)"
                    >
                      删除{{ table.type }}
                    </button>
                  </div>

                  <table class="water-goods-table">
                    <thead>
                      <tr>
                        <th style="width: 22%; min-width: 180px;"><span class="star">*</span>货品</th>
                        <th style="width: 12%; min-width: 100px;">发货重量（吨）</th>
                        <th style="width: 12%; min-width: 100px;">发货体积（m³）</th>
                        <th style="width: 10%; min-width: 90px;">发货数量</th>
                        <th style="width: 10%; min-width: 90px;">单价（元）</th>
                        <th style="width: 10%; min-width: 90px;">总价（元）</th>
                        <th style="width: 11%; min-width: 100px;">货品包装</th>
                        <th style="min-width: 120px;">货品备注</th>
                        <th style="width: 60px; text-align: center;">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, itemIdx) in table.list" :key="itemIdx" class="water-goods-row">
                        <!-- 货品下拉选择框 -->
                        <td class="goods-select-cell">
                          <el-select
                            v-model="item.name"
                            placeholder="请选择货品"
                            class="water-cargo-select"
                            clearable
                            filterable
                          >
                            <el-option
                              v-for="cargo in cargoOptions"
                              :key="cargo"
                              :label="cargo"
                              :value="cargo"
                            />
                          </el-select>
                        </td>

                        <!-- 发货重量 -->
                        <td>
                          <el-input v-model="item.weight" placeholder="请输入" size="small" class="table-input" />
                        </td>

                        <!-- 发货体积 -->
                        <td>
                          <el-input v-model="item.volume" placeholder="请输入" size="small" class="table-input" />
                        </td>

                        <!-- 发货数量 -->
                        <td>
                          <el-input v-model="item.quantity" placeholder="请输入" size="small" class="table-input" />
                        </td>

                        <!-- 单价 -->
                        <td>
                          <el-input v-model="item.price" placeholder="请输入" size="small" class="table-input" />
                        </td>

                        <!-- 总价 (自动计算或展示 -) -->
                        <td class="calc-total-cell">
                          {{ calculateTotalPrice(item) }}
                        </td>

                        <!-- 货品包装 -->
                        <td>
                          <el-select v-model="item.pack" placeholder="请选择货品包" size="small" class="table-select" clearable>
                            <el-option label="散装" value="散装" />
                            <el-option label="袋装" value="袋装" />
                            <el-option label="卷装" value="卷装" />
                            <el-option label="箱装" value="箱装" />
                            <el-option label="集装箱" value="集装箱" />
                            <el-option label="托盘" value="托盘" />
                          </el-select>
                        </td>

                        <!-- 货品备注 -->
                        <td>
                          <el-input v-model="item.remark" placeholder="请输入" size="small" class="table-input" />
                        </td>

                        <!-- 操作 -->
                        <td class="actions-cell">
                          <span class="action-btn delete" @click="handleDeleteGoods(table, itemIdx)">删除</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div class="table-footer-btn-row">
                    <button class="add-goods-link" @click="handleAddGoods(table)">
                      <span class="plus-sign">⊕</span> 添加货品
                    </button>
                  </div>
                </div>

                <!-- 途经点快捷配置：支持添加装货或卸货货品表格 -->
                <div class="add-table-buttons-row" v-if="node.type === '途'">
                  <button
                    v-if="!node.goodsTables.some(t => t.type === '装货货品')"
                    class="add-table-btn"
                    @click="handleAddTableToNode(node, '装货货品')"
                  >
                    <span class="plus-sign">⊕</span> 添加「装货货品」
                  </button>
                  <button
                    v-if="!node.goodsTables.some(t => t.type === '卸货货品')"
                    class="add-table-btn"
                    @click="handleAddTableToNode(node, '卸货货品')"
                  >
                    <span class="plus-sign">⊕</span> 添加「卸货货品」
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 费用信息 -->
      <div class="section-block">
        <div class="section-header">
          <span class="blue-bar"></span>
          <span class="section-title-text">费用信息</span>
        </div>

        <!-- 货主费用设置卡片 (选择托运企业后可开启/关闭) -->
        <div class="fee-setting-card">
          <div class="fee-card-top-row">
            <div class="title-with-switch">
              <span class="card-title">货主费用设置</span>
              <el-switch
                v-model="form.shipperFee.enabled"
                size="small"
                :disabled="!form.shipperCompany"
                @change="handleShipperFeeSwitchChange"
              />
            </div>
            <span class="sub-explain" v-if="!form.shipperCompany">请先在上方选择托运企业，方可设置货主费用规则</span>
            <span class="sub-explain" v-else-if="!form.shipperFee.enabled">无上游货主（或为本企业），无需设置货主结算费用</span>
          </div>

          <!-- 货主费用开启后的配置项 (严格对齐用户提供的图片) -->
          <div v-if="form.shipperFee.enabled && form.shipperCompany" class="fee-card-body">
            <div class="fee-options-row">
              <div class="opt-group">
                <span class="opt-label">计费类型</span>
                <div class="opt-radios">
                  <label class="custom-radio active">
                    <input type="radio" value="单位计费" v-model="form.shipperFee.feeType" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">单位计费</span>
                  </label>
                </div>
              </div>

              <div class="opt-group">
                <span class="opt-label">是否含税</span>
                <div class="opt-radios">
                  <label class="custom-radio" :class="{ active: form.shipperFee.isTaxIncluded === '是' }">
                    <input type="radio" value="是" v-model="form.shipperFee.isTaxIncluded" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">是</span>
                  </label>
                  <label class="custom-radio" :class="{ active: form.shipperFee.isTaxIncluded === '否' }">
                    <input type="radio" value="否" v-model="form.shipperFee.isTaxIncluded" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">否</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 计费规则 / 计费依据 / 运输单价 (3列严格对齐图片) -->
            <div class="shipper-calc-grid">
              <div class="calc-item">
                <span class="calc-label">计费规则</span>
                <el-select v-model="form.shipperFee.calcRule" placeholder="请选择" class="calc-select" clearable>
                  <el-option label="重量计费" value="重量计费" />
                  <el-option label="体积计费" value="体积计费" />
                  <el-option label="整船包干" value="整船包干" />
                </el-select>
              </div>

              <div class="calc-item">
                <span class="calc-label">计费依据</span>
                <el-select v-model="form.shipperFee.calcBasis" placeholder="请选择" class="calc-select" clearable>
                  <el-option label="装货重量" value="装货重量" />
                  <el-option label="卸货重量" value="卸货重量" />
                  <el-option label="二者取小" value="二者取小" />
                  <el-option label="提单重量" value="提单重量" />
                </el-select>
              </div>

              <div class="calc-item">
                <span class="calc-label">运输单价</span>
                <el-input v-model="form.shipperFee.unitPrice" placeholder="请输入运输单价" class="calc-input" />
              </div>
            </div>
          </div>
        </div>

        <!-- 承运费用设置卡片 (水运承运商费用设置，严格对齐截图) -->
        <div class="fee-setting-card driver-card">
          <div class="fee-card-top-row">
            <div class="title-with-switch">
              <span class="card-title">承运费用设置</span>
              <el-switch v-model="form.carrierFee.enabled" size="small" />
            </div>
          </div>

          <div v-if="form.carrierFee.enabled" class="fee-card-body">
            <div class="fee-options-row">
              <div class="opt-group">
                <span class="opt-label">计费类型</span>
                <div class="opt-radios">
                  <label class="custom-radio active">
                    <input type="radio" value="单位计费" v-model="form.carrierFee.feeType" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">单位计费</span>
                  </label>
                </div>
              </div>

              <div class="opt-group">
                <span class="opt-label">是否含税</span>
                <div class="opt-radios">
                  <label class="custom-radio" :class="{ active: form.carrierFee.isTaxIncluded === '是' }">
                    <input type="radio" value="是" v-model="form.carrierFee.isTaxIncluded" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">是</span>
                  </label>
                  <label class="custom-radio" :class="{ active: form.carrierFee.isTaxIncluded === '否' }">
                    <input type="radio" value="否" v-model="form.carrierFee.isTaxIncluded" />
                    <span class="radio-indicator"></span>
                    <span class="radio-text">否</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 计费规则 / 计费依据 / 运输单价 (3列严格对齐图片) -->
            <div class="carrier-calc-grid">
              <div class="calc-item">
                <span class="calc-label">计费规则</span>
                <el-select v-model="form.carrierFee.calcRule" placeholder="请选择" class="calc-select" clearable>
                  <el-option label="重量计费" value="重量计费" />
                  <el-option label="体积计费" value="体积计费" />
                  <el-option label="整船包干" value="整船包干" />
                </el-select>
              </div>
              <div class="calc-item">
                <span class="calc-label">计费依据</span>
                <el-select v-model="form.carrierFee.calcBasis" placeholder="请选择" class="calc-select" clearable>
                  <el-option label="装货重量" value="装货重量" />
                  <el-option label="卸货重量" value="卸货重量" />
                  <el-option label="二者取小" value="二者取小" />
                  <el-option label="提单重量" value="提单重量" />
                </el-select>
              </div>
              <div class="calc-item">
                <span class="calc-label">运输单价</span>
                <el-input v-model="form.carrierFee.unitPrice" placeholder="请输入运输单价" class="calc-input" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 核算规则 -->
      <div class="section-block">
        <div class="section-header">
          <span class="blue-bar"></span>
          <span class="section-title-text">核算规则</span>
        </div>

        <div class="settle-rule-content">
          <div class="rule-field-group">
            <span class="rule-label">司机凭证</span>
            <div class="voucher-tags-group">
              <button
                type="button"
                class="voucher-tag-btn"
                :class="{ active: form.settleRules.driverVoucher.includes('装货凭证') }"
                @click="toggleVoucher('装货凭证')"
              >
                装货凭证
              </button>
              <button
                type="button"
                class="voucher-tag-btn"
                :class="{ active: form.settleRules.driverVoucher.includes('卸货凭证') }"
                @click="toggleVoucher('卸货凭证')"
              >
                卸货凭证
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 其他设置 -->
      <div class="section-block">
        <div class="section-header">
          <span class="blue-bar"></span>
          <span class="section-title-text">其他设置</span>
        </div>

        <div class="other-settings-content">
          <div class="rule-field-group">
            <span class="rule-label">接单限制</span>
            <div class="limit-controls-row">
              <el-checkbox v-model="form.otherSettings.allowQrCodeOrder">
                允许扫码接单
              </el-checkbox>

              <el-select
                v-model="form.otherSettings.qrCodeScope"
                placeholder="请选择"
                class="order-scope-select"
                :disabled="!form.otherSettings.allowQrCodeOrder"
              >
                <el-option label="所有人可接单" value="所有人可接单" />
                <el-option label="仅白名单承运人/司机" value="仅白名单承运人/司机" />
                <el-option label="指定承运商接单" value="指定承运商接单" />
              </el-select>

              <el-checkbox v-model="form.otherSettings.disallowOutsource">
                不允许委外运输
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定操作栏 (取消 / 保存 / 提交 三按钮) -->
    <template #footer>
      <div class="drawer-footer-wrap">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-save" @click="handleSaveDraft">保存</button>
        <button class="btn-submit" @click="handleSubmit">提交</button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back', 'success'])

// 下拉选项
const consignmentOptions = [
  { value: 'TYD202608001', label: 'TYD202608001 (北港散货-玉米5000吨)' },
  { value: 'TYD202608002', label: 'TYD202608002 (热轧卷板大宗水运采购)' },
  { value: 'TYD202608003', label: 'TYD202608003 (贵港至南宁水泥散杂熟料)' }
]

const shipperOptions = ['富邦集团', '中远海运集运', '北港物流股份有限公司', '华润水泥(贵港)有限公司', '中粮贸易(厦门)有限公司']

// 水运大宗货品标准选项
const cargoOptions = [
  '热轧卷板（Q235B）',
  '硫酸铵',
  '热轧卷板（Q355B）',
  '热轧卷板（SS400）',
  '粉煤',
  '碳砖',
  '炭粉',
  '鲜柑桔',
  '玉米',
  '小麦',
  '大豆'
]

// 常用港口与地址列表
const activeAddressDropdownIdx = ref(-1)
const addressSearchKeyword = ref('')

const savedAddressList = [
  { id: 1, name: '万泰煤场', tag: '网点', address: '云南省曲靖市马龙区041县道', contact: '王建国', phone: '13800138001' },
  { id: 2, name: '厦门市', tag: '', address: '福建省厦门市思明区思明区', contact: '陈志强', phone: '13912345678' },
  { id: 3, name: '浙江汽车职业技术...', tag: '', address: '浙江省台州市临海市双林南...', contact: '李老师', phone: '13788889999' },
  { id: 4, name: '福州市', tag: '', address: '福建省福州市鼓楼区鼓楼区', contact: '张华', phone: '13611112222' },
  { id: 5, name: '南宁港牛湾作业区', tag: '', address: '广西壮族自治区南宁市邕宁...', contact: '黄主管', phone: '13566667777' },
  { id: 6, name: '南宁糖业股份有限...', tag: '', address: '广西壮族自治区南宁市江南...', contact: '刘经理', phone: '13344445555' },
  { id: 7, name: '四川省成都市青白...', tag: '', address: '四川省成都市青白江区城厢站', contact: '赵队长', phone: '13122223333' }
]

function filteredAddresses() {
  if (!addressSearchKeyword.value) return savedAddressList
  const kw = addressSearchKeyword.value.toLowerCase()
  return savedAddressList.filter(a => a.name.toLowerCase().includes(kw) || a.address.toLowerCase().includes(kw))
}

function openAddressDropdown(idx) {
  if (activeAddressDropdownIdx.value === idx) {
    activeAddressDropdownIdx.value = -1
  } else {
    activeAddressDropdownIdx.value = idx
    addressSearchKeyword.value = ''
  }
}

function selectAddress(node, item) {
  node.address = item.name
  node.detailAddress = item.address
  if (item.contact && !node.contact) node.contact = item.contact
  if (item.phone && !node.phone) node.phone = item.phone
  activeAddressDropdownIdx.value = -1
  ElMessage.success(`已选定港口/地址：${item.name}`)
}

function handleDocumentClick() {
  activeAddressDropdownIdx.value = -1
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

// 水运起止港口列表
const portNodes = ref([
  {
    id: 'port-start',
    type: '起',
    address: '',
    arriveTime: '',
    departTime: '',
    contact: '',
    phone: '',
    goodsTables: [
      {
        type: '装货货品',
        list: [
          {
            name: '',
            weight: '',
            volume: '',
            quantity: '',
            price: '',
            pack: '',
            remark: ''
          }
        ]
      }
    ]
  },
  {
    id: 'port-end',
    type: '终',
    address: '',
    arriveTime: '',
    departTime: '',
    contact: '',
    phone: '',
    goodsTables: [
      {
        type: '卸货货品',
        list: [
          {
            name: '',
            weight: '',
            volume: '',
            quantity: '',
            price: '',
            pack: '',
            remark: ''
          }
        ]
      }
    ]
  }
])

// 插入途经港口
function insertPortNode(idx) {
  const newNode = {
    id: String(Date.now()),
    type: '途',
    address: '',
    arriveTime: '',
    departTime: '',
    contact: '',
    phone: '',
    goodsTables: [
      {
        type: '装货货品',
        list: [
          {
            name: '',
            weight: '',
            volume: '',
            quantity: '',
            price: '',
            pack: '',
            remark: ''
          }
        ]
      },
      {
        type: '卸货货品',
        list: [
          {
            name: '',
            weight: '',
            volume: '',
            quantity: '',
            price: '',
            pack: '',
            remark: ''
          }
        ]
      }
    ]
  }
  portNodes.value.splice(idx + 1, 0, newNode)
  ElMessage.success('已插入途经港口节点（已默认开启装货与卸货货品明细）')
}

// 途经点添加指定类型的货品表格
function handleAddTableToNode(node, tableType) {
  node.goodsTables.push({
    type: tableType,
    list: [
      {
        name: '',
        weight: '',
        volume: '',
        quantity: '',
        price: '',
        pack: '',
        remark: ''
      }
    ]
  })
  ElMessage.success(`已为该港口添加「${tableType}」表格`)
}

// 删除货品表格
function handleRemoveGoodsTable(node, tblIdx) {
  if (node.goodsTables.length <= 1) {
    ElMessage.warning('每个港口节点至少需保留一个货品明细表格')
    return
  }
  const removedType = node.goodsTables[tblIdx].type
  node.goodsTables.splice(tblIdx, 1)
  ElMessage.success(`已移除「${removedType}」表格`)
}

function handleAddGoods(table) {
  table.list.push({
    name: '',
    weight: '',
    volume: '',
    quantity: '',
    price: '',
    pack: '',
    remark: ''
  })
  ElMessage.success('已添加货品行')
}

function handleDeleteGoods(table, itemIdx) {
  if (table.list.length <= 1) {
    ElMessage.warning('当前表格至少需保留一行货品')
    return
  }
  table.list.splice(itemIdx, 1)
  ElMessage.success('已删除货品')
}

function calculateTotalPrice(item) {
  const w = parseFloat(item.weight)
  const p = parseFloat(item.price)
  if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0) {
    return (w * p).toFixed(2)
  }
  return '-'
}

// 主表单数据模型
const form = reactive({
  consignmentNo: '',
  planName: '',
  shipperCompany: '',
  contactPerson: '',
  contactPhone: '',
  remark: '',
  businessMode: '整船',
  stowageMethod: '按重量',
  shipperFee: {
    enabled: false,
    feeType: '单位计费',
    isTaxIncluded: '是',
    calcRule: '',
    calcBasis: '',
    unitPrice: ''
  },
  carrierFee: {
    enabled: true,
    feeType: '单位计费',
    isTaxIncluded: '是',
    calcRule: '',
    calcBasis: '',
    unitPrice: ''
  },
  settleRules: {
    driverVoucher: ['装货凭证']
  },
  otherSettings: {
    allowQrCodeOrder: true,
    qrCodeScope: '所有人可接单',
    disallowOutsource: false
  }
})

function toggleVoucher(name) {
  const list = form.settleRules.driverVoucher
  const idx = list.indexOf(name)
  if (idx > -1) {
    list.splice(idx, 1)
  } else {
    list.push(name)
  }
}

// 监听托运企业：选择后方可开启货主费用设置；清空时自动关闭
watch(() => form.shipperCompany, (newVal) => {
  if (newVal) {
    form.shipperFee.enabled = true
    ElMessage.info(`已选定托运企业「${newVal}」，已启用货主费用设置`)
  } else {
    form.shipperFee.enabled = false
  }
})

function handleShipperFeeSwitchChange(val) {
  if (val && !form.shipperCompany) {
    form.shipperFee.enabled = false
    ElMessage.warning('请先在上方基础信息中选择托运企业！')
  }
}

function handleCancel() {
  emit('back')
}

function handleSaveDraft() {
  if (!form.planName) {
    ElMessage.warning('请输入计划名称')
    return
  }
  ElMessage.success('水运计划草稿保存成功！')
  emit('success', {
    name: form.planName,
    shipperCompany: form.shipperCompany,
    status: '草稿',
    businessMode: form.businessMode,
    stowageMethod: form.stowageMethod,
    portNodes: portNodes.value
  })
}

function handleSubmit() {
  if (!form.planName) {
    ElMessage.warning('请输入计划名称')
    return
  }
  ElMessage.success('水运计划提交成功！')
  emit('success', {
    name: form.planName,
    shipperCompany: form.shipperCompany,
    status: '待执行',
    businessMode: form.businessMode,
    stowageMethod: form.stowageMethod,
    portNodes: portNodes.value
  })
}
</script>

<style scoped>
/* 抽屉内容主体 */
.create-content-body {
  padding: 0 4px 16px 4px;
  box-sizing: border-box;
}

/* 1. 基础信息栅格 (4列网格) */
.first-section {
  border-top: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.form-grid-basic {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
  padding-bottom: 8px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  color: #4E5969;
  font-weight: 400;
  display: flex;
  align-items: center;
}

.star {
  color: #F53F3F;
  margin-right: 4px;
}

.custom-input :deep(.el-input__wrapper),
.custom-select :deep(.el-select__wrapper) {
  border-radius: 4px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  background-color: #FFFFFF;
  height: 32px;
  font-size: 12px;
}

.custom-input :deep(.el-input__inner),
.custom-select :deep(.el-select__inner) {
  font-size: 12px;
  color: #1D2129;
}

/* 2. 章节通用 */
.section-block {
  margin-top: 24px;
  border-top: 1px solid #F2F3F5;
  padding-top: 18px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.blue-bar {
  width: 4px;
  height: 15px;
  background: #2F65EE;
  border-radius: 2px;
}

.section-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
}

/* 业务模式与配载方式行 */
.shipping-mode-row {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 16px;
  font-size: 12px;
}

.mode-group,
.stowage-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mode-label {
  color: #4E5969;
  font-size: 12px;
  font-weight: 500;
}

.mode-radios {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.custom-radio.active {
  background: #F2F7FF;
  border-color: #2F65EE;
}

.custom-radio.active .radio-text {
  color: #2F65EE;
  font-weight: 500;
}

.custom-radio input[type="radio"] {
  display: none;
}

.radio-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #C9CDD4;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.custom-radio.active .radio-indicator {
  border-color: #2F65EE;
}

.custom-radio.active .radio-indicator::after {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2F65EE;
  display: block;
}

.radio-text {
  color: #1D2129;
  font-size: 12px;
}

.mode-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #86909C;
  font-size: 12px;
}

.hint-icon {
  flex-shrink: 0;
}

/* 水运节点树形容器 */
.waterway-tree-container {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.tree-node-wrapper {
  display: flex;
  position: relative;
}

.node-timeline-col {
  width: 32px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.node-badge-box {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
}

.node-badge-box.port-start {
  background: #C9CDD4;
  color: #4E5969;
}

.node-badge-box.port-mid {
  background: #2F65EE;
  color: #FFFFFF;
}

.node-badge-box.port-end {
  background: #2F65EE;
  color: #FFFFFF;
}

.timeline-line.dashed {
  flex: 1;
  width: 2px;
  border-left: 2px dashed #E5E6EB;
  margin: 6px 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.timeline-add-node-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 0;
  z-index: 5;
}

.timeline-add-node-btn:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.node-main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

/* 节点单行地址信息 */
.node-address-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

.addr-box-wrapper {
  position: relative;
  flex: 1.4;
  min-width: 200px;
}

.addr-box-260 {
  width: 100%;
  height: 32px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  cursor: pointer;
}

.addr-box-260:hover {
  border-color: #C9CDD4;
}

.addr-pure-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 12px;
  color: #1D2129;
  background: transparent;
  width: 100%;
}

.addr-pure-input::placeholder {
  color: #C9CDD4;
  font-size: 12px;
}

.net-tag {
  background: #333842;
  color: #FFFFFF;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 2px;
  line-height: 16px;
  flex-shrink: 0;
}

.addr-icon-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.field-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.field-label-text {
  font-size: 12px;
  color: #4E5969;
  flex-shrink: 0;
  white-space: nowrap;
}

.port-time-item {
  flex: 1.1;
  min-width: 180px;
  width: auto;
}

.port-time-item .node-date-picker {
  flex: 1;
  width: 100%;
}

.port-time-item .node-date-picker :deep(.el-input__wrapper) {
  height: 30px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.port-contact-item {
  flex: 0.85;
  min-width: 120px;
  width: auto;
}

.port-phone-item {
  flex: 0.95;
  min-width: 130px;
  width: auto;
}

.port-contact-item .node-field-input,
.port-phone-item .node-field-input {
  flex: 1;
  width: 100%;
}

.node-field-input :deep(.el-input__wrapper) {
  height: 30px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.node-field-input :deep(.el-input__inner),
.node-date-picker :deep(.el-input__inner) {
  font-size: 12px;
}

/* 常用地址下拉弹窗 */
.addr-dropdown-popover {
  position: absolute;
  top: 36px;
  left: 0;
  width: 340px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  z-index: 80;
  padding: 10px 0 6px 0;
  box-sizing: border-box;
}

.addr-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 12px 10px 12px;
  padding: 5px 8px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
}

.addr-search-ico {
  flex-shrink: 0;
}

.addr-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 12px;
  color: #1D2129;
}

.addr-search-input::placeholder {
  color: #C9CDD4;
}

.addr-list-scroll {
  max-height: 240px;
  overflow-y: auto;
}

.addr-list-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 10px;
}

.addr-list-item:hover {
  background: #F7F8FA;
}

.addr-list-item.active {
  background: #F2F7FF;
}

.item-left-num {
  font-size: 13px;
  font-weight: 500;
  color: #1D2129;
  width: 16px;
  line-height: 18px;
  flex-shrink: 0;
}

.item-mid-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-main-name {
  font-size: 12px;
  font-weight: 600;
  color: #1D2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub-address {
  font-size: 11px;
  color: #86909C;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-right-radio {
  margin-top: 2px;
  flex-shrink: 0;
}

.pop-radio {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.5px solid #C9CDD4;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.pop-radio.checked {
  border-color: #2F65EE;
}

.pop-radio.checked::after {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2F65EE;
  display: block;
}

/* 港口货品卡片组 */
.port-goods-cards-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.port-goods-card {
  width: 100%;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  overflow: hidden;
  background: #FFFFFF;
}

.goods-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #FFFFFF;
  border-bottom: 1px solid #F2F3F5;
}

.goods-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #1D2129;
}

.delete-table-btn {
  background: none;
  border: none;
  color: #86909C;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 2px;
  transition: all 0.2s;
}

.delete-table-btn:hover {
  background: #FFF1F0;
  color: #F53F3F;
}

.add-table-buttons-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}

.add-table-btn {
  background: #F7F8FA;
  border: 1px dashed #2F65EE;
  color: #2F65EE;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.add-table-btn:hover {
  background: #E8F3FF;
}

.water-goods-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
}

.water-goods-table th {
  background: #F7F8FA;
  color: #4E5969;
  font-weight: 500;
  text-align: left;
  padding: 8px 6px;
  border-top: 1px solid #E5E6EB;
  border-bottom: 1px solid #E5E6EB;
  white-space: nowrap;
  box-sizing: border-box;
  font-size: 12px;
}

.water-goods-table td {
  padding: 6px 6px;
  border-bottom: 1px solid #F2F3F5;
  color: #1D2129;
  box-sizing: border-box;
  white-space: nowrap;
  font-size: 12px;
}

.water-cargo-select :deep(.el-select__wrapper) {
  height: 28px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.table-input :deep(.el-input__wrapper),
.table-select :deep(.el-select__wrapper) {
  height: 28px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.table-input :deep(.el-input__inner),
.table-select :deep(.el-select__inner),
.water-cargo-select :deep(.el-select__inner) {
  font-size: 12px;
}

.calc-total-cell {
  color: #4E5969;
  font-weight: 500;
  font-size: 12px;
}

.actions-cell {
  text-align: center;
}

.action-btn.delete {
  color: #2F65EE;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.delete:hover {
  color: #F53F3F;
}

.table-footer-btn-row {
  padding: 6px 12px;
  background: #FFFFFF;
}

.add-goods-link {
  background: none;
  border: none;
  color: #2F65EE;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
}

.add-goods-link:hover {
  background: #E8F3FF;
}

/* 3. 费用信息卡片 */
.fee-setting-card {
  background: #F7F8FA;
  border-radius: 4px;
  padding: 14px 18px;
  margin-bottom: 14px;
  border: 1px solid #F2F3F5;
}

.fee-card-top-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-with-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #1D2129;
}

.sub-explain {
  font-size: 12px;
  color: #86909C;
}

.fee-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.fee-options-row {
  display: flex;
  align-items: center;
  gap: 40px;
}

.opt-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opt-label {
  font-size: 12px;
  color: #4E5969;
}

.opt-radios {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shipper-calc-grid,
.carrier-calc-grid {
  display: flex;
  align-items: center;
  gap: 24px;
}

.calc-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calc-label {
  font-size: 12px;
  color: #4E5969;
}

.calc-select {
  width: 140px;
}

.calc-select :deep(.el-select__wrapper),
.calc-input :deep(.el-input__wrapper) {
  height: 30px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.calc-select :deep(.el-select__inner),
.calc-input :deep(.el-input__inner) {
  font-size: 12px;
}

.unit-price-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.unit-suffix {
  font-size: 12px;
  color: #4E5969;
}

/* 4. 核算规则与凭证按钮 */
.settle-rule-content,
.other-settings-content {
  padding-top: 2px;
}

.rule-field-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rule-label {
  font-size: 12px;
  color: #4E5969;
  font-weight: 500;
  min-width: 65px;
}

.voucher-tags-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voucher-tag-btn {
  background: #F2F3F5;
  border: 1px solid transparent;
  color: #4E5969;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.voucher-tag-btn.active {
  background: #F2F7FF;
  border-color: #2F65EE;
  color: #2F65EE;
}

/* 5. 其他设置与接单限制 */
.limit-controls-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.order-scope-select {
  width: 160px;
}

.order-scope-select :deep(.el-select__wrapper) {
  height: 30px;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  font-size: 12px;
}

.order-scope-select :deep(.el-select__inner) {
  font-size: 12px;
}

:deep(.el-checkbox__label) {
  font-size: 12px;
  color: #1D2129;
}

/* 底部操作栏 */
.drawer-footer-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 10px;
}

.btn-cancel {
  height: 32px;
  padding: 0 18px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  font-size: 13px;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #F7F8FA;
  border-color: #C9CDD4;
}

.btn-save {
  height: 32px;
  padding: 0 20px;
  background: #2F65EE;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  background: #1B50D8;
}

.btn-submit {
  height: 32px;
  padding: 0 20px;
  background: #2F65EE;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #1B50D8;
}
</style>

<style>
/* 覆盖 Element Plus el-drawer 全局样式，严格对齐线上设计 */
.water-plan-drawer.el-drawer {
  background: #FFFFFF !important;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15) !important;
}

.water-plan-drawer .el-drawer__header {
  margin-bottom: 0 !important;
  padding: 14px 24px !important;
  border-bottom: 1px solid #E5E6EB !important;
  color: #1D2129 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.water-plan-drawer .el-drawer__body {
  padding: 16px 24px 20px 24px !important;
  overflow-y: auto !important;
}

.water-plan-drawer .el-drawer__footer {
  padding: 10px 24px !important;
  border-top: 1px solid #E5E6EB !important;
  background: #FFFFFF !important;
}

.water-plan-drawer-overlay {
  background-color: rgba(0, 0, 0, 0.45) !important;
}
</style>
