<template>
  <div class="channel-page">

    <!-- ============ 视图1：管理页 ============ -->
    <div v-if="view === 'manage'" class="manage-view">
      <!-- header 卡 -->
      <header class="page-header-card">
        <div class="header-left">
          <h1 class="page-title">运输通道管理</h1>
          <p class="page-subtitle">运输能力资产管理</p>
        </div>
        <button class="btn primary" @click="openNewForm">+ 新增运输通道</button>
      </header>

      <!-- 状态 tabs（带计数）-->
      <div class="status-tabs">
        <button
          v-for="t in bodyStatusTabs"
          :key="t.value"
          class="status-tab"
          :class="{ active: filterState.bodyStatus === t.value }"
          @click="filterState.bodyStatus = t.value"
        >{{ t.label }} <i v-if="t.value !== '全部'">({{ bodyStatusCount(t.value) }})</i></button>
      </div>

      <!-- 筛选区 -->
      <div class="filter-card">
        <div class="filter-grid">
          <div class="filter-field">
            <label>通道名称</label>
            <input class="q-input" v-model="filterState.keyword" placeholder="通道名称/编号" />
          </div>
          <div class="filter-field">
            <label>集货点</label>
            <input class="q-input" v-model="filterState.origin" placeholder="集货点" />
          </div>
          <div class="filter-field">
            <label>目的地</label>
            <input class="q-input" v-model="filterState.destination" placeholder="目的地" />
          </div>
          <div class="filter-field">
            <label>业务方向</label>
            <select class="q-input" v-model="filterState.businessDirection">
              <option value="">全部</option>
              <option v-for="d in businessDirections.filter(x => x)" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>运输方式</label>
            <select class="q-input" v-model="filterState.transportType">
              <option value="">全部</option>
              <option v-for="t in transportTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>发布状态</label>
            <select class="q-input" v-model="filterState.publishStatus">
              <option v-for="s in publishStatusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>是否已有方案</label>
            <select class="q-input" v-model="filterState.hasScheme">
              <option v-for="s in hasSchemeOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>更新时间开始</label>
            <input class="q-input" type="date" v-model="filterState.updatedFrom" />
          </div>
          <div class="filter-field">
            <label>更新时间结束</label>
            <input class="q-input" type="date" v-model="filterState.updatedTo" />
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn ghost" @click="resetFilter">重置筛选</button>
          <button class="btn primary" @click="doFilter">查询</button>
        </div>
      </div>

      <!-- 通道列表 -->
      <div class="list-card">
        <table class="dt">
          <thead>
            <tr>
              <th style="min-width:180px">通道名称</th>
              <th style="min-width:200px">集货点 → 目的地</th>
              <th style="min-width:120px">运输方式</th>
              <th style="min-width:120px">路径 / 方案</th>
              <th style="min-width:160px">参考价 / 时效</th>
              <th style="min-width:220px">服务能力</th>
              <th style="min-width:100px">本体状态</th>
              <th style="min-width:140px">发布状态</th>
              <th style="min-width:120px">更新时间</th>
              <th style="min-width:240px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredChannels" :key="c.id">
              <td>
                <strong class="row-title">{{ c.name }}</strong>
                <div class="row-sub">{{ c.id }}</div>
              </td>
              <td>{{ c.origin }} → {{ c.destination }}</td>
              <td>{{ transportTypeText(c.transportType) }}</td>
              <td>
                <div>{{ (c.paths || []).length }} 条路径</div>
                <div class="row-sub">{{ (c.schemes || []).length }} 个方案</div>
              </td>
              <td>
                <div>{{ priceSummary(c.displayConfig?.price) }}</div>
                <div class="row-sub">{{ leadTimeSummary(c.displayConfig?.leadTime) }}</div>
              </td>
              <td>
                <span v-for="(tag, i) in serviceTagList(c).slice(0, 3)" :key="i" class="tag-pill gray">{{ tag }}</span>
                <span v-if="serviceTagList(c).length > 3" class="tag-pill gray">更多 +{{ serviceTagList(c).length - 3 }}</span>
              </td>
              <td><span class="tag-pill" :class="bodyStatusTagClass(c.bodyStatus)">{{ c.bodyStatus }}</span></td>
              <td>
                <span class="tag-pill" :class="publishStatusTagClass(c.publishStatus)">{{ c.publishStatus }}</span>
                <div v-if="c.publishStatus === '已驳回' && c.rejectReason" class="reject-reason" :title="c.rejectReason">{{ c.rejectReason }}</div>
              </td>
              <td>{{ c.updatedAt }}</td>
              <td>
                <div class="action-row">
                  <button v-for="(act, i) in getRowActions(c).slice(0, 3)" :key="act.key"
                    class="link-btn"
                    :class="{ danger: act.danger }"
                    @click="handleRowAction(act.key, c)"
                  >{{ act.label }}</button>
                  <details v-if="getRowActions(c).length > 3" class="action-more">
                    <summary>更多</summary>
                    <div class="action-more-menu">
                      <button v-for="act in getRowActions(c).slice(3)" :key="act.key"
                        class="link-btn"
                        :class="{ danger: act.danger }"
                        @click="handleRowAction(act.key, c)"
                      >{{ act.label }}</button>
                    </div>
                  </details>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredChannels.length">
              <td colspan="10" class="empty-row">当前筛选条件下没有符合的运输通道。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============ 视图2：通道 form（新增/编辑/查看） ============ -->
    <div v-else-if="view === 'form'" class="form-view">
      <!-- header -->
      <header class="page-header-card">
        <div class="header-left">
          <h1 class="page-title">{{ formTitle }}</h1>
          <p class="page-subtitle">{{ formSubtitle }}</p>
        </div>
        <div class="header-actions">
          <button v-if="formMode === 'view' && editing.bodyStatus === '启用'" class="btn primary" @click="openSchemeDrawerFromForm">查看方案</button>
          <button v-if="formMode === 'edit' && editing.bodyStatus === '启用'" class="btn primary" @click="openSchemeDrawerFromForm">进入方案管理</button>
          <button class="btn ghost" @click="backToManage">返回管理页</button>
        </div>
      </header>

      <!-- 已驳回信息卡 -->
      <div v-if="formMode !== 'view' && editing.publishStatus === '已驳回' && editing.rejectReason" class="reject-card">
        <strong>审核驳回信息</strong>
        <div>驳回时间：{{ editing.rejectTime }}</div>
        <p>{{ editing.rejectReason }}</p>
      </div>

      <!-- 区块1：基础信息 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>基础信息</h3>
        <div class="form-grid four">
          <div class="form-field">
            <label>通道名称 <i>*</i></label>
            <input class="q-input" v-model="editing.name" :disabled="formMode === 'view'" placeholder="请输入通道名称" />
          </div>
          <div class="form-field">
            <label>运输方式 <i>*</i></label>
            <select class="q-input" v-model="editing.transportType" :disabled="formMode === 'view'">
              <option v-for="t in transportTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>业务方向</label>
            <select class="q-input" v-model="editing.businessDirection" :disabled="formMode === 'view'">
              <option value="">请选择（选填）</option>
              <option v-for="d in businessDirections.filter(x => x)" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 区块2：运输路线 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>运输路线</h3>
        <div class="form-grid two">
          <div class="form-field">
            <label>集货地 <i>*</i></label>
            <input class="q-input" v-model="editing.origin" :disabled="formMode === 'view'" placeholder="集货地" />
          </div>
          <div class="form-field">
            <label>目的地 <i>*</i></label>
            <input class="q-input" v-model="editing.destination" :disabled="formMode === 'view'" placeholder="目的地" />
          </div>
        </div>

        <!-- 路径列表 -->
        <div class="path-list">
          <div
            v-for="(path, pIdx) in editing.paths"
            :key="path.id"
            class="path-item"
            :class="{ active: pIdx === currentPathIdx }"
            @click="currentPathIdx = pIdx"
          >
            <input class="path-name-input" v-model="path.name" :disabled="formMode === 'view'" />
            <div class="path-meta">{{ path.segments.length }} 段</div>
          </div>
          <button v-if="formMode !== 'view'" class="add-path-btn" @click="addPath">+ 新增路径</button>
        </div>

        <!-- 当前路径结构（时间线）-->
        <div v-if="currentPath" class="path-builder">
          <div v-if="formMode !== 'view'" class="builder-actions">
            <button @click="addSegment('segment')">+ 新增运输节点</button>
            <button @click="addSegment('node')">+ 新增作业节点</button>
          </div>
          <div v-if="currentPath.segments.length" class="timeline">
            <div v-for="(seg, idx) in currentPath.segments" :key="seg.id" class="timeline-item">
              <div class="timeline-axis">
                <div class="timeline-badge" :class="{ node: seg.type === 'node' }">{{ seg.type === 'node' ? '作' : idx + 1 }}</div>
              </div>
              <div class="timeline-card">
                <div v-if="seg.type === 'segment'" class="segment-row">
                  <div class="form-field">
                    <label>运输方式</label>
                    <select class="q-input-sm" v-model="seg.mode" :disabled="formMode === 'view' || idx !== 0 && false">
                      <option v-for="m in segmentModes" :key="m" :value="m">{{ m }}</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>起点</label>
                    <input class="q-input-sm" v-model="seg.from" :disabled="formMode === 'view' || idx > 0" placeholder="起点" />
                  </div>
                  <div class="form-field">
                    <label>终点</label>
                    <input class="q-input-sm" v-model="seg.to" :disabled="formMode === 'view'" placeholder="终点" @input="syncNextFrom(idx)" />
                  </div>
                  <div class="form-field">
                    <label>备注</label>
                    <input class="q-input-sm" v-model="seg.note" :disabled="formMode === 'view'" placeholder="备注" />
                  </div>
                  <button v-if="formMode !== 'view'" class="link-btn danger" @click="removeSegment(idx)">删除</button>
                </div>
                <div v-else class="segment-row">
                  <div class="form-field">
                    <label>作业类型</label>
                    <select class="q-input-sm" v-model="seg.operationType" :disabled="formMode === 'view'">
                      <option v-for="o in operationTypes" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>作业地点 <i>*</i></label>
                    <input class="q-input-sm" v-model="seg.location" :disabled="formMode === 'view'" placeholder="作业地点" />
                  </div>
                  <div class="form-field">
                    <label>备注</label>
                    <input class="q-input-sm" v-model="seg.note" :disabled="formMode === 'view'" placeholder="备注" />
                  </div>
                  <button v-if="formMode !== 'view'" class="link-btn danger" @click="removeSegment(idx)">删除</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-tip">当前路径尚未配置结构，请新增运输节点。</div>
        </div>
      </section>

      <!-- 区块3：服务能力 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>服务能力</h3>
        <div class="form-field block">
          <label>适配货类</label>
          <div class="chip-row">
            <label v-for="c in cargoTypes" :key="c" class="chip" :class="{ checked: editing.cargoTypes.includes(c) }">
              <input type="checkbox" :value="c" v-model="editing.cargoTypes" :disabled="formMode === 'view'" />
              {{ c }}
            </label>
          </div>
        </div>
        <div class="capability-grid three">
          <label v-for="s in serviceSwitches" :key="s.key" class="capability-toggle" :class="{ checked: editing.serviceConfig[s.key], disabled: formMode === 'view' }">
            <input type="checkbox" v-model="editing.serviceConfig[s.key]" :disabled="formMode === 'view'" />
            <span class="cap-mark"></span>
            <span class="cap-label">{{ s.label }}</span>
          </label>
        </div>
        <div class="capability-grid one">
          <label v-for="s in valueAddedSwitches" :key="s.key" class="capability-toggle wide" :class="{ checked: editing.serviceConfig[s.key], disabled: formMode === 'view' }">
            <input type="checkbox" v-model="editing.serviceConfig[s.key]" :disabled="formMode === 'view'" />
            <span class="cap-mark"></span>
            <div>
              <span class="cap-label">{{ s.label }}</span>
              <span class="cap-desc">{{ s.key === 'storageTransfer' ? '当前仅记录开关表达，暂不展开复杂配置' : '如加固、贴标、换单等增值服务' }}</span>
            </div>
          </label>
        </div>
      </section>

      <!-- 区块4：展示信息 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>展示信息</h3>
        <div class="display-grid two">
          <div class="display-block">
            <strong class="block-label">参考价</strong>
            <div class="form-field"><label>参考价类型</label>
              <select class="q-input" v-model="editing.displayConfig.price.type" :disabled="formMode === 'view'">
                <option v-for="p in priceTypes" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
            <div class="form-field" v-if="editing.displayConfig.price.type !== 'consult'"><label>计费条件</label>
              <select class="q-input" v-model="editing.displayConfig.price.billingDimension" :disabled="formMode === 'view'">
                <option v-for="b in billingDimensions" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div class="form-field" v-if="editing.displayConfig.price.type === 'start'"><label>价格</label>
              <div class="suffix-input">
                <select class="q-input-sm" v-model="editing.displayConfig.price.currency" :disabled="formMode === 'view'" style="width:80px">
                  <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
                </select>
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.price.value" :disabled="formMode === 'view'" style="flex:1" />
              </div>
            </div>
            <div class="form-field" v-else-if="editing.displayConfig.price.type === 'range'"><label>价格区间</label>
              <div class="range-input">
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.price.min" :disabled="formMode === 'view'" placeholder="最低" />
                <span>~</span>
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.price.max" :disabled="formMode === 'view'" placeholder="最高" />
              </div>
            </div>
            <div class="form-field"><label>价格说明</label>
              <input class="q-input" v-model="editing.displayConfig.price.note" :disabled="formMode === 'view'" placeholder="价格说明" />
            </div>
          </div>
          <div class="display-block">
            <strong class="block-label">参考时效</strong>
            <div class="form-field"><label>时效类型</label>
              <select class="q-input" v-model="editing.displayConfig.leadTime.type" :disabled="formMode === 'view'">
                <option v-for="l in leadTimeTypes" :key="l.value" :value="l.value">{{ l.label }}</option>
              </select>
            </div>
            <div class="form-field" v-if="editing.displayConfig.leadTime.type === 'fixed'"><label>时效值</label>
              <div class="suffix-input">
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.leadTime.value" :disabled="formMode === 'view'" style="flex:1" />
                <span class="suffix">天</span>
              </div>
            </div>
            <div class="form-field" v-else-if="editing.displayConfig.leadTime.type === 'range'"><label>时效区间</label>
              <div class="range-input">
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.leadTime.min" :disabled="formMode === 'view'" placeholder="最短" />
                <span>~</span>
                <input class="q-input-sm" type="number" v-model.number="editing.displayConfig.leadTime.max" :disabled="formMode === 'view'" placeholder="最长" />
                <span class="suffix">天</span>
              </div>
            </div>
            <div class="form-field"><label>时效说明</label>
              <input class="q-input" v-model="editing.displayConfig.leadTime.note" :disabled="formMode === 'view'" placeholder="时效说明" />
            </div>
          </div>
        </div>
        <div class="form-field block">
          <label>通道说明</label>
          <textarea class="q-textarea" v-model="editing.displayConfig.description" :disabled="formMode === 'view'" placeholder="通道说明"></textarea>
        </div>
      </section>

      <!-- 底部 sticky 操作条 -->
      <div class="sticky-actions">
        <button v-if="formMode === 'view'" class="btn ghost" @click="backToManage">返回管理页</button>
        <template v-else>
          <button class="btn ghost" @click="backToManage">取消</button>
          <button class="btn ghost" @click="saveDraft">保存草稿</button>
          <button class="btn primary" @click="saveAndEnable">保存并启用</button>
        </template>
      </div>
    </div>

    <!-- ============ 视图3：新增运输方案（scheme-create 合并） ============ -->
    <div v-else-if="view === 'schemeForm'" class="scheme-form-view">
      <header class="page-header-card">
        <div class="header-left">
          <h1 class="page-title">新增运输方案</h1>
        </div>
        <button class="btn ghost" @click="backToSchemeDrawer">返回方案列表</button>
      </header>

      <div class="warning-card" v-if="schemeSourceChannel?.bodyStatus === '停用'">当前来源通道已停用，可返回方案列表查看历史方案。</div>

      <!-- 区块1：来源信息 -->
      <section class="section-card">
        <div class="section-card-header">
          <h3 class="section-h"><span class="section-bar"></span>来源信息与绑定路径</h3>
          <div class="source-tag-group">
            <span class="tag-pill blue">{{ schemeSourceChannel?.id }}</span>
            <span class="tag-pill" :class="bodyStatusTagClass(schemeSourceChannel?.bodyStatus)">{{ schemeSourceChannel?.bodyStatus }}</span>
            <span class="tag-pill" :class="publishStatusTagClass(schemeSourceChannel?.publishStatus)">{{ schemeSourceChannel?.publishStatus }}</span>
          </div>
        </div>
        <div class="source-summary">
          <strong>{{ schemeSourceChannel?.name }}</strong>
          <span>{{ schemeSourceChannel?.origin }} → {{ schemeSourceChannel?.destination }}</span>
          <span>{{ schemeSourceChannel?.transportType }}</span>
        </div>
        <div class="form-grid two">
          <div class="form-field">
            <label>绑定主路径 <i>*</i></label>
            <select class="q-input" v-model="newScheme.pathId" @change="confirmChangePath">
              <option v-for="p in (schemeSourceChannel?.paths || [])" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
        </div>
        <div v-if="boundPath" class="path-structure-list">
          <div v-for="(seg, idx) in boundPath.segments" :key="seg.id" class="path-line-item">
            <span>路段{{ idx + 1 }}：{{ seg.from }} → {{ seg.to }}</span>
            <em>{{ seg.mode }}</em>
            <select class="q-input-sm" v-model="seg.businessType" style="width:100px;margin-left:8px">
              <option v-for="b in segmentBusinessTypes" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 区块2：方案基础信息 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>方案基础信息</h3>
        <div class="form-grid four">
          <div class="form-field wide">
            <label>方案名称 <i>*</i></label>
            <input class="q-input" v-model="newScheme.name" placeholder="请输入方案名称" />
          </div>
          <div class="form-field wide">
            <label>适用场景</label>
            <input class="q-input" v-model="newScheme.scene" placeholder="适用场景（选填）" />
          </div>
        </div>
        <div class="form-field block">
          <label>补充备注</label>
          <textarea class="q-textarea" v-model="newScheme.description" placeholder="补充备注"></textarea>
        </div>
      </section>

      <!-- 区块3：标准服务组合 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>标准服务组合</h3>
        <div class="capability-grid three">
          <label v-for="s in serviceSwitches" :key="s.key" class="capability-toggle" :class="{ checked: newScheme.serviceConfig[s.key] }">
            <input type="checkbox" v-model="newScheme.serviceConfig[s.key]" />
            <span class="cap-mark"></span>
            <span class="cap-label">{{ s.label }}</span>
          </label>
        </div>
        <div class="capability-grid one">
          <label v-for="s in valueAddedSwitches" :key="s.key" class="capability-toggle wide" :class="{ checked: newScheme.serviceConfig[s.key] }">
            <input type="checkbox" v-model="newScheme.serviceConfig[s.key]" />
            <span class="cap-mark"></span>
            <span class="cap-label">{{ s.label }}</span>
          </label>
        </div>
        <div class="form-field block">
          <label>增值服务</label>
          <div class="chip-row">
            <label v-for="v in valueAddedDictionary" :key="v" class="chip" :class="{ checked: newScheme.valueAdded.includes(v) }">
              <input type="checkbox" :value="v" v-model="newScheme.valueAdded" />{{ v }}
            </label>
          </div>
        </div>
      </section>

      <!-- 区块4：标准价格结构 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>标准价格结构</h3>
        <div class="config-panel two">
          <div class="form-field">
            <label>费用组织方式</label>
            <div class="pill-btn-group">
              <button :class="{ active: newScheme.quoteMode === '整段' }" @click="newScheme.quoteMode = '整段'">整段</button>
              <button :class="{ active: newScheme.quoteMode === '分段' }" @click="newScheme.quoteMode = '分段'">分段</button>
            </div>
          </div>
          <div class="form-field">
            <label>计费条件</label>
            <select class="q-input" v-model="newScheme.billingDimension">
              <option v-for="b in billingDimensions" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
        </div>

        <!-- 整段费用 -->
        <div v-if="newScheme.quoteMode === '整段'" class="fee-panel">
          <div class="form-field" v-if="newScheme.billingDimension === '按集装箱'">
            <label>箱型价格明细</label>
            <table class="mini-table">
              <thead><tr><th>箱型</th><th>运输费用</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="(b, i) in newScheme.boxPrices" :key="i">
                  <td><select class="q-input-sm" v-model="b.boxType"><option v-for="c in containerTypes" :key="c" :value="c">{{ c }}</option></select></td>
                  <td><input class="q-input-sm" type="number" v-model.number="b.price" /></td>
                  <td><button class="link-btn danger" @click="newScheme.boxPrices.splice(i, 1)">删除</button></td>
                </tr>
              </tbody>
            </table>
            <button class="add-row-btn" @click="newScheme.boxPrices.push({ boxType: '', price: 0 })">+ 添加箱型价格</button>
          </div>
          <div class="form-field" v-else>
            <label>参考价格口径</label>
            <input class="q-input" type="number" v-model.number="newScheme.unitPrice" placeholder="参考价格" />
          </div>
        </div>

        <!-- 分段费用 -->
        <div v-else>
          <div v-for="(seg, idx) in (boundPath?.segments || [])" :key="idx" class="segment-fee-card">
            <div class="seg-fee-title">
              <span>路段{{ idx + 1 }}：{{ seg.from }} → {{ seg.to }}</span>
              <span class="tag-pill blue">{{ seg.mode }}</span>
            </div>
            <div class="form-field">
              <label>计费条件</label>
              <select class="q-input" v-model="seg.billingDimension">
                <option v-for="b in billingDimensions" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>参考价格</label>
              <input class="q-input" type="number" v-model.number="seg.unitPrice" placeholder="参考价格" />
            </div>
          </div>
        </div>

        <!-- 标准其他费用 -->
        <div class="form-field block">
          <label>标准其他费用</label>
          <table class="mini-table">
            <thead><tr><th>费用名称</th><th>费用类型</th><th>计价方式</th><th>基数</th><th>单价</th><th>金额</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="(f, i) in newScheme.otherFees" :key="i">
                <td><input class="q-input-sm" v-model="f.name" placeholder="费用名称" /></td>
                <td><select class="q-input-sm" v-model="f.type"><option v-for="t in feeTypeOptions" :key="t" :value="t">{{ t }}</option></select></td>
                <td><select class="q-input-sm" v-model="f.calcMode" @change="f.amount = f.calcMode === '固定金额' ? f.amount : 0"><option v-for="m in feeCalcModes" :key="m" :value="m">{{ m }}</option></select></td>
                <td><input class="q-input-sm" type="number" v-model.number="f.base" :disabled="f.calcMode === '固定金额'" /></td>
                <td><input class="q-input-sm" type="number" v-model.number="f.unitPrice" :disabled="f.calcMode === '固定金额'" /></td>
                <td>{{ f.calcMode === '固定金额' ? (f.amount || 0) : ((f.base || 0) * (f.unitPrice || 0)) }}</td>
                <td><button class="link-btn danger" @click="newScheme.otherFees.splice(i, 1)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <button class="add-row-btn" @click="newScheme.otherFees.push({ name: '', type: '增项', calcMode: '固定金额', base: 0, unitPrice: 0, amount: 0 })">+ 新增其他费用</button>
        </div>
      </section>

      <!-- 区块5：标准时效 -->
      <section class="section-card">
        <h3 class="section-h"><span class="section-bar"></span>标准时效</h3>
        <div class="form-field">
          <label>时效类型</label>
          <div class="pill-btn-group">
            <button v-for="l in leadTimeTypes" :key="l.value"
              :class="{ active: newScheme.leadTime.type === l.value }"
              @click="newScheme.leadTime.type = l.value"
            >{{ l.label }}</button>
          </div>
        </div>
        <div class="form-field" v-if="newScheme.leadTime.type === 'fixed'">
          <label>时效数值</label>
          <div class="suffix-input">
            <input class="q-input-sm" type="number" v-model.number="newScheme.leadTime.value" style="flex:1" />
            <span class="suffix">天</span>
          </div>
        </div>
        <div class="form-field" v-else-if="newScheme.leadTime.type === 'range'">
          <label>时效区间</label>
          <div class="range-input">
            <input class="q-input-sm" type="number" v-model.number="newScheme.leadTime.min" placeholder="最短" />
            <span>~</span>
            <input class="q-input-sm" type="number" v-model.number="newScheme.leadTime.max" placeholder="最长" />
            <span class="suffix">天</span>
          </div>
        </div>
        <div class="lead-time-preview">预计时效：{{ leadTimePreview }}</div>
      </section>

      <!-- 区块6：路段候选承运商 -->
      <section class="section-card">
        <div class="section-card-header">
          <h3 class="section-h"><span class="section-bar"></span>路段候选承运商</h3>
          <span class="tag-pill gray">已配置 {{ carrierConfiguredCount }} / {{ (boundPath?.segments || []).length }} 段</span>
        </div>
        <div v-for="(seg, idx) in (boundPath?.segments || [])" :key="idx" class="carrier-card">
          <div class="carrier-card-head">
            <strong>路段{{ idx + 1 }}：{{ seg.from }} → {{ seg.to }}</strong>
            <span class="tag-pill blue">{{ seg.mode }}</span>
            <span class="carrier-status">{{ (newScheme.carrierBySegment[seg.id] || []).length ? '已选 ' + newScheme.carrierBySegment[seg.id].length + ' 个' : '未配置' }}</span>
            <button class="btn-link" @click="openCarrierPicker(seg)">+ 新增承运商</button>
          </div>
          <div v-if="(newScheme.carrierBySegment[seg.id] || []).length" class="selected-carrier-list">
            <div v-for="cid in newScheme.carrierBySegment[seg.id]" :key="cid" class="selected-carrier-item">
              <strong>{{ getCarrierName(seg.mode, cid) }}</strong>
              <span class="tag-pill gray">{{ getCarrierSource(seg.mode, cid) }}</span>
              <span>{{ getCarrierNote(seg.mode, cid) }}</span>
              <button class="link-btn danger" @click="removeCarrier(seg.id, cid)">删除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 底部 sticky 操作条 -->
      <div class="sticky-actions">
        <button class="btn ghost" @click="backToSchemeDrawer">取消</button>
        <button class="btn ghost" @click="saveSchemeDraft">保存草稿</button>
        <button class="btn primary" @click="enableScheme">启用方案</button>
      </div>
    </div>

    <!-- ============ 方案管理抽屉 ============ -->
    <div v-if="schemeDrawerVisible" class="drawer-mask" @click.self="schemeDrawerVisible = false">
      <aside class="scheme-drawer">
        <header class="drawer-header">
          <div>
            <h2>运输方案管理</h2>
            <p v-if="schemeDrawerIntent === 'new' && schemeSourceChannel && schemeSourceChannel.transportType !== '多式联运'">当前为单一运输方式通道；如仅需沉淀运输能力，可先不新增方案。</p>
          </div>
          <button class="drawer-close" @click="schemeDrawerVisible = false">×</button>
        </header>
        <div class="drawer-body">
          <!-- 来源通道摘要 -->
          <div class="scheme-summary-card">
            <div class="summary-left">
              <div><strong>{{ schemeSourceChannel?.name }}</strong></div>
              <div>{{ schemeSourceChannel?.origin }} → {{ schemeSourceChannel?.destination }}</div>
              <div>{{ schemeSourceChannel?.transportType }} ｜ {{ (schemeSourceChannel?.paths || []).length }} 条路径 ｜ {{ (schemeSourceChannel?.schemes || []).length }} 个方案</div>
            </div>
            <div class="summary-right">
              <span class="tag-pill" :class="bodyStatusTagClass(schemeSourceChannel?.bodyStatus)">{{ schemeSourceChannel?.bodyStatus }}</span>
              <span class="tag-pill" :class="publishStatusTagClass(schemeSourceChannel?.publishStatus)">{{ schemeSourceChannel?.publishStatus }}</span>
              <button class="btn primary" :disabled="schemeSourceChannel?.bodyStatus !== '启用'" @click="openSchemeCreate">+ 新增方案</button>
            </div>
          </div>

          <div v-if="schemeSourceChannel?.bodyStatus === '停用'" class="drawer-warning">来源通道已停用，当前仅支持查看既有方案，不可新增方案。</div>
          <div v-else-if="(schemeSourceChannel?.schemes || []).length === 0 && schemeSourceChannel?.transportType !== '多式联运'" class="drawer-warning light">当前可先仅维护通道，后续需要标准经营母版时再新增方案。</div>

          <!-- 方案筛选 -->
          <div class="scheme-filters">
            <input class="q-input-sm" v-model="schemeFilter.name" placeholder="方案名称" style="grid-column:1.4fr" />
            <select class="q-input-sm" v-model="schemeFilter.pathName"><option value="">绑定路径（全部）</option><option v-for="p in (schemeSourceChannel?.paths || [])" :key="p.id" :value="p.name">{{ p.name }}</option></select>
            <select class="q-input-sm" v-model="schemeFilter.status"><option value="">方案状态（全部）</option><option>草稿</option><option>启用</option><option>停用</option></select>
            <select class="q-input-sm" v-model="schemeFilter.sourceStatus"><option value="">来源通道状态（全部）</option><option>启用</option><option>停用</option><option>草稿</option></select>
          </div>
          <div class="scheme-meta">来源通道：{{ schemeSourceChannel?.id }} · 共 {{ filteredSchemes.length }} 条方案</div>

          <!-- 方案列表 -->
          <table class="dt">
            <thead>
              <tr>
                <th style="min-width:180px">方案名称</th>
                <th style="min-width:160px">绑定路径</th>
                <th style="min-width:100px">运输方式</th>
                <th style="min-width:180px">标准服务组合</th>
                <th style="min-width:150px">标准价格结构</th>
                <th style="min-width:130px">标准时效</th>
                <th style="min-width:150px">候选承运商</th>
                <th style="min-width:100px">方案状态</th>
                <th style="min-width:240px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in filteredSchemes" :key="s.id">
                <td><strong class="row-title">{{ s.name }}</strong><div class="row-sub">{{ s.id }}</div></td>
                <td>{{ s.pathName }}</td>
                <td>{{ s.transportType }}</td>
                <td>{{ s.serviceSummary }}</td>
                <td>{{ s.priceSummary }}</td>
                <td>{{ s.leadTimeSummary }}</td>
                <td>{{ s.carrierSummary }}</td>
                <td><span class="tag-pill" :class="schemeStatusTagClass(s.status)">{{ s.status }}</span></td>
                <td>
                  <button class="link-btn" @click="viewSchemeDetail(s)">查看</button>
                  <button class="link-btn" @click="copyScheme(i)">复制新增</button>
                  <button v-if="s.status !== '停用'" class="link-btn danger" @click="disableScheme(i)">停用</button>
                </td>
              </tr>
              <tr v-if="!filteredSchemes.length"><td colspan="9" class="empty-row">暂无方案</td></tr>
            </tbody>
          </table>
        </div>
      </aside>
    </div>

    <!-- ============ 承运商选择器弹窗 ============ -->
    <div v-if="carrierPickerVisible" class="picker-mask" @click.self="carrierPickerVisible = false">
      <div class="picker-box">
        <header class="picker-header">
          <h3>选择候选承运商</h3>
          <button class="drawer-close" @click="carrierPickerVisible = false">×</button>
        </header>
        <div class="picker-context">
          <strong>{{ pickerSegment && `路段：${pickerSegment.from} → ${pickerSegment.to}` }}</strong>
          <span class="tag-pill blue">{{ pickerSegment?.mode }}</span>
        </div>
        <div class="picker-toolbar">
          <div class="pill-btn-group">
            <button :class="{ active: pickerTab === '自有合作' }" @click="pickerTab = '自有合作'">自有合作</button>
            <button :class="{ active: pickerTab === '平台承运商' }" @click="pickerTab = '平台承运商'">平台承运商</button>
          </div>
          <input class="q-input-sm" v-model="pickerKeyword" placeholder="搜索承运商" style="width:200px" />
          <span class="picker-count">已勾选 {{ tempSelectedCarriers.length }} 个</span>
        </div>
        <div class="picker-list">
          <label v-for="c in filteredCarrierOptions" :key="c.id" class="picker-option" :class="{ checked: tempSelectedCarriers.includes(c.id) }">
            <input type="checkbox" :value="c.id" v-model="tempSelectedCarriers" />
            <div>
              <strong>{{ c.name }}</strong>
              <span class="tag-pill gray">{{ c.source }}</span>
              <p>{{ c.note }}</p>
            </div>
          </label>
          <div v-if="!filteredCarrierOptions.length" class="empty-tip">该运输方式暂无候选承运商</div>
        </div>
        <footer class="picker-footer">
          <button class="btn ghost" @click="carrierPickerVisible = false">取消</button>
          <button class="btn primary" @click="confirmCarrierPicker">确认添加</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  transportTypes, businessDirections, cargoTypes, containerTypes,
  serviceSwitches, valueAddedSwitches, segmentModes, operationTypes,
  publishStatusOptions, bodyStatusTabs, hasSchemeOptions,
  priceTypes, billingDimensions, currencies, leadTimeTypes,
  quoteModes, segmentBusinessTypes, valueAddedDictionary,
  feeTypeOptions, feeCalcModes, carrierPool, seedChannels, initialIdSeed,
} from './mock-data'
import { setCurrentPage } from '../../src/shared/prototype-store'

