<template>
  <WorkspaceShell current-title="托运单管理" :show-back-link="false">
    <div class="waybill-manage-page">
      <!-- 页面标题（与表格拼接成连续卡片墙）-->
      <header class="page-header">
        <h1 class="page-title annotation-business-type-entry">托运单管理</h1>
        <div class="page-actions">
          <button class="ws-btn" @click="refreshList">刷新</button>
          <button class="ws-btn primary annotation-create-entry" @click="openTypeSelectDialog">+ 新增公开托运单</button>
        </div>
      </header>

      <!-- 托运单列表 -->
      <div class="table-card">
        <table class="ws-table">
          <thead>
            <tr>
              <th width="140">托运单号</th>
              <th width="100">业务类型</th>
              <th width="120">运输方式</th>
              <th>托运企业</th>
              <th width="100">联系人</th>
              <th width="110">状态</th>
              <th width="160">发布时间</th>
              <th>路线</th>
              <th width="100">操作</th>
            </tr>
          </thead>
          <tbody v-if="waybillList.length">
            <tr v-for="item in waybillList" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.businessType }}</td>
              <td>{{ item.transportMode }}</td>
              <td class="ellipsis">{{ item.shipperCompany }}</td>
              <td>{{ item.contactName }}</td>
              <td>
                <span class="status-pill" :class="getStatusClass(item.status)">{{ item.status }}</span>
              </td>
              <td>{{ item.publishTime }}</td>
              <td class="ellipsis">{{ item.route }}</td>
              <td>
                <button class="text-link" @click="viewDetail(item)">查看</button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="9" class="empty-cell">暂无托运单，点击右上角创建</td>
            </tr>
          </tbody>
        </table>
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
    </div>
  </WorkspaceShell>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ElButton, ElTable, ElTableColumn, ElDialog, ElDrawer, ElInput, ElInputNumber,
  ElSelect, ElOption, ElDatePicker, ElRadio, ElRadioGroup, ElRadioButton,
  ElCheckbox, ElCheckboxGroup, ElTag, ElEmpty,
} from 'element-plus'
import {
  businessTypeOptions, transportModeOptions, taxRequirementOptions,
  paymentMethodOptions, billingModeOptions, goodsOptions, packageOptions,
  visibilityScopeOptions, sampleWaybillList,
} from './mock-data'
import { prototypeStore, addWaybill } from '../../src/shared/prototype-store'
import WorkspaceShell from '../../src/components/WorkspaceShell.vue'

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

// ============ 列表数据 ============
const waybillList = ref([])

function loadWaybillList() {
  // 优先读 store（创建页写入的），无则用 mock
  if (prototypeStore.waybills.length > 0) {
    waybillList.value = prototypeStore.waybills.map(formatWaybillRow)
  } else {
    waybillList.value = sampleWaybillList.slice()
  }
}

function formatWaybillRow(w) {
  return {
    id: w.id,
    businessType: w.businessType || '散杂货',
    transportMode: w.mainTransportMode || w.transportMode || '多式联运',
    shipperCompany: w.shipperCompany,
    contactName: w.contactName,
    status: w.status,
    publishTime: w.publishTime
      ? new Date(w.publishTime).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      : '',
    route: getRouteText(w),
  }
}

function getRouteText(waybill) {
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

function getStatusClass(status) {
  const map = {
    竞价中: 'pending',
    已确认: 'success',
    已取消: 'cancelled',
    草稿: 'draft',
    待审核: 'pending',
    待确定: 'pending',
    待执行: 'primary',
    执行中: 'primary',
    已完成: 'success',
    已终止: 'cancelled',
  }
  return map[status] || 'draft'
}

function refreshList() {
  loadWaybillList()
  ElMessage.success('列表已刷新')
}

function viewDetail(item) {
  ElMessage.info(`查看托运单详情：${item.id}`)
}

// ============ 业务类型选择 ============
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
    showBulkCargoDialog.value = true
    initEmptyNodes()
  } else if (type === '集装箱') {
    showContainerDialog.value = true
    initEmptyContainerData()
  }
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

.waybill-manage-page {
  min-height: calc(100vh - 132px);
}

/* page-header 与表格拼接成连续卡片墙 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 18px;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #e7ebf0;
  border-bottom: none;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.page-actions {
  display: flex;
  gap: 10px;
}

/* 自定义按钮（源 z1 风格）*/
.ws-btn {
  height: 32px;
  padding: 0 16px;
  border: 1px solid #c9cdd4;
  border-radius: 2px;
  background: #fff;
  color: #4e5969;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.ws-btn:hover {
  border-color: #165dff;
  color: #165dff;
}
.ws-btn.primary {
  background: #165dff;
  border-color: #165dff;
  color: #fff;
}
.ws-btn.primary:hover {
  background: #4080ff;
  border-color: #4080ff;
  color: #fff;
}

.table-card {
  background: #fff;
  border: 1px solid #e7ebf0;
}

/* 自定义紧凑表格（源 z1 表格风格）*/
.ws-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ws-table th, .ws-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
}
.ws-table th {
  background: #f7f9fc;
  color: #556273;
  font-weight: 700;
  white-space: nowrap;
}
.ws-table tbody tr:hover {
  background: #fbfdff;
}
.ws-table tbody tr:last-child td {
  border-bottom: none;
}
.ws-table .ellipsis {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-table .empty-cell {
  padding: 54px 20px;
  text-align: center;
  color: #8894a4;
  font-size: 14px;
}

/* 状态彩色 pill（椭圆带边框）*/
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 24px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}
.status-pill.pending { background: #fff2df; color: #f2870b; border-color: #ffe5b4; }
.status-pill.success { background: #eaf9ef; color: #1ea25d; border-color: #c5edd5; }
.status-pill.cancelled { background: #f1f4f8; color: #7d8795; }
.status-pill.draft { background: #f1f4f8; color: #5f6b7a; }
.status-pill.primary { background: #e8f3ff; color: #165dff; border-color: #bedaff; }

.text-link {
  border: none;
  background: transparent;
  color: #165dff;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.text-link:hover { color: #4080ff; }

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
