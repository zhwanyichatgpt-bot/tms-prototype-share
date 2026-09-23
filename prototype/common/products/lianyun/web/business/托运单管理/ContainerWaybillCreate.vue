<template>
  <!-- 抽屉半透明蒙层 (Overlay) -->
  <div class="drawer-overlay" @click.self="emit('back')">
    <!-- 从右侧滑出的抽屉面板 (Drawer Panel) -->
    <div class="drawer-panel">
      <!-- 1. 抽屉标题栏 -->
      <div class="drawer-header">
        <span class="drawer-title">新增公开托运单/集装箱运输</span>
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

        <!-- ============ 模块一：集装箱信息 ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">集装箱信息</span>
          </div>

          <!-- 用箱方式 -->
          <div class="mix-row">
            <div class="field-label">用箱方式</div>
            <div class="mix-radio-group">
              <label class="mix-radio-chip" :class="{ active: formData.containerSource === '自有集装箱' }">
                <input type="radio" value="自有集装箱" v-model="formData.containerSource" />
                <span class="radio-dot"></span>
                <span>自有集装箱</span>
              </label>
              <label class="mix-radio-chip plain" :class="{ active: formData.containerSource === '承运商提供' }">
                <input type="radio" value="承运商提供" v-model="formData.containerSource" />
                <span class="radio-dot"></span>
                <span>承运商提供</span>
              </label>
            </div>
          </div>

          <!-- 柜种信息表格（仅自有集装箱） -->
          <div v-if="formData.containerSource === '自有集装箱'" class="box-table-block">
            <div class="field-label row-with-star">
              <span>柜种信息</span>
              <span class="star-red">*</span>
            </div>
            <div class="goods-table-border-box">
              <table class="goods-pure-table">
                <thead>
                  <tr>
                    <th class="th-index">序号</th>
                    <th class="th-box-type">箱型</th>
                    <th class="th-size">尺寸</th>
                    <th class="th-qty">数量</th>
                    <th class="th-remark">备注</th>
                    <th class="th-op">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 已录入数据行（只读） -->
                  <tr v-for="(row, idx) in savedBoxes" :key="row.id" class="text-data-row">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ row.boxType }}</td>
                    <td>{{ row.size }}</td>
                    <td>{{ row.qty }}</td>
                    <td>{{ row.remark || '-' }}</td>
                    <td class="td-op">
                      <span class="link-blue-btn" @click="editBoxRow(idx)">编辑</span>
                      <span class="link-blue-btn" @click="removeBoxRow(idx)">删除</span>
                    </td>
                  </tr>

                  <!-- 数据编辑录入行 -->
                  <tr class="input-edit-row">
                    <td>{{ savedBoxes.length + 1 }}</td>
                    <td>
                      <select v-model="boxEdit.boxType" class="grid-select">
                        <option value="" disabled>请选择</option>
                        <option>普通集装箱</option>
                        <option>冷藏集装箱</option>
                        <option>开顶集装箱</option>
                        <option>框架集装箱</option>
                        <option>罐式集装箱</option>
                      </select>
                    </td>
                    <td>
                      <select v-model="boxEdit.size" class="grid-select">
                        <option value="" disabled>请选择</option>
                        <option>20GP</option>
                        <option>40GP</option>
                        <option>40HQ</option>
                        <option>45GP</option>
                        <option>45HQ</option>
                      </select>
                    </td>
                    <td><input type="number" class="grid-input" v-model.number="boxEdit.qty" placeholder="0.00" /></td>
                    <td>
                      <div class="remark-cell-wrap">
                        <input class="grid-input pad-count" v-model="boxEdit.remark" placeholder="请输入" maxlength="50" />
                        <span class="count-tip">{{ (boxEdit.remark || '').length }}/50</span>
                      </div>
                    </td>
                    <td class="td-op">
                      <span class="link-blue-btn" @click="saveBoxRow()">保存</span>
                      <span class="link-blue-btn" @click="resetBoxEdit()">删除</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============ 模块二：运输货品（仅自有集装箱） ============ -->
        <div v-if="formData.containerSource === '自有集装箱'" class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">运输货品</span>
          </div>

          <div class="field-label row-with-star">
            <span>货品信息</span>
            <span class="star-red">*</span>
          </div>
          <div class="goods-table-border-box">
            <table class="goods-pure-table">
              <thead>
                <tr>
                  <th class="th-code">货品编号</th>
                  <th class="th-name">货品</th>
                  <th class="th-vol">发货体积（m³）</th>
                  <th class="th-weight">发货重量（吨）</th>
                  <th class="th-qty">发货数量</th>
                  <th class="th-price">货品单价（元）</th>
                  <th class="th-total">货品总价（元）</th>
                  <th class="th-pkg">货品包装</th>
                  <th class="th-remark">货品备注</th>
                  <th class="th-op">操作</th>
                </tr>
              </thead>
              <tbody>
                <!-- 已录入数据行（只读） -->
                <tr v-for="(item, idx) in savedGoods" :key="item.id" class="text-data-row">
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.volume }}</td>
                  <td>{{ item.weight }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unitPrice }}</td>
                  <td>{{ item.totalPrice }}</td>
                  <td>{{ item.package || '-' }}</td>
                  <td>{{ item.remark || '-' }}</td>
                  <td class="td-op">
                    <span class="link-blue-btn" @click="editGoodsRow(idx)">编辑</span>
                    <span class="link-blue-btn" @click="removeGoodsRow(idx)">删除</span>
                  </td>
                </tr>

                <!-- 数据编辑录入行 -->
                <tr class="input-edit-row">
                  <td><input class="grid-input" v-model="goodsEdit.code" placeholder="输入货品编..." /></td>
                  <td><input class="grid-input" v-model="goodsEdit.name" placeholder="输入货品名称" /></td>
                  <td><input type="number" class="grid-input" v-model.number="goodsEdit.volume" placeholder="0.00" /></td>
                  <td><input type="number" class="grid-input" v-model.number="goodsEdit.weight" placeholder="0.00" /></td>
                  <td><input type="number" class="grid-input" v-model.number="goodsEdit.quantity" placeholder="0" /></td>
                  <td><input type="number" class="grid-input" v-model.number="goodsEdit.unitPrice" placeholder="0.00" /></td>
                  <td><input type="text" class="grid-input readonly-bg" :value="calcRowTotal(goodsEdit)" readonly placeholder="0.00" /></td>
                  <td>
                    <select v-model="goodsEdit.package" class="grid-select">
                      <option value="">请选择</option>
                      <option>散装</option>
                      <option>袋装</option>
                      <option>吨包</option>
                    </select>
                  </td>
                  <td>
                    <div class="remark-cell-wrap">
                      <input class="grid-input pad-count" v-model="goodsEdit.remark" placeholder="请输入" maxlength="50" />
                      <span class="count-tip">{{ (goodsEdit.remark || '').length }}/50</span>
                    </div>
                  </td>
                  <td class="td-op">
                    <span class="link-blue-btn" @click="saveGoodsRow()">保存</span>
                    <span class="link-blue-btn" @click="resetGoodsEdit()">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- ⊕ 添加货品 -->
            <div class="table-footer-action">
              <span class="link-blue-btn" @click="saveGoodsRow()">⊕ 添加货品</span>
            </div>
          </div>
        </div>

        <!-- ============ 模块三：运输信息（运输路线） ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">运输信息</span>
          </div>

          <!-- 运输路线模式（仅自有集装箱，设计稿承运商态无此行） -->
          <div v-if="formData.containerSource === '自有集装箱'" class="mix-row">
            <div class="field-label">运输路线</div>
            <div class="mix-radio-group">
              <label class="mix-radio-chip" :class="{ active: formData.routeMode === '提重还空' }">
                <input type="radio" value="提重还空" v-model="formData.routeMode" />
                <span class="radio-dot"></span>
                <span>提重还空</span>
              </label>
              <label class="mix-radio-chip plain" :class="{ active: formData.routeMode === '提空还空' }">
                <input type="radio" value="提空还空" v-model="formData.routeMode" />
                <span class="radio-dot"></span>
                <span>提空还空</span>
              </label>
              <label class="mix-radio-chip plain" :class="{ active: formData.routeMode === '自定义' }">
                <input type="radio" value="自定义" v-model="formData.routeMode" />
                <span class="radio-dot"></span>
                <span>自定义</span>
              </label>
            </div>
          </div>

          <!-- 节点时间轴 -->
          <div class="nodes-timeline-wrap">
            <div
              v-for="(node, nodeIdx) in transportNodes"
              :key="node.id"
              class="node-item-row"
            >
              <!-- 左侧轴线列（圆点 + 删除 + 虚线） -->
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

              <!-- 右侧节点主体 -->
              <div class="node-content-col">
                <!-- 节点头部单行表单 -->
                <div class="node-toolbar-row">
                  <!-- 提空/装货/卸货/还空 胶囊 -->
                  <div class="badge-type-tag" :class="node.type === '卸货' ? 'unload-badge' : 'load-badge'">
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
                      :placeholder="timePlaceholder(node.type)"
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

                <!-- 承运商提供态：节点带货品明细表 -->
                <div v-if="formData.containerSource === '承运商提供'" class="goods-table-border-box">
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
                        <th class="th-op">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in node.savedItems" :key="item.id" class="text-data-row">
                        <td>{{ item.name }}</td>
                        <td>{{ item.volume }}</td>
                        <td>{{ item.weight }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.unitPrice }}</td>
                        <td>{{ item.totalPrice }}</td>
                        <td>{{ item.package || '-' }}</td>
                        <td>{{ item.remark || '-' }}</td>
                        <td class="td-op">
                          <span class="link-blue-btn" @click="removeNodeGoodsRow(node, item)">删除</span>
                        </td>
                      </tr>

                      <tr class="input-edit-row">
                        <td>
                          <select v-model="node.editItem.name" class="grid-select">
                            <option>玉米</option>
                            <option>小麦</option>
                            <option>大豆</option>
                            <option>钢材</option>
                          </select>
                        </td>
                        <td><input type="number" class="grid-input" v-model.number="node.editItem.volume" placeholder="0.00" /></td>
                        <td><input type="number" class="grid-input" v-model.number="node.editItem.weight" placeholder="0.00" /></td>
                        <td><input type="number" class="grid-input" v-model.number="node.editItem.quantity" placeholder="0" /></td>
                        <td><input type="number" class="grid-input" v-model.number="node.editItem.unitPrice" placeholder="0.00" /></td>
                        <td><input type="text" class="grid-input readonly-bg" :value="calcRowTotal(node.editItem)" readonly placeholder="0.00" /></td>
                        <td>
                          <select v-model="node.editItem.package" class="grid-select">
                            <option value="">请选择</option>
                            <option>散装</option>
                            <option>袋装</option>
                            <option>吨包</option>
                          </select>
                        </td>
                        <td>
                          <div class="remark-cell-wrap">
                            <input class="grid-input pad-count" v-model="node.editItem.remark" placeholder="请输入" maxlength="50" />
                            <span class="count-tip">{{ (node.editItem.remark || '').length }}/50</span>
                          </div>
                        </td>
                        <td class="td-op">
                          <span class="link-blue-btn" @click="saveNodeGoodsRow(node)">保存</span>
                          <span class="link-blue-btn" @click="resetNodeEdit(node)">删除</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="table-footer-action">
                    <span class="link-blue-btn" @click="saveNodeGoodsRow(node)">⊕ 添加货品</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部添加节点按钮 -->
            <div class="add-node-row">
              <span class="link-blue-btn" @click="addNewNode">⊕ 添加节点</span>
            </div>
          </div>

          <!-- 运输货品总计（仅承运商提供） -->
          <div v-if="formData.containerSource === '承运商提供'" class="summary-highlight-card">
            <div class="sum-icon">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="12" rx="2" fill="#3a65ff"/>
                <path d="M5 6H11M5 8.5H11M5 11H9" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="sum-text">
              <span class="sum-label">运输货品总计：</span>
              <span v-for="seg in goodsSummary" :key="seg.name" class="sum-segment">
                {{ seg.name }}（装货 <b class="val-blue">{{ seg.loadWeight }}</b> 吨 | 卸货 <b class="val-blue">{{ seg.unloadWeight }}</b> 吨）
              </span>
            </div>
          </div>
        </div>

        <!-- ============ 模块四：运费设置 ============ -->
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
            <div class="form-field-item">
              <label class="field-title">期望承运商何时进行报价</label>
              <input class="cell-input" v-model="formData.quoteDeadline" placeholder="请输入报价有效期范围" />
            </div>

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

            <div class="form-field-item">
              <label class="field-title"><span class="star-red">*</span> 期望运输单价</label>
              <div class="suffix-input-wrap">
                <input class="cell-input borderless" v-model.number="formData.expectedUnitPrice" placeholder="请输入运输单价范围" />
                <span class="unit-tag">元/吨</span>
              </div>
            </div>

            <div class="form-field-item">
              <label class="field-title">支付方式</label>
              <div class="custom-select-wrap">
                <select v-model="formData.paymentMethod" class="form-select">
                  <option value="请选择">请选择</option>
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
            <span class="estimate-desc">预估总运费（总重量 {{ totalWeight }} 吨 * {{ formData.expectedUnitPrice || 0 }} 元/吨）</span>
            <span class="estimate-num-text">{{ estimatedFreight }} 元</span>
          </div>
        </div>

        <!-- ============ 模块五：偏好设置 ============ -->
        <div class="section-block">
          <div class="section-title-line">
            <span class="blue-bar"></span>
            <span class="section-title-text">偏好设置</span>
          </div>

          <div class="preference-layout-row">
            <div class="pref-left-col">
              <!-- 运输方式 -->
              <div class="form-field-item">
                <label class="field-title">{{ formData.containerSource === '承运商提供' ? '期望运输方式' : '运输方式' }}</label>
                <div class="mode-chips-row">
                  <div
                    v-for="m in ['汽运','水运','火运','联运']"
                    :key="m"
                    class="mode-chip-box"
                    :class="{ active: formData.transportModes.includes(m) }"
                    @click="toggleMode(m)"
                  >
                    <span>{{ m }}</span>
                    <span v-if="formData.transportModes.includes(m)" class="chip-corner-check">✓</span>
                  </div>
                </div>
              </div>

              <!-- 可见范围 -->
              <div class="form-field-item mt-16">
                <label class="field-title">{{ formData.containerSource === '承运商提供' ? '承运商可见范围' : '可见范围' }}</label>
                <div class="scope-radios-inline">
                  <label class="scope-radio-item" :class="{ 'active-box': formData.visibilityScope === '全平台可见' }">
                    <input type="radio" value="全平台可见" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>全平台可见</span>
                  </label>

                  <label class="scope-radio-item" :class="{ 'active-box': formData.visibilityScope === '指定平台可见' }">
                    <input type="radio" value="指定平台可见" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>指定平台可见</span>
                  </label>

                  <!-- 指定平台可见时选择渠道 -->
                  <div v-if="formData.visibilityScope === '指定平台可见'" class="scope-dropdown-wrap" @click="showChannelCard = true">
                    <span class="drop-text">{{ selectedChannelSummary }}</span>
                    <span class="arrow-indicator">▾</span>
                  </div>

                  <label class="scope-radio-item" :class="{ 'active-box': formData.visibilityScope === '指定承运商' }">
                    <input type="radio" value="指定承运商" v-model="formData.visibilityScope" />
                    <span class="radio-dot"></span>
                    <span>指定承运商</span>
                  </label>

                  <!-- 承运商提供态：指定承运商后选择承运商 -->
                  <div v-if="formData.containerSource === '承运商提供' && formData.visibilityScope === '指定承运商'" class="scope-dropdown-wrap plain">
                    <select v-model="formData.selectedCarrier" class="drop-select">
                      <option value="" disabled>请选择承运商</option>
                      <option>宏远物流</option>
                      <option>恒路物流</option>
                    </select>
                    <span class="arrow-indicator">▾</span>
                  </div>
                </div>
              </div>

              <!-- 单据凭证 -->
              <div class="form-field-item mt-16">
                <label class="field-title">单据凭证</label>
                <div class="voucher-chips-row">
                  <div
                    class="voucher-chip"
                    :class="{ active: formData.vouchers.includes('装货凭证') }"
                    @click="toggleVoucher('装货凭证')"
                  >
                    <span>装货凭证</span>
                    <span v-if="formData.vouchers.includes('装货凭证')" class="chip-corner-check">✓</span>
                  </div>
                  <div
                    class="voucher-chip"
                    :class="{ active: formData.vouchers.includes('卸货凭证') }"
                    @click="toggleVoucher('卸货凭证')"
                  >
                    <span>卸货凭证</span>
                    <span v-if="formData.vouchers.includes('卸货凭证')" class="chip-corner-check">✓</span>
                  </div>
                </div>
              </div>

              <!-- 备注 -->
              <div class="form-field-item mt-16">
                <label class="field-title">备注</label>
                <div class="pure-remark-wrap">
                  <textarea class="pure-textarea" v-model="formData.remark" placeholder="请输入..." rows="3" maxlength="200"></textarea>
                  <span class="textarea-count">{{ (formData.remark || '').length }}/200</span>
                </div>
              </div>
            </div>

            <!-- 右侧：发布渠道选择卡片（指定平台可见时展开） -->
            <div v-if="showChannelCard" class="pref-right-col">
              <div class="channel-dialog-card">
                <div class="channel-card-top-title">
                  <div class="card-main-heading">发布渠道选择</div>
                  <div class="card-sub-tip">请选择您希望将托运单发布的平台渠道</div>
                </div>

                <div class="channel-items-stack">
                  <div
                    v-for="ch in channelList"
                    :key="ch.id"
                    class="channel-row-item"
                    :class="{ selected: formData.selectedChannels.includes(ch.id) }"
                    @click="toggleChannel(ch.id)"
                  >
                    <div class="item-checkbox" :class="{ checked: formData.selectedChannels.includes(ch.id) }">
                      {{ formData.selectedChannels.includes(ch.id) ? '✓' : '' }}
                    </div>
                    <div class="item-logo" :class="ch.logoClass">
                      <span v-if="ch.logoText" class="chy-text">{{ ch.logoText }}</span>
                      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20L12 18H4L12 6" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="item-info">
                      <div class="info-title-row">
                        <span class="info-title">{{ ch.name }}</span>
                        <span v-if="ch.recommended" class="rec-badge">⏰ 推荐</span>
                      </div>
                      <div class="info-sub">{{ ch.desc }}</div>
                      <div class="info-tags">
                        <span v-for="tag in ch.tags" :key="tag" class="ch-tag-pill">{{ tag }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="channel-card-footer">
                  <button class="ch-footer-cancel" @click="formData.selectedChannels = []">取消</button>
                  <button class="ch-footer-confirm" @click="showChannelCard = false">确认</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 抽屉底部固定操作按钮 -->
      <div class="drawer-footer-actions">
        <button class="footer-btn btn-plain" @click="emit('back')">取消</button>
        <button class="footer-btn btn-draft" @click="handleSaveDraft">保存草稿</button>
        <button class="footer-btn btn-confirm" @click="handleSubmit">提交</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back', 'submit-success', 'save-draft'])

const currentTab = ref('详细')
const showChannelCard = ref(false)

const channelList = [
  { id: 'ch1', name: '至简物流运输平台', desc: '注册承运商80000+家，公路公路/水...', tags: ['全面覆盖', '服务保障', '高响应'], logoClass: 'logo-zj', recommended: true },
  { id: 'ch2', name: '超好运网路货运运输平台', desc: '注册承运商80000+家，公路公路/水...', tags: ['全面覆盖', '服务保障', '高响应'], logoClass: 'logo-chy', logoText: 'CHY' },
  { id: 'ch3', name: '至简无船承运平台', desc: '注册承运商80000+家，公路公路/水...', tags: ['全面覆盖', '服务保障', '高响应'], logoClass: 'logo-ship' },
  { id: 'ch4', name: '至简无船承运平台', desc: '注册承运商80000+家，公路公路/水...', tags: [], logoClass: 'logo-ship' },
]

const formData = reactive({
  containerSource: '自有集装箱',
  routeMode: '提重还空',
  quoteMode: '竞价',
  quoteDeadline: '',
  billingMode: '请选择计算规则',
  expectedUnitPrice: 20,
  paymentMethod: '请选择',
  transportModes: ['汽运'],
  visibilityScope: '全平台可见',
  selectedChannels: ['ch1'],
  selectedCarrier: '',
  vouchers: ['装货凭证'],
  remark: '',
})

function timePlaceholder(type) {
  if (type === '提空') return '请选择提货时间'
  if (type === '装货') return '请选择装货时间'
  return '请选择卸货时间'
}

// ============ 柜种信息（自有集装箱） ============
const savedBoxes = ref([
  { id: 'box-1', boxType: '普通集装箱', size: '20GP', qty: 50, remark: '备注备注信息备注信息' },
  { id: 'box-2', boxType: '普通集装箱', size: '40GP', qty: 50, remark: '-' },
])
const boxEdit = reactive({ boxType: '', size: '', qty: null, remark: '' })

function editBoxRow(idx) {
  const row = savedBoxes.value[idx]
  boxEdit.boxType = row.boxType
  boxEdit.size = row.size
  boxEdit.qty = Number(row.qty) || null
  boxEdit.remark = row.remark === '-' ? '' : row.remark
  savedBoxes.value.splice(idx, 1)
}

function saveBoxRow() {
  if (!boxEdit.boxType) return ElMessage.warning('请选择箱型')
  if (!boxEdit.size) return ElMessage.warning('请选择尺寸')
  if (!boxEdit.qty) return ElMessage.warning('请输入数量')
  savedBoxes.value.push({
    id: `box-${Date.now()}`,
    boxType: boxEdit.boxType,
    size: boxEdit.size,
    qty: boxEdit.qty,
    remark: boxEdit.remark || '-',
  })
  resetBoxEdit()
  ElMessage.success('已保存')
}

function removeBoxRow(idx) {
  savedBoxes.value.splice(idx, 1)
}

function resetBoxEdit() {
  boxEdit.boxType = ''
  boxEdit.size = ''
  boxEdit.qty = null
  boxEdit.remark = ''
}

// ============ 运输货品（自有集装箱） ============
const savedGoods = ref([
  { id: 'goods-1', code: '001', name: '玉米', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '备注备注信息备注信息' },
  { id: 'goods-2', code: '002', name: '小麦', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '-' },
])
const goodsEdit = reactive({ code: '', name: '', volume: null, weight: null, quantity: null, unitPrice: null, package: '', remark: '' })

function editGoodsRow(idx) {
  const row = savedGoods.value[idx]
  Object.assign(goodsEdit, {
    code: row.code,
    name: row.name,
    volume: Number(row.volume) || null,
    weight: Number(row.weight) || null,
    quantity: Number(row.quantity) || null,
    unitPrice: Number(row.unitPrice) || null,
    package: row.package === '-' ? '' : row.package,
    remark: row.remark === '-' ? '' : row.remark,
  })
  savedGoods.value.splice(idx, 1)
}

function saveGoodsRow() {
  if (!goodsEdit.name) return ElMessage.warning('请输入货品名称')
  if (!goodsEdit.weight && !goodsEdit.quantity) return ElMessage.warning('请维护货品数量')
  savedGoods.value.push({
    id: `goods-${Date.now()}`,
    code: goodsEdit.code || String(savedGoods.value.length + 1).padStart(3, '0'),
    name: goodsEdit.name,
    volume: goodsEdit.volume ?? '-',
    weight: goodsEdit.weight ?? '-',
    quantity: goodsEdit.quantity ?? '-',
    unitPrice: goodsEdit.unitPrice ?? '-',
    totalPrice: calcRowTotal(goodsEdit),
    package: goodsEdit.package || '-',
    remark: goodsEdit.remark || '-',
  })
  resetGoodsEdit()
  ElMessage.success('已保存')
}

function removeGoodsRow(idx) {
  savedGoods.value.splice(idx, 1)
}

function resetGoodsEdit() {
  goodsEdit.code = ''
  goodsEdit.name = ''
  goodsEdit.volume = null
  goodsEdit.weight = null
  goodsEdit.quantity = null
  goodsEdit.unitPrice = null
  goodsEdit.package = ''
  goodsEdit.remark = ''
}

function calcRowTotal(item) {
  const w = Number(item.weight) || 0
  const p = Number(item.unitPrice) || 0
  if (!w || !p) return '0.00'
  return (w * p).toFixed(2)
}

// ============ 节点 ============
function createNode(type, withGoods) {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    location: '马尾港',
    time: '',
    contact: '',
    phone: '',
    savedItems: withGoods
      ? [
          { id: `item-${Date.now()}-1`, name: '玉米', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '备注备注信息备注信息' },
          { id: `item-${Date.now()}-2`, name: '小麦', volume: '100', weight: '50', quantity: '1000', unitPrice: '1000', totalPrice: '10000', package: '-', remark: '-' },
        ]
      : [],
    editItem: { name: '玉米', volume: null, weight: null, quantity: null, unitPrice: null, package: '', remark: '' },
  }
}