const channels = ref(JSON.parse(JSON.stringify(seedChannels)))
let idSeed = initialIdSeed

const view = ref('manage') // manage / form / schemeForm
const formMode = ref('new') // new / edit / view
const editing = reactive(getEmptyChannel())
const currentPathIdx = ref(0)

// ============ 筛选 ============
const filterState = reactive({
  bodyStatus: '全部',
  keyword: '', origin: '', destination: '',
  businessDirection: '', transportType: '',
  publishStatus: '全部', hasScheme: '全部',
  updatedFrom: '', updatedTo: '',
})

const filteredChannels = computed(() => channels.value.filter(c => {
  if (filterState.bodyStatus !== '全部' && c.bodyStatus !== filterState.bodyStatus) return false
  if (filterState.keyword) {
    const k = filterState.keyword.toLowerCase()
    if (!c.id.toLowerCase().includes(k) && !c.name.toLowerCase().includes(k)) return false
  }
  if (filterState.origin && !c.origin.includes(filterState.origin)) return false
  if (filterState.destination && !c.destination.includes(filterState.destination)) return false
  if (filterState.businessDirection && c.businessDirection !== filterState.businessDirection) return false
  if (filterState.transportType && c.transportType !== filterState.transportType) return false
  if (filterState.publishStatus !== '全部' && c.publishStatus !== filterState.publishStatus) return false
  if (filterState.hasScheme === '已有方案' && !(c.schemes || []).length) return false
  if (filterState.hasScheme === '无方案' && (c.schemes || []).length) return false
  return true
}))

