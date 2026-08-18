<template>
  <div class="plan-scroll">
    <div class="waybill-manage-page">
    <!-- 顶部系统区 (业务系统顶栏) -->
    <header class="tp-topbar">
      <img class="tp-logo" src="/transport-plan-assets/logo.png" alt="logo" @click="handleGoHome" style="cursor: pointer;" />
      <span class="tp-divider1"></span>
      <span class="tp-avatar"></span>
      <div class="tp-site">
        <span class="tp-site-name">楹联集运站</span>
        <span class="tp-site-org">企业名称企业名称企业企业名称...</span>
      </div>
      <img class="tp-nav" src="/transport-plan-assets/nav.png" alt="nav" />
      <span class="tp-date">2022 年 05 月 27 日</span>
      <span class="tp-weather">24℃ 多云</span>
      <img class="tp-user" src="/transport-plan-assets/avatar.png" alt="user" />
      <span class="tp-divider2"></span>
      <img class="tp-icon i1" src="/transport-plan-assets/icon1.png" alt="icon1" />
      <img class="tp-icon i2" src="/transport-plan-assets/icon2.png" alt="icon2" />
      <img class="tp-icon i3" src="/transport-plan-assets/icon3.png" alt="icon3" />
    </header>

    <!-- 第二层工作台条 -->
    <div class="tp-workbar">
      <img class="wb-ws-icon" src="/transport-plan-assets/workspace-icon.png" alt="workspace" />
      <span class="wb-ws-text" @click="handleGoHome" style="cursor: pointer;">工作台</span>
      <span class="wb-tab-active">
        <span class="wb-tab-shape"></span>
        <span class="wb-tab-text">托运单管理</span>
        <span class="wb-tab-close" title="关闭页面" @click="handleGoHome">
          <svg width="7" height="7" viewBox="0 0 6.58 6.58" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.82" y="0" width="8.14" height="1.16" transform="rotate(45 0.82 0)" rx="0.58" fill="#3D4050" />
            <rect x="6.58" y="0.82" width="8.14" height="1.16" transform="rotate(135 6.58 0.82)" rx="0.58" fill="#3D4050" />
          </svg>
        </span>
      </span>
    </div>

    <!-- 主体内容区 -->
    <div class="tp-body">
      <!-- 1. 综合查询区（运输计划风格） -->
      <div class="query-row">
        <div class="query-field search-field">
          <input class="q-input" v-model="filters.keyword" placeholder="输入托运单号/路线/货品搜索" @keyup.enter="handleQuery" />
        </div>
        <div class="query-field shipper-field">
          <span class="q-label">托运企业</span>
          <input class="q-input" v-model="filters.shipperCompany" placeholder="输入企业名称" @keyup.enter="handleQuery" />
        </div>
        <div class="query-field select-field">
          <span class="q-label">业务类型</span>
          <select class="q-select" v-model="filters.businessType">
            <option value="">全部类型</option>
            <option v-for="b in businessTypeOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="query-field select-field">
          <span class="q-label">运输方式</span>
          <select class="q-select" v-model="filters.transportMode">
            <option value="">全部方式</option>
            <option v-for="m in transportModeOptions" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button class="q-refresh" title="重置筛选" @click="handleResetFilters">↻</button>
        <button class="q-search-btn" @click="handleQuery">搜索</button>
      </div>

      <!-- 2. 状态页签 -->
      <div class="status-tabs">
        <button
          v-for="t in waybillStatusTabs"
          :key="t.value"
          :class="{ active: activeStatus === t.value }"
          @click="handleStatusTabChange(t.value)"
        >{{ t.label }}</button>
      </div>

      <!-- 3. 操作按钮行 -->
      <div class="action-row">
        <button class="btn-primary annotation-create-entry" @click="openTypeSelectDialog">新增托运单</button>
      </div>

      <!-- 4. 托运单表头栏 -->
      <div class="wb-list-header">
        <div class="col-head col-hd-waybill">托运单</div>
        <div class="col-head col-hd-transport">运输信息</div>
        <div class="col-head col-hd-company">物贸企业</div>
        <div class="col-head col-hd-cargo">货品信息</div>
        <div class="col-head col-hd-price">期望单价</div>
        <div class="col-head col-hd-status">
          <span>状态</span>
          <span class="status-arrow">▾</span>
        </div>
        <div class="col-head col-hd-requirement">运输要求</div>
      </div>

      <!-- 4. 托运单卡片列表 -->
      <div class="wb-card-list">
        <div
          v-if="pagedWaybills.length"
          v-for="(item, index) in pagedWaybills"
          :key="item.id"
          class="wb-card-item"
        >
          <!-- 卡片顶条 -->
          <div class="wb-card-topbar">
            <div class="topbar-left">
              <span class="wb-index">{{ formatIndex(index) }}</span>
              <span class="wb-code" @click="viewDetail(item)">{{ item.id }}</span>
              <span class="wb-mode-tag" :class="item.modeTag === '抢单' ? 'grab' : 'bidding'">
                {{ item.modeTag || '竞价' }}
              </span>
            </div>
            <div class="topbar-right">
              <span class="countdown-label">{{ item.countdownType || '距离竞价结束' }}</span>
              <span class="cd-box">{{ item.countdownDays || '36' }}</span>
              <span class="cd-unit">天</span>
              <span class="cd-box">{{ item.countdownHours || '03' }}</span>
              <span class="cd-colon">:</span>
              <span class="cd-box">{{ item.countdownMinutes || '37' }}</span>
              <span class="cd-colon">:</span>
              <span class="cd-box">{{ item.countdownSeconds || '06' }}</span>
              <button class="top-action-btn" @click="viewDetail(item)">详情</button>
              <button
                v-if="item.status === '竞价中' || item.status === '待审核' || item.status === '待确定'"
                class="top-action-btn danger"
                @click="handleCancelWaybill(item)"
              >取消</button>
            </div>
          </div>

          <!-- 卡片内容主体 -->
          <div class="wb-card-body">
            <!-- 路线轴 -->
            <div class="wb-col col-route-wrap">
              <div class="route-timeline-cell">
                <div class="rt-axis">
                  <span class="rt-badge load">装</span>
                  <div class="rt-line">
                    <span class="rt-node-circle">{{ getRouteDetails(item).nodeCount }}</span>
                  </div>
                  <span class="rt-badge unload">卸</span>
                </div>
                <div class="rt-content">
                  <div class="rt-item load-item">
                    <div class="rt-item-top">
                      <span class="rt-city">{{ getRouteDetails(item).loadCity }}</span>
                      <span class="rt-time">装货时间：{{ getRouteDetails(item).loadTime }}</span>
                    </div>
                    <div class="rt-detail">{{ getRouteDetails(item).loadPoint }}</div>
                  </div>
                  <div class="rt-item unload-item">
                    <div class="rt-item-top">
                      <span class="rt-city">{{ getRouteDetails(item).unloadCity }}</span>
                      <span class="rt-time">卸货时间：{{ getRouteDetails(item).unloadTime }}</span>
                    </div>
                    <div class="rt-detail">{{ getRouteDetails(item).unloadPoint }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 运输信息 -->
            <div class="wb-col col-transport-wrap">
              <span class="tag-transport public">公开托运</span>
              <span
                class="tag-transport type"
                :class="item.businessType === '集装箱' ? 'container' : 'bulk'"
              >{{ item.businessType === '集装箱' ? '集装箱运输' : '散杂货运输' }}</span>
            </div>

            <!-- 物贸企业 -->
            <div class="wb-col col-company-wrap">
              <span class="company-text">{{ item.shipperCompany && item.shipperCompany !== '-' ? item.shipperCompany : '-' }}</span>
            </div>

            <!-- 货品信息 -->
            <div class="wb-col col-cargo-wrap">
              <div class="cargo-cell">
                <span class="cargo-badge">1</span>
                <span class="cargo-name">{{ item.cargoName || '货品' }}</span>
                <span class="cargo-divider">|</span>
                <span class="cargo-qty">{{ item.cargoQtyStr || (item.totalWeight ? item.totalWeight + ' 吨' : '100 吨') }}</span>
              </div>
            </div>

            <!-- 期望单价 -->
            <div class="wb-col col-price-wrap">
              <div class="price-cell">
                <div class="price-val">{{ item.expectedPrice || '400~1200元/箱' }}</div>
                <div class="price-tag-wrap">
                  <span class="price-billing-tag">{{ item.billingTag || (item.businessType === '集装箱' ? '箱' : '重量') }}</span>
                </div>
              </div>
            </div>

            <!-- 状态 -->
            <div class="wb-col col-status-wrap">
              <div class="status-pill">{{ item.status }}</div>
            </div>

            <!-- 运输要求 -->
            <div class="wb-col col-requirement-wrap">
              <span class="req-text">{{ item.requirementText || '-' }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-cell">暂无符合条件的托运单，点击右上角创建</div>
      </div>

      <!-- 5. 分页栏 -->
      <div class="pagination-row">
        <span class="page-total">共 {{ filteredWaybills.length }} 条</span>
        <span class="page-size">{{ pageSize }}条/页</span>
        <button class="page-btn" :disabled="currentPageNum <= 1" @click="currentPageNum--">‹</button>
        <button
          v-for="n in totalPageNumbers"
          :key="n"
          class="page-btn"
          :class="{ active: n === currentPageNum }"
          @click="currentPageNum = n"
        >{{ n }}</button>
        <button class="page-btn" :disabled="currentPageNum >= totalPageCount" @click="currentPageNum++">›</button>
        <span class="page-jump">到第 <input class="page-input" v-model.number="jumpPageNum" @keyup.enter="doJumpPage" /> 页</span>
      </div>

    <!-- 业务类型选择弹窗 -->
    <el-dialog v-model="showTypeSelectDialog" title="选择托运单类型" width="460px" :append-to-body="false">
      <p class="dialog-tip">请选择要创建的托运单业务类型：</p>
      <div class="type-options">
        <div
          v-for="type in businessTypeOptions"
          :key="type"
          class="type-option-btn"
          @click="selectBusinessType(type)"
        >
          <div class="type-icon">{{ type === '散杂货' ? '📦' : '🚢' }}</div>
          <div class="type-name">{{ type }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 散杂货托运单创建抽屉 -->
    <el-drawer
      v-model="showBulkCargoDialog"
      title="新增公开托运单 / 散杂货运输"
      direction="rtl"
      size="calc(100vw - 258px)"
      :append-to-body="false"
      :before-close="closeCreateDialog"
    >
      <div class="create-body">
        <div class="create-tabs">
          <button type="button" class="create-tab active">详情</button>
          <button type="button" class="create-tab">简易</button>
        </div>

        <!-- 运输信息 -->
        <section class="form-section design-section">
          <h3 class="section-title">运输信息</h3>
          <div class="field-line">
            <span class="inline-label">是否允许货品混装</span>
            <el-radio-group v-model="formData.allowMix" size="small" class="choice-segment mix-choice">
              <el-radio-button label="允许" />
              <el-radio-button label="不允许" />
            </el-radio-group>
          </div>

          <div class="transport-timeline">
            <!-- 装货节点 -->
            <div v-for="(node, index) in loadNodes" :key="node.id" class="transport-node">
              <span class="timeline-dot" />
              <button
                type="button"
                class="node-remove"
                :disabled="loadNodes.length === 1"
                @click="removeLoadNode(index)"
              >⌫</button>
              <div class="node-panel">
                <div class="node-toolbar">
                  <el-select v-model="node.nodeType" disabled size="small" style="width: 90px">
                    <el-option label="装" value="装" />
                  </el-select>
                  <el-input v-model="node.name" placeholder="请选择装货地址" size="small" />
                  <el-date-picker
                    v-model="node.expectTime"
                    type="datetime"
                    size="small"
                    placeholder="预计时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 200px"
                  />
                  <el-input v-model="node.contactName" placeholder="联系人" size="small" style="width: 130px" />
                  <el-input v-model="node.contactPhone" placeholder="联系电话" size="small" style="width: 130px" />
                </div>
                <table class="node-goods-table">
                  <thead>
                    <tr>
                      <th class="required-col">货品</th>
                      <th>发货重量（吨）</th>
                      <th>发货体积（m³）</th>
                      <th>发货数量</th>
                      <th>货品单价（元）</th>
                      <th>货品总价（元）</th>
                      <th>货品包装</th>
                      <th>货品备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(goods, goodsIndex) in node.goodsItems" :key="goods.id">
                      <td>
                        <el-select v-model="goods.cargoName" size="small" style="width: 100%">
                          <el-option v-for="opt in goodsOptions" :key="opt" :label="opt" :value="opt" />
                        </el-select>
                      </td>
                      <td><el-input-number v-model="goods.weight" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.volume" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.quantity" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.unitPrice" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input :model-value="calcGoodsTotal(goods)" readonly size="small" /></td>
                      <td>
                        <el-select v-model="goods.package" size="small" placeholder="请选择" style="width: 100%">
                          <el-option v-for="opt in packageOptions" :key="opt" :label="opt" :value="opt" />
                        </el-select>
                      </td>
                      <td><el-input v-model="goods.remark" placeholder="请输入" size="small" /></td>
                      <td>
                        <el-button
                          v-if="node.goodsItems.length > 1"
                          type="primary"
                          link
                          size="small"
                          @click="removeGoodsItem(node, goodsIndex)"
                        >删除</el-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <el-button type="primary" link size="small" class="add-goods-btn" @click="addGoodsItem(node)">⊕ 添加货品</el-button>
              </div>
            </div>

            <!-- 卸货节点 -->
            <div v-for="(node, index) in unloadNodes" :key="node.id" class="transport-node">
              <span class="timeline-dot" />
              <button
                type="button"
                class="node-remove"
                :disabled="unloadNodes.length === 1"
                @click="removeUnloadNode(index)"
              >⌫</button>
              <div class="node-panel">
                <div class="node-toolbar">
                  <el-select v-model="node.nodeType" disabled size="small" style="width: 90px">
                    <el-option label="卸" value="卸" />
                  </el-select>
                  <el-input v-model="node.name" placeholder="请选择卸货地址" size="small" />
                  <el-date-picker
                    v-model="node.expectTime"
                    type="datetime"
                    size="small"
                    placeholder="预计时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 200px"
                  />
                  <el-input v-model="node.contactName" placeholder="联系人" size="small" style="width: 130px" />
                  <el-input v-model="node.contactPhone" placeholder="联系电话" size="small" style="width: 130px" />
                  <el-select v-model="node.sourceBatchId" size="small" placeholder="来源批次" style="width: 160px">
                    <el-option
                      v-for="(loadNode, lidx) in loadNodes"
                      :key="loadNode.id"
                      :label="loadNode.name || `装货节点 ${lidx + 1}`"
                      :value="loadNode.id"
                    />
                  </el-select>
                </div>
                <table class="node-goods-table">
                  <thead>
                    <tr>
                      <th class="required-col">货品</th>
                      <th>卸货重量（吨）</th>
                      <th>卸货体积（m³）</th>
                      <th>卸货数量</th>
                      <th>货品单价（元）</th>
                      <th>货品总价（元）</th>
                      <th>货品包装</th>
                      <th>货品备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(goods, goodsIndex) in node.goodsItems" :key="goods.id">
                      <td>
                        <el-select v-model="goods.cargoName" size="small" style="width: 100%">
                          <el-option v-for="opt in goodsOptions" :key="opt" :label="opt" :value="opt" />
                        </el-select>
                      </td>
                      <td><el-input-number v-model="goods.weight" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.volume" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.quantity" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input-number v-model="goods.unitPrice" :min="0" :controls="false" size="small" style="width: 100%" /></td>
                      <td><el-input :model-value="calcGoodsTotal(goods)" readonly size="small" /></td>
                      <td>
                        <el-select v-model="goods.package" size="small" placeholder="请选择" style="width: 100%">
                          <el-option v-for="opt in packageOptions" :key="opt" :label="opt" :value="opt" />
                        </el-select>
                      </td>
                      <td><el-input v-model="goods.remark" placeholder="请输入" size="small" /></td>
                      <td>
                        <el-button
                          v-if="node.goodsItems.length > 1"
                          type="primary"
                          link
                          size="small"
                          @click="removeGoodsItem(node, goodsIndex)"
                        >删除</el-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <el-button type="primary" link size="small" class="add-goods-btn" @click="addGoodsItem(node)">⊕ 添加货品</el-button>
              </div>
            </div>
            <el-button type="primary" link size="small" class="add-node-btn" @click="addLoadNode">⊕ 添加装货节点</el-button>
            <el-button type="primary" link size="small" class="add-node-btn" @click="addUnloadNode">⊕ 添加卸货节点</el-button>
          </div>

          <div class="transport-summary">
            <span class="summary-icon">▣</span>
            运输货品总计：
            <strong v-for="item in cargoSummary" :key="item.name">{{ item.name }} {{ item.weight }} 吨 </strong>
          </div>
        </section>

        <!-- 运费设置 -->
        <section class="form-section design-section">
          <h3 class="section-title">运费设置</h3>
          <div class="freight-grid">
            <div class="design-field">
              <label>竞价模式</label>
              <el-radio-group v-model="formData.quoteMode" size="small">
                <el-radio-button label="竞价" />
                <el-radio-button label="抢单" />
              </el-radio-group>
            </div>
            <div class="design-field">
              <label>报价时间</label>
              <el-date-picker
                v-model="formData.quoteValidRange"
                type="datetimerange"
                size="small"
                start-placeholder="报价开始时间"
                end-placeholder="报价截止时间"
                range-separator="至"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </div>
            <div class="design-field">
              <label>计费条件</label>
              <el-select v-model="formData.billingMode" size="small" style="width: 100%">
                <el-option v-for="m in billingModeOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </div>
            <div class="design-field">
              <label>期望运输单价</label>
              <el-input v-model.number="formData.expectedPrice" type="number" :min="0" size="small">
                <template #append>元/吨</template>
              </el-input>
            </div>
            <div class="design-field">
              <label>支付方式</label>
              <el-select v-model="formData.paymentMethod" size="small" style="width: 100%">
                <el-option v-for="m in paymentMethodOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </div>
          </div>
          <div class="estimate-strip">
            <span>￥</span> 预估总运费（总重量 {{ totalLoadWeight }} 吨 × {{ formData.expectedPrice || 0 }} 元/吨）
            <strong>{{ estimatedFreight }} 元</strong>
          </div>
        </section>

        <!-- 偏好设置 -->
        <section class="form-section design-section preference-section">
          <h3 class="section-title">偏好设置</h3>
          <div class="preference-layout">
            <div class="preference-main">
              <div class="preference-row">
                <span class="inline-label">运输方式</span>
                <el-checkbox-group v-model="formData.allowedTransportModes" @change="onTransportModeChange">
                  <el-checkbox v-for="m in transportModeOptions" :key="m" :label="m">{{ m.replace('运输', '') }}</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="preference-row">
                <span class="inline-label">可见范围</span>
                <el-radio-group v-model="formData.visibilityScope" size="small" class="choice-segment visibility-choice">
                  <el-radio-button v-for="s in visibilityScopeOptions" :key="s" :label="s">{{ s }}</el-radio-button>
                </el-radio-group>
              </div>
              <div class="preference-row">
                <span class="inline-label">单据凭证</span>
                <el-checkbox-group v-model="formData.vouchers">
                  <el-checkbox label="装货凭证" />
                  <el-checkbox label="卸货凭证" />
                </el-checkbox-group>
              </div>
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入..." />
            </div>
            <div v-if="formData.visibilityScope === '指定平台可见'" class="publish-channel-card">
              <h4>发布渠道选择</h4>
              <p>请选择您希望将托运单发布的平台渠道</p>
              <div class="channel-item checked">
                <span class="channel-check">✓</span>
                <span class="channel-logo">至</span>
                <div>
                  <strong>至简物流运输平台</strong>
                  <p>注册承运商8000+家，覆盖公路/水运/铁路资源</p>
                  <em>全面覆盖</em><em>服务保障</em><em>高响应</em>
                </div>
                <b>推荐</b>
              </div>
              <div class="channel-item">
                <span class="channel-check" />
                <span class="channel-logo blue">HY</span>
                <div>
                  <strong>超级运网路线运输平台</strong>
                  <p>注册承运商8000+家，覆盖公路/水运/铁路资源</p>
                  <em>全面覆盖</em><em>服务保障</em><em>高响应</em>
                </div>
              </div>
              <div class="channel-actions">
                <el-button>取消</el-button>
                <el-button type="primary">确认</el-button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="modal-footer">
          <el-button @click="closeCreateDialog">取消</el-button>
          <el-button @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" @click="handlePublish">提交发布</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 集装箱托运单创建抽屉 -->
    <el-drawer
      v-model="showContainerDialog"
      title="新增公开托运单 / 集装箱运输"
      direction="rtl"
      size="calc(100vw - 258px)"
      :append-to-body="false"
      :before-close="closeCreateDialog"
    >
      <div class="create-body">
        <div class="create-tabs">
          <button type="button" class="create-tab active">详情</button>
          <button type="button" class="create-tab">简易</button>
        </div>

        <!-- 集装箱来源 -->
        <section class="form-section design-section">
          <h3 class="section-title">运输信息</h3>
          <div class="field-line">
            <span class="inline-label">集装箱来源</span>
            <el-radio-group v-model="containerForm.containerSource" size="small">
              <el-radio-button label="货主提供" />
              <el-radio-button label="承运商提供" />
            </el-radio-group>
          </div>
        </section>

        <!-- 箱信息 -->
        <section class="form-section design-section">
          <div class="section-header">
            <h3 class="section-title">箱信息</h3>
            <el-button type="primary" link @click="addContainerBox">+ 新增箱种</el-button>
          </div>
          <el-empty v-if="containerBoxes.length === 0" description="暂无箱信息，请添加" />
          <el-table v-else :data="containerBoxes" border style="width: 100%">
            <el-table-column label="箱种" width="140">
              <template #default="{ row }">
                <el-select v-model="row.boxType" size="small" style="width: 100%">
                  <el-option label="普通集装箱" value="普通集装箱" />
                  <el-option label="冷藏集装箱" value="冷藏集装箱" />
                  <el-option label="开顶集装箱" value="开顶集装箱" />
                  <el-option label="框架集装箱" value="框架集装箱" />
                  <el-option label="罐式集装箱" value="罐式集装箱" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="尺寸" width="100">
              <template #default="{ row }">
                <el-select v-model="row.size" size="small" style="width: 100%">
                  <el-option label="20尺" value="20尺" />
                  <el-option label="40尺" value="40尺" />
                  <el-option label="45尺" value="45尺" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.qty" :min="1" :controls="false" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="货品名称" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.cargoName" placeholder="货品名称" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="重量（吨）" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.weight" :min="0" :step="0.01" :controls="false" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="期望单价（元/箱）" width="140">
              <template #default="{ row }">
                <el-input-number v-model="row.expectedUnitPrice" :min="0" :controls="false" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="包装" min-width="100">
              <template #default="{ row }">
                <el-input v-model="row.package" placeholder="包装" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button v-if="containerBoxes.length > 1" type="danger" link size="small" @click="removeContainerBox($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <!-- 节点列表 -->
        <section class="form-section design-section">
          <div class="section-header">
            <h3 class="section-title">节点列表</h3>
            <el-button type="primary" link @click="addContainerNode">+ 新增节点</el-button>
          </div>
          <el-empty v-if="containerNodes.length === 0" description="暂无节点，请添加" />
          <div v-else class="transport-timeline container-timeline">
            <div v-for="(node, index) in containerNodes" :key="node.id" class="transport-node">
              <span class="timeline-dot" />
              <button
                type="button"
                class="node-remove"
                :disabled="containerNodes.length === 1"
                @click="removeContainerNode(index)"
              >⌫</button>
              <div class="node-panel">
                <div class="node-toolbar">
                  <el-select v-model="node.nodeType" size="small" style="width: 90px">
                    <el-option label="提空" value="提空" />
                    <el-option label="提重" value="提重" />
                    <el-option label="装货" value="装货" />
                    <el-option label="卸货" value="卸货" />
                    <el-option label="还重" value="还重" />
                    <el-option label="还空" value="还空" />
                  </el-select>
                  <el-input v-model="node.name" placeholder="请输入节点地点" size="small" />
                  <el-date-picker
                    v-model="node.expectTime"
                    type="datetime"
                    size="small"
                    placeholder="预计时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 200px"
                  />
                  <el-input v-model="node.contactName" placeholder="联系人" size="small" style="width: 130px" />
                  <el-input v-model="node.contactPhone" placeholder="联系电话" size="small" style="width: 130px" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 需求说明 -->
        <section class="form-section design-section">
          <h3 class="section-title">需求说明</h3>
          <el-input v-model="containerForm.description" placeholder="例：需冷链箱，提供预冷服务" />
        </section>

        <!-- 发布设置 -->
        <section class="form-section design-section preference-section">
          <h3 class="section-title">偏好设置</h3>
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label required">报价模式</label>
              <el-radio-group v-model="containerForm.quoteMode" size="small">
                <el-radio label="竞价">竞价</el-radio>
                <el-radio label="抢单">抢单</el-radio>
              </el-radio-group>
            </div>
            <div class="form-field">
              <label class="field-label required">可报价运输方式</label>
              <el-checkbox-group v-model="containerForm.allowedTransportModes">
                <el-checkbox v-for="m in transportModeOptions" :key="m" :label="m">{{ m }}</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="form-field">
              <label class="field-label required">主方式</label>
              <el-select v-model="containerForm.mainTransportMode" size="small" style="width: 100%">
                <el-option v-for="m in containerForm.allowedTransportModes" :key="m" :label="m" :value="m" />
              </el-select>
            </div>
            <div class="form-field">
              <label class="field-label">报价开启时间</label>
              <el-date-picker
                v-model="containerForm.windowStart"
                type="datetime"
                size="small"
                placeholder="请选择报价开启时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </div>
            <div class="form-field">
              <label class="field-label">报价截止时间</label>
              <el-date-picker
                v-model="containerForm.deadline"
                type="datetime"
                size="small"
                placeholder="请选择报价截止时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </div>
            <div class="form-field">
              <label class="field-label required">税务要求</label>
              <el-select v-model="containerForm.taxRequirement" size="small" style="width: 100%">
                <el-option v-for="r in taxRequirementOptions" :key="r" :label="r" :value="r" />
              </el-select>
            </div>
          </div>
        </section>

        <!-- 备注 -->
        <section class="form-section design-section">
          <h3 class="section-title">备注</h3>
          <el-input v-model="containerForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息（选填）" />
        </section>
      </div>

      <template #footer>
        <div class="modal-footer">
          <el-button @click="closeCreateDialog">取消</el-button>
          <el-button @click="handleSaveContainerDraft">保存草稿</el-button>
          <el-button type="primary" @click="handlePublishContainer">提交发布</el-button>
        </div>
      </template>
    </el-drawer>
    </div> <!-- tp-body 结束 -->
  </div> <!-- waybill-manage-page 结束 -->

  <!-- 散杂货托运单创建抽屉（带黑色半透明蒙层） -->
  <BulkWaybillCreate
    v-if="currentSubView === 'bulk-create'"
    @back="currentSubView = 'list'"
    @submit-success="handleCreatedWaybill"
  />
</div> <!-- plan-scroll 结束 -->
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BulkWaybillCreate from './BulkWaybillCreate.vue'
import {
  ElButton, ElTable, ElTableColumn, ElDialog, ElDrawer, ElInput, ElInputNumber,
  ElSelect, ElOption, ElDatePicker, ElRadio, ElRadioGroup, ElRadioButton,
  ElCheckbox, ElCheckboxGroup, ElTag, ElEmpty,
} from 'element-plus'
import {
  businessTypeOptions, transportModeOptions, taxRequirementOptions,
  paymentMethodOptions, billingModeOptions, goodsOptions, packageOptions,
  visibilityScopeOptions, sampleWaybillList, waybillStatusTabs,
} from './mock-data'
import { prototypeStore, addWaybill, setCurrentPage } from '../../src/shared/prototype-store'

const currentDate = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y} 年 ${m} 月 ${d} 日`
})

function handleGoHome() {
  setCurrentPage('home')
  window.dispatchEvent(new CustomEvent('prototype-go-home'))
}

function formatIndex(index) {
  const size = pageSize.value || 10
  const current = currentPageNum.value || 1
  const num = (current - 1) * size + index + 1
  return String(num).padStart(2, '0')
}

function getRouteDetails(item) {
  let loadCity = item.loadCity || item.loadLocation || ''
  let unloadCity = item.unloadCity || item.unloadLocation || ''
  if (!loadCity && item.route) {
    const parts = item.route.split(' -> ')
    loadCity = parts[0] || ''
    unloadCity = parts[1] || ''
  }
  return {
    loadCity: loadCity || '福建省-福州市',
    loadPoint: item.loadPoint || item.loadDetail || '装货点',
    loadTime: item.loadTime || '2026-09-23 00:00:00',
    unloadCity: unloadCity || '湖北省-武汉市',
    unloadPoint: item.unloadPoint || item.unloadDetail || '卸货点',
    unloadTime: item.unloadTime || '2026-10-01 00:00:00',
    nodeCount: item.nodeCount || 2,
  }
}

const annotationBaseUrl = `${import.meta.env.BASE_URL}annotation/`
const annotationSpecUrl = new URL('./spec.yaml', import.meta.url).href

function loadAnnotationScript() {
  return new Promise((resolve, reject) => {
    if (window.AnnotationCore) {
      resolve()
      return
    }

    const scriptUrl = `${annotationBaseUrl}annotation-core.js`
    const existing = document.querySelector(`script[src="${scriptUrl}"]`)
    if (existing) {
      existing.remove()
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function bootAnnotation() {
  await nextTick()
  await loadAnnotationScript()
  await window.AnnotationCore.init({
    pageId: '托运单管理',
    specUrl: annotationSpecUrl,
    jsYamlSrc: `${annotationBaseUrl}vendor/js-yaml.min.js`,
    unitGates: {
      business_type_entry: () => !showTypeSelectDialog.value && !showBulkCargoDialog.value && !showContainerDialog.value,
      management_list_status: () => !showTypeSelectDialog.value && !showBulkCargoDialog.value && !showContainerDialog.value,
      bulk_cargo_nodes: () => showBulkCargoDialog.value,
      bulk_cargo_flow: () => showBulkCargoDialog.value,
      container_boxes_and_nodes: () => showContainerDialog.value,
      quote_and_publish_settings: () => showBulkCargoDialog.value || showContainerDialog.value,
      draft_publish_and_writeback: () => showBulkCargoDialog.value || showContainerDialog.value,
    },
    readOnly: (() => {
      const params = new URLSearchParams(window.location.search)
      return params.get('readOnly') === '1' || params.get('readonly') === '1'
    })(),
  })
}

function refreshAnnotation() {
  nextTick(() => {
    requestAnimationFrame(() => window.AnnotationCore?.refresh?.())
  })
}

// ============ 列表与筛选数据 ============
const waybillList = ref([])
const activeStatus = ref('全部')
const filters = reactive({
  keyword: '',
  shipperCompany: '',
  businessType: '',
  transportMode: '',
})
const currentPageNum = ref(1)
const pageSize = ref(10)
const jumpPageNum = ref(1)
const checkedRows = reactive({})
const checkAll = ref(false)

function loadWaybillList() {
  // 优先读 store（创建页写入的），无则用 mock
  if (prototypeStore.waybills.length > 0) {
    waybillList.value = prototypeStore.waybills.map(formatWaybillRow)
  } else {
    waybillList.value = sampleWaybillList.map(item => ({ ...item }))
  }
}

function formatWaybillRow(w) {
  return {
    id: w.id,
    businessType: w.businessType || '散杂货',
    transportMode: w.mainTransportMode || w.transportMode || '多式联运',
    shipperCompany: w.shipperCompany,
    contactName: w.contactName,
    contactPhone: w.contactPhone || '',
    status: w.status,
    publishTime: w.publishTime
      ? new Date(w.publishTime).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      : '',
    route: getRouteText(w),
    cargoName: w.cargoName || (w.businessType === '集装箱' ? '集装箱货物' : '散杂货'),
  }
}

function getRouteText(waybill) {
  if (waybill.route) return waybill.route
  if (!waybill.loadNodes || waybill.loadNodes.length === 0) {
    if (!waybill.containerNodes || waybill.containerNodes.length === 0) return '待确认路线'
    const first = waybill.containerNodes[0].name || '起点'
    const last = waybill.containerNodes[waybill.containerNodes.length - 1].name || '终点'
    return `${first.replace(/提空|提重|装货|卸货|还重|还空/g, '')} -> ${last.replace(/提空|提重|装货|卸货|还重|还空/g, '')}`
  }
  const firstLoad = waybill.loadNodes[0].name || '起点'
  const lastUnload = waybill.unloadNodes && waybill.unloadNodes.length > 0
    ? waybill.unloadNodes[waybill.unloadNodes.length - 1].name
    : '终点'
  return `${firstLoad.replace(/装货点|卸货点/g, '')} -> ${lastUnload.replace(/装货点|卸货点/g, '')}`
}

function handleStatusTabChange(statusVal) {
  activeStatus.value = statusVal
  currentPageNum.value = 1
}

function handleQuery() {
  currentPageNum.value = 1
  ElMessage.info('已更新列表筛选')
}

function handleResetFilters() {
  filters.keyword = ''
  filters.shipperCompany = ''
  filters.businessType = ''
  filters.transportMode = ''
  activeStatus.value = '全部'
  currentPageNum.value = 1
  ElMessage.success('筛选已重置')
}

function handleCheckAll(val) {
  pagedWaybills.value.forEach(item => {
    checkedRows[item.id] = val
  })
}

function handleRowCheck(item, val) {
  checkedRows[item.id] = val
  checkAll.value = pagedWaybills.value.length > 0 && pagedWaybills.value.every(p => !!checkedRows[p.id])
}

const filteredWaybills = computed(() => {
  return waybillList.value.filter(item => {
    // 状态过滤
    if (activeStatus.value === '已取消/终止') {
      if (item.status !== '已取消' && item.status !== '已终止') return false
    } else if (activeStatus.value !== '全部' && item.status !== activeStatus.value) {
      return false
    }
    // 关键词过滤（单号、路线、货品）
    if (filters.keyword.trim()) {
      const kw = filters.keyword.trim().toLowerCase()
      const matchId = (item.id || '').toLowerCase().includes(kw)
      const matchRoute = (item.route || '').toLowerCase().includes(kw)
      const matchCargo = (item.cargoName || '').toLowerCase().includes(kw)
      if (!matchId && !matchRoute && !matchCargo) return false
    }
    // 托运企业过滤
    if (filters.shipperCompany.trim()) {
      const sc = filters.shipperCompany.trim().toLowerCase()
      if (!(item.shipperCompany || '').toLowerCase().includes(sc)) return false
    }
    // 业务类型过滤
    if (filters.businessType && item.businessType !== filters.businessType) {
      return false
    }
    // 运输方式过滤
    if (filters.transportMode && item.transportMode !== filters.transportMode) {
      return false
    }
    return true
  })
})

const totalPageCount = computed(() => Math.max(1, Math.ceil(filteredWaybills.value.length / pageSize.value)))
const totalPageNumbers = computed(() => {
  const count = totalPageCount.value
  const arr = []
  for (let i = 1; i <= count; i++) arr.push(i)
  return arr
})

const pagedWaybills = computed(() => {
  const start = (currentPageNum.value - 1) * pageSize.value
  return filteredWaybills.value.slice(start, start + pageSize.value)
})

function doJumpPage() {
  const target = Number(jumpPageNum.value)
  if (target >= 1 && target <= totalPageCount.value) {
    currentPageNum.value = target
  }
}

function getStatusTagClass(status) {
  const map = {
    竞价中: 'blue',
    已确认: 'green',
    已完成: 'green',
    待确定: 'purple',
    待审核: 'purple',
    待执行: 'steel',
    执行中: 'steel',
    草稿: 'gray',
    已取消: 'gray',
    已终止: 'gray',
  }
  return map[status] || 'gray'
}

function handleCancelWaybill(item) {
  ElMessageBox.confirm(`确定要取消托运单【${item.id}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    item.status = '已取消'
    ElMessage.success(`托运单【${item.id}】已取消`)
  }).catch(() => {})
}

