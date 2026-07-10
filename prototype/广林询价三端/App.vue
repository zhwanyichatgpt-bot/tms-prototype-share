<template>
  <div class="guanglin-app">
    <BackBar current-title="广林询价三端" />
    <!-- ============ 顶部应用 shell ============ -->
    <div class="gl-top-nav">
      <div class="gl-nav-logo">TMS</div>
      <span class="gl-nav-sep">|</span>
      <div class="gl-nav-module">询价管理 / <span>{{ navPage }}</span></div>
      <div class="gl-project-badge">
        <span class="gl-badge-guanglin">广林项目定制</span>
        <div class="gl-role-switch">
          <button
            v-for="r in roleList"
            :key="r.key"
            class="gl-role-btn"
            :class="{ active: currentRole === r.key }"
            @click="switchRole(r.key)"
          >{{ r.label }}</button>
        </div>
      </div>
    </div>
    <div class="gl-sub-nav">
      <button
        v-for="v in visibleViews"
        :key="v.id"
        class="gl-sub-tab"
        :class="{ active: currentView === v.id }"
        @click="showView(v.id)"
      >{{ v.label }}</button>
    </div>

    <div class="gl-content-area">
      <!-- ============ 货主端：列表 ============ -->
      <div v-if="currentView === 'shipper-list'" class="gl-page-view">
        <div class="gl-filter-strip">
          <input class="gl-form-input" v-model="shipperFilterKw" placeholder="询价标题/单号" style="width:180px;" />
          <select class="gl-form-input" v-model="shipperFilterType" style="width:90px;">
            <option value="">全部类型</option>
            <option v-for="t in typeOptions" :key="t">{{ t }}</option>
          </select>
          <div class="gl-date-range">
            <input type="date" v-model="shipperFilterDateFrom" />
            <span>至</span>
            <input type="date" v-model="shipperFilterDateTo" />
          </div>
          <button class="gl-btn gl-btn-primary gl-btn-sm">搜索</button>
          <button class="gl-btn gl-btn-secondary gl-btn-sm" @click="resetShipperFilter">重置</button>
          <div class="spacer"></div>
          <button class="gl-btn gl-btn-primary gl-btn-sm" @click="openCreateAsNew">+ 新增货源询价</button>
        </div>
        <div class="gl-status-tabs" style="margin-top:12px;background:var(--white);border-radius:var(--radius-card);box-shadow:var(--shadow-sm);border:1px solid var(--border-light);">
          <span
            v-for="s in shipperStatusTabs"
            :key="s"
            class="gl-status-tab"
            :class="{ active: shipperActiveTab === s }"
            @click="shipperActiveTab = s"
          >{{ s }} <span class="gl-badge" :class="{ 'has-data': shipperStatusCount(s) > 0 }">{{ shipperStatusCount(s) }}</span></span>
        </div>
        <div class="gl-card" style="padding:0;border-radius:var(--radius-card);">
          <div class="gl-table-wrap" style="border:none;box-shadow:none;">
            <table>
              <thead><tr>
                <th>询价单号</th><th>询价标题</th><th>询价类型</th><th>询价对象</th><th>路线数</th><th>待确认</th><th>已生成托运单</th><th>询价状态</th><th>发布时间</th><th>操作</th>
              </tr></thead>
              <tbody>
                <tr v-for="inq in filteredShipperList" :key="inq.id">
                  <td>{{ inq.id }}</td>
                  <td>{{ inq.title }}</td>
                  <td><span class="gl-tag" :class="getStatusTagClass(inq.type)">{{ inq.type }}</span></td>
                  <td>{{ inq.targetNvocc || '-' }}</td>
                  <td>{{ inq.routes.length }}</td>
                  <td :style="{ color: shipperPendingCount(inq) ? 'var(--warning-text)' : 'inherit', fontWeight: shipperPendingCount(inq) ? 600 : 400 }">{{ shipperPendingCount(inq) }}</td>
                  <td>{{ shipperShippingCount(inq) }}</td>
                  <td><span class="gl-tag" :class="getStatusTagClass(displayStatus(inq, 'shipper'))">{{ displayStatus(inq, 'shipper') }}</span></td>
                  <td>{{ inq.publishTime || '-' }}</td>
                  <td>
                    <template v-if="inq.status === '草稿'">
                      <button class="gl-btn-link" @click="editDraft(inq.id)">编辑</button>
                      <button class="gl-btn-link" style="color:var(--error-text)" @click="deleteDraft(inq.id)">删除</button>
                      <button class="gl-btn-link" @click="publishFromList(inq.id)">发布</button>
                    </template>
                    <template v-else-if="inq.status === '待承接'">
                      <button class="gl-btn-link" @click="openDetail(inq.id)">查看</button>
                      <button class="gl-btn-link" style="color:var(--warning-text)" @click="cancelInquiry(inq.id)">取消</button>
                    </template>
                    <template v-else-if="inq.status === '待确认'">
                      <button class="gl-btn-link" @click="openDetail(inq.id)">确认路线</button>
                      <button class="gl-btn-link" @click="openDetail(inq.id)">查看</button>
                    </template>
                    <template v-else-if="inq.status === '已拒绝' || inq.status === '已取消'">
                      <button class="gl-btn-link" @click="openDetail(inq.id)">查看</button>
                      <button class="gl-btn-link" @click="reopenInquiry(inq.id)">重新发起</button>
                    </template>
                    <template v-else>
                      <button class="gl-btn-link" @click="openDetail(inq.id)">查看</button>
                    </template>
                  </td>
                </tr>
                <tr v-if="!filteredShipperList.length"><td colspan="10" class="gl-empty">暂无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ 货主端：新增 ============ -->
      <div v-else-if="currentView === 'shipper-create'" class="gl-page-view">
        <div class="gl-page-header">
          <button class="gl-back-btn" @click="showView('shipper-list')">←</button>
          <h2>{{ editingInquiryId ? '编辑货源询价' : '新增货源询价' }}</h2>
          <span class="gl-tag gl-tag-neutral">草稿</span>
        </div>
        <div class="gl-card">
          <div class="gl-sec-title"><div class="bar"></div><h3>基本信息</h3></div>
          <div class="gl-form-row">
            <div class="gl-form-group">
              <label class="gl-form-label"><span class="req">*</span> 询价类型</label>
              <select class="gl-form-input" v-model="createForm.type">
                <option value="">请选择</option>
                <option v-for="t in typeOptions" :key="t">{{ t }}</option>
              </select>
            </div>
            <div class="gl-form-group">
              <label class="gl-form-label"><span class="req">*</span> 询价标题</label>
              <input class="gl-form-input" v-model="createForm.title" placeholder="请填写询价标题" maxlength="50" />
            </div>
            <div class="gl-form-group">
              <label class="gl-form-label"><span class="req">*</span> 货主</label>
              <select class="gl-form-input" v-model="createForm.owner">
                <option>广西广林木业有限公司</option>
              </select>
            </div>
          </div>
          <div class="gl-form-row">
            <div class="gl-form-group">
              <label class="gl-form-label"><span class="req">*</span> 询价对象（无车承运人）</label>
              <select class="gl-form-input" v-model="createForm.targetNvocc">
                <option value="">请选择</option>
                <option v-for="n in nvoccOptions" :key="n">{{ n }}</option>
              </select>
            </div>
            <div class="gl-form-group" style="flex:2;">
              <label class="gl-form-label">询价说明</label>
              <input class="gl-form-input" v-model="createForm.desc" placeholder="选填，同步给无车承运人查看" maxlength="200" />
            </div>
          </div>
        </div>
        <div class="gl-card" style="margin-top:32px;">
          <div class="gl-sec-title"><div class="bar"></div><h3>路线明细</h3><span class="gl-sec-sub">已录入 {{ editRoutes.length }} 条路线</span></div>
          <div class="gl-action-bar">
            <button class="gl-btn gl-btn-primary gl-btn-sm" @click="addInlineRoute">+ 新增路线</button>
            <button class="gl-btn gl-btn-secondary gl-btn-sm" @click="simulateImport">导入路线</button>
            <button class="gl-btn gl-btn-secondary gl-btn-sm">下载导入模板</button>
            <button class="gl-btn gl-btn-sm gl-btn-danger" @click="batchDeleteRoutes">批量删除</button>
            <div class="spacer"></div>
          </div>
          <div class="gl-table-wrap">
            <table>
              <thead><tr>
                <th style="width:36px;"><input type="checkbox" :checked="allRouteChk" @change="toggleAllRoute($event)" /></th>
                <th style="width:40px;">序号</th><th>始发地 *</th><th>目的地 *</th><th>货品 *</th><th>配载方式 *</th><th>货量 *</th><th>单位</th><th>运输方式</th><th>路线备注</th><th style="width:50px;">操作</th>
              </tr></thead>
              <tbody>
                <tr v-for="(r, i) in editRoutes" :key="i" :style="{ background: isRouteDup(i) ? 'var(--warning-bg)' : '' }">
                  <td><input type="checkbox" v-model="r._chk" /></td>
                  <td>{{ i + 1 }}</td>
                  <td>
                    <select class="gl-inline-select" v-model="r.origin" @change="onRouteFieldChange(i, 'origin', r.origin)">
                      <option value="">请选择</option>
                      <option v-for="o in originOptions" :key="o">{{ o }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="gl-inline-select" v-model="r.dest">
                      <option value="">请选择</option>
                      <option v-for="d in destOptions" :key="d">{{ d }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="gl-inline-select" v-model="r.goods" @change="onRouteFieldChange(i, 'goods', r.goods)">
                      <option value="">请选择</option>
                      <option v-for="g in goodsOptions" :key="g">{{ g }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="gl-inline-select" v-model="r.loadMode" @change="onRouteFieldChange(i, 'loadMode', r.loadMode)">
                      <option v-for="m in loadModeOptions" :key="m">{{ m }}</option>
                    </select>
                  </td>
                  <td><input class="gl-inline-input" type="number" v-model="r.quantity" placeholder="填写" /></td>
                  <td>
                    <select class="gl-inline-select" v-model="r.unit">
                      <option v-for="u in (unitMap[r.loadMode] || [])" :key="u">{{ u }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="gl-inline-select" v-model="r.transport">
                      <option v-for="t in transportOptions" :key="t">{{ t }}</option>
                    </select>
                  </td>
                  <td><input class="gl-inline-input wide" v-model="r.remark" placeholder="选填" /></td>
                  <td><button class="gl-btn-link" style="color:var(--error-text)" @click="editRoutes.splice(i, 1)">删除</button></td>
                </tr>
                <tr v-if="!editRoutes.length"><td colspan="11" class="gl-empty">暂无路线，点击"新增路线"添加</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="gl-bottom-bar">
          <button class="gl-btn gl-btn-secondary" @click="showView('shipper-list')">取消</button>
          <div class="spacer"></div>
          <button class="gl-btn gl-btn-secondary" @click="saveDraftInquiry">保存草稿</button>
          <button class="gl-btn gl-btn-primary" @click="publishInquiry">发布询价</button>
        </div>
      </div>

      <!-- ============ 货主端：详情 ============ -->
      <div v-else-if="currentView === 'shipper-detail'" class="gl-page-view">
        <template v-if="detailInq">
          <div class="gl-page-header">
            <button class="gl-back-btn" @click="showView('shipper-list')">←</button>
            <h2>{{ detailInq.id }}</h2>
            <span class="gl-tag" :class="getStatusTagClass(displayStatus(detailInq, 'shipper'))">{{ displayStatus(detailInq, 'shipper') }}</span>
          </div>
          <div class="gl-detail-summary">
            <div class="gl-summary-seg blue"><div class="s-label">全部路线</div><div class="s-value">{{ detailInq.routes.length }}</div></div>
            <div class="gl-summary-seg gray"><div class="s-label">处理中</div><div class="s-value">{{ detailProcessingCount(detailInq) }}</div></div>
            <div class="gl-summary-seg orange"><div class="s-label">待确认</div><div class="s-value">{{ detailPendingCount(detailInq) }}</div></div>
            <div class="gl-summary-seg red"><div class="s-label">已驳回</div><div class="s-value">{{ detailRejectedCount(detailInq) }}</div></div>
            <div class="gl-summary-seg green"><div class="s-label">已确认</div><div class="s-value">{{ detailConfirmedCount(detailInq) }}</div></div>
            <div class="gl-summary-seg blue"><div class="s-label">已生成托运单</div><div class="s-value">{{ shipperShippingCount(detailInq) }}</div></div>
          </div>
          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>询价信息</h3></div>
            <div class="gl-info-grid">
              <div class="gl-field-item"><span class="label">询价类型</span><span class="value"><span class="gl-tag" :class="getStatusTagClass(detailInq.type)">{{ detailInq.type }}</span></span></div>
              <div class="gl-field-item"><span class="label">货主</span><span class="value">{{ detailInq.owner }}</span></div>
              <div class="gl-field-item"><span class="label">询价对象</span><span class="value">{{ detailInq.targetNvocc || '-' }}</span></div>
              <div class="gl-field-item"><span class="label">发布时间</span><span class="value">{{ detailInq.publishTime || '-' }}</span></div>
              <div class="gl-field-item"><span class="label">询价说明</span><span class="value">{{ detailInq.desc || '-' }}</span></div>
              <template v-if="detailInq.status === '已拒绝'">
                <div class="gl-field-item"><span class="label">拒绝原因</span><span class="value" style="color:var(--error-text)">{{ detailInq.rejectReason }}</span></div>
                <div class="gl-field-item" v-if="detailInq.rejectTime"><span class="label">拒绝时间</span><span class="value">{{ detailInq.rejectTime }}</span></div>
              </template>
              <template v-if="detailInq.status === '已取消'">
                <div class="gl-field-item"><span class="label">取消原因</span><span class="value" style="color:var(--error-text)">{{ detailInq.cancelReason }}</span></div>
                <div class="gl-field-item" v-if="detailInq.cancelTime"><span class="label">取消时间</span><span class="value">{{ detailInq.cancelTime }}</span></div>
              </template>
            </div>
            <div class="gl-action-bar" style="margin-top:16px;">
              <button v-if="detailInq.status === '待承接'" class="gl-btn gl-btn-sm gl-btn-danger" style="border:1px solid var(--warning-text);color:var(--warning-text);" @click="cancelInquiry(detailInq.id)">取消询价</button>
              <template v-if="detailInq.status === '已拒绝' || detailInq.status === '已取消'">
                <button class="gl-btn gl-btn-primary gl-btn-sm" @click="reopenInquiry(detailInq.id)">重新发起</button>
              </template>
              <div class="spacer"></div>
              <label v-if="detailHasPendingOrConfirmed(detailInq)" style="display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-secondary);cursor:pointer;margin-right:8px;">
                <input type="checkbox" :checked="detailAllChk" @change="toggleAllDetailChk($event.target.checked)" style="accent-color:var(--primary)" /> 全选
              </label>
              <button v-if="detailPendingCount(detailInq) > 0" class="gl-btn gl-btn-primary gl-btn-sm" @click="batchConfirmRoute">批量确认</button>
              <button v-if="detailConfirmedCount(detailInq) > 0" class="gl-btn gl-btn-secondary gl-btn-sm" @click="batchGenShipping">批量生成托运单</button>
            </div>
          </div>
          <div class="gl-card" style="margin-top:32px;">
            <div class="gl-sec-title"><div class="bar"></div><h3>路线管理</h3></div>
            <div>
              <div v-for="(r, i) in detailInq.routes" :key="r.id" class="gl-row-group">
                <div class="gl-rg-header">
                  <input v-if="canShowDetailChk(r)" type="checkbox" v-model="detailChkMap[r.id]" style="margin-right:4px;accent-color:var(--primary)" />
                  <span class="seq">{{ i + 1 }}</span>
                  <span class="code">{{ r.id }}</span>
                  <span class="gl-tag" :class="getStatusTagClass(r.status)">{{ r.status }}</span>
                  <div class="rg-actions">
                    <button v-if="r.status === '待货主确认'" class="gl-btn gl-btn-sm gl-btn-secondary" @click="confirmRoute(r.id)">确认</button>
                    <button v-if="r.status === '待货主确认'" class="gl-btn gl-btn-sm gl-btn-danger" @click="rejectRoute(r.id)">拒绝</button>
                    <button v-if="r.status === '已确认' && !r.shippingOrder" class="gl-btn gl-btn-sm gl-btn-secondary" @click="genShipping(r.id)">生成托运单</button>
                  </div>
                </div>
                <div class="gl-rg-body">
                  <div class="gl-field-item"><span class="label">始发地</span><span class="value">{{ r.origin }}</span></div>
                  <div class="gl-field-item"><span class="label">目的地</span><span class="value">{{ r.dest }}</span></div>
                  <div class="gl-field-item"><span class="label">货品</span><span class="value">{{ r.goods }}</span></div>
                  <div class="gl-field-item"><span class="label">配载方式</span><span class="value">{{ r.loadMode }}</span></div>
                  <div class="gl-field-item"><span class="label">货量</span><span class="value">{{ fmtQty(r) }}</span></div>
                  <div class="gl-field-item"><span class="label">运输方式</span><span class="value">{{ r.transport }}</span></div>
                  <template v-if="r.confirmPrice">
                    <div class="gl-field-item"><span class="label">运输总价</span><span class="value money">{{ fmtMoney(r.confirmPrice) }}</span></div>
                    <div class="gl-field-item"><span class="label">运输单价</span><span class="value">{{ unitPriceOf(r.confirmPrice, r) }}</span></div>
                  </template>
                  <div v-if="r.fillNote" class="gl-field-item"><span class="label">提交说明</span><span class="value">{{ r.fillNote }}</span></div>
                  <div v-if="r.remark" class="gl-field-item"><span class="label">路线备注</span><span class="value">{{ r.remark }}</span></div>
                  <template v-if="r.status === '已驳回'">
                    <div v-if="r.rejectReason" class="gl-field-item"><span class="label">驳回原因</span><span class="value" style="color:var(--error-text)">{{ r.rejectReason }}</span></div>
                    <div v-if="r.rejectTime" class="gl-field-item"><span class="label">驳回时间</span><span class="value">{{ r.rejectTime }}</span></div>
                  </template>
                  <div v-if="r.shippingOrder" class="gl-field-item"><span class="label">指定托运单</span><span class="value" style="color:var(--primary)">{{ r.shippingOrder }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ============ 无车承运人端：列表 ============ -->
      <div v-else-if="currentView === 'novcc-list'" class="gl-page-view">
        <div class="gl-filter-strip">
          <input class="gl-form-input" v-model="novccFilterKw" placeholder="货主/标题/单号" style="width:170px;" />
          <select class="gl-form-input" v-model="novccFilterType" style="width:90px;">
            <option value="">全部类型</option>
            <option v-for="t in typeOptions" :key="t">{{ t }}</option>
          </select>
          <div class="gl-date-range">
            <input type="date" v-model="novccFilterDateFrom" />
            <span>至</span>
            <input type="date" v-model="novccFilterDateTo" />
          </div>
          <button class="gl-btn gl-btn-primary gl-btn-sm">搜索</button>
          <button class="gl-btn gl-btn-secondary gl-btn-sm" @click="resetNovccFilter">重置</button>
          <div class="spacer"></div>
        </div>
        <div class="gl-status-tabs" style="margin-top:12px;background:var(--white);border-radius:var(--radius-card);box-shadow:var(--shadow-sm);border:1px solid var(--border-light);">
          <span
            v-for="s in nvoccStatusTabs"
            :key="s"
            class="gl-status-tab"
            :class="{ active: novccActiveTab === s }"
            @click="novccActiveTab = s"
          >{{ s }} <span class="gl-badge" :class="{ 'has-data': nvoccStatusCount(s) > 0 }">{{ nvoccStatusCount(s) }}</span></span>
        </div>
        <div class="gl-card" style="padding:0;border-radius:var(--radius-card);">
          <div class="gl-table-wrap" style="border:none;box-shadow:none;">
            <table>
              <thead><tr>
                <th>询价单号</th><th>来源货主</th><th>询价类型</th><th>询价标题</th><th>路线数</th><th>待处理</th><th>报价中</th><th>待货主确认</th><th>已完成</th><th>状态</th><th>接收时间</th><th>操作</th>
              </tr></thead>
              <tbody>
                <tr v-for="inq in filteredNvoccList" :key="inq.id">
                  <td>{{ inq.id }}</td>
                  <td>{{ inq.owner }}</td>
                  <td><span class="gl-tag" :class="getStatusTagClass(inq.type)">{{ inq.type }}</span></td>
                  <td>{{ inq.title }}</td>
                  <td>{{ inq.routes.length }}</td>
                  <td>{{ novccRouteCount(inq, '待处理') }}</td>
                  <td>{{ novccRouteCount(inq, '报价中') }}</td>
                  <td>{{ novccRouteCount(inq, '待货主确认') }}</td>
                  <td>{{ novccDoneCount(inq) }}</td>
                  <td><span class="gl-tag" :class="getStatusTagClass(displayStatus(inq, 'novcc'))">{{ displayStatus(inq, 'novcc') }}</span></td>
                  <td>{{ inq.publishTime }}</td>
                  <td>
                    <button class="gl-btn-link" @click="openNovccDetail(inq.id)">{{ (inq.status === '已拒绝' || inq.status === '已取消') ? '查看' : '处理' }}</button>
                  </td>
                </tr>
                <tr v-if="!filteredNvoccList.length"><td colspan="12" class="gl-empty">暂无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ 无车承运人端：详情 ============ -->
      <div v-else-if="currentView === 'novcc-detail'" class="gl-page-view">
        <template v-if="novccInq">
          <div class="gl-page-header">
            <button class="gl-back-btn" @click="showView('novcc-list')">←</button>
            <h2>{{ novccInq.id }} - 询价管理详情</h2>
          </div>
          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>货源询价信息</h3></div>
            <div class="gl-info-grid">
              <div class="gl-field-item"><span class="label">来源货主</span><span class="value">{{ novccInq.owner }}</span></div>
              <div class="gl-field-item"><span class="label">询价类型</span><span class="value"><span class="gl-tag" :class="getStatusTagClass(novccInq.type)">{{ novccInq.type }}</span></span></div>
              <div class="gl-field-item"><span class="label">询价标题</span><span class="value">{{ novccInq.title }}</span></div>
              <div class="gl-field-item"><span class="label">询价说明</span><span class="value">{{ novccInq.desc || '-' }}</span></div>
            </div>
          </div>
          <!-- 待承接：接受/拒绝区 -->
          <div v-if="novccInq.status === '待承接'" style="display:flex;justify-content:flex-end;gap:12px;padding:8px 4px 0;margin-bottom:18px;">
            <button class="gl-btn gl-btn-primary" @click="acceptInquiry(novccInq.id)">接受承接</button>
            <button class="gl-btn gl-btn-secondary" style="color:var(--error-text);border-color:var(--error-text);" @click="rejectNvccInquiry(novccInq.id)">拒绝承接</button>
          </div>
          <!-- 已拒绝 -->
          <div v-else-if="novccInq.status === '已拒绝'" class="gl-reject-card">
            <div class="gl-sec-title"><div class="bar" style="background:var(--error-text);"></div><h3>已拒绝承接</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">拒绝原因</span><span class="value" style="color:var(--error-text)">{{ novccInq.rejectReason }}</span></div>
              <div class="gl-field-item"><span class="label">拒绝时间</span><span class="value">{{ novccInq.rejectTime || '-' }}</span></div>
            </div>
          </div>
          <!-- 已取消 -->
          <div v-else-if="novccInq.status === '已取消'" class="gl-cancel-card">
            <div class="gl-sec-title"><div class="bar" style="background:var(--warning-text);"></div><h3>已取消</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">取消原因</span><span class="value" style="color:var(--warning-text)">{{ novccInq.cancelReason }}</span></div>
              <div class="gl-field-item"><span class="label">取消时间</span><span class="value">{{ novccInq.cancelTime || '-' }}</span></div>
            </div>
          </div>

          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>{{ (novccInq.status === '待承接' || novccInq.status === '已拒绝' || novccInq.status === '已取消') ? '路线信息' : '路线管理' }}</h3></div>
            <div v-if="novccInq.status !== '待承接' && novccInq.status !== '已拒绝' && novccInq.status !== '已取消'" class="gl-action-bar">
              <button class="gl-btn gl-btn-primary gl-btn-sm" @click="batchPublishNovcc">批量发布</button>
              <div class="spacer"></div>
              <span style="font-size:12px;color:var(--text-tertiary);">已勾选 {{ pubSelCount }} 条</span>
            </div>
            <!-- info bar 提示 -->
            <div v-if="novccInq.status === '待承接'" class="gl-novcc-info-bar">
              <span>当前为待承接状态，请先查看货主路线信息；如确认承接，请在页面底部完成操作，确认后当前详情页会直接切换为可发布到询价大厅的处理态。</span>
            </div>
            <div v-else-if="novccInq.status === '已拒绝'" class="gl-novcc-info-bar">
              <span>该询价单已拒绝承接，以下路线信息仅供回看，不能继续发布或报价处理。</span>
            </div>
            <div v-else-if="novccInq.status === '已取消'" class="gl-novcc-info-bar">
              <span>该询价单已取消，以下路线信息仅供回看，不能继续发布或报价处理。</span>
            </div>
            <div>
              <div v-for="(r, i) in novccInq.routes" :key="r.id" class="gl-row-group">
                <div class="gl-rg-header">
                  <input v-if="r.status === '待处理' && !isNovccReadonly" type="checkbox" v-model="pubChkMap[r.id]" style="margin-right:6px;accent-color:var(--primary)" />
                  <span class="seq">{{ i + 1 }}</span>
                  <span class="code">{{ r.id }}</span>
                  <span class="gl-tag" :class="getStatusTagClass(r.status)">{{ r.status }}</span>
                  <div class="rg-actions">
                    <button class="gl-btn gl-btn-sm gl-btn-secondary" @click="openNovccDrawer(r.id)">{{ novccActionText(r, novccInq) }}</button>
                  </div>
                </div>
                <div class="gl-rg-body">
                  <div class="gl-field-item"><span class="label">始发地</span><span class="value">{{ r.origin }}</span></div>
                  <div class="gl-field-item"><span class="label">目的地</span><span class="value">{{ r.dest }}</span></div>
                  <div class="gl-field-item"><span class="label">货品</span><span class="value">{{ r.goods }}</span></div>
                  <div class="gl-field-item"><span class="label">配载方式</span><span class="value">{{ r.loadMode }}</span></div>
                  <div class="gl-field-item"><span class="label">货量</span><span class="value">{{ fmtQty(r) }}</span></div>
                  <div class="gl-field-item"><span class="label">运输方式</span><span class="value">{{ r.transport }}</span></div>
                  <template v-if="r.status === '报价中'">
                    <div v-if="r.deadline" class="gl-field-item"><span class="label">报价截止时间</span><span class="value" style="color:var(--warning-text)">{{ r.deadline }}</span></div>
                    <div v-if="r.publishNote" class="gl-field-item"><span class="label">发布备注</span><span class="value">{{ r.publishNote }}</span></div>
                    <div class="gl-field-item"><span class="label">报价数量</span><span class="value">{{ (r.quotes || []).length }} 个</span></div>
                    <div v-if="(r.quotes || []).length > 0" class="gl-field-item"><span class="label">最低报价总价</span><span class="value" style="color:var(--primary);font-weight:600">{{ fmtMoney(minQuoteTotal(r)) }}</span></div>
                  </template>
                  <template v-if="r.status === '待货主确认'">
                    <div v-for="fi in selectedCarrierPricingFields(r, '意向承运商')" :key="'a'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-for="fi in ownerPricingFields(r, '货主')" :key="'b'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                  </template>
                  <template v-if="r.status === '已驳回'">
                    <div v-for="fi in selectedCarrierPricingFields(r, '意向承运商')" :key="'c'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-for="fi in ownerPricingFields(r, '货主')" :key="'d'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-if="r.rejectReason" class="gl-field-item"><span class="label">驳回原因</span><span class="value" style="color:var(--error-text)">{{ r.rejectReason }}</span></div>
                    <div v-if="r.rejectTime" class="gl-field-item"><span class="label">驳回时间</span><span class="value">{{ r.rejectTime }}</span></div>
                  </template>
                  <template v-if="r.status === '已确认'">
                    <div v-for="fi in selectedCarrierPricingFields(r, '下游承运商')" :key="'e'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-for="fi in ownerPricingFields(r, '货主')" :key="'f'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                  </template>
                  <template v-if="r.status === '已生成托运单'">
                    <div v-for="fi in selectedCarrierPricingFields(r, '下游承运商')" :key="'g'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-for="fi in ownerPricingFields(r, '货主')" :key="'h'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                    <div v-if="r.shippingOrder" class="gl-field-item"><span class="label">托运单号</span><span class="value" style="color:var(--primary)">{{ r.shippingOrder }}</span></div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ============ 承运商端：询价大厅 ============ -->
      <div v-else-if="currentView === 'carrier-hall'" class="gl-page-view">
        <div class="gl-filter-strip">
          <input class="gl-form-input" v-model="hallFilterKw" placeholder="始发地/目的地" style="width:170px;" />
          <select class="gl-form-input" v-model="hallFilterType" style="width:90px;">
            <option value="">全部类型</option>
            <option v-for="t in typeOptions" :key="t">{{ t }}</option>
          </select>
          <div class="gl-date-range">
            <input type="date" v-model="hallFilterDateFrom" />
            <span>至</span>
            <input type="date" v-model="hallFilterDateTo" />
          </div>
          <button class="gl-btn gl-btn-primary gl-btn-sm">搜索</button>
          <button class="gl-btn gl-btn-secondary gl-btn-sm" @click="resetHallFilter">重置</button>
          <div class="spacer"></div>
        </div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px;">
          <template v-if="hallItems.length">
            <div v-for="it in filteredHallItems" :key="it.route.id" class="gl-hall-card">
              <div class="hall-info">
                <div class="hall-title">{{ it.route.origin }} → {{ it.route.dest }} <span class="gl-tag" :class="getStatusTagClass(it.inquiry.type)">{{ it.inquiry.type }}</span> <span class="gl-tag gl-tag-neutral">待报价</span></div>
                <div class="hall-meta" style="display:flex;gap:16px;">
                  <span>货品：{{ it.route.goods }}</span><span>配载：{{ it.route.loadMode }}</span><span>货量：{{ fmtQty(it.route) }}</span><span>运输方式：{{ it.route.transport }}</span>
                </div>
                <div class="hall-deadline">竞价截止：{{ it.route.deadline || '-' }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="gl-btn gl-btn-primary gl-btn-sm" @click="openCarrierQuote(it.route.id)">报价</button>
              </div>
            </div>
          </template>
          <div v-else class="gl-empty"><div class="gl-empty-icon">📋</div><div>暂无可报价路线</div></div>
        </div>
      </div>

      <!-- ============ 承运商端：报价详情 ============ -->
      <div v-else-if="currentView === 'carrier-quote'" class="gl-page-view">
        <div class="gl-page-header"><button class="gl-back-btn" @click="showView('carrier-hall')">←</button><h2>路线报价详情</h2></div>
        <template v-if="carrierQuoteRoute && carrierQuoteInq">
          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>路线信息</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">线路发布单号</span><span class="value">FB-{{ carrierQuoteRoute.id }}</span></div>
              <div class="gl-field-item"><span class="label">询价类型</span><span class="value"><span class="gl-tag" :class="getStatusTagClass(carrierQuoteInq.type)">{{ carrierQuoteInq.type }}</span></span></div>
              <div class="gl-field-item"><span class="label">竞价截止时间</span><span class="value" style="color:var(--warning-text)">{{ carrierQuoteRoute.deadline || '-' }}</span></div>
              <div class="gl-field-item"><span class="label">始发地</span><span class="value">{{ carrierQuoteRoute.origin }}</span></div>
              <div class="gl-field-item"><span class="label">目的地</span><span class="value">{{ carrierQuoteRoute.dest }}</span></div>
              <div class="gl-field-item"><span class="label">货品</span><span class="value">{{ carrierQuoteRoute.goods }}</span></div>
              <div class="gl-field-item"><span class="label">配载方式</span><span class="value">{{ carrierQuoteRoute.loadMode }}</span></div>
              <div class="gl-field-item"><span class="label">货量</span><span class="value">{{ fmtQty(carrierQuoteRoute) }}</span></div>
              <div class="gl-field-item"><span class="label">运输方式</span><span class="value">{{ carrierQuoteRoute.transport }}</span></div>
              <div v-if="carrierQuoteRoute.remark" class="gl-field-item"><span class="label">路线备注</span><span class="value">{{ carrierQuoteRoute.remark }}</span></div>
            </div>
          </div>
          <div class="gl-card" style="margin-top:16px;">
            <div class="gl-sec-title"><div class="bar"></div><h3>{{ carrierQuoteEditMode ? '修改报价' : '提交报价' }}</h3></div>
            <div class="gl-form-row">
              <div class="gl-form-group" style="flex:1;">
                <label class="gl-form-label"><span class="req">*</span> 报价方式</label>
                <div class="gl-radio-group">
                  <label><input type="radio" v-model="cqMode" value="按运输单价报价" /> 按运输单价报价</label>
                  <label><input type="radio" v-model="cqMode" value="按运输总价报价" /> 按运输总价报价</label>
                </div>
              </div>
            </div>
            <div class="gl-form-row" style="align-items:flex-end;">
              <div class="gl-form-group">
                <label class="gl-form-label"><span class="req">*</span> {{ cqMode === '按运输单价报价' ? '运输单价(' + fmtPriceUnit(carrierQuoteRoute) + ')' : '运输总价(元)' }}</label>
                <input class="gl-form-input" type="number" v-model="cqPriceInput" :placeholder="cqMode === '按运输单价报价' ? '请填写运输单价' : '请填写运输总价'" />
              </div>
              <div class="gl-form-group">
                <label class="gl-form-label">{{ cqMode === '按运输单价报价' ? '折算运输总价' : '折算运输单价' }}</label>
                <div class="gl-form-input" style="display:flex;align-items:center;background:var(--disabled-bg);color:var(--text-secondary);">{{ cqCalcText }}</div>
              </div>
            </div>
            <div class="gl-form-row">
              <div class="gl-form-group">
                <label class="gl-form-label">报价备注</label>
                <textarea class="gl-form-textarea" v-model="cqRemark" placeholder="选填"></textarea>
              </div>
            </div>
            <div v-if="carrierQuoteEditMode && !canCarrierEditQuote(carrierQuoteRoute, carrierQuoteInq)" class="gl-novcc-info-bar" style="margin-top:12px;"><span>当前报价已不可修改。</span></div>
            <div style="text-align:right;margin-top:8px;">
              <button class="gl-btn gl-btn-primary" :disabled="carrierQuoteEditMode && !canCarrierEditQuote(carrierQuoteRoute, carrierQuoteInq)" @click="submitCarrierQuote">{{ carrierQuoteEditMode ? '保存报价' : '提交报价' }}</button>
            </div>
          </div>
        </template>
        <div v-else class="gl-card">未找到路线</div>
      </div>

      <!-- ============ 承运商端：报价记录 ============ -->
      <div v-else-if="currentView === 'carrier-records'" class="gl-page-view">
        <div class="gl-card">
          <div class="gl-action-bar" style="padding:0 0 16px;">
            <div class="spacer"></div>
            <select class="gl-form-input" v-model="recordFilterStatus" style="width:120px;height:34px;font-size:13px;border-radius:var(--radius-input);">
              <option value="">全部状态</option>
              <option>已报价</option><option>未入围</option><option>已成交</option><option>已失效</option>
            </select>
            <button class="gl-btn gl-btn-secondary gl-btn-sm" style="height:34px;">搜索</button>
          </div>
          <div class="gl-table-wrap">
            <table>
              <thead><tr>
                <th>报价单号</th><th>线路发布单号</th><th>询价类型</th><th>始发地</th><th>目的地</th><th>货品</th><th>货量</th><th>报价总价/单价</th><th>报价状态</th><th>报价时间</th><th>操作</th>
              </tr></thead>
              <tbody>
                <tr v-for="rec in filteredRecords" :key="rec.route.id">
                  <td>{{ rec.qid }}</td>
                  <td>FB-{{ rec.route.id }}</td>
                  <td><span class="gl-tag" :class="getStatusTagClass(rec.inquiry.type)">{{ rec.inquiry.type }}</span></td>
                  <td>{{ rec.route.origin }}</td>
                  <td>{{ rec.route.dest }}</td>
                  <td>{{ rec.route.goods }}</td>
                  <td>{{ fmtQty(rec.route) }}</td>
                  <td style="font-weight:600;color:var(--primary)">{{ fmtMoney(quoteTotal(rec.quote)) }}<div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">{{ (quoteUnitPrice(rec.quote, rec.route) || 0).toLocaleString() }} {{ fmtPriceUnit(rec.route) }}</div></td>
                  <td><span class="gl-tag" :class="getStatusTagClass(rec.quote.status)">{{ rec.quote.status }}</span></td>
                  <td>{{ rec.quote.time }}</td>
                  <td>
                    <button class="gl-btn-link" @click="openCarrierRecordDetail(rec.route.id)">查看</button>
                    <button v-if="canCarrierEditQuote(rec.route, rec.inquiry)" class="gl-btn-link" style="margin-left:8px;" @click="openCarrierQuoteEdit(rec.route.id)">修改报价</button>
                  </td>
                </tr>
                <tr v-if="!filteredRecords.length"><td colspan="11" class="gl-empty">暂无报价记录</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ 承运商端：报价记录详情 ============ -->
      <div v-else-if="currentView === 'carrier-record-detail'" class="gl-page-view">
        <div class="gl-page-header"><button class="gl-back-btn" @click="showView('carrier-records')">←</button><h2>报价记录详情</h2></div>
        <template v-if="carrierRecordRoute && carrierRecordInq && carrierRecordQuote">
          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>报价信息</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">报价单号</span><span class="value">QT-{{ carrierRecordRoute.id }}-01</span></div>
              <div class="gl-field-item"><span class="label">线路发布单号</span><span class="value">FB-{{ carrierRecordRoute.id }}</span></div>
              <div class="gl-field-item"><span class="label">询价类型</span><span class="value"><span class="gl-tag" :class="getStatusTagClass(carrierRecordInq.type)">{{ carrierRecordInq.type }}</span></span></div>
              <div class="gl-field-item"><span class="label">报价方式</span><span class="value">{{ quoteModeText(carrierRecordQuote) }}</span></div>
              <div class="gl-field-item"><span class="label">运输总价</span><span class="value money">{{ fmtMoney(quoteTotal(carrierRecordQuote)) }}</span></div>
              <div class="gl-field-item"><span class="label">运输单价</span><span class="value">{{ (quoteUnitPrice(carrierRecordQuote, carrierRecordRoute) || 0).toLocaleString() }} {{ fmtPriceUnit(carrierRecordRoute) }}</span></div>
              <div class="gl-field-item"><span class="label">报价状态</span><span class="value"><span class="gl-tag" :class="getStatusTagClass(carrierRecordQuote.status)">{{ carrierRecordQuote.status }}</span></span></div>
              <div class="gl-field-item"><span class="label">报价时间</span><span class="value">{{ carrierRecordQuote.time }}</span></div>
              <div v-if="carrierRecordQuote.remark" class="gl-field-item"><span class="label">报价备注</span><span class="value">{{ carrierRecordQuote.remark }}</span></div>
            </div>
            <div v-if="canCarrierEditQuote(carrierRecordRoute, carrierRecordInq)" style="margin-top:14px;text-align:right;">
              <button class="gl-btn gl-btn-primary" @click="openCarrierQuoteEdit(carrierRecordRoute.id)">修改报价</button>
            </div>
          </div>
          <div class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>路线信息</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">始发地</span><span class="value">{{ carrierRecordRoute.origin }}</span></div>
              <div class="gl-field-item"><span class="label">目的地</span><span class="value">{{ carrierRecordRoute.dest }}</span></div>
              <div class="gl-field-item"><span class="label">货品</span><span class="value">{{ carrierRecordRoute.goods }}</span></div>
              <div class="gl-field-item"><span class="label">配载方式</span><span class="value">{{ carrierRecordRoute.loadMode }}</span></div>
              <div class="gl-field-item"><span class="label">货量</span><span class="value">{{ fmtQty(carrierRecordRoute) }}</span></div>
              <div class="gl-field-item"><span class="label">运输方式</span><span class="value">{{ carrierRecordRoute.transport }}</span></div>
              <div class="gl-field-item"><span class="label">竞价截止时间</span><span class="value">{{ carrierRecordRoute.deadline || '-' }}</span></div>
              <div v-if="carrierRecordRoute.remark" class="gl-field-item"><span class="label">路线备注</span><span class="value">{{ carrierRecordRoute.remark }}</span></div>
            </div>
          </div>
          <!-- 当前说明（锁定） -->
          <div v-if="!canCarrierEditQuote(carrierRecordRoute, carrierRecordInq) && isCarrierQuoteLocked(carrierRecordRoute, carrierRecordQuote) && carrierRecordQuote.status === '已报价'" class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>当前说明</h3></div>
            <p style="color:var(--text-secondary);">当前报价已进入上游待确认版本，暂不支持修改；若后续未被继续采用，且仍在报价期内，可再次修改。</p>
          </div>
          <!-- 成交信息 -->
          <div v-if="carrierRecordQuote.status === '已成交' && carrierRecordRoute.shippingOrder" class="gl-card">
            <div class="gl-sec-title"><div class="bar"></div><h3>成交信息</h3></div>
            <div class="gl-info-grid" style="grid-template-columns:repeat(3,1fr);">
              <div class="gl-field-item"><span class="label">托运单号</span><span class="value" style="color:var(--primary)">{{ carrierRecordRoute.shippingOrder }}</span></div>
              <template v-if="carrierRecordRoute.selectedCarrier === CURRENT_CARRIER && carrierRecordRoute.confirmPrice">
                <div class="gl-field-item"><span class="label">运输总价</span><span class="value money">{{ fmtMoney(carrierRecordRoute.confirmPrice) }}</span></div>
                <div class="gl-field-item"><span class="label">运输单价</span><span class="value">{{ unitPriceOf(carrierRecordRoute.confirmPrice, carrierRecordRoute) }}</span></div>
              </template>
            </div>
          </div>
          <!-- 未入围 -->
          <div v-if="carrierRecordQuote.status === '未入围'" class="gl-card" style="border-color:var(--warning-text);">
            <div class="gl-sec-title"><div class="bar" style="background:var(--warning-text);"></div><h3>未入围提示</h3></div>
            <p style="color:var(--text-secondary);">您的报价未中标，货主已选择其他承运商。感谢您的参与。</p>
          </div>
        </template>
        <div v-else class="gl-card">未找到记录</div>
      </div>
    </div>

    <!-- ============ 发布到询价大厅弹窗 ============ -->
    <div v-if="publishModalShow" class="gl-modal-overlay" @click.self="publishModalShow = false">
      <div class="gl-modal">
        <div class="gl-modal-header"><h4>发布到询价大厅</h4><button class="gl-modal-close" @click="publishModalShow = false">✕</button></div>
        <div class="gl-modal-body">
          <div style="margin-bottom:16px;padding:12px;background:var(--page-bg);border-radius:var(--radius-input);"><strong>已选 {{ publishTargets.length }} 条路线</strong></div>
          <div class="gl-form-row"><div class="gl-form-group">
            <label class="gl-form-label"><span class="req">*</span> 竞价截止时间</label>
            <input class="gl-form-input" type="datetime-local" v-model="pubDeadline" />
          </div></div>
          <div class="gl-form-row"><div class="gl-form-group">
            <label class="gl-form-label">发布备注</label>
            <textarea class="gl-form-textarea" v-model="pubNote" placeholder="选填"></textarea>
          </div></div>
        </div>
        <div class="gl-modal-footer">
          <button class="gl-btn gl-btn-secondary" @click="publishModalShow = false">取消</button>
          <button class="gl-btn gl-btn-primary" @click="confirmPublish">确认发布</button>
        </div>
      </div>
    </div>

    <!-- ============ 通用确认弹窗 ============ -->
    <div v-if="confirmModal.show" class="gl-modal-overlay" @click.self="confirmModal.show = false">
      <div class="gl-modal">
        <div class="gl-modal-header"><h4>{{ confirmModal.title }}</h4><button class="gl-modal-close" @click="confirmModal.show = false">✕</button></div>
        <div class="gl-modal-body">
          <p style="font-size:14px;line-height:22px;">{{ confirmModal.body }}</p>
          <div v-if="confirmModal.extraType === 'cancelReason'" class="gl-form-group" style="margin-top:12px;">
            <label class="gl-form-label"><span class="req">*</span> 取消原因</label>
            <textarea class="gl-form-textarea" v-model="confirmModal.extraValue" placeholder="请填写取消原因" maxlength="200"></textarea>
          </div>
        </div>
        <div class="gl-modal-footer">
          <button class="gl-btn gl-btn-secondary" @click="confirmModal.show = false">取消</button>
          <button class="gl-btn gl-btn-primary" @click="confirmModal.onConfirm">确认</button>
        </div>
      </div>
    </div>

    <!-- ============ 货主拒绝路线弹窗 ============ -->
    <div v-if="rejectModalShow" class="gl-modal-overlay" @click.self="rejectModalShow = false">
      <div class="gl-modal">
        <div class="gl-modal-header"><h4>拒绝路线报价</h4><button class="gl-modal-close" @click="rejectModalShow = false">✕</button></div>
        <div class="gl-modal-body">
          <p style="margin-bottom:12px;font-size:14px;">{{ rejectInfo }}</p>
          <div class="gl-form-group">
            <label class="gl-form-label"><span class="req">*</span> 拒绝原因</label>
            <textarea class="gl-form-textarea" v-model="rejectReason" placeholder="请填写拒绝原因" maxlength="200"></textarea>
          </div>
        </div>
        <div class="gl-modal-footer">
          <button class="gl-btn gl-btn-secondary" @click="rejectModalShow = false">取消</button>
          <button class="gl-btn gl-btn-primary" style="background:var(--error-text);box-shadow:none;" @click="confirmReject">确认拒绝</button>
        </div>
      </div>
    </div>

    <!-- ============ 无车拒绝承接弹窗 ============ -->
    <div v-if="nvccRejectModalShow" class="gl-modal-overlay" @click.self="nvccRejectModalShow = false">
      <div class="gl-modal">
        <div class="gl-modal-header"><h4>拒绝承接</h4><button class="gl-modal-close" @click="nvccRejectModalShow = false">✕</button></div>
        <div class="gl-modal-body">
          <p style="margin-bottom:12px;font-size:14px;">{{ nvccRejectInfo }}</p>
          <div class="gl-form-group">
            <label class="gl-form-label"><span class="req">*</span> 拒绝原因</label>
            <textarea class="gl-form-textarea" v-model="nvccRejectReason" placeholder="请填写拒绝承接原因" maxlength="200"></textarea>
          </div>
        </div>
        <div class="gl-modal-footer">
          <button class="gl-btn gl-btn-secondary" @click="nvccRejectModalShow = false">取消</button>
          <button class="gl-btn gl-btn-primary" style="background:var(--error-text);box-shadow:none;" @click="confirmNvccReject">确认拒绝</button>
        </div>
      </div>
    </div>

    <!-- ============ 抽屉（无车承运人路线处理） ============ -->
    <div v-if="drawerShow" class="gl-drawer-mask" @click="closeDrawer"></div>
    <div v-if="drawerShow" class="gl-drawer">
      <div class="gl-drawer-header"><h3>{{ drawerTitle }}</h3><button class="gl-modal-close" @click="closeDrawer">✕</button></div>
      <div class="gl-drawer-body">
        <template v-if="drawerRoute">
          <!-- 路线信息 -->
          <div class="gl-drawer-section">
            <div class="gl-drawer-section-title">路线信息</div>
            <div class="gl-drawer-grid">
              <div class="gl-field-item"><span class="label">始发地</span><span class="value">{{ drawerRoute.origin }}</span></div>
              <div class="gl-field-item"><span class="label">目的地</span><span class="value">{{ drawerRoute.dest }}</span></div>
              <div class="gl-field-item"><span class="label">货品</span><span class="value">{{ drawerRoute.goods }}</span></div>
              <div class="gl-field-item"><span class="label">配载方式</span><span class="value">{{ drawerRoute.loadMode }}</span></div>
              <div class="gl-field-item"><span class="label">货量</span><span class="value">{{ fmtQty(drawerRoute) }}</span></div>
              <div class="gl-field-item"><span class="label">运输方式</span><span class="value">{{ drawerRoute.transport }}</span></div>
              <div v-if="drawerRoute.remark" class="gl-field-item"><span class="label">路线备注</span><span class="value">{{ drawerRoute.remark }}</span></div>
            </div>
          </div>

          <!-- 待承接 -->
          <div v-if="drawerInq && drawerInq.status === '待承接'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">承接前说明</div>
            <div class="gl-novcc-info-bar"><span>当前询价单尚未承接，路线信息仅供查看。请先返回详情页顶部完成承接确认，承接后即可在当前详情页直接发布路线到询价大厅。</span></div>
          </div>
          <!-- 已拒绝 -->
          <div v-else-if="drawerInq && drawerInq.status === '已拒绝'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">拒绝结果</div>
            <div class="gl-drawer-grid">
              <div class="gl-field-item"><span class="label">拒绝原因</span><span class="value" style="color:var(--error-text)">{{ drawerInq.rejectReason || '-' }}</span></div>
              <div class="gl-field-item"><span class="label">拒绝时间</span><span class="value">{{ drawerInq.rejectTime || '-' }}</span></div>
            </div>
          </div>
          <!-- 已取消 -->
          <div v-else-if="drawerInq && drawerInq.status === '已取消'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">取消结果</div>
            <div class="gl-drawer-grid">
              <div class="gl-field-item"><span class="label">取消原因</span><span class="value" style="color:var(--warning-text)">{{ drawerInq.cancelReason || '-' }}</span></div>
              <div class="gl-field-item"><span class="label">取消时间</span><span class="value">{{ drawerInq.cancelTime || '-' }}</span></div>
            </div>
          </div>
          <!-- 待处理：发布设置 -->
          <div v-else-if="drawerRoute.status === '待处理'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">发布设置</div>
            <div class="gl-form-row"><div class="gl-form-group">
              <label class="gl-form-label"><span class="req">*</span> 竞价截止时间</label>
              <input class="gl-form-input" type="datetime-local" v-model="dDeadline" />
            </div></div>
            <div class="gl-form-row"><div class="gl-form-group">
              <label class="gl-form-label">发布备注</label>
              <textarea class="gl-form-textarea" v-model="dPubNote" placeholder="选填"></textarea>
            </div></div>
          </div>
          <!-- 报价中 无报价 -->
          <div v-else-if="drawerRoute.status === '报价中' && (!drawerRoute.quotes || !drawerRoute.quotes.length)" class="gl-drawer-section">
            <div class="gl-drawer-section-title">发布信息</div>
            <div class="gl-novcc-info-bar">
              <span>报价截止：<span class="hl">{{ drawerRoute.deadline || '-' }}</span></span>
              <span>已收到 <span class="hl">0</span> 个报价</span>
              <span v-if="drawerRoute.publishNote">备注：{{ drawerRoute.publishNote }}</span>
            </div>
            <div style="text-align:center;padding:32px 0;color:var(--text-tertiary);">暂无承运商报价，请耐心等待</div>
          </div>
          <!-- 报价中 有报价 / 待货主确认 / 已驳回：报价卡片 + 提交表单 -->
          <template v-else-if="['报价中','待货主确认','已驳回'].includes(drawerRoute.status) && drawerRoute.quotes && drawerRoute.quotes.length">
            <div v-if="drawerRoute.status !== '已驳回'" class="gl-drawer-section">
              <div class="gl-drawer-section-title">发布信息</div>
              <div class="gl-novcc-info-bar">
                <span>报价截止：<span class="hl">{{ drawerRoute.deadline || '-' }}</span></span>
                <span>已收到 <span class="hl">{{ drawerRoute.quotes.length }}</span> 个报价</span>
              </div>
            </div>
            <div v-if="drawerRoute.status === '待货主确认'" class="gl-drawer-section">
              <div class="gl-drawer-section-title">已提交货主报价</div>
              <div class="gl-drawer-grid">
                <div v-for="fi in selectedCarrierPricingFields(drawerRoute, '意向承运商')" :key="'s1'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                <div class="gl-field-item"><span class="label">加价方式</span><span class="value">{{ drawerRoute.markupMode || '-' }}</span></div>
                <div v-if="drawerRoute.markupMode === '按比例加价'" class="gl-field-item"><span class="label">加价比例</span><span class="value">{{ drawerRoute.markupValue || 0 }}%</span></div>
                <div v-else-if="drawerRoute.markupMode === '按固定金额加价'" class="gl-field-item"><span class="label">加价金额</span><span class="value">{{ markupAmountDisplay(drawerRoute) }}</span></div>
                <div v-for="fi in ownerPricingFields(drawerRoute, '货主')" :key="'s2'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                <div class="gl-field-item"><span class="label">提交说明</span><span class="value">{{ drawerRoute.fillNote || '-' }}</span></div>
                <div class="gl-field-item"><span class="label">提交时间</span><span class="value">{{ drawerRoute.submitTime || '-' }}</span></div>
              </div>
            </div>
            <div v-if="drawerRoute.status === '已驳回'" class="gl-drawer-section">
              <div class="gl-drawer-section-title">驳回信息</div>
              <div class="gl-drawer-grid">
                <div class="gl-field-item"><span class="label">驳回原因</span><span class="value" style="color:var(--error-text)">{{ drawerRoute.rejectReason || '-' }}</span></div>
                <div class="gl-field-item"><span class="label">驳回时间</span><span class="value">{{ drawerRoute.rejectTime || '-' }}</span></div>
                <div v-for="fi in selectedCarrierPricingFields(drawerRoute, '意向承运商')" :key="'s3'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
                <div v-for="fi in ownerPricingFields(drawerRoute, '货主')" :key="'s4'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
              </div>
            </div>
            <div class="gl-drawer-section">
              <div class="gl-drawer-section-title">{{ drawerRoute.status === '报价中' ? '承运商报价（点击选择基准报价）' : (drawerRoute.status === '待货主确认' ? '最新承运商报价（可改选并重新提交）' : '重新提交货主报价') }}</div>
              <div v-if="drawerRoute.status === '报价中'" class="gl-novcc-info-bar"><span>最低报价总价：<span class="hl">{{ fmtMoney(minQuoteTotal(drawerRoute)) }}</span></span></div>
              <div
                v-for="q in drawerRoute.quotes"
                :key="q.carrier"
                class="gl-quote-card"
                :class="{ selected: drawerRoute.selectedCarrier === q.carrier }"
                @click="drawerSelectCarrier(q.carrier)"
              >
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <div>
                    <div style="font-weight:600;margin-bottom:6px;">{{ q.carrier }}</div>
                    <div style="font-size:12px;color:var(--text-tertiary);display:flex;gap:12px;flex-wrap:wrap;">
                      <span>报价方式：{{ quoteModeText(q) }}</span>
                      <span>总价：<span style="font-size:15px;font-weight:600;color:var(--primary)">{{ fmtMoney(quoteTotal(q)) }}</span></span>
                      <span>单价：{{ (quoteUnitPrice(q, drawerRoute) || 0).toLocaleString() }} {{ fmtPriceUnit(drawerRoute) }}</span>
                      <span v-if="q.remark">备注：{{ q.remark }}</span>
                    </div>
                  </div>
                  <div class="gl-tick"></div>
                </div>
              </div>
            </div>
            <!-- 提交给货主报价表单 -->
            <div class="gl-drawer-section">
              <div class="gl-drawer-section-title">提交给货主报价</div>
              <div class="gl-quote-submit-grid">
                <input type="hidden" :value="finalQuoteBaseAmount(drawerRoute)" />
                <div class="gl-form-group gl-full-span">
                  <label class="gl-form-label"><span class="req">*</span> 加价方式</label>
                  <div class="gl-radio-group">
                    <label><input type="radio" v-model="dMarkupMode" value="按比例加价" /> 按比例加价</label>
                    <label><input type="radio" v-model="dMarkupMode" value="按固定金额加价" /> 按固定金额加价</label>
                    <label><input type="radio" v-model="dMarkupMode" value="直接填写" /> {{ drawerFollowUnit ? '直接填写运输单价' : '直接填写运输总价' }}</label>
                  </div>
                  <div class="gl-quote-submit-hint">当前按已选基准报价生成对货主报价，货主侧仅查看无车承运人提交的运输总价和运输单价。</div>
                </div>
                <div v-if="dMarkupMode !== '直接填写'" class="gl-form-group">
                  <label class="gl-form-label"><span class="req">*</span> {{ dMarkupLabelText }}</label>
                  <input class="gl-form-input" type="number" v-model="dMarkupValue" placeholder="请填写" />
                </div>
                <div v-if="dMarkupMode === '直接填写'" class="gl-form-group">
                  <label class="gl-form-label"><span class="req">*</span> {{ drawerFollowUnit ? '加价后运输单价' : '加价后运输总价' }}({{ drawerMetricUnit }})</label>
                  <input class="gl-form-input" type="number" v-model="dFinalPrice" :placeholder="drawerFollowUnit ? '请填写运输单价' : '请填写运输总价'" />
                </div>
                <div class="gl-form-group"><label class="gl-form-label">运输总价</label><input class="gl-form-input" :value="dFinalTotalText" disabled /></div>
                <div class="gl-form-group"><label class="gl-form-label">运输单价</label><input class="gl-form-input" :value="dFinalUnitText" disabled /></div>
                <div class="gl-form-group gl-full-span"><label class="gl-form-label">提交说明</label><textarea class="gl-form-textarea" v-model="dSubmitNote" placeholder="选填" style="height:60px;"></textarea></div>
              </div>
            </div>
          </template>
          <!-- 已确认 -->
          <div v-else-if="drawerRoute.status === '已确认'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">确认结果</div>
            <div class="gl-drawer-grid">
              <div v-for="fi in selectedCarrierPricingFields(drawerRoute, '下游承运商')" :key="'cf1'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
              <div v-if="drawerRoute.markupMode" class="gl-field-item"><span class="label">加价方式</span><span class="value">{{ drawerRoute.markupMode }}</span></div>
              <div v-for="fi in ownerPricingFields(drawerRoute, '货主')" :key="'cf2'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
            </div>
            <div style="margin-top:12px;text-align:center;"><span class="gl-tag gl-tag-success">货主已确认</span></div>
          </div>
          <!-- 已生成托运单 -->
          <div v-else-if="drawerRoute.status === '已生成托运单'" class="gl-drawer-section">
            <div class="gl-drawer-section-title">托运单信息</div>
            <div class="gl-drawer-grid">
              <div v-for="fi in selectedCarrierPricingFields(drawerRoute, '下游承运商')" :key="'sd1'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
              <div v-for="fi in ownerPricingFields(drawerRoute, '货主')" :key="'sd2'+fi.label" class="gl-field-item"><span class="label">{{ fi.label }}</span><span class="value" :class="{ money: fi.money }">{{ fi.value }}</span></div>
              <div class="gl-field-item"><span class="label">托运单号</span><span class="value">{{ drawerRoute.shippingOrder || '-' }}</span></div>
            </div>
          </div>
        </template>
      </div>
      <div class="gl-drawer-footer">
        <button class="gl-btn gl-btn-secondary" @click="closeDrawer">{{ drawerCancelText }}</button>
        <button v-if="drawerConfirmText" class="gl-btn gl-btn-primary" @click="drawerConfirm">{{ drawerConfirmText }}</button>
      </div>
    </div>

    <!-- toast -->
    <div v-if="toast.show" class="gl-toast" :class="'gl-toast-' + toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, watchEffect } from 'vue'
import BackBar from '../../src/components/BackBar.vue'
import {
  initialInquiries, CURRENT_CARRIER, CURRENT_NVOCC, CONFIG,
  typeOptions, loadModeOptions, unitMap, transportOptions,
  originOptions, destOptions, goodsOptions, goodsRecommend,
  shipperStatusTabs, nvoccStatusTabs, getStatusTagClass,
} from './mock-data'

// 无车承运人选项（来自 CONFIG）
const nvoccOptions = CONFIG.nvoccs
import './guanglin-styles.css'

// ==================== 数据 ====================
const inquiries = ref(JSON.parse(JSON.stringify(initialInquiries)))

// ==================== 工具函数（严格按源） ====================
function nowTS() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}
function fmtQty(r) { return (r.quantity || '-') + ' ' + (r.unit || '') }
function fmtMoney(v) { const n = parseFloat(v); if (!n && n !== 0) return '-'; return '¥' + n.toLocaleString() }
function fmtPriceUnit(r) { return '元/' + (r && r.unit ? r.unit : '单位') }
function quoteTotal(q) { return q && q.totalAmount != null ? parseFloat(q.totalAmount || 0) : parseFloat(q && q.amount || 0) }
function quoteUnitPrice(q, r) {
  if (q && q.unitPrice != null) return parseFloat(q.unitPrice || 0)
  const total = quoteTotal(q), qty = parseFloat(r && r.quantity || 0)
  if (!qty) return 0
  return Math.round(total / qty * 100) / 100
}
function quoteModeText(q) { return q && q.quoteMode ? q.quoteMode : '按运输总价报价' }
function unitPriceOf(total, r) {
  const u = (parseFloat(total || 0) / (parseFloat(r && r.quantity || 1) || 1)) || 0
  return u.toFixed(2) + ' ' + fmtPriceUnit(r)
}
function selectedQuote(r) {
  return r && r.selectedCarrier && r.quotes ? r.quotes.find(item => item.carrier === r.selectedCarrier) : null
}
function finalQuoteModeText(r) { return quoteModeText(selectedQuote(r)) }
function finalQuoteBaseAmount(r) {
  const q = selectedQuote(r)
  if (!q) return 0
  return finalQuoteModeText(r) === '按运输单价报价' ? (quoteUnitPrice(q, r) || 0) : (quoteTotal(q) || 0)
}
function minQuoteTotal(r) {
  if (!r.quotes || !r.quotes.length) return 0
  return Math.min.apply(null, r.quotes.map(q => quoteTotal(q)))
}
function findCarrierQuote(r, carrier) {
  return r && r.quotes ? r.quotes.find(q => q.carrier === carrier) : null
}
function parseDateTimeValue(v) {
  if (!v) return null
  const s = String(v).trim().replace(' ', 'T')
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
function isDeadlinePassed(v) {
  const d = parseDateTimeValue(v)
  return !!(d && d.getTime() < Date.now())
}
function isRouteQuotePoolOpen(r, inq) {
  if (!r || !inq) return false
  if (['草稿', '待承接', '已拒绝', '已取消'].indexOf(inq.status) > -1) return false
  if (['报价中', '待货主确认', '已驳回'].indexOf(r.status) === -1) return false
  if (!r.deadline) return false
  return !isDeadlinePassed(r.deadline)
}
function isCarrierQuoteLocked(r, q) {
  if (!r || !q) return false
  return r.status === '待货主确认' && r.selectedCarrier === q.carrier
}
function canCarrierEditQuote(r, inq, carrier) {
  carrier = carrier || CURRENT_CARRIER
  const q = findCarrierQuote(r, carrier)
  return !!(q && isRouteQuotePoolOpen(r, inq) && !isCarrierQuoteLocked(r, q))
}
function findRoute(rid) {
  for (let i = 0; i < inquiries.value.length; i++) {
    const r = inquiries.value[i].routes.find(x => x.id === rid)
    if (r) return { route: r, inquiry: inquiries.value[i] }
  }
  return null
}

// 字段渲染辅助：返回 [{label, value(HTML), money}]
function selectedCarrierPricingFields(r, opts) {
  opts = opts || {}
  const q = selectedQuote(r)
  const label = opts.carrierLabel || selectedCarrierRoleLabel(r)
  return [
    { label, value: (r && r.selectedCarrier ? r.selectedCarrier : '-') },
    { label: '承运商运输总价', value: q ? fmtMoney(quoteTotal(q)) : '-' },
    { label: '承运商运输单价', value: q ? quoteUnitPrice(q, r).toFixed(2) + ' ' + fmtPriceUnit(r) : '-' },
  ]
}
function ownerPricingFields(r, prefix) {
  const total = parseFloat(r && r.confirmPrice || 0) || 0
  const unit = (total / (parseFloat(r && r.quantity || 1) || 1)) || 0
  const baseLabel = prefix || '货主'
  return [
    { label: baseLabel + '运输总价', value: r && r.confirmPrice ? fmtMoney(r.confirmPrice) : '-', money: true },
    { label: baseLabel + '运输单价', value: r && r.confirmPrice ? unit.toFixed(2) + ' ' + fmtPriceUnit(r) : '-' },
  ]
}
function selectedCarrierRoleLabel(r) {
  return ['已确认', '已生成托运单'].indexOf(r && r.status) > -1 ? '下游承运商' : '意向承运商'
}

// ==================== 状态计算（严格按源） ====================
function computeMasterStatus(inq) {
  if (inq.status === '已拒绝') return '已拒绝'
  if (inq.status === '已取消') return '已取消'
  if (inq.status === '草稿') return '草稿'
  const rs = inq.routes
  if (rs.length > 0 && rs.every(r => r.status === '已生成托运单')) return '已完成'
  if (rs.some(r => r.status === '待货主确认')) return '待确认'
  const hasPublished = rs.some(r => r.status !== '待处理')
  if (hasPublished) return '已发布'
  if (inq.acceptTime) return '已承接'
  return '待承接'
}
function syncStatus(inq) { inq.status = computeMasterStatus(inq) }
function displayStatus(inq, role) {
  const s = inq.status
  if (s === '已承接') return role === 'shipper' ? '待报价' : '已承接'
  if (s === '已发布') return role === 'shipper' ? '待报价' : '已发布'
  if (s === '待确认') return role === 'shipper' ? '待确认' : '待货主确认'
  return s
}

// 统一状态同步：依赖 inquiries 的 routes/status 变化时自动重算主单状态
// （替代源文件各 render 函数开头的 DB.inquiries.forEach(syncStatus)，
//  避免在 Vue computed 内部写副作用导致潜在递归更新）
watchEffect(() => {
  inquiries.value.forEach(syncStatus)
})

// ==================== Toast ====================
const toast = reactive({ show: false, msg: '', type: 'success' })
let toastTimer = null
function showToast(msg, type) {
  toast.msg = msg
  toast.type = type || 'success'
  toast.show = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 2500)
}

// ==================== 通用确认弹窗 ====================
const confirmModal = reactive({
  show: false, title: '确认', body: '', extraType: '', extraValue: '', onConfirm: () => {},
})
function openConfirm({ title, body, extraType, extraPlaceholder, onConfirm }) {
  confirmModal.title = title || '确认'
  confirmModal.body = body || ''
  confirmModal.extraType = extraType || ''
  confirmModal.extraValue = ''
  confirmModal.onConfirm = onConfirm || (() => {})
  confirmModal.show = true
}

// ==================== 导航 ====================
const roleList = [
  { key: 'shipper', label: '货主端' },
  { key: 'novcc', label: '无车承运人端' },
  { key: 'carrier', label: '承运商端' },
]
const roleViews = {
  shipper: [
    { id: 'shipper-list', label: '货源询价' },
    { id: 'shipper-create', label: '新增', hidden: true },
    { id: 'shipper-detail', label: '详情', hidden: true },
  ],
  novcc: [
    { id: 'novcc-list', label: '询价管理' },
    { id: 'novcc-detail', label: '详情', hidden: true },
  ],
  carrier: [
    { id: 'carrier-hall', label: '询价大厅' },
    { id: 'carrier-quote', label: '报价', hidden: true },
    { id: 'carrier-records', label: '我的报价记录' },
    { id: 'carrier-record-detail', label: '报价详情', hidden: true },
  ],
}
const roleNames = { shipper: '货源询价', novcc: '询价管理', carrier: '询价大厅' }
const currentRole = ref('shipper')
const currentView = ref('shipper-list')
const navPage = computed(() => roleNames[currentRole.value])
const visibleViews = computed(() => roleViews[currentRole.value].filter(v => !v.hidden))

function switchRole(role) {
  currentRole.value = role
  resetSelectionState()
  const first = roleViews[role].filter(v => !v.hidden)[0]
  showView(first.id)
}
// 统一清空各端选中状态，避免 role 切换/详情切换时残留脏数据
function resetSelectionState() {
  detailInqId.value = null
  novccInqId.value = null
  carrierQuoteRid.value = null
  carrierRecordRid.value = null
  drawerRid.value = null
  carrierQuoteEditMode.value = false
  drawerShow.value = false
  // 清空 checkbox map
  Object.keys(detailChkMap).forEach(k => { delete detailChkMap[k] })
  Object.keys(pubChkMap).forEach(k => { delete pubChkMap[k] })
}
function showView(vid) {
  currentView.value = vid
}

// ==================== 货主端：列表 ====================
const shipperFilterKw = ref('')
const shipperFilterType = ref('')
const shipperFilterDateFrom = ref('')
const shipperFilterDateTo = ref('')
const shipperActiveTab = ref('全部')

function resetShipperFilter() {
  shipperFilterKw.value = ''
  shipperFilterType.value = ''
  shipperFilterDateFrom.value = ''
  shipperFilterDateTo.value = ''
}
function shipperPendingCount(inq) { return inq.routes.filter(r => r.status === '待货主确认').length }
function shipperShippingCount(inq) { return inq.routes.filter(r => r.shippingOrder).length }
function shipperStatusCount(s) {
  let c = 0
  if (s === '全部') return inquiries.value.length
  inquiries.value.forEach(i => { if (displayStatus(i, 'shipper') === s) c++ })
  return c
}
const filteredShipperList = computed(() => {
  let list = inquiries.value
  if (shipperActiveTab.value !== '全部') {
    list = list.filter(i => displayStatus(i, 'shipper') === shipperActiveTab.value)
  }
  if (shipperFilterKw.value) {
    const k = shipperFilterKw.value.toLowerCase()
    list = list.filter(i => i.id.toLowerCase().includes(k) || (i.title || '').toLowerCase().includes(k))
  }
  if (shipperFilterType.value) {
    list = list.filter(i => i.type === shipperFilterType.value)
  }
  return list
})

// 列表行操作
function openDetail(id) {
  detailInqId.value = id || (inquiries.value[0] && inquiries.value[0].id)
  Object.keys(detailChkMap).forEach(k => { delete detailChkMap[k] })
  showView('shipper-detail')
}
function editDraft(id) {
  const inq = inquiries.value.find(i => i.id === id)
  if (!inq) return
  loadInquiryToCreate(inq)
  showView('shipper-create')
}
function publishFromList(id) {
  openConfirm({
    title: '发布确认',
    body: '确定要发布该货源询价吗？',
    onConfirm: () => {
      const inq = inquiries.value.find(i => i.id === id)
      if (inq) {
        inq.status = '待承接'
        inq.publishTime = nowTS()
        inq.routes.forEach(r => { r.status = '待处理' })
      }
      confirmModal.show = false
      showToast('发布成功，等待无车承运人承接', 'success')
    },
  })
}
function deleteDraft(id) {
  openConfirm({
    title: '删除确认',
    body: '确定要删除该货源询价草稿吗？',
    onConfirm: () => {
      inquiries.value = inquiries.value.filter(i => i.id !== id)
      confirmModal.show = false
      showToast('已删除', 'success')
    },
  })
}

// ==================== 货主端：新增/编辑 ====================
const editingInquiryId = ref(null)
const createForm = reactive({
  type: '', title: '', owner: '广西广林木业有限公司', targetNvocc: '', desc: '',
})
const editRoutes = ref([])

function cloneDraftRoutes(routes, resetStatus) {
  return (routes || []).map(r => ({
    origin: r.origin || '', dest: r.dest || '', goods: r.goods || '',
    loadMode: r.loadMode || '按重量', quantity: r.quantity || '', unit: r.unit || '吨',
    transport: r.transport || '汽运', remark: r.remark || '', _chk: false,
    status: resetStatus ? '待处理' : (r.status || '待处理'),
    quotes: resetStatus ? [] : (r.quotes || []),
    deadline: resetStatus ? '' : (r.deadline || ''),
    publishNote: resetStatus ? '' : (r.publishNote || ''),
  }))
}
function clearCreateForm() {
  editingInquiryId.value = null
  createForm.type = ''
  createForm.title = ''
  createForm.owner = '广西广林木业有限公司'
  createForm.targetNvocc = ''
  createForm.desc = ''
  editRoutes.value = []
}
function loadInquiryToCreate(inq) {
  if (!inq) return
  editingInquiryId.value = inq.id
  createForm.type = inq.type || ''
  createForm.title = inq.title || ''
  createForm.owner = inq.owner || '广西广林木业有限公司'
  createForm.targetNvocc = inq.targetNvocc || ''
  createForm.desc = inq.desc || ''
  editRoutes.value = cloneDraftRoutes(inq.routes || [], false)
}
function openCreateAsNew() {
  clearCreateForm()
  showView('shipper-create')
}
function isRouteDup(i) {
  const r = editRoutes.value[i]
  return r.origin && r.dest && r.goods && editRoutes.value.some((r2, j) => j !== i && r2.origin === r.origin && r2.dest === r.dest && r2.goods === r.goods)
}
function onRouteFieldChange(i, field, v) {
  const r = editRoutes.value[i]
  r[field] = v
  if (field === 'goods') {
    const rec = goodsRecommend[v]
    if (rec) {
      r.loadMode = rec.loadMode
      r.unit = rec.unit
    }
  } else if (field === 'loadMode') {
    const u = unitMap[v] || []
    r.unit = u[0] || ''
  }
}
function addInlineRoute() {
  editRoutes.value.push({ origin: '', dest: '', goods: '', loadMode: '按重量', quantity: '', unit: '吨', transport: '汽运', remark: '', _chk: false })
}
const allRouteChk = computed(() => editRoutes.value.length > 0 && editRoutes.value.every(r => r._chk))
function toggleAllRoute(e) {
  const c = e.target.checked
  editRoutes.value.forEach(r => { r._chk = c })
}
function simulateImport() {
  const nr = [
    { origin: '梧州', dest: '珠海', goods: '板材', loadMode: '按重量', quantity: 180, unit: '吨', transport: '汽运', remark: '进口板材' },
    { origin: '南宁', dest: '广州', goods: '原木', loadMode: '按重量', quantity: 500, unit: '吨', transport: '汽运', remark: '' },
  ]
  let a = 0, d = 0
  nr.forEach(n => {
    if (editRoutes.value.some(r => r.origin === n.origin && r.dest === n.dest && r.goods === n.goods)) d++
    else { editRoutes.value.push(Object.assign({}, n, { _chk: false })); a++ }
  })
  showToast('导入完成：新增' + a + '条，跳过重复' + d + '条', d > 0 ? 'warning' : 'success')
}
function batchDeleteRoutes() {
  const sel = editRoutes.value.filter(r => r._chk)
  if (!sel.length) { showToast('请先勾选路线', 'warning'); return }
  openConfirm({
    title: '批量删除',
    body: '确定删除选中的' + sel.length + '条路线？',
    onConfirm: () => {
      editRoutes.value = editRoutes.value.filter(r => !r._chk)
      confirmModal.show = false
      showToast('已删除', 'success')
    },
  })
}
function nextInquiryId() {
  const num = inquiries.value.length + 1
  return 'HYXJ-2026-' + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') + '-' + String(num).padStart(3, '0')
}
function nextRouteSeed() {
  let mx = 0
  inquiries.value.forEach(i => { (i.routes || []).forEach(r => { const n = parseInt(String(r.id || '').replace(/\D/g, '')); if (n > mx) mx = n }) })
  return mx
}
function buildDraftRoutePayload(routes, startIndex) {
  return routes.map((r, i) => ({
    id: 'R' + String(startIndex + i + 1).padStart(3, '0'),
    origin: r.origin, dest: r.dest, goods: r.goods, loadMode: r.loadMode,
    quantity: r.quantity, unit: r.unit, transport: r.transport, remark: r.remark || '',
    status: '待处理', quotes: [], deadline: '', publishNote: '',
  }))
}
function saveDraftInquiry() {
  if (editingInquiryId.value) {
    const draft = inquiries.value.find(i => i.id === editingInquiryId.value)
    if (!draft) return
    draft.type = createForm.type || draft.type || ''
    draft.title = createForm.title.trim() || draft.title || ''
    draft.owner = createForm.owner || draft.owner || '广西广林木业有限公司'
    draft.targetNvocc = createForm.targetNvocc || draft.targetNvocc || ''
    draft.desc = createForm.desc.trim() || ''
    draft.status = '草稿'
    draft.publishTime = ''; draft.acceptTime = ''; draft.rejectReason = ''; draft.rejectTime = ''; draft.cancelReason = ''; draft.cancelTime = ''
    draft.routes = cloneDraftRoutes(editRoutes.value, false).map((r, i) => ({
      id: (draft.routes && draft.routes[i] && draft.routes[i].id) || ('R-DRAFT-' + (i + 1)),
      origin: r.origin, dest: r.dest, goods: r.goods, loadMode: r.loadMode,
      quantity: r.quantity, unit: r.unit, transport: r.transport, remark: r.remark || '',
      status: '待处理', quotes: [], deadline: '', publishNote: '',
    }))
    showToast('草稿已保存', 'success')
    return
  }
  const nid = nextInquiryId(), mx = nextRouteSeed()
  inquiries.value.push({
    id: nid, title: createForm.title.trim() || '未命名货源询价', type: createForm.type || '',
    owner: createForm.owner || '广西广林木业有限公司', targetNvocc: createForm.targetNvocc || '',
    desc: createForm.desc.trim() || '', status: '草稿',
    publishTime: '', acceptTime: '', rejectReason: '', rejectTime: '', cancelReason: '', cancelTime: '',
    routes: buildDraftRoutePayload(editRoutes.value, mx),
  })
  editingInquiryId.value = nid
  showToast('草稿已保存', 'success')
}
function publishInquiry() {
  if (!createForm.type) { showToast('请选择询价类型', 'error'); return }
  if (!createForm.title.trim()) { showToast('请填写询价标题', 'error'); return }
  if (!createForm.targetNvocc) { showToast('请选择询价对象', 'error'); return }
  if (!editRoutes.value.length) { showToast('请至少添加一条路线', 'error'); return }
  if (editRoutes.value.some(r => !r.origin || !r.dest || !r.goods || !r.quantity || r.quantity <= 0)) { showToast('请完整填写所有路线必填字段', 'error'); return }
  openConfirm({
    title: '发布确认',
    body: '确定要发布该货源询价吗？',
    onConfirm: () => {
      if (editingInquiryId.value) {
        const draft = inquiries.value.find(i => i.id === editingInquiryId.value)
        if (draft) {
          const mxDraft = nextRouteSeed()
          draft.title = createForm.title.trim()
          draft.type = createForm.type
          draft.owner = createForm.owner || '广西广林木业有限公司'
          draft.targetNvocc = createForm.targetNvocc
          draft.desc = createForm.desc.trim() || ''
          draft.status = '待承接'; draft.publishTime = nowTS(); draft.acceptTime = ''; draft.rejectReason = ''; draft.rejectTime = ''; draft.cancelReason = ''; draft.cancelTime = ''
          draft.routes = buildDraftRoutePayload(editRoutes.value, mxDraft)
        }
      } else {
        const nid = nextInquiryId(), mx = nextRouteSeed()
        inquiries.value.push({
          id: nid, title: createForm.title.trim(), type: createForm.type,
          owner: '广西广林木业有限公司', targetNvocc: createForm.targetNvocc,
          desc: createForm.desc.trim() || '', status: '待承接', publishTime: nowTS(),
          acceptTime: '', rejectReason: '', rejectTime: '', cancelReason: '', cancelTime: '',
          routes: buildDraftRoutePayload(editRoutes.value, mx),
        })
      }
      clearCreateForm()
      confirmModal.show = false
      showView('shipper-list')
      showToast('发布成功，等待无车承运人承接', 'success')
    },
  })
}

// ==================== 货主端：详情 ====================
const detailInqId = ref(null)
const detailInq = computed(() => {
  if (!detailInqId.value) return null
  const inq = inquiries.value.find(i => i.id === detailInqId.value)
  return inq || null
})
const detailChkMap = reactive({})
function detailProcessingCount(inq) { return inq.routes.filter(r => r.status === '待处理' || r.status === '报价中').length }
function detailPendingCount(inq) { return inq.routes.filter(r => r.status === '待货主确认').length }
function detailRejectedCount(inq) { return inq.routes.filter(r => r.status === '已驳回').length }
function detailConfirmedCount(inq) { return inq.routes.filter(r => r.status === '已确认').length }
function canShowDetailChk(r) { return r.status === '待货主确认' || (r.status === '已确认' && !r.shippingOrder) }
function detailHasPendingOrConfirmed(inq) { return detailPendingCount(inq) > 0 || detailConfirmedCount(inq) > 0 }
const detailAllChk = computed(() => {
  if (!detailInq.value) return false
  const target = detailInq.value.routes.filter(canShowDetailChk)
  return target.length > 0 && target.every(r => detailChkMap[r.id])
})
function toggleAllDetailChk(c) {
  if (!detailInq.value) return
  detailInq.value.routes.forEach(r => { if (canShowDetailChk(r)) detailChkMap[r.id] = c })
}
function confirmRoute(rid) {
  const f = findRoute(rid)
  if (!f) return
  const pr = f.route.confirmPrice || quoteTotal((f.route.quotes.find(q => q.carrier === f.route.selectedCarrier) || {})) || 0
  openConfirm({
    title: '路线确认',
    body: '确认路线 ' + f.route.origin + ' → ' + f.route.dest + ' 的总报价 ' + fmtMoney(pr) + '？',
    onConfirm: () => {
      f.route.status = '已确认'
      syncStatus(f.inquiry)
      confirmModal.show = false
      showToast('路线已确认', 'success')
    },
  })
}
const rejectModalShow = ref(false)
const rejectInfo = ref('')
const rejectReason = ref('')
let rejectRid = null
function rejectRoute(rid) {
  rejectRid = rid
  const f = findRoute(rid)
  if (!f) return
  rejectInfo.value = '路线：' + f.route.origin + ' → ' + f.route.dest + '，运输总价：' + fmtMoney(f.route.confirmPrice || 0)
  rejectReason.value = ''
  rejectModalShow.value = true
}
function confirmReject() {
  if (!rejectReason.value.trim()) { showToast('请填写拒绝原因', 'error'); return }
  const f = findRoute(rejectRid)
  if (!f) return
  f.route.status = '已驳回'
  f.route.rejectReason = rejectReason.value.trim()
  f.route.rejectTime = nowTS()
  syncStatus(f.inquiry)
  rejectModalShow.value = false
  showToast('路线已驳回', 'success')
}
function batchConfirmRoute() {
  if (!detailInq.value) return
  const ck = detailInq.value.routes.filter(r => detailChkMap[r.id] && r.status === '待货主确认')
  if (!ck.length) { showToast('请先勾选待确认路线', 'warning'); return }
  openConfirm({
    title: '批量确认',
    body: '确定批量确认 ' + ck.length + ' 条路线？',
    onConfirm: () => {
      ck.forEach(r => { r.status = '已确认' })
      if (detailInq.value) syncStatus(detailInq.value)
      confirmModal.show = false
      showToast('已确认 ' + ck.length + ' 条路线', 'success')
    },
  })
}
function genShipping(rid) {
  const f = findRoute(rid)
  if (!f) return
  const cnt = inquiries.value.reduce((s, i) => s + i.routes.filter(r => r.shippingOrder).length, 0)
  f.route.shippingOrder = 'ZY-' + nowTS().slice(0, 10).replace(/-/g, '') + '-' + String(cnt + 1).padStart(3, '0')
  f.route.status = '已生成托运单'
  f.route.quotes.forEach(q => { q.status = q.carrier === f.route.selectedCarrier ? '已成交' : '未入围' })
  syncStatus(f.inquiry)
  showToast('托运单 ' + f.route.shippingOrder + ' 已生成', 'success')
}
function batchGenShipping() {
  if (!detailInq.value) return
  const tg = detailInq.value.routes.filter(r => detailChkMap[r.id] && r.status === '已确认' && !r.shippingOrder)
  if (!tg.length) { showToast('请先勾选已确认路线', 'warning'); return }
  openConfirm({
    title: '批量生成托运单',
    body: '确定生成 ' + tg.length + ' 张托运单？',
    onConfirm: () => {
      let cnt = inquiries.value.reduce((s, i) => s + i.routes.filter(r => r.shippingOrder).length, 0)
      tg.forEach(r => {
        cnt++
        r.shippingOrder = 'ZY-' + nowTS().slice(0, 10).replace(/-/g, '') + '-' + String(cnt).padStart(3, '0')
        r.status = '已生成托运单'
        r.quotes.forEach(q => { q.status = q.carrier === r.selectedCarrier ? '已成交' : '未入围' })
      })
      if (detailInq.value) syncStatus(detailInq.value)
      confirmModal.show = false
      showToast('已生成 ' + tg.length + ' 张托运单', 'success')
    },
  })
}

// ==================== 无车承运人端：列表 ====================
const novccFilterKw = ref('')
const novccFilterType = ref('')
const novccFilterDateFrom = ref('')
const novccFilterDateTo = ref('')
const novccActiveTab = ref('全部')
function resetNovccFilter() {
  novccFilterKw.value = ''
  novccFilterType.value = ''
  novccFilterDateFrom.value = ''
  novccFilterDateTo.value = ''
}
function novccRouteCount(inq, status) { return inq.routes.filter(r => r.status === status).length }
function novccDoneCount(inq) { return inq.routes.filter(r => r.status === '已确认' || r.status === '已生成托运单').length }
function nvoccStatusCount(s) {
  const received = inquiries.value.filter(i => i.status !== '草稿' && i.targetNvocc === CURRENT_NVOCC)
  if (s === '全部') return received.length
  let c = 0
  received.forEach(i => { if (displayStatus(i, 'novcc') === s) c++ })
  return c
}
const filteredNvoccList = computed(() => {
  let list = inquiries.value.filter(i => i.status !== '草稿' && i.targetNvocc === CURRENT_NVOCC)
  if (novccActiveTab.value !== '全部') {
    list = list.filter(i => displayStatus(i, 'novcc') === novccActiveTab.value)
  }
  if (novccFilterKw.value) {
    const k = novccFilterKw.value.toLowerCase()
    list = list.filter(i => (i.owner || '').toLowerCase().includes(k) || (i.title || '').toLowerCase().includes(k) || (i.id || '').toLowerCase().includes(k))
  }
  if (novccFilterType.value) {
    list = list.filter(i => i.type === novccFilterType.value)
  }
  return list
})

// 承接 / 拒绝
function acceptInquiry(id) {
  openConfirm({
    title: '确认承接',
    body: '确定要承接该货源询价吗？承接后即可管理路线并发布到竞价大厅。',
    onConfirm: () => {
      const inq = inquiries.value.find(i => i.id === id)
      if (inq) {
        inq.acceptTime = nowTS()
        inq.rejectReason = ''
        inq.rejectTime = ''
      }
      if (inq) syncStatus(inq)
      confirmModal.show = false
      showToast('已承接，可开始管理路线', 'success')
    },
  })
}
const nvccRejectModalShow = ref(false)
const nvccRejectInfo = ref('')
const nvccRejectReason = ref('')
let nvccRejectId = null
function rejectNvccInquiry(id) {
  nvccRejectId = id
  const inq = inquiries.value.find(i => i.id === id)
  nvccRejectInfo.value = '询价单：' + inq.id + ' - ' + inq.title
  nvccRejectReason.value = ''
  nvccRejectModalShow.value = true
}
function confirmNvccReject() {
  if (!nvccRejectReason.value.trim()) { showToast('请填写拒绝原因', 'error'); return }
  const inq = inquiries.value.find(i => i.id === nvccRejectId)
  if (!inq) return
  inq.rejectReason = nvccRejectReason.value.trim()
  inq.rejectTime = nowTS()
  inq.acceptTime = ''
  inq.status = '已拒绝'
  nvccRejectModalShow.value = false
  showToast('已拒绝承接', 'success')
}

// ==================== 无车承运人端：详情 ====================
const novccInqId = ref(null)
function openNovccDetail(id) {
  novccInqId.value = id
  Object.keys(pubChkMap).forEach(k => { delete pubChkMap[k] })
  showView('novcc-detail')
}
const novccInq = computed(() => {
  if (!novccInqId.value) return null
  const inq = inquiries.value.find(i => i.id === novccInqId.value)
  return inq || null
})
const isNovccReadonly = computed(() => {
  if (!novccInq.value) return false
  return ['待承接', '已拒绝', '已取消'].indexOf(novccInq.value.status) > -1
})
const pubChkMap = reactive({})
const pubSelCount = computed(() => {
  if (!novccInq.value) return 0
  return novccInq.value.routes.filter(r => pubChkMap[r.id]).length
})
function novccActionText(r, inq) {
  if (inq && inq.status === '待承接') return '查看路线'
  if (inq && (inq.status === '已拒绝' || inq.status === '已取消')) return '查看路线'
  if (r.status === '待处理') return '发布到竞价大厅'
  if (r.status === '报价中') return r.quotes && r.quotes.length > 0 ? '查看报价并提交货主' : '查看发布信息'
  if (r.status === '待货主确认') return '查看已提交报价'
  if (r.status === '已驳回') return '重新提交货主'
  if (r.status === '已确认') return '查看确认结果'
  if (r.status === '已生成托运单') return '查看托运单'
  return '查看'
}

// ==================== 无车抽屉 ====================
const drawerShow = ref(false)
const drawerRid = ref(null)
const drawerRoute = computed(() => {
  if (!drawerRid.value) return null
  const f = findRoute(drawerRid.value)
  return f ? f.route : null
})
const drawerInq = computed(() => {
  if (!drawerRid.value) return null
  const f = findRoute(drawerRid.value)
  return f ? f.inquiry : null
})
const drawerTitle = computed(() => {
  if (!drawerRoute.value) return '路线处理'
  return drawerRoute.value.id + ' ' + drawerRoute.value.origin + ' → ' + drawerRoute.value.dest
})
// 抽屉发布设置
const dDeadline = ref('2026-08-22T18:00')
const dPubNote = ref('')
// 抽屉加价表单
const dMarkupMode = ref('')
const dMarkupValue = ref('')
const dFinalPrice = ref('')
const dSubmitNote = ref('')
const drawerFollowUnit = computed(() => drawerRoute.value && finalQuoteModeText(drawerRoute.value) === '按运输单价报价')
const drawerMetricUnit = computed(() => drawerFollowUnit.value ? (drawerRoute.value ? fmtPriceUnit(drawerRoute.value) : '单位') : '元')
const dMarkupLabelText = computed(() => {
  if (dMarkupMode.value === '按比例加价') return '加价比例(%)'
  if (dMarkupMode.value === '按固定金额加价') return '加价金额(' + drawerMetricUnit.value + ')'
  return '加价值'
})
// 计算总价/单价
const dFinalTotal = computed(() => {
  if (!drawerRoute.value) return 0
  const qty = parseFloat(drawerRoute.value.quantity || 0) || 0
  const inputVal = parseFloat(dFinalPrice.value || 0) || 0
  const mode = finalQuoteModeText(drawerRoute.value)
  if (mode === '按运输单价报价') return qty ? Math.round(inputVal * qty * 100) / 100 : 0
  return inputVal
})
const dFinalUnit = computed(() => {
  if (!drawerRoute.value) return 0
  const qty = parseFloat(drawerRoute.value.quantity || 0) || 0
  const inputVal = parseFloat(dFinalPrice.value || 0) || 0
  const mode = finalQuoteModeText(drawerRoute.value)
  if (mode === '按运输单价报价') return inputVal
  return qty ? Math.round(inputVal / qty * 100) / 100 : 0
})
const dFinalTotalText = computed(() => dFinalTotal.value ? fmtMoney(dFinalTotal.value) : '-')
const dFinalUnitText = computed(() => dFinalUnit.value ? dFinalUnit.value.toFixed(2) + ' ' + (drawerRoute.value ? fmtPriceUnit(drawerRoute.value) : '') : '-')
// 加价值 → 最终价（按比例/按固定金额时自动算）
function calcFinalPrice() {
  if (!dMarkupMode.value || dMarkupMode.value === '直接填写') return
  const f = findRoute(drawerRid.value)
  if (!f) return
  const ca = finalQuoteBaseAmount(f.route)
  const mv = parseFloat(dMarkupValue.value || 0) || 0
  if (dMarkupMode.value === '按比例加价') dFinalPrice.value = Math.round(ca * (1 + mv / 100) * 100) / 100
  else if (dMarkupMode.value === '按固定金额加价') dFinalPrice.value = Math.round((ca + mv) * 100) / 100
}
watch(dMarkupValue, calcFinalPrice)
watch(dMarkupMode, () => {
  dMarkupValue.value = ''
  dFinalPrice.value = ''
  if (dMarkupMode.value !== '直接填写') calcFinalPrice()
})
function openNovccDrawer(rid) {
  drawerRid.value = rid
  // 重置抽屉表单
  dDeadline.value = '2026-08-22T18:00'
  dPubNote.value = ''
  dMarkupMode.value = ''
  dMarkupValue.value = ''
  dFinalPrice.value = ''
  dSubmitNote.value = ''
  drawerShow.value = true
}
function closeDrawer() {
  drawerShow.value = false
  drawerRid.value = null
}
function drawerSelectCarrier(c) {
  const f = findRoute(drawerRid.value)
  if (!f) return
  f.route.selectedCarrier = c
  showToast('已选择基准报价', 'success')
}
const drawerCancelText = computed(() => {
  if (!drawerRoute.value) return '关闭'
  if (drawerInq.value && ['待承接', '已拒绝', '已取消'].indexOf(drawerInq.value.status) > -1) return '关闭'
  if (drawerRoute.value.status === '待处理') return '取消'
  if (['报价中', '待货主确认', '已驳回'].includes(drawerRoute.value.status) && drawerRoute.value.quotes && drawerRoute.value.quotes.length) return '取消'
  return '关闭'
})
const drawerConfirmText = computed(() => {
  if (!drawerRoute.value) return ''
  if (drawerInq.value && ['待承接', '已拒绝', '已取消'].indexOf(drawerInq.value.status) > -1) return ''
  if (drawerRoute.value.status === '待处理') return '发布到竞价大厅'
  if (drawerRoute.value.status === '报价中' && drawerRoute.value.quotes && drawerRoute.value.quotes.length) return '提交给货主'
  if (drawerRoute.value.status === '待货主确认') return '重新提交给货主'
  if (drawerRoute.value.status === '已驳回') return '重新提交给货主'
  return ''
})
function drawerConfirm() {
  const f = findRoute(drawerRid.value)
  if (!f || !drawerRoute.value) return
  if (drawerRoute.value.status === '待处理') return drawerPublish()
  if (['报价中', '待货主确认', '已驳回'].includes(drawerRoute.value.status)) return drawerSubmit()
}
function drawerPublish() {
  if (!dDeadline.value) { showToast('请填写竞价截止时间', 'error'); return }
  const f = findRoute(drawerRid.value)
  if (!f) return
  f.route.status = '报价中'
  f.route.deadline = dDeadline.value.replace('T', ' ')
  f.route.publishNote = dPubNote.value
  syncStatus(f.inquiry)
  closeDrawer()
  showToast('已发布到竞价大厅', 'success')
}
function drawerSubmit() {
  const f = findRoute(drawerRid.value)
  if (!f) return
  if (!f.route.selectedCarrier) { showToast('请先选择基准报价', 'warning'); return }
  if (!dMarkupMode.value) { showToast('请选择加价方式', 'warning'); return }
  const fp = parseFloat(dFinalPrice.value)
  const displayLabel = finalQuoteModeText(f.route) === '按运输单价报价' ? '运输单价' : '运输总价'
  if (!fp || fp <= 0) { showToast(displayLabel + '必须大于0', 'error'); return }
  const ca = finalQuoteBaseAmount(f.route)
  if (fp < ca) { showToast(displayLabel + '不能小于当前基准报价', 'error'); return }
  let mv = 0
  if (dMarkupMode.value === '按比例加价' || dMarkupMode.value === '按固定金额加价') mv = parseFloat(dMarkupValue.value || 0) || 0
  const qty = parseFloat(f.route.quantity || 0) || 0
  let total = 0
  if (finalQuoteModeText(f.route) === '按运输单价报价') total = qty ? Math.round(fp * qty * 100) / 100 : 0
  else total = fp
  const oldVersion = f.route.submitVersion || 0
  f.route.markupMode = dMarkupMode.value
  f.route.markupValue = mv
  f.route.confirmPrice = total
  f.route.fillNote = dSubmitNote.value
  f.route.submitTime = nowTS()
  f.route.submitVersion = oldVersion + 1
  f.route.status = '待货主确认'
  syncStatus(f.inquiry)
  closeDrawer()
  showToast(oldVersion > 0 ? '已按最新报价重新提交给货主' : '已提交给货主，等待确认', 'success')
}
function markupAmountDisplay(r) {
  return finalQuoteModeText(r) === '按运输单价报价' ? (r.markupValue || 0).toLocaleString() + ' ' + fmtPriceUnit(r) : fmtMoney(r.markupValue || 0)
}

// 批量发布
const publishModalShow = ref(false)
const publishTargets = ref([])
const pubDeadline = ref('2026-08-22T18:00')
const pubNote = ref('')
function batchPublishNovcc() {
  if (!novccInq.value) return
  const ck = novccInq.value.routes.filter(r => pubChkMap[r.id] && r.status === '待处理').map(r => r.id)
  if (!ck.length) { showToast('请先勾选待处理路线', 'warning'); return }
  publishTargets.value = ck
  pubDeadline.value = '2026-08-22T18:00'
  pubNote.value = ''
  publishModalShow.value = true
}
function confirmPublish() {
  if (!pubDeadline.value) { showToast('请填写竞价截止时间', 'error'); return }
  const dl = pubDeadline.value.replace('T', ' ')
  publishTargets.value.forEach(rid => {
    const f = findRoute(rid)
    if (f) {
      f.route.status = '报价中'
      f.route.deadline = dl
      f.route.publishNote = pubNote.value
      syncStatus(f.inquiry)
    }
  })
  publishModalShow.value = false
  showToast('已发布 ' + publishTargets.value.length + ' 条路线', 'success')
}

// ==================== 承运商端：询价大厅 ====================
const hallFilterKw = ref('')
const hallFilterType = ref('')
const hallFilterDateFrom = ref('')
const hallFilterDateTo = ref('')
function resetHallFilter() {
  hallFilterKw.value = ''
  hallFilterType.value = ''
  hallFilterDateFrom.value = ''
  hallFilterDateTo.value = ''
}
const hallItems = computed(() => {
  const items = []
  inquiries.value.forEach(inq => {
    if (['草稿', '待承接', '已承接', '已拒绝', '已取消'].indexOf(inq.status) > -1) return
    inq.routes.forEach(r => {
      if (!isRouteQuotePoolOpen(r, inq)) return
      const my = findCarrierQuote(r, CURRENT_CARRIER)
      if (my) return
      items.push({ inquiry: inq, route: r })
    })
  })
  return items
})
const filteredHallItems = computed(() => {
  let list = hallItems.value
  if (hallFilterKw.value) {
    const k = hallFilterKw.value.toLowerCase()
    list = list.filter(it => (it.route.origin || '').toLowerCase().includes(k) || (it.route.dest || '').toLowerCase().includes(k))
  }
  if (hallFilterType.value) {
    list = list.filter(it => it.inquiry.type === hallFilterType.value)
  }
  return list
})

// ==================== 承运商端：报价 ====================
const carrierQuoteRid = ref(null)
const carrierQuoteEditMode = ref(false)
const carrierQuoteRoute = computed(() => {
  if (!carrierQuoteRid.value) return null
  const f = findRoute(carrierQuoteRid.value)
  return f ? f.route : null
})
const carrierQuoteInq = computed(() => {
  if (!carrierQuoteRid.value) return null
  const f = findRoute(carrierQuoteRid.value)
  return f ? f.inquiry : null
})
const cqMode = ref('按运输单价报价')
const cqPriceInput = ref(0)
const cqRemark = ref('')
const cqCalcText = computed(() => {
  if (!carrierQuoteRoute.value) return '-'
  const qty = parseFloat(carrierQuoteRoute.value.quantity || 0) || 0
  const inputVal = parseFloat(cqPriceInput.value || 0) || 0
  if (cqMode.value === '按运输单价报价') {
    const total = qty ? Math.round(inputVal * qty * 100) / 100 : 0
    return total ? fmtMoney(total) : '-'
  }
  const unit = qty ? Math.round(inputVal / qty * 100) / 100 : 0
  return unit ? unit.toFixed(2) + ' ' + fmtPriceUnit(carrierQuoteRoute.value) : '-'
})
function openCarrierQuote(rid) {
  carrierQuoteRid.value = rid
  carrierQuoteEditMode.value = false
  cqMode.value = '按运输单价报价'
  cqPriceInput.value = 0
  cqRemark.value = ''
  showView('carrier-quote')
}
function openCarrierQuoteEdit(rid) {
  const f = findRoute(rid)
  if (!f) return
  if (!canCarrierEditQuote(f.route, f.inquiry, CURRENT_CARRIER)) { showToast('当前报价已不可修改', 'warning'); return }
  carrierQuoteRid.value = rid
  carrierQuoteEditMode.value = true
  const myQ = findCarrierQuote(f.route, CURRENT_CARRIER)
  const mode = (myQ && carrierQuoteEditMode.value) ? quoteModeText(myQ) : '按运输单价报价'
  cqMode.value = mode
  if (myQ) {
    cqPriceInput.value = mode === '按运输单价报价' ? (quoteUnitPrice(myQ, f.route) || 0) : (quoteTotal(myQ) || 0)
    cqRemark.value = myQ.remark || ''
  }
  showView('carrier-quote')
}
function submitCarrierQuote() {
  const f = findRoute(carrierQuoteRid.value)
  if (!f) return
  const inputVal = parseFloat(cqPriceInput.value)
  if (!cqMode.value) { showToast('请选择报价方式', 'warning'); return }
  if (!inputVal || inputVal <= 0) { showToast('请填写正确的运输报价', 'error'); return }
  if (carrierQuoteEditMode.value && !canCarrierEditQuote(f.route, f.inquiry, CURRENT_CARRIER)) { showToast('当前报价已不可修改', 'warning'); return }
  if (!isRouteQuotePoolOpen(f.route, f.inquiry)) { showToast('当前路线已不在可报价窗口内', 'warning'); return }
  const qty = parseFloat(f.route.quantity || 0) || 0
  let unitPrice = 0, totalAmount = 0
  if (cqMode.value === '按运输单价报价') { unitPrice = inputVal; totalAmount = qty ? Math.round(unitPrice * qty * 100) / 100 : 0 }
  else { totalAmount = inputVal; unitPrice = qty ? Math.round(totalAmount / qty * 100) / 100 : 0 }
  if (!totalAmount || totalAmount <= 0) { showToast('请填写正确的运输报价', 'error'); return }
  if (!f.route.quotes) f.route.quotes = []
  const existing = findCarrierQuote(f.route, CURRENT_CARRIER)
  const ts = nowTS()
  let updated = false
  if (existing) {
    existing.quoteMode = cqMode.value; existing.totalAmount = totalAmount; existing.unitPrice = unitPrice
    existing.remark = cqRemark.value; existing.status = '已报价'; existing.time = ts
    updated = true
  } else {
    f.route.quotes.push({ carrier: CURRENT_CARRIER, quoteMode: cqMode.value, totalAmount, unitPrice, remark: cqRemark.value, status: '已报价', time: ts })
  }
  carrierQuoteEditMode.value = false
  carrierQuoteRid.value = null
  showToast(updated ? '报价已更新' : '报价提交成功', 'success')
  showView('carrier-records')
}

// ==================== 承运商端：报价记录 ====================
const recordFilterStatus = ref('')
const allRecords = computed(() => {
  const recs = []
  inquiries.value.forEach(inq => {
    inq.routes.forEach(r => {
      const q = findCarrierQuote(r, CURRENT_CARRIER)
      if (q) recs.push({ inquiry: inq, route: r, quote: q, qid: 'QT-' + r.id + '-01' })
    })
  })
  return recs
})
const filteredRecords = computed(() => {
  let list = allRecords.value
  if (recordFilterStatus.value) list = list.filter(rec => rec.quote.status === recordFilterStatus.value)
  return list
})

// 报价记录详情
const carrierRecordRid = ref(null)
const carrierRecordRoute = computed(() => {
  if (!carrierRecordRid.value) return null
  const f = findRoute(carrierRecordRid.value)
  return f ? f.route : null
})
const carrierRecordInq = computed(() => {
  if (!carrierRecordRid.value) return null
  const f = findRoute(carrierRecordRid.value)
  return f ? f.inquiry : null
})
const carrierRecordQuote = computed(() => {
  if (!carrierRecordRid.value) return null
  const f = findRoute(carrierRecordRid.value)
  return f ? findCarrierQuote(f.route, CURRENT_CARRIER) : null
})
function openCarrierRecordDetail(rid) {
  carrierRecordRid.value = rid
  showView('carrier-record-detail')
}

// ==================== 取消 / 重新发起 ====================
function cancelInquiry(id) {
  const inq = inquiries.value.find(i => i.id === id)
  openConfirm({
    title: '取消询价',
    body: '确定要取消该询价单吗？取消后双方均可见。',
    extraType: 'cancelReason',
    onConfirm: () => {
      if (!confirmModal.extraValue.trim()) { showToast('请填写取消原因', 'error'); return }
      const inq2 = inquiries.value.find(i => i.id === id)
      if (!inq2) return
      inq2.cancelReason = confirmModal.extraValue.trim()
      inq2.cancelTime = nowTS()
      inq2.status = '已取消'
      confirmModal.show = false
      showToast('询价单已取消', 'success')
    },
  })
}
function reopenInquiry(id) {
  const inq = inquiries.value.find(i => i.id === id)
  if (!inq) return
  const nid = nextInquiryId(), mx = nextRouteSeed()
  inquiries.value.push({
    id: nid, title: inq.title, type: inq.type, owner: inq.owner, targetNvocc: inq.targetNvocc, desc: inq.desc, status: '草稿',
    publishTime: '', acceptTime: '', rejectReason: '', rejectTime: '', cancelReason: '', cancelTime: '',
    routes: buildDraftRoutePayload(cloneDraftRoutes(inq.routes || [], true), mx),
  })
  const draft = inquiries.value.find(item => item.id === nid)
  if (draft) {
    loadInquiryToCreate(draft)
    showView('shipper-create')
  }
  showToast('已生成新草稿单，可修改后再发布', 'success')
}
</script>

<style scoped>
.gl-page-view {
  animation: glFadeUp 0.3s ease;
}
.gl-back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid var(--border); color: var(--text-secondary);
  font-size: 16px; background: var(--white); box-shadow: var(--shadow-xs);
  transition: 0.15s; cursor: pointer;
}
.gl-back-btn:hover {
  border-color: var(--primary); color: var(--primary);
  background: var(--primary-bg); box-shadow: var(--shadow-sm);
}
.gl-date-range { display: flex; align-items: center; gap: 6px; }
.gl-date-range input[type="date"] {
  height: 34px; font-size: 13px; border: 1px solid var(--border);
  border-radius: var(--radius-input); padding: 0 10px;
}
.gl-date-range span { font-size: 13px; color: var(--text-tertiary); padding: 0 2px; }
.gl-filter-strip {
  background: var(--white); border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-light);
  padding: 14px 20px;
}
.gl-filter-strip .gl-form-input { height: 34px; font-size: 13px; border-radius: var(--radius-input); }
.gl-filter-strip .gl-btn-sm { height: 34px; }
.gl-filter-strip .spacer { flex: 1; }
.gl-radio-group { display: flex; gap: 18px; margin-bottom: 14px; flex-wrap: wrap; }
.gl-radio-group label {
  display: flex; align-items: center; gap: 6px; font-size: 13px;
  cursor: pointer; color: var(--text-secondary); padding: 4px 0;
}
.gl-radio-group label input { accent-color: var(--primary); width: 16px; height: 16px; }
/* 弹窗 */
.gl-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,18,35,0.45);
  backdrop-filter: blur(4px); z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.gl-modal {
  background: var(--white); border-radius: var(--radius-card);
  box-shadow: var(--shadow-float); width: 560px; max-height: 80vh; overflow-y: auto;
}
.gl-modal-header {
  padding: 20px 24px 16px; display: flex; align-items: center;
  justify-content: space-between; border-bottom: 1px solid var(--border-light);
}
.gl-modal-header h4 {
  font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.gl-modal-header h4::before {
  content: ''; width: 4px; height: 18px; background: var(--primary); border-radius: 2px;
}
.gl-modal-close {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--text-tertiary); transition: 0.15s; cursor: pointer;
  border: none; background: none;
}
.gl-modal-close:hover { background: var(--error-bg); color: var(--error-text); }
.gl-modal-body { padding: 24px; font-size: 14px; line-height: 22px; }
.gl-modal-footer {
  padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px;
  border-top: 1px solid var(--border-light); background: #FAFBFD;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  min-height: 60px; align-items: center;
}
/* 无车承运人详情 info bar */
.gl-novcc-info-bar {
  display: flex; gap: 20px; padding: 12px 16px; background: var(--page-bg);
  border-radius: 10px; margin-bottom: 14px; font-size: 13px;
  color: var(--text-secondary); line-height: 20px; border: 1px solid var(--border-light);
  flex-wrap: wrap;
}
.gl-novcc-info-bar span { display: flex; align-items: center; gap: 4px; }
.gl-novcc-info-bar .hl { color: var(--primary); font-weight: 600; }
/* 抽屉 */
.gl-drawer-mask { position: fixed; inset: 0; background: rgba(15,18,35,0.25); z-index: 180; }
.gl-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 540px;
  max-width: calc(100vw - 48px); background: var(--white);
  z-index: 190; display: flex; flex-direction: column;
  box-shadow: -4px 0 24px rgba(30,41,76,0.12);
}
.gl-drawer-header {
  padding: 20px 24px; border-bottom: 1px solid var(--border-light);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.gl-drawer-header h3 {
  font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.gl-drawer-header h3::before {
  content: ''; width: 4px; height: 18px; background: var(--primary); border-radius: 2px;
}
.gl-drawer-body { flex: 1; overflow-y: auto; padding: 24px 28px 32px; }
.gl-drawer-footer {
  padding: 16px 24px; border-top: 1px solid var(--border-light);
  background: #FAFBFD; display: flex; justify-content: flex-end; gap: 12px;
  flex-shrink: 0; min-height: 64px; align-items: center;
}
.gl-drawer-section { margin-bottom: 28px; }
.gl-drawer-section:last-child { margin-bottom: 0; }
.gl-drawer-section-title {
  font-size: 14px; font-weight: 600; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-light);
}
.gl-drawer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 28px; }
.gl-drawer-grid .gl-field-item .value { font-size: 13px; }
/* 提交给货主报价 grid */
.gl-quote-submit-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 20px; }
.gl-quote-submit-grid .gl-full-span { grid-column: 1 / -1; }
.gl-quote-submit-hint {
  font-size: 12px; color: var(--text-tertiary); line-height: 20px;
  padding: 8px 12px; background: var(--page-bg); border-radius: 8px; margin-top: 8px;
}
.gl-quote-submit-hint .hl { color: var(--primary); font-weight: 600; }
/* quote card 抽屉内 */
.gl-tick {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--border); transition: 0.15s; flex-shrink: 0;
}
.gl-quote-card.selected .gl-tick {
  border-color: var(--primary); background: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.gl-quote-card.selected .gl-tick::after { content: '✓'; color: white; font-size: 12px; font-weight: 700; }
.gl-empty { text-align: center; padding: 32px 0; color: var(--text-tertiary); }
</style>