function bodyStatusCount(value) {
  return channels.value.filter(c => c.bodyStatus === value).length
}
function doFilter() { ElMessage.success(`共 ${filteredChannels.value.length} 条`) }
function resetFilter() {
  Object.assign(filterState, { bodyStatus: '全部', keyword: '', origin: '', destination: '', businessDirection: '', transportType: '', publishStatus: '全部', hasScheme: '全部', updatedFrom: '', updatedTo: '' })
}

// ============ 摘要/标签 helper ============
function transportTypeText(t) {
  return t === '多式联运' ? '多式联运' : `单一${t}`
}
function priceSummary(p) {
  if (!p || p.type === 'consult') return '面议'
  if (p.type === 'start') return `${p.currency} ${p.value} 起`
  return `${p.currency} ${p.min}~${p.max}`
}
function leadTimeSummary(l) {
  if (!l || l.type === 'pending') return '时效待确认'
  if (l.type === 'fixed') return `${l.value} ${l.unit}`
  return `${l.min}~${l.max} ${l.unit}`
}
function serviceTagList(c) {
  const arr = []
  serviceSwitches.forEach(s => { if (c.serviceConfig?.[s.key]) arr.push(s.label) })
  valueAddedSwitches.forEach(s => { if (c.serviceConfig?.[s.key]) arr.push(s.label) })
  c.cargoTypes?.forEach(t => arr.push(t))
  c.containerTypes?.forEach(t => arr.push(t))
  return arr
}
function bodyStatusTagClass(s) {
  return { 启用: 'success', 草稿: 'warning', 停用: 'danger' }[s] || 'gray'
}
function publishStatusTagClass(s) {
  return { 已发布: 'blue', 待审核: 'warning', 已驳回: 'danger', 未发布: 'gray', 已下架: 'gray' }[s] || 'gray'
}
function schemeStatusTagClass(s) {
  return { 启用: 'success', 草稿: 'warning', 停用: 'gray' }[s] || 'gray'
}