function defaultNodes(source) {
  return source === '自有集装箱'
    ? [createNode('提空', false), createNode('装货', false), createNode('卸货', false), createNode('还空', false)]
    : [createNode('装货', true), createNode('卸货', true)]
}

const transportNodes = ref(defaultNodes(formData.containerSource))

watch(() => formData.containerSource, (val) => {
  transportNodes.value = defaultNodes(val)
})

function addNewNode() {
  transportNodes.value.push(createNode('卸货', formData.containerSource === '承运商提供'))
}

function removeNode(idx) {
  if (transportNodes.value.length <= 2) {
    ElMessage.warning('至少需要保留两个节点')
    return
  }
  transportNodes.value.splice(idx, 1)
}

function saveNodeGoodsRow(node) {
  if (!node.editItem.weight && !node.editItem.quantity) {
    return ElMessage.info('请先填写当前行货品的数据')
  }
  node.savedItems.push({
    id: `item-${Date.now()}`,
    name: node.editItem.name || '玉米',
    volume: node.editItem.volume ?? '-',
    weight: node.editItem.weight ?? '-',
    quantity: node.editItem.quantity ?? '-',
    unitPrice: node.editItem.unitPrice ?? '-',
    totalPrice: calcRowTotal(node.editItem),
    package: node.editItem.package || '-',
    remark: node.editItem.remark || '-',
  })
  node.editItem = { name: '玉米', volume: null, weight: null, quantity: null, unitPrice: null, package: '', remark: '' }
  ElMessage.success('已添加货品')
}