function refreshList() {
  loadWaybillList()
  ElMessage.success('列表已刷新')
}

function viewDetail(item) {
  ElMessage.info(`查看托运单详情：${item.id}`)
}

// ============ 业务类型选择 ============
const currentSubView = ref('list')
const showTypeSelectDialog = ref(false)
const showBulkCargoDialog = ref(false)
const showContainerDialog = ref(false)

function openTypeSelectDialog() {
  showTypeSelectDialog.value = true
  refreshAnnotation()
}

function selectBusinessType(type) {
  showTypeSelectDialog.value = false
  if (type === '散杂货') {
    currentSubView.value = 'bulk-create'
  } else if (type === '集装箱') {
    showContainerDialog.value = true
    initEmptyContainerData()
  }
  refreshAnnotation()
}

function handleCreatedWaybill(newWaybill) {
  waybillList.value.unshift(newWaybill)
  currentSubView.value = 'list'
  refreshAnnotation()
}

// ============ 散杂货表单 ============
function getEmptyForm() {
  return {
    shipperCompany: '福州江远跨境运输有限公司',
    contactName: '橙联',
    contactPhone: '13966668888',
    consignor: '',
    consignee: '',
    allowMix: '允许',
    quoteMode: '竞价',
    billingMode: '按重量',
    quoteValidRange: [],
    allowedTransportModes: ['公路运输'],
    mainTransportMode: '公路运输',
    expectedPrice: 20,
    taxRequirement: '增值税专用发票，税率13%',
    paymentMethod: '月结',
    visibilityScope: '全平台可见',
    vouchers: ['装货凭证'],
    remark: '',
  }
}