// ============ 行操作矩阵 ============
function getRowActions(c) {
  const actions = []
  if (c.bodyStatus === '草稿') {
    actions.push({ key: 'edit', label: '编辑' })
  } else if (c.bodyStatus === '停用') {
    actions.push({ key: 'view', label: '查看' })
    actions.push({ key: 'viewSchemes', label: '查看方案' })
  } else if (c.bodyStatus === '启用') {
    actions.push({ key: 'edit', label: '编辑' })
    if (c.publishStatus === '未发布' || c.publishStatus === '已下架' || c.publishStatus === '已驳回') {
      actions.push({ key: 'publish', label: '发布' })
    } else if (c.publishStatus === '待审核') {
      actions.push({ key: 'withdraw', label: '撤回' })
    } else if (c.publishStatus === '已发布') {
      actions.push({ key: 'unpublish', label: '下架' })
    }
    actions.push({ key: 'viewSchemes', label: '查看方案' })
    actions.push({ key: 'disable', label: '停用', danger: true })
  }
  return actions
}
function handleRowAction(key, c) {
  if (key === 'view') openViewForm(c)
  else if (key === 'edit') openEditForm(c)
  else if (key === 'publish') publishChannel(c)
  else if (key === 'withdraw') withdrawChannel(c)
  else if (key === 'unpublish') unpublishChannel(c)
  else if (key === 'disable') disableChannel(c)
  else if (key === 'viewSchemes') openSchemeDrawer(c, 'view')
}