function removeNodeGoodsRow(node, item) {
  const idx = node.savedItems.indexOf(item)
  if (idx > -1) node.savedItems.splice(idx, 1)
}

function resetNodeEdit(node) {
  node.editItem = { name: '玉米', volume: null, weight: null, quantity: null, unitPrice: null, package: '', remark: '' }
}

// ============ 汇总 ============
const goodsSummary = computed(() => {
  const map = {}
  transportNodes.value.forEach(node => {
    (node.savedItems || []).forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, loadWeight: 0, unloadWeight: 0 }
      if (node.type === '装货') map[item.name].loadWeight += Number(item.weight) || 0
      if (node.type === '卸货') map[item.name].unloadWeight += Number(item.weight) || 0
    })
  })
  return Object.values(map)
})

const totalWeight = computed(() => {
  if (formData.containerSource === '自有集装箱') {
    return savedGoods.value.reduce((t, g) => t + (Number(g.weight) || 0), 0)
  }
  return transportNodes.value.reduce((t, node) => {
    if (node.type !== '装货') return t
    return t + (node.savedItems || []).reduce((s, i) => s + (Number(i.weight) || 0), 0)
  }, 0)
})

const estimatedFreight = computed(() => {
  const amount = totalWeight.value * (Number(formData.expectedUnitPrice) || 0)
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

// ============ 渠道与偏好 ============
const selectedChannelSummary = computed(() => {
  if (formData.selectedChannels.length === 0) return '请选择可见平台'
  if (formData.selectedChannels.includes('ch1')) return '至简物流运输平台'
  return `已选 ${formData.selectedChannels.length} 个平台`
})

function toggleChannel(chId) {
  const idx = formData.selectedChannels.indexOf(chId)
  if (idx > -1) formData.selectedChannels.splice(idx, 1)
  else formData.selectedChannels.push(chId)
}

function toggleVoucher(v) {
  const idx = formData.vouchers.indexOf(v)
  if (idx > -1) formData.vouchers.splice(idx, 1)
  else formData.vouchers.push(v)
}

function toggleMode(m) {
  const idx = formData.transportModes.indexOf(m)
  if (idx > -1) {
    if (formData.transportModes.length > 1) formData.transportModes.splice(idx, 1)
  } else {
    formData.transportModes.push(m)
  }
}

// ============ 提交 ============
function buildPayload(status) {
  return {
    id: `TY${Date.now().toString().slice(-9)}`,
    businessType: '集装箱',
    publishMode: '公开托运',
    status,
    publishTime: new Date().toISOString(),
    containerSource: formData.containerSource,
    routeMode: formData.routeMode,
    quoteMode: formData.quoteMode,
    quoteDeadline: formData.quoteDeadline,
    billingMode: formData.billingMode,
    expectedUnitPrice: Number(formData.expectedUnitPrice) || 0,
    paymentMethod: formData.paymentMethod,
    transportModes: [...formData.transportModes],
    visibilityScope: formData.visibilityScope,
    selectedChannels: [...formData.selectedChannels],
    selectedCarrier: formData.selectedCarrier,
    vouchers: [...formData.vouchers],
    remark: formData.remark,
    containerBoxes: formData.containerSource === '自有集装箱' ? savedBoxes.value.map(b => ({ ...b })) : [],
    containerGoods: formData.containerSource === '自有集装箱' ? savedGoods.value.map(g => ({ ...g })) : [],
    containerNodes: transportNodes.value.map(n => ({
      nodeType: n.type,
      name: n.location,
      expectTime: n.time,
      contactName: n.contact,
      contactPhone: n.phone,
      goodsItems: (n.savedItems || []).map(i => ({ ...i })),
    })),
  }
}

function validatePublish() {
  if (formData.containerSource === '自有集装箱') {
    if (savedBoxes.value.length === 0) return '请至少保存一行柜种信息'
    if (savedGoods.value.length === 0) return '请至少保存一行货品信息'
  }
  return null
}

function handleSaveDraft() {
  emit('save-draft', buildPayload('草稿'))
}

function handleSubmit() {
  const err = validatePublish()
  if (err) return ElMessage.warning(err)
  emit('submit-success', buildPayload('竞价中'))
  ElMessage.success('托运单已成功提交！')
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
  width: 1604px;
  max-width: 96vw;
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
  color: #333333;
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
  font-size: 16px;
  color: #333333;
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
  color: #333333;
}

/* 字段标签 */
.field-label {
  font-size: 14px;
  color: #333333;
  margin-bottom: 8px;
}
.row-with-star {
  display: flex;
  align-items: center;
  gap: 2px;
}
.star-red { color: #f14335; }

/* 单选胶囊（设计稿：选中 #3a65ff@6% 底 + #3a65ff 边框；未选 #f6f6f6 底 + #707070 边框） */
.mix-row {
  margin-bottom: 20px;
}
.mix-radio-group {
  display: flex;
  gap: 16px;
}
.mix-radio-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 16px;
  border-radius: 2px;
  font-size: 14px;
  cursor: pointer;
  background: #f6f6f6;
  border: 1px solid #707070;
  color: #20273a;
  box-sizing: border-box;
}
.mix-radio-chip input { display: none; }
.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #c9cdd4;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
}
.mix-radio-chip.active {
  background: rgba(58, 101, 255, 0.06);
  border-color: #3a65ff;
  color: #3a65ff;
  font-weight: 600;
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
/* 节点类型徽章（提空/装货/还空 #e7ebf7 底 #3e4e83 字；卸货 #3a65ff 底白字） */
.badge-type-tag {
  min-width: 58px;
  height: 24px;
  padding: 0 10px;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;
}
.badge-type-tag.load-badge {
  background: #e7ebf7;
  color: #3e4e83;
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
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 0 10px;
  font-size: 14px;
  color: #333333;
  outline: none;
  box-sizing: border-box;
  background: #ffffff;
}
.cell-input:focus { border-color: #3a65ff; }
.cell-input.borderless { border: none; }
.cell-input::placeholder { color: #cccccc; }

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

/* 表格（设计稿：表头 #f5f5f5 底，行框线 #e4ecf4） */
.goods-table-border-box {
  border: 1px solid #e4ecf4;
  border-radius: 2px;
  background: #ffffff;
}
.goods-pure-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.goods-pure-table th {
  background: #f5f5f5;
  color: #333333;
  font-weight: 600;
  text-align: left;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid #e4ecf4;
  border-right: 1px solid #e4ecf4;
  box-sizing: border-box;
}
.goods-pure-table td {
  height: 38px;
  padding: 4px 12px;
  box-sizing: border-box;
  color: #333333;
  border-bottom: 1px solid #e4ecf4;
  border-right: 1px solid #e4ecf4;
}
.td-op { white-space: nowrap; }

.th-index { width: 72px; }
.th-box-type { width: 160px; }
.th-size { width: 120px; }
.th-qty { width: 110px; }
.th-remark { min-width: 200px; }
.th-op { width: 140px; }

.th-code { width: 110px; }
.th-name { width: 140px; }
.th-vol { width: 120px; }
.th-weight { width: 130px; }
.th-price { width: 120px; }
.th-total { width: 120px; }
.th-pkg { width: 110px; }

.grid-input {
  width: 100%;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 0 8px;
  font-size: 14px;
  color: #333333;
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
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 0 4px;
  font-size: 14px;
  color: #333333;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}
.grid-select:invalid { color: #cccccc; }
.remark-cell-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.grid-input.pad-count { padding-right: 46px; }
.count-tip {
  position: absolute;
  right: 6px;
  font-size: 12px;
  color: #d3d3d3;
}

.table-footer-action {
  padding: 8px 12px;
}
.link-blue-btn {
  color: #3a65ff;
  font-size: 14px;
  cursor: pointer;
}
.link-blue-btn + .link-blue-btn { margin-left: 16px; }
.link-blue-btn:hover { text-decoration: underline; }

.add-node-row {
  padding-left: 44px;
  margin-top: 10px;
}

/* 汇总条（设计稿：#f2f7ff→#f8f9ff 渐变，边框 #e6ecff） */
.summary-highlight-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 12px 16px;
  background: linear-gradient(90deg, #f2f7ff 0%, #f8f9ff 100%);
  border: 1px solid #e6ecff;
  border-radius: 4px;
}
.sum-icon {
  display: inline-flex;
  align-items: center;
}
.sum-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: #333333;
}
.sum-label { color: #333333; }
.val-blue { color: #3a65ff; font-weight: 600; }

/* ============ 运费设置 ============ */
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
  font-size: 14px;
  color: #333333;
}

.custom-select-wrap {
  position: relative;
}
.form-select {
  width: 100%;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 0 24px 0 10px;
  font-size: 14px;
  color: #333333;
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
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  background: #ffffff;
  box-sizing: border-box;
}
.suffix-input-wrap .cell-input { border: none; height: 100%; }
.unit-tag {
  padding: 0 10px;
  font-size: 14px;
  color: #333333;
  background: #ffffff;
  border-left: 1px solid #e0e0e0;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.freight-estimate-pill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  width: 100%;
  padding: 10px 14px;
  background: linear-gradient(90deg, #f2f7ff 0%, #f8f9ff 100%);
  border: 1px solid #e6ecff;
  border-radius: 4px;
  box-sizing: border-box;
}
.yen-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #2f6bff;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.estimate-desc {
  font-size: 14px;
  color: #333333;
}
.estimate-num-text {
  font-size: 14px;
  color: #3a65ff;
  font-weight: 600;
}

/* ============ 偏好设置 ============ */
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

/* 运输方式 chips */
.mode-chips-row {
  display: flex;
  gap: 12px;
}
.mode-chip-box {
  position: relative;
  height: 28px;
  padding: 0 16px;
  border: 1px solid #707070;
  background: #f6f6f6;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #20273a;
  cursor: pointer;
  box-sizing: border-box;
}
.mode-chip-box.active {
  border-color: #3a65ff;
  color: #3a65ff;
  background: rgba(58, 101, 255, 0.06);
  font-weight: 600;
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
  flex-wrap: wrap;
}
.scope-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 16px;
  border-radius: 2px;
  border: 1px solid #707070;
  background: #f6f6f6;
  font-size: 14px;
  color: #20273a;
  cursor: pointer;
  box-sizing: border-box;
}
.scope-radio-item input { display: none; }
.scope-radio-item.active-box {
  background: rgba(58, 101, 255, 0.06);
  border-color: #3a65ff;
  color: #3a65ff;
  font-weight: 600;
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
.scope-radio-item { position: relative; }

.scope-dropdown-wrap {
  position: relative;
  width: 160px;
  height: 28px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  border-radius: 2px;
  display: flex;
  align-items: center;
  padding: 0 24px 0 10px;
  cursor: pointer;
  box-sizing: border-box;
}
.scope-dropdown-wrap.plain { cursor: default; }
.drop-text {
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.drop-select {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333333;
  appearance: none;
  padding-right: 14px;
}
.drop-select:invalid { color: #cccccc; }

/* 单据凭证 */
.voucher-chips-row {
  display: flex;
  gap: 12px;
}
.voucher-chip {
  position: relative;
  height: 28px;
  padding: 0 16px;
  border-radius: 2px;
  border: 1px solid #707070;
  background: #f6f6f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #20273a;
  cursor: pointer;
  box-sizing: border-box;
}
.voucher-chip.active {
  border-color: #3a65ff;
  background: rgba(58, 101, 255, 0.06);
  color: #3a65ff;
  font-weight: 600;
}

/* 备注 */
.pure-remark-wrap {
  position: relative;
  width: 100%;
}
.pure-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 8px 12px;
  font-size: 14px;
  color: #333333;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}
.pure-textarea:focus {
  border-color: #3a65ff;
}
.textarea-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: #cccccc;
  pointer-events: none;
}

/* ============ 渠道卡片 ============ */
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
  box-sizing: border-box;
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

/* 3. 抽屉底部操作栏（设计稿：取消为纯文字，提交为蓝底 16px） */
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
  height: 32px;
  padding: 0 24px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 14px;
  box-sizing: border-box;
}
.btn-plain {
  border: none;
  background: transparent;
  color: #333333;
}
.btn-draft {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #333333;
}
.btn-confirm {
  border: none;
  background: #3a65ff;
  color: #ffffff;
  font-size: 16px;
}
.btn-confirm:hover {
  background: #5982ff;
}

.mt-16 { margin-top: 16px; }
</style>