const formData = reactive(getEmptyForm())
const loadNodes = ref([])
const unloadNodes = ref([])

function initEmptyNodes() {
  const loadNode = createTransportNode('load', 1)
  const unloadNode = createTransportNode('unload', 1, loadNode.id)
  loadNodes.value = [loadNode]
  unloadNodes.value = [unloadNode]
}

function createTransportNode(type, index, sourceBatchId = '') {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nodeType: type === 'load' ? '装' : '卸',
    name: `马尾港${index > 1 ? index : ''}`,
    address: '',
    sourceBatchId,
    contactName: '',
    contactPhone: '',
    expectTime: '',
    goodsItems: [createGoodsItem(0), createGoodsItem(1)],
  }
}

function createGoodsItem(index = 0) {
  const presets = [
    { cargoName: '玉米', volume: 100, weight: 50, quantity: 1000, unitPrice: 1000, package: '散装', remark: '备注备注信息备注信息' },
    { cargoName: '小麦', volume: 100, weight: 50, quantity: 1000, unitPrice: 1000, package: '散装', remark: '' },
  ]
  const preset = presets[index] || { cargoName: '玉米', volume: 0, weight: 0, quantity: 0, unitPrice: 0, package: '', remark: '' }
  return { id: `goods-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...preset }
}

function addLoadNode() {
  loadNodes.value.push(createTransportNode('load', loadNodes.value.length + 1))
}
function removeLoadNode(index) {
  if (loadNodes.value.length > 1) loadNodes.value.splice(index, 1)
}
function addUnloadNode() {
  const sourceBatchId = loadNodes.value[0] ? loadNodes.value[0].id : ''
  unloadNodes.value.push(createTransportNode('unload', unloadNodes.value.length + 1, sourceBatchId))
}
function removeUnloadNode(index) {
  if (unloadNodes.value.length > 1) unloadNodes.value.splice(index, 1)
}
function addGoodsItem(node) {
  node.goodsItems.push(createGoodsItem(node.goodsItems.length))
}
function removeGoodsItem(node, index) {
  if (node.goodsItems.length > 1) node.goodsItems.splice(index, 1)
}
function calcGoodsTotal(goods) {
  const total = (Number(goods.weight) || 0) * (Number(goods.unitPrice) || 0)
  return total.toFixed(2)
}

const cargoSummary = computed(() => {
  const summary = {}
  loadNodes.value.forEach(node => {
    ;(node.goodsItems || []).forEach(g => {
      if (!g.cargoName) return
      if (!summary[g.cargoName]) summary[g.cargoName] = { name: g.cargoName, weight: 0 }
      summary[g.cargoName].weight += Number(g.weight) || 0
    })
  })
  return Object.values(summary)
})

const totalLoadWeight = computed(() =>
  cargoSummary.value.reduce((t, i) => t + i.weight, 0)
)

const estimatedFreight = computed(() => {
  const amount = totalLoadWeight.value * (Number(formData.expectedPrice) || 0)
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

function onTransportModeChange(val) {
  formData.mainTransportMode = val[0] || '公路运输'
}

// ============ 集装箱表单 ============
function getEmptyContainerForm() {
  return {
    shipperCompany: '福州江远跨境运输有限公司',
    contactName: '橙联',
    contactPhone: '13966668888',
    consignor: '',
    consignee: '',
    containerSource: '承运商提供',
    description: '',
    quoteMode: '竞价',
    allowedTransportModes: ['多式联运'],
    mainTransportMode: '多式联运',
    windowStart: '',
    deadline: '',
    taxRequirement: '增值税专用发票，税率13%',
    remark: '',
  }
}

const containerForm = reactive(getEmptyContainerForm())
const containerNodes = ref([])
const containerBoxes = ref([])

function initEmptyContainerData() {
  containerBoxes.value = [{
    id: `box-${Date.now()}`, boxType: '普通集装箱', size: '20尺', qty: 1,
    cargoName: '', weight: 0, expectedUnitPrice: 0, package: '',
  }]
  containerNodes.value = [{
    id: `node-${Date.now()}`, nodeType: '装货', name: '', address: '',
    contactName: '', contactPhone: '', expectTime: '',
  }]
}

function addContainerBox() {
  containerBoxes.value.push({
    id: `box-${Date.now()}`, boxType: '普通集装箱', size: '20尺', qty: 1,
    cargoName: '', weight: 0, expectedUnitPrice: 0, package: '',
  })
}
function removeContainerBox(index) {
  if (containerBoxes.value.length > 1) containerBoxes.value.splice(index, 1)
}
function addContainerNode() {
  containerNodes.value.push({
    id: `node-${Date.now()}`, nodeType: '装货', name: '', address: '',
    contactName: '', contactPhone: '', expectTime: '',
  })
}
function removeContainerNode(index) {
  if (containerNodes.value.length > 1) containerNodes.value.splice(index, 1)
}

function closeCreateDialog(done) {
  showBulkCargoDialog.value = false
  showContainerDialog.value = false
  Object.assign(formData, getEmptyForm())
  Object.assign(containerForm, getEmptyContainerForm())
  loadNodes.value = []
  unloadNodes.value = []
  containerNodes.value = []
  containerBoxes.value = []
  if (typeof done === 'function') done()
  refreshAnnotation()
}

// ============ 校验 ============
function validateBulkDraftForm() {
  if (!formData.shipperCompany) return '请输入托运企业'
  return null
}
function validateBulkPublishForm() {
  if (!formData.shipperCompany) return '请输入托运企业'
  if (loadNodes.value.length === 0) return '请至少添加一个装货节点'
  if (unloadNodes.value.length === 0) return '请至少添加一个卸货节点'
  for (let i = 0; i < loadNodes.value.length; i++) {
    const node = loadNodes.value[i]
    if (!node.name) return `请输入第 ${i + 1} 个装货节点的名称`
    if (!node.goodsItems || node.goodsItems.length === 0) return `请维护第 ${i + 1} 个装货节点的货品`
    for (let j = 0; j < node.goodsItems.length; j++) {
      const g = node.goodsItems[j]
      if (!g.cargoName) return `请选择第 ${i + 1} 个装货节点第 ${j + 1} 行货品`
      if (!Number(g.weight) && !Number(g.volume) && !Number(g.quantity)) return `请维护第 ${i + 1} 个装货节点第 ${j + 1} 行货量`
    }
  }
  for (let i = 0; i < unloadNodes.value.length; i++) {
    const node = unloadNodes.value[i]
    if (!node.name) return `请输入第 ${i + 1} 个卸货节点的名称`
    if (!node.sourceBatchId) return `请选择第 ${i + 1} 个卸货节点的来源批次`
  }
  if (formData.allowedTransportModes.length === 0) return '请选择可报价运输方式'
  return null
}
function validateContainerDraftForm() {
  if (!containerForm.shipperCompany) return '请输入托运企业'
  return null
}
function validateContainerPublishForm() {
  const allowedNodeTypes = ['提空', '提重', '装货', '卸货', '还重', '还空']
  if (!containerForm.shipperCompany) return '请输入托运企业'
  if (!containerForm.containerSource) return '请选择集装箱来源'
  if (containerBoxes.value.length === 0) return '请至少添加一个箱种'
  for (let i = 0; i < containerBoxes.value.length; i++) {
    const box = containerBoxes.value[i]
    if (!box.boxType) return `请选择第 ${i + 1} 行箱种`
    if (!box.size) return `请选择第 ${i + 1} 行箱尺寸`
    if (!Number(box.qty) || Number(box.qty) <= 0) return `请输入第 ${i + 1} 行箱数量`
    if (!box.cargoName) return `请输入第 ${i + 1} 行货品名称`
  }
  if (containerNodes.value.length === 0) return '请至少添加一个节点'
  for (let i = 0; i < containerNodes.value.length; i++) {
    const node = containerNodes.value[i]
    if (!allowedNodeTypes.includes(node.nodeType)) return `请选择第 ${i + 1} 个节点的合法节点类型`
    if (!node.name) return `请输入第 ${i + 1} 个节点地点`
  }
  if (containerForm.allowedTransportModes.length === 0) return '请选择可报价运输方式'
  return null
}

// ============ 提交 ============
function handleSaveDraft() {
  const err = validateBulkDraftForm()
  if (err) return ElMessage.warning(err)
  saveBulkWaybill('草稿')
}
function handlePublish() {
  const err = validateBulkPublishForm()
  if (err) return ElMessage.warning(err)
  saveBulkWaybill('竞价中')
}
function saveBulkWaybill(status) {
  const resolveUnloadNode = (loadNode, goods) => {
    const sameBatch = unloadNodes.value.filter(n => n.sourceBatchId === loadNode.id)
    const exact = sameBatch.find(n => (n.goodsItems || []).some(i => i.cargoName === goods.cargoName))
    return exact || sameBatch[0] || unloadNodes.value[unloadNodes.value.length - 1] || null
  }
  const newWaybill = {
    id: `TY${Date.now().toString().slice(-8)}`,
    businessType: '散杂货',
    publishMode: '公开托运单/竞价',
    status,
    publishTime: new Date().toISOString(),
    shipperCompany: formData.shipperCompany,
    contactName: formData.contactName,
    contactPhone: formData.contactPhone,
    consignor: formData.consignor,
    consignee: formData.consignee,
    billingMode: formData.billingMode,
    allowedTransportModes: [...formData.allowedTransportModes],
    mainTransportMode: formData.mainTransportMode,
    expectedPrice: Number(formData.expectedPrice) || 0,
    taxRequirement: formData.taxRequirement,
    paymentMethod: formData.paymentMethod,
    visibilityScope: formData.visibilityScope,
    remark: formData.remark,
    loadNodes: loadNodes.value.map(n => ({ ...n })),
    unloadNodes: unloadNodes.value.map(n => ({ ...n })),
    cargoItems: loadNodes.value.flatMap(n => (n.goodsItems || []).map(g => {
      const unload = resolveUnloadNode(n, g)
      return {
        ...g, totalPrice: Number(calcGoodsTotal(g)),
        loadNodeId: n.id, loadNodeName: n.name,
        unloadNodeId: unload ? unload.id : '', unloadNodeName: unload ? unload.name : '',
      }
    })),
  }
  addWaybill(newWaybill)
  ElMessage.success(status === '草稿' ? '草稿保存成功' : '托运单发布成功')
  closeCreateDialog()
  loadWaybillList()
}

function handleSaveContainerDraft() {
  const err = validateContainerDraftForm()
  if (err) return ElMessage.warning(err)
  saveContainerWaybill('草稿')
}
function handlePublishContainer() {
  const err = validateContainerPublishForm()
  if (err) return ElMessage.warning(err)
  saveContainerWaybill('竞价中')
}
function saveContainerWaybill(status) {
  const newWaybill = {
    id: `TY${Date.now().toString().slice(-8)}`,
    businessType: '集装箱',
    publishMode: '公开托运单/竞价',
    status,
    publishTime: new Date().toISOString(),
    shipperCompany: containerForm.shipperCompany,
    contactName: containerForm.contactName,
    contactPhone: containerForm.contactPhone,
    containerSource: containerForm.containerSource,
    description: containerForm.description,
    quoteMode: containerForm.quoteMode,
    allowedTransportModes: [...containerForm.allowedTransportModes],
    mainTransportMode: containerForm.mainTransportMode,
    windowStart: containerForm.windowStart,
    deadline: containerForm.deadline,
    taxRequirement: containerForm.taxRequirement,
    remark: containerForm.remark,
    containerBoxes: containerBoxes.value.map(b => ({ ...b })),
    containerNodes: containerNodes.value.map(n => ({ ...n })),
  }
  addWaybill(newWaybill)
  ElMessage.success(status === '草稿' ? '草稿保存成功' : '托运单发布成功')
  closeCreateDialog()
  loadWaybillList()
}

onMounted(() => {
  loadWaybillList()
  bootAnnotation().catch((error) => {
    console.warn('[prototype-annotation] 托运单管理标注加载失败:', error)
  })
})

onUnmounted(() => {
  window.AnnotationCore?.disable?.()
  window.AnnotationCore?.close?.()
})
</script>

<style scoped>
/* ============ 弹窗约束回画布内（不盖外层工具栏，避让左侧目录）============ */
/* 变量来自外层 App.vue 的 .prototype-workbench 三态：
   --canvas-toolbar-height (48px)  外层原型工具栏高度
   --canvas-offset-left (232/48/0) 左侧目录占宽，目录切换时联动
   弹窗 append-to-body=false 后挂在组件 DOM 内，:deep() 才能选中 */
:deep(.el-overlay) {
  /* overlay 圈定 drawer 可用区：顶部避让工具栏，左侧避让目录并留 16px 空隙，
     右侧留 16px 空隙，高度=视口-工具栏；同时设 left/right 让宽度自动算 */
  top: var(--canvas-toolbar-height, 48px);
  left: calc(var(--canvas-offset-left, 232px) + 16px);
  right: 16px;
  bottom: auto;
  height: calc(100vh - var(--canvas-toolbar-height, 48px));
  overflow: hidden;
}
:deep(.el-overlay-dialog) {
  /* dialog 居中基准下沉到工具栏下方 */
  top: var(--canvas-toolbar-height, 48px);
}
:deep(.el-drawer) {
  /* drawer 在 overlay 内部撑满，不再独立定位（overlay 已做避让+间距）*/
  top: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 100% !important;
  width: 100% !important;
  /* drawer 纵向 flex：header 固定 + body 自适应滚动 + footer 钉底 */
  display: flex;
  flex-direction: column;
}
:deep(.el-drawer__body) {
  /* 内容区自适应 drawer 剩余高度，独立滚动，footer 不再被挤出可视区 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.plan-scroll {
  overflow-x: auto;
  background: #f5f6f8;
}

.waybill-manage-page {
  position: relative;
  width: 1920px;
  min-height: 1456px;
  background: #ffffff;
  box-sizing: border-box;
}

/* ============ 顶部系统区 (y 0-72, 白底) ============ */
.tp-topbar {
  position: relative;
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
}
.tp-logo {
  position: absolute;
  left: 64px;
  top: 22px;
  width: 124px;
  height: 28px;
}
.tp-divider1 {
  position: absolute;
  left: 216px;
  top: 24px;
  width: 1px;
  height: 24px;
  background: #3d4050;
}
.tp-avatar {
  position: absolute;
  left: 244px;
  top: 21px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e1dede;
  border: 2px solid #c4cad1;
}
.tp-site {
  position: absolute;
  left: 284px;
  top: 17px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tp-site-name {
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
}
.tp-site-org {
  font-size: 12px;
  color: #91929e;
  line-height: 18px;
}
.tp-nav {
  position: absolute;
  left: 854px;
  top: 20px;
  width: 318px;
  height: 36px;
}
.tp-date {
  position: absolute;
  left: 1474px;
  top: 27px;
  font-size: 16px;
  color: #3d4050;
  line-height: 21px;
  white-space: nowrap;
}
.tp-weather {
  position: absolute;
  left: 1635px;
  top: 27px;
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
  white-space: nowrap;
}
.tp-user {
  position: absolute;
  left: 1715px;
  top: 22px;
  width: 37px;
  height: 31px;
}
.tp-divider2 {
  position: absolute;
  left: 1771px;
  top: 28px;
  width: 1px;
  height: 21px;
  background: #3d4050;
}
.tp-icon {
  position: absolute;
  top: 26px;
  width: 24px;
  height: 24px;
}
.tp-icon.i1 { left: 1792px; }
.tp-icon.i2 { left: 1828px; }
.tp-icon.i3 { left: 1864px; }

/* ============ 第二层工作台条 (y 72-108, 浅灰:黑色填充6%透明度) ============ */
.tp-workbar {
  position: relative;
  height: 36px;
  margin: 0 64px;
  background: rgba(0, 0, 0, 0.06);
}
.wb-ws-icon {
  position: absolute;
  left: 48px;
  top: 11px;
  width: 16px;
  height: 16px;
}
.wb-ws-text {
  position: absolute;
  left: 72px;
  top: 8px;
  font-size: 16px;
  color: #909499;
  line-height: 22px;
}
.wb-tab-active {
  position: absolute;
  left: 153px;
  top: 0;
  width: 202px;
  height: 36px;
}
.wb-tab-shape {
  position: absolute;
  inset: 0;
  background: url('/transport-plan-assets/tab-transport.png') no-repeat center / 100% 100%;
}
.wb-tab-text {
  position: absolute;
  left: 50px;
  top: 8px;
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
}
.wb-tab-close {
  position: absolute;
  left: 161px;
  top: 17px;
  width: 7px;
  height: 7px;
  cursor: pointer;
}

/* ============ 内容区 (y 108+, 白底) ============ */
.tp-body {
  margin: 0 64px;
  padding-top: 20px;
  background: #ffffff;
  box-sizing: border-box;
}

/* ============ 1. 查询区 ============ */
.query-row {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 32px;
  margin-bottom: 37px;
}
.query-field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  border: 1px solid #e0e2e6;
  background: #fff;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 2px;
}
.search-field { width: 280px; }
.shipper-field { width: 300px; }
.select-field { width: 256px; }
.q-label {
  font-size: 14px;
  color: #1b1b1b;
  white-space: nowrap;
}
.q-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1f2329;
  background: transparent;
  min-width: 0;
}
.q-input::placeholder { color: #cccccc; }
.q-select {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #3d4050;
  background: transparent;
}
.q-refresh {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e2e6;
  background: #fff;
  color: #4e5969;
  font-size: 16px;
  cursor: pointer;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.q-refresh:hover { border-color: #3a65ff; color: #3a65ff; }
.q-search-btn {
  width: 80px;
  height: 32px;
  border: none;
  background: #3a65ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
}
.q-search-btn:hover { background: #5982ff; }

/* ============ 2. 状态页签 ============ */
.status-tabs {
  display: flex;
  gap: 24px;
  height: 29px;
  align-items: center;
  margin-bottom: 20px;
}
.status-tabs button {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #333333;
  cursor: pointer;
  padding: 0 2px;
  line-height: 29px;
  position: relative;
}
.status-tabs button:hover { color: #3a65ff; }
.status-tabs button.active {
  color: #3a65ff;
  font-weight: 600;
}
.status-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #3a65ff;
}

/* ============ 3. 操作按钮行 ============ */
.action-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.btn-primary {
  min-width: 92px;
  height: 28px;
  padding: 0 12px;
  border: none;
  background: #3a65ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-primary:hover { background: #5982ff; }
.btn-plain {
  min-width: 92px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #d8dce3;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-plain:hover { border-color: #3a65ff; color: #3a65ff; }

/* ============ 4. 托运单表头与卡片列表 ============ */
.wb-list-header {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  color: #86909c;
  font-size: 13px;
  border-bottom: 1px solid #eef1f5;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.col-head {
  box-sizing: border-box;
}
.col-hd-waybill { width: 500px; flex-shrink: 0; }
.col-hd-transport { width: 140px; flex-shrink: 0; }
.col-hd-company { width: 140px; flex-shrink: 0; }
.col-hd-cargo { width: 220px; flex-shrink: 0; }
.col-hd-price { width: 200px; flex-shrink: 0; }
.col-hd-status { width: 160px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
.status-arrow { font-size: 10px; color: #86909c; }
.col-hd-requirement { flex: 1; min-width: 200px; }

.wb-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wb-card-item {
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 2px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.wb-card-item:hover {
  border-color: #d0e0ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.wb-card-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 16px;
  background: #fbfcfd;
  border-bottom: 1px solid #f2f4f8;
  font-size: 13px;
  box-sizing: border-box;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wb-index {
  color: #86909c;
  font-size: 13px;
  font-weight: 500;
  margin-right: 4px;
}
.wb-code {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  cursor: pointer;
}
.wb-code:hover {
  color: #3a65ff;
}
.wb-mode-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 11px;
  color: #ffffff;
  line-height: 1.2;
}
.wb-mode-tag.bidding {
  background: #3a65ff;
}
.wb-mode-tag.grab {
  background: #ff7d00;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.countdown-label {
  font-size: 12px;
  color: #86909c;
  margin-right: 4px;
}
.cd-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 18px;
  padding: 0 3px;
  background: #ffece8;
  color: #f53f3f;
  font-size: 12px;
  font-weight: 600;
  border-radius: 2px;
  line-height: 1;
}
.cd-unit {
  font-size: 12px;
  color: #86909c;
  margin: 0 3px;
}
.cd-colon {
  font-size: 12px;
  color: #f53f3f;
  font-weight: 700;
  margin: 0 2px;
}
.top-action-btn {
  border: none;
  background: transparent;
  color: #3a65ff;
  font-size: 13px;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 10px;
}
.top-action-btn:hover {
  text-decoration: underline;
}
.top-action-btn.danger {
  color: #3a65ff;
}

.wb-card-body {
  display: flex;
  align-items: center;
  min-height: 84px;
  padding: 12px 16px;
  box-sizing: border-box;
}

.col-route-wrap { width: 500px; flex-shrink: 0; }
.col-transport-wrap {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}
.tag-transport {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 6px;
  border-radius: 2px;
  font-size: 12px;
  white-space: nowrap;
}
.tag-transport.public {
  background: #e8f8ed;
  color: #21bd88;
}
.tag-transport.container {
  background: #f2ecff;
  color: #9482b8;
}
.tag-transport.bulk {
  background: #fcecde;
  color: #aa7b57;
}

.col-company-wrap {
  width: 140px;
  flex-shrink: 0;
  color: #4e5969;
  font-size: 14px;
}

.col-cargo-wrap {
  width: 220px;
  flex-shrink: 0;
}
.cargo-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1f2329;
}
.cargo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #f2f3f5;
  color: #86909c;
  font-size: 11px;
  border-radius: 2px;
}
.cargo-name {
  font-weight: 500;
  color: #1f2329;
}
.cargo-divider {
  color: #c9cdd4;
}
.cargo-qty {
  color: #4e5969;
}

.col-price-wrap {
  width: 200px;
  flex-shrink: 0;
}
.price-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.price-val {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
}
.price-billing-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  background: #f2f3f5;
  color: #86909c;
  font-size: 11px;
  border-radius: 2px;
}

.col-status-wrap {
  width: 160px;
  flex-shrink: 0;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid #3a65ff;
  color: #3a65ff;
  background: #ffffff;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
}

.col-requirement-wrap {
  flex: 1;
  color: #4e5969;
  font-size: 14px;
}

/* ============ 路线垂直时间轴（图二/三风格） ============ */
.route-timeline-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  width: 100%;
  box-sizing: border-box;
}

.rt-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 0 0 20px;
}

.rt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  z-index: 2;
}

.rt-badge.load {
  background: #e5e9f2;
  color: #5b6b82;
}

.rt-badge.unload {
  background: #2b6bf3;
  color: #ffffff;
}

.rt-line {
  position: relative;
  width: 1px;
  height: 26px;
  background: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px 0;
}

.rt-node-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #717d8f;
  background: #ffffff;
  color: #475569;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 3;
}

.rt-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.rt-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rt-item-top {
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}

.rt-city {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
}

.rt-time {
  font-size: 13px;
  color: #333842;
}

.rt-detail {
  font-size: 12px;
  color: #8f959e;
  line-height: 1.2;
}

.row-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.text-link {
  border: none;
  background: transparent;
  color: #3a65ff;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  line-height: 1;
}
.text-link:hover { color: #5982ff; }
.text-link.publish { color: #21bd88; }
.text-link.publish:hover { color: #2fcf9b; }
.text-link.danger { color: #f53f3f; }
.text-link.danger:hover { color: #d91a15; }

.empty-cell {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}

/* ============ 5. 分页栏 ============ */
.pagination-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding: 4px 18px;
  border-top: 1px solid #eef1f5;
  font-size: 14px;
  color: #323234;
  justify-content: flex-end;
  height: 32px;
  box-sizing: border-box;
}
.page-total { color: #91929e; font-size: 14px; }
.page-size { color: #91929e; font-size: 14px; }
.page-btn {
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #e0e2e6;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.page-btn:hover:not(:disabled) {
  border-color: #3a65ff;
  color: #3a65ff;
}
.page-btn.active {
  background: #3a65ff;
  border-color: #3a65ff;
  color: #fff;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #91929e;
  font-size: 14px;
}
.page-input {
  width: 32px;
  height: 24px;
  border: 1px solid #e0e2e6;
  border-radius: 2px;
  text-align: center;
  font-size: 14px;
  color: #1f2329;
  outline: none;
}
.page-input:focus {
  border-color: #3a65ff;
}


.dialog-tip {
  font-size: 14px;
  color: #5d697a;
  margin: 0 0 18px;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.type-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 20px;
  background: #f7f8fa;
  border: 1px solid #e1e6ef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-option-btn:hover {
  border-color: #2468f2;
}

.type-icon {
  font-size: 32px;
}

.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #222935;
}

.create-body {
  padding: 0 8px 40px;
}

.create-tabs {
  display: flex;
  gap: 28px;
  height: 38px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e7ebf0;
}

.create-tab {
  position: relative;
  border: none;
  background: transparent;
  color: #1f2937;
  font-size: 14px;
  cursor: pointer;
  height: 38px;
}

.create-tab.active {
  color: #165dff;
  font-weight: 600;
}

.create-tab.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: #165dff;
}

.form-section {
  margin-bottom: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  position: relative;
  padding-left: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #202733;
  margin: 0;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: #2468f2;
  transform: translateY(-50%);
}

.field-line,
.preference-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0;
}

.inline-label {
  width: 140px;
  color: #4e5969;
  font-size: 13px;
}

/* 创建托运单的二元/多元选择统一为紧凑的分段控件，强化选中层级。 */
:deep(.choice-segment) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid #dbe3f0;
  border-radius: 6px;
  background: #f5f7fb;
}

:deep(.choice-segment .el-radio-button__inner) {
  min-width: 76px;
  padding: 7px 14px;
  border: 1px solid transparent !important;
  border-radius: 4px !important;
  background: transparent !important;
  color: #5f6b7a !important;
  font-size: 13px;
  line-height: 18px;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

:deep(.visibility-choice .el-radio-button__inner) {
  min-width: 104px;
}

:deep(.choice-segment .el-radio-button__inner:hover) {
  background: #eaf1ff !important;
  color: #165dff !important;
}

:deep(.choice-segment .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #b9d0ff !important;
  background: #ffffff !important;
  color: #165dff !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 3px rgba(22, 93, 255, 0.14) !important;
}

:deep(.choice-segment .el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
  outline: 2px solid #8cb8ff;
  outline-offset: 1px;
}

.transport-timeline {
  position: relative;
  margin-top: 10px;
  padding-left: 20px;
}

.transport-timeline::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 14px;
  bottom: 32px;
  border-left: 2px dotted #c7d2e3;
}

.transport-node {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 13px;
  z-index: 1;
  width: 8px;
  height: 8px;
  border: 2px solid #8aa5d8;
  border-radius: 50%;
  background: #fff;
}

.node-remove {
  width: 28px;
  height: 28px;
  margin-top: 8px;
  border: 1px solid #e5e8ef;
  border-radius: 2px;
  background: #fff;
  color: #667085;
  cursor: pointer;
}

.node-remove:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.node-panel {
  min-width: 0;
  border: 1px solid #e6ebf2;
  background: #fff;
  padding-bottom: 8px;
}

.container-timeline .node-panel {
  border: none;
  background: transparent;
}

.node-toolbar {
  display: grid;
  grid-template-columns: 90px minmax(180px, 1fr) 200px 130px 130px;
  gap: 8px;
  align-items: center;
  padding: 10px 10px 8px;
  background: #fff;
}

/* 散杂货节点工具条带来源批次，6 列 */
.transport-node:not(.container-node) .node-toolbar:has(.el-select:nth-of-type(2)) {
  grid-template-columns: 90px minmax(180px, 1fr) 200px 130px 130px 160px;
}

/* 窄屏降级：两行布局，但不再 wrap 到 3 行 */
@media (max-width: 1400px) {
  .node-toolbar {
    grid-template-columns: 88px minmax(160px, 1fr) 180px 120px 120px;
    gap: 6px;
    padding: 8px;
  }
}

@media (max-width: 1200px) {
  .node-toolbar {
    grid-template-columns: 80px minmax(140px, 1fr) 160px;
  }
  .node-toolbar > :nth-child(4),
  .node-toolbar > :nth-child(5),
  .node-toolbar > :nth-child(6) {
    grid-column: span 1;
  }
}

.node-goods-table {
  width: calc(100% - 20px);
  margin: 0 10px 8px;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #e5e8ef;
}

.node-goods-table th,
.node-goods-table td {
  padding: 6px 8px;
  border-right: 1px solid #edf0f5;
  border-bottom: 1px solid #edf0f5;
  font-size: 13px;
  text-align: left;
}

.node-goods-table th {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 600;
}

.required-col::before {
  content: "* ";
  color: #f53f3f;
}

.add-goods-btn {
  margin: 0 0 12px 24px;
}

.add-node-btn {
  margin: 0 14px 12px 0;
}

.transport-summary,
.estimate-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #dbe7ff;
  border-radius: 2px;
  background: #f2f6ff;
  color: #344054;
  font-size: 13px;
}

.transport-summary strong,
.estimate-strip strong {
  color: #165dff;
}

.summary-icon,
.estimate-strip span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #2f6bff;
  color: #fff;
  font-size: 12px;
}

.freight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px 22px;
  align-items: end;
  margin-top: 12px;
}

.design-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.design-field label {
  color: #4e5969;
  font-size: 13px;
}

.estimate-strip {
  margin-top: 14px;
}

.preference-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  gap: 28px;
}

.preference-main {
  min-width: 0;
}

.publish-channel-card {
  padding: 18px 20px;
  border: 1px solid #e5e8ef;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.publish-channel-card h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1f2937;
}

.publish-channel-card > p {
  margin: 0 0 14px;
  color: #6b7280;
  font-size: 13px;
}

.channel-item {
  position: relative;
  display: grid;
  grid-template-columns: 18px 38px minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: start;
  padding: 12px;
  margin-bottom: 12px;
  background: #f7f8fa;
}

.channel-check {
  width: 14px;
  height: 14px;
  margin-top: 5px;
  border: 1px solid #cfd6e4;
  background: #fff;
  color: #fff;
  text-align: center;
  line-height: 13px;
  font-size: 12px;
}

.channel-item.checked .channel-check {
  border-color: #165dff;
  background: #165dff;
}

.channel-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background: #165dff;
  color: #fff;
  font-weight: 700;
}

.channel-logo.blue {
  background: #3f7cff;
}

.channel-item strong {
  display: block;
  margin-bottom: 4px;
  color: #1f2937;
  font-size: 13px;
}

.channel-item p {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 12px;
}

.channel-item em {
  display: inline-block;
  padding: 2px 8px;
  margin-right: 6px;
  background: #eef4ff;
  color: #597399;
  font-size: 12px;
  font-style: normal;
}

.channel-item b {
  height: 24px;
  padding: 4px 8px;
  background: #ff6b6b;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
}

.channel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: #5a6678;
  font-weight: 600;
}

.field-label.required::before {
  content: "* ";
  color: #f53f3f;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1400px) {
  .preference-layout {
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 18px;
  }
}

@media (max-width: 1200px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .freight-grid,
  .preference-layout {
    grid-template-columns: 1fr;
  }
}
</style>