// ============ 通道 form ============
function getEmptyChannel() {
  return {
    id: '', name: '', transportType: '多式联运', businessDirection: '',
    origin: '', destination: '', bodyStatus: '草稿', publishStatus: '未发布',
    rejectReason: '', rejectTime: '', updatedAt: '',
    cargoTypes: [], containerTypes: [],
    serviceConfig: { pickup: false, lastMile: false, customs: false, valueAdded: false, storageTransfer: false },
    displayConfig: {
      price: { type: 'consult', billingDimension: '按重量', currency: 'RMB', value: 0, min: 0, max: 0, note: '' },
      leadTime: { type: 'pending', value: 0, min: 0, max: 0, unit: '天', note: '' },
      description: '',
    },
    paths: [{ id: `p-${Date.now()}`, name: '主路径', segments: [] }],
    schemes: [],
  }
}
const formTitle = computed(() => ({ new: '新增运输通道', edit: '编辑运输通道', view: '查看运输通道' }[formMode.value]))
const formSubtitle = computed(() => {
  if (formMode.value === 'view') return '运输通道能力详情'
  return editing.transportType !== '多式联运' ? `运输通道能力配置 · 单一${editing.transportType}验证` : '运输通道能力配置'
})
const currentPath = computed(() => editing.paths[currentPathIdx.value])

function openNewForm() {
  Object.assign(editing, getEmptyChannel())
  formMode.value = 'new'
  view.value = 'form'
}
function openEditForm(c) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  formMode.value = 'edit'
  view.value = 'form'
}
function openViewForm(c) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  formMode.value = 'view'
  view.value = 'form'
}
function backToManage() { view.value = 'manage' }

function addPath() {
  editing.paths.push({ id: `p-${Date.now()}`, name: `路径${editing.paths.length + 1}`, segments: [] })
}
function addSegment(type) {
  const seg = type === 'segment'
    ? { id: `s-${Date.now()}`, type: 'segment', mode: '公路', from: '', to: '', note: '' }
    : { id: `s-${Date.now()}`, type: 'node', operationType: operationTypes[0], location: '', note: '' }
  currentPath.value.segments.push(seg)
  // 自动承接：新段 from = 上一段 to
  if (type === 'segment' && currentPath.value.segments.length > 1) {
    const prev = currentPath.value.segments[currentPath.value.segments.length - 2]
    if (prev && prev.type === 'segment') seg.from = prev.to
  }
}
function removeSegment(idx) { currentPath.value.segments.splice(idx, 1) }
function syncNextFrom(idx) {
  // 修改某段终点时，下一段起点同步
  const segs = currentPath.value.segments
  if (idx + 1 < segs.length && segs[idx + 1].type === 'segment') {
    segs[idx + 1].from = segs[idx].to
  }
}

function saveDraft() {
  if (!editing.name?.trim()) return ElMessage.warning('请输入通道名称')
  applySave(false)
}
function saveAndEnable() {
  if (!editing.name?.trim()) return ElMessage.warning('请输入通道名称')
  if (!editing.origin?.trim() || !editing.destination?.trim()) return ElMessage.warning('请输入集货地和目的地')
  for (const p of editing.paths) {
    if (!p.segments.length) return ElMessage.warning(`路径"${p.name}"至少需要 1 个路段`)
    for (const s of p.segments) {
      if (s.type === 'segment' && (!s.from || !s.to || !s.mode)) return ElMessage.warning(`路径"${p.name}"路段信息不完整`)
    }
  }
  applySave(true)
}
function applySave(enable) {
  const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  const original = channels.value.find(c => c.id === editing.id)
  let wasPublishedKeyChanged = false
  if (original && original.publishStatus === '已发布') {
    if (editing.name !== original.name || editing.origin !== original.origin || editing.destination !== original.destination || editing.transportType !== original.transportType) {
      wasPublishedKeyChanged = true
    }
  }
  const data = JSON.parse(JSON.stringify(editing))
  data.updatedAt = now
  if (formMode.value === 'new') {
    data.id = `TC2026-${String(++idSeed).padStart(4, '0')}`
    data.bodyStatus = enable ? '启用' : '草稿'
    data.publishStatus = '未发布'
    channels.value.unshift(data)
  } else {
    if (enable) {
      data.bodyStatus = '启用'
      // 按源规则：原是未发布/已下架 → 待审核；原是已驳回 → 待审核；原是待审核 → 待审核
      if (['未发布', '已下架', '已驳回', '待审核'].includes(original.publishStatus)) {
        data.publishStatus = '待审核'
        data.rejectReason = ''
        data.rejectTime = ''
      }
    } else {
      data.bodyStatus = original.bodyStatus === '启用' ? '启用' : '草稿'
    }
    if (wasPublishedKeyChanged) {
      data.publishStatus = '已下架'
      ElMessage.warning('已发布通道修改了关键字段，自动下架，需重新发布')
    }
    Object.assign(original, data)
  }
  ElMessage.success(enable ? '保存并启用成功' : '草稿保存成功')
  backToManage()
}

function publishChannel(c) {
  ElMessageBox.confirm(`确认发布通道「${c.name}」？发布后进入待审核。`, '发布通道', { type: 'info' })
    .then(() => { c.publishStatus = '待审核'; c.rejectReason = ''; ElMessage.success('已提交，进入待审核') }).catch(() => {})
}
function withdrawChannel(c) { c.publishStatus = '未发布'; ElMessage.success('已撤回') }
function unpublishChannel(c) {
  ElMessageBox.confirm(`确认下架通道「${c.name}」？`, '下架通道', { type: 'warning' })
    .then(() => { c.publishStatus = '已下架'; ElMessage.success('已下架') }).catch(() => {})
}
function disableChannel(c) {
  ElMessageBox.confirm(`确认停用通道「${c.name}」？停用后若已发布会自动下架，且不可继续新增方案。`, '停用通道', { type: 'warning' })
    .then(() => {
      c.bodyStatus = '停用'
      if (c.publishStatus === '已发布') c.publishStatus = '已下架'
      ElMessage.success('已停用')
    }).catch(() => {})
}

// ============ 方案抽屉 ============
const schemeDrawerVisible = ref(false)
const schemeDrawerIntent = ref('view') // view / new
const schemeSourceChannel = ref(null)
const schemeFilter = reactive({ name: '', pathName: '', status: '', sourceStatus: '' })

const filteredSchemes = computed(() => {
  if (!schemeSourceChannel.value) return []
  return (schemeSourceChannel.value.schemes || []).filter(s => {
    if (schemeFilter.name && !s.name.includes(schemeFilter.name)) return false
    if (schemeFilter.pathName && s.pathName !== schemeFilter.pathName) return false
    if (schemeFilter.status && s.status !== schemeFilter.status) return false
    if (schemeFilter.sourceStatus && schemeSourceChannel.value.bodyStatus !== schemeFilter.sourceStatus) return false
    return true
  })
})

function openSchemeDrawer(c, intent = 'view') {
  schemeSourceChannel.value = c
  schemeDrawerIntent.value = intent
  schemeFilter.name = ''; schemeFilter.pathName = ''; schemeFilter.status = ''; schemeFilter.sourceStatus = ''
  schemeDrawerVisible.value = true
}
function openSchemeDrawerFromForm() {
  // 从 form 视图打开抽屉
  const c = channels.value.find(x => x.id === editing.id)
  if (c) openSchemeDrawer(c, 'view')
}
function viewSchemeDetail(s) {
  ElMessage.info('方案详情页暂未开放，请先在列表查看摘要信息')
}
function copyScheme(idx) {
  const src = schemeSourceChannel.value.schemes[idx]
  const copy = JSON.parse(JSON.stringify(src))
  copy.id = `TS-${Date.now()}`
  copy.name = src.name + '-复制'
  copy.status = '草稿'
  schemeSourceChannel.value.schemes.unshift(copy)
  ElMessage.success('已复制为新草稿')
}
function disableScheme(idx) {
  schemeSourceChannel.value.schemes[idx].status = '停用'
  ElMessage.success('方案已停用')
}

// ============ 新增方案（scheme-create 合并）============
function getEmptyScheme() {
  return {
    name: '', scene: '', description: '',
    pathId: '', quoteMode: '整段', billingDimension: '按重量',
    unitPrice: 0, boxPrices: [], otherFees: [],
    serviceConfig: { pickup: false, lastMile: false, customs: false, valueAdded: false, storageTransfer: false },
    valueAdded: [],
    leadTime: { type: 'pending', value: 0, min: 0, max: 0, unit: '天' },
    carrierBySegment: {},
  }
}
const newScheme = reactive(getEmptyScheme())

const boundPath = computed(() => {
  if (!schemeSourceChannel.value || !newScheme.pathId) return null
  return schemeSourceChannel.value.paths.find(p => p.id === newScheme.pathId)
})

function openSchemeCreate() {
  Object.assign(newScheme, getEmptyScheme())
  if (schemeSourceChannel.value?.paths?.length) {
    newScheme.pathId = schemeSourceChannel.value.paths[0].id
  }
  schemeDrawerVisible.value = false
  view.value = 'schemeForm'
}
function backToSchemeDrawer() {
  view.value = 'manage'
  if (schemeSourceChannel.value) schemeDrawerVisible.value = true
}
function confirmChangePath() {
  // 切换主路径的二次确认
  if (Object.keys(newScheme.carrierBySegment).length) {
    if (!window.confirm('切换主路径后，当前路段候选承运商配置将按新路径重置，是否继续？')) {
      // 还原（简化处理）
    } else {
      newScheme.carrierBySegment = {}
    }
  }
}

const leadTimePreview = computed(() => leadTimeSummary(newScheme.leadTime))
const carrierConfiguredCount = computed(() => {
  return (boundPath.value?.segments || []).filter(s => (newScheme.carrierBySegment[s.id] || []).length > 0).length
})

function saveSchemeDraft() {
  if (!newScheme.name?.trim()) return ElMessage.warning('请输入方案名称')
  applySchemeSave('草稿', '方案草稿保存成功')
}
function enableScheme() {
  if (!newScheme.name?.trim()) return ElMessage.warning('请输入方案名称')
  if (!newScheme.pathId) return ElMessage.warning('请选择绑定主路径')
  applySchemeSave('启用', '方案已启用')
}
function applySchemeSave(status, msg) {
  const path = boundPath.value
  const carriers = Object.keys(newScheme.carrierBySegment).flatMap(sid => newScheme.carrierBySegment[sid])
  const scheme = {
    id: `TS-${Date.now()}`,
    name: newScheme.name,
    pathName: path?.name || '-',
    transportType: schemeSourceChannel.value.transportType,
    status,
    serviceSummary: [
      ...serviceSwitches.filter(s => newScheme.serviceConfig[s.key]).map(s => s.label),
      ...valueAddedSwitches.filter(s => newScheme.serviceConfig[s.key]).map(s => s.label),
      ...newScheme.valueAdded,
    ].join('/') || '-',
    priceSummary: newScheme.billingDimension === '按集装箱'
      ? (newScheme.boxPrices.length ? `按箱型：${newScheme.boxPrices.map(b => `${b.boxType} ${b.price}元`).join('，')}` : '-')
      : `${newScheme.unitPrice || 0} 元`,
    leadTimeSummary: leadTimePreview.value,
    carrierSummary: `${new Set(carriers).size} 家承运商`,
    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }
  if (!schemeSourceChannel.value.schemes) schemeSourceChannel.value.schemes = []
  schemeSourceChannel.value.schemes.unshift(scheme)
  ElMessage.success(msg)
  backToSchemeDrawer()
}

// ============ 承运商选择器 ============
const carrierPickerVisible = ref(false)
const pickerSegment = ref(null)
const pickerTab = ref('自有合作')
const pickerKeyword = ref('')
const tempSelectedCarriers = ref([])

const filteredCarrierOptions = computed(() => {
  if (!pickerSegment.value) return []
  const pool = carrierPool[pickerSegment.value.mode] || []
  return pool.filter(c => {
    if (pickerTab.value && c.source !== pickerTab.value) return false
    if (pickerKeyword.value && !c.name.includes(pickerKeyword.value)) return false
    return true
  })
})
function openCarrierPicker(seg) {
  pickerSegment.value = seg
  pickerTab.value = '自有合作'
  pickerKeyword.value = ''
  tempSelectedCarriers.value = [...(newScheme.carrierBySegment[seg.id] || [])]
  carrierPickerVisible.value = true
}
function confirmCarrierPicker() {
  if (!pickerSegment.value) return
  newScheme.carrierBySegment[pickerSegment.value.id] = [...tempSelectedCarriers.value]
  carrierPickerVisible.value = false
  ElMessage.success(`已添加 ${tempSelectedCarriers.value.length} 个承运商`)
}
function removeCarrier(segId, cid) {
  const arr = newScheme.carrierBySegment[segId] || []
  const idx = arr.indexOf(cid)
  if (idx >= 0) arr.splice(idx, 1)
}
function getCarrierName(mode, cid) { return (carrierPool[mode] || []).find(c => c.id === cid)?.name || cid }
function getCarrierSource(mode, cid) { return (carrierPool[mode] || []).find(c => c.id === cid)?.source || '-' }
function getCarrierNote(mode, cid) { return (carrierPool[mode] || []).find(c => c.id === cid)?.note || '' }
</script>

<style src="./channel-styles.css"></style>
