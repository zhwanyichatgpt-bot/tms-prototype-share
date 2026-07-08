<template>
  <div class="inquiry-page">
    <BackBar current-title="广林询价三端联动" />
    <!-- 顶部：三端切换 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">广林询价三端联动</h1>
        <span class="page-sub">广林项目定制 · 三端联动演示</span>
      </div>
      <el-radio-group v-model="currentRole" size="small">
        <el-radio-button label="shipper">货主端</el-radio-button>
        <el-radio-button label="nvocc">无车承运人端</el-radio-button>
        <el-radio-button label="carrier">承运商端</el-radio-button>
      </el-radio-group>
    </header>

    <!-- ============ 货主端 ============ -->
    <template v-if="currentRole === 'shipper'">
      <div class="role-view">
        <!-- 货主端：货源询价列表 -->
        <div class="filter-row">
          <el-input v-model="shipperFilter.keyword" placeholder="询价单号/标题" size="small" clearable style="width: 240px" />
          <el-select v-model="shipperFilter.status" placeholder="全部状态" size="small" clearable style="width: 140px">
            <el-option v-for="s in shipperStatusOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="primary" size="small" @click="openCreate">+ 新增货源询价</el-button>
        </div>

        <el-table :data="filteredShipperInquiries" border>
          <el-table-column label="询价单号" width="160">
            <template #default="{ row }"><strong>{{ row.id }}</strong></template>
          </el-table-column>
          <el-table-column prop="title" label="询价标题" min-width="180" />
          <el-table-column prop="inquiryType" label="询价类型" width="140" />
          <el-table-column prop="nvocc" label="询价对象" min-width="160" />
          <el-table-column label="路线数" width="80">
            <template #default="{ row }">{{ row.routes.length }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="inquiryStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="发布时间" width="160" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openShipperDetail(row)">查看</el-button>
              <el-button v-if="row.status === '草稿'" type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === '草稿'" link type="danger" size="small" @click="deleteInquiry(row)">删除</el-button>
              <el-button v-if="['待承接', '待报价', '待确认'].includes(row.status)" link type="warning" size="small" @click="cancelInquiry(row)">取消</el-button>
              <el-button v-if="['已拒绝', '已取消'].includes(row.status)" type="primary" link size="small" @click="reopenInquiry(row)">重新发起</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ============ 无车承运人端 ============ -->
    <template v-else-if="currentRole === 'nvocc'">
      <div class="role-view">
        <div class="filter-row">
          <el-input v-model="nvoccFilter.keyword" placeholder="询价单号/标题" size="small" clearable style="width: 240px" />
          <el-select v-model="nvoccFilter.status" placeholder="全部状态" size="small" clearable style="width: 140px">
            <el-option v-for="s in nvoccStatusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>

        <el-table :data="filteredNvoccInquiries" border>
          <el-table-column label="询价单号" width="160">
            <template #default="{ row }"><strong>{{ row.id }}</strong></template>
          </el-table-column>
          <el-table-column prop="title" label="询价标题" min-width="180" />
          <el-table-column prop="shipper" label="来源货主" min-width="160" />
          <el-table-column label="路线数" width="80">
            <template #default="{ row }">{{ row.routes.length }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="inquiryStatusType(row.status)" size="small">{{ nvoccStatusOf(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="接收时间" width="160" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openNvoccDetail(row)">处理</el-button>
              <el-button v-if="row.status === '待承接'" type="primary" link size="small" @click="acceptInquiry(row)">接受</el-button>
              <el-button v-if="row.status === '待承接'" link type="danger" size="small" @click="rejectInquiry(row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ============ 承运商端 ============ -->
    <template v-else>
      <div class="role-view">
        <el-tabs v-model="carrierTab">
          <el-tab-pane label="询价大厅" name="hall">
            <el-table :data="hallRoutes" border>
              <el-table-column label="路线发布单号" width="180">
                <template #default="{ row }"><strong>{{ row.publishId }}</strong></template>
              </el-table-column>
              <el-table-column prop="origin" label="始发地" width="100" />
              <el-table-column prop="destination" label="目的地" width="100" />
              <el-table-column prop="cargo" label="货品" width="120" />
              <el-table-column label="货量" min-width="140">
                <template #default="{ row }">{{ row.cargoQty }}{{ row.unit }}（{{ row.stowage }}）</template>
              </el-table-column>
              <el-table-column prop="transportMode" label="运输方式" width="100" />
              <el-table-column prop="publishDeadline" label="竞价截止" width="160" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openCarrierQuote(row)">报价</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!hallRoutes.length" description="暂无可报价的路线" />
          </el-tab-pane>

          <el-tab-pane label="我的报价记录" name="records">
            <el-table :data="myQuoteRecords" border>
              <el-table-column prop="publishId" label="发布单号" width="180" />
              <el-table-column prop="origin" label="始发地→目的地" min-width="180">
                <template #default="{ row }">{{ row.origin }} → {{ row.destination }}</template>
              </el-table-column>
              <el-table-column prop="cargo" label="货品" width="120" />
              <el-table-column label="报价金额" width="120">
                <template #default="{ row }">¥{{ row.myQuote?.totalAmount || 0 }}</template>
              </el-table-column>
              <el-table-column label="报价状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="quoteStatusType(row.myStatus)" size="small">{{ row.myStatus }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="row.myStatus === '已报价'" type="primary" link size="small" @click="modifyQuote(row)">修改</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!myQuoteRecords.length" description="暂无报价记录" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- ============ 货主端：新增/编辑 抽屉 ============ -->
    <el-drawer v-model="createDrawerVisible" :title="editMode ? '编辑货源询价' : '新增货源询价'" direction="rtl" size="720px">
      <el-form :model="editing" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="询价类型" required>
              <el-select v-model="editing.inquiryType" style="width: 100%">
                <el-option v-for="t in inquiryTypes" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="询价标题" required>
              <el-input v-model="editing.title" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货主">
              <el-input v-model="editing.shipper" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="询价对象" required>
              <el-select v-model="editing.nvocc" style="width: 100%">
                <el-option v-for="n in nvoccOptions" :key="n" :label="n" :value="n" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="询价说明">
              <el-input v-model="editing.description" type="textarea" :rows="2" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-header">
          <h4 class="sub-title">路线明细</h4>
          <el-button type="primary" link size="small" @click="addRouteRow">+ 新增路线</el-button>
        </div>
        <el-table :data="editing.routes" border size="small" empty-text="暂无路线">
          <el-table-column label="始发地" width="120">
            <template #default="{ row }">
              <el-select v-model="row.origin" size="small" filterable style="width: 100%">
                <el-option v-for="a in addressOptions" :key="a" :label="a" :value="a" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="目的地" width="120">
            <template #default="{ row }">
              <el-select v-model="row.destination" size="small" filterable style="width: 100%">
                <el-option v-for="a in addressOptions" :key="a" :label="a" :value="a" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="货品" width="120">
            <template #default="{ row }">
              <el-select v-model="row.cargo" size="small" filterable style="width: 100%" @change="onCargoChange(row)">
                <el-option v-for="c in cargoOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="配载方式" width="120">
            <template #default="{ row }">
              <el-select v-model="row.stowage" size="small" style="width: 100%" @change="onStowageChange(row)">
                <el-option v-for="s in stowageModes" :key="s" :label="s" :value="s" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="货量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.cargoQty" :min="0" :controls="false" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="100">
            <template #default="{ row }">
              <el-select v-model="row.unit" size="small" style="width: 100%">
                <el-option v-for="u in (unitMap[row.stowage] || [])" :key="u" :label="u" :value="u" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="100">
            <template #default="{ row }"><el-input v-model="row.remark" size="small" /></template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="editing.routes.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="createDrawerVisible = false">取消</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="publishInquiry">发布询价</el-button>
      </template>
    </el-drawer>

    <!-- ============ 货主端：详情/确认 抽屉 ============ -->
    <el-drawer v-model="shipperDetailVisible" title="货源询价详情" direction="rtl" size="720px">
      <template v-if="currentDetail">
        <div class="detail-head">
          <strong>{{ currentDetail.title }}</strong>
          <el-tag :type="inquiryStatusType(currentDetail.status)" size="small">{{ currentDetail.status }}</el-tag>
        </div>
        <div class="detail-meta">
          <span>询价单号：{{ currentDetail.id }}</span>
          <span>询价对象：{{ currentDetail.nvocc }}</span>
          <span>类型：{{ currentDetail.inquiryType }}</span>
        </div>

        <h4 class="sub-title">路线进度</h4>
        <el-table :data="currentDetail.routes" border size="small">
          <el-table-column label="路线" min-width="160">
            <template #default="{ row }">{{ row.origin }} → {{ row.destination }}</template>
          </el-table-column>
          <el-table-column label="货品/货量" min-width="160">
            <template #default="{ row }">{{ row.cargo }} {{ row.cargoQty }}{{ row.unit }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="routeStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="对货主报价" width="140">
            <template #default="{ row }">
              <span v-if="row.currentQuoteVersion">¥{{ row.currentQuoteVersion.totalAmount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="指定托运单" width="140">
            <template #default="{ row }">{{ row.waybillNo || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === '待货主确认'" type="success" link size="small" @click="confirmRoute(row)">确认</el-button>
              <el-button v-if="row.status === '待货主确认'" link type="danger" size="small" @click="rejectRoute(row)">驳回</el-button>
              <el-button v-if="row.status === '已确认' && !row.waybillNo" type="primary" link size="small" @click="generateWaybill(row)">生成托运单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- ============ 无车承运人端：详情/发布/提交报价 抽屉 ============ -->
    <el-drawer v-model="nvoccDetailVisible" title="询价管理详情" direction="rtl" size="780px">
      <template v-if="currentDetail">
        <div class="detail-head">
          <strong>{{ currentDetail.title }}</strong>
        </div>
        <div class="detail-meta">
          <span>询价单号：{{ currentDetail.id }}</span>
          <span>来源货主：{{ currentDetail.shipper }}</span>
        </div>

        <h4 class="sub-title">路线处理</h4>
        <el-table :data="currentDetail.routes" border size="small">
          <el-table-column label="路线" min-width="160">
            <template #default="{ row }">{{ row.origin }} → {{ row.destination }}</template>
          </el-table-column>
          <el-table-column label="货品/货量" min-width="140">
            <template #default="{ row }">{{ row.cargo }} {{ row.cargoQty }}{{ row.unit }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="routeStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="报价数" width="80">
            <template #default="{ row }">{{ row.carrierQuotes.length }}</template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === '待处理'" type="primary" link size="small" @click="publishRoute(row)">发布到大厅</el-button>
              <el-button v-if="row.carrierQuotes.length" link size="small" @click="openQuoteDialog(row)">查看报价/提交货主</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- ============ 报价查看与提交货主 弹窗 ============ -->
    <el-dialog v-model="quoteDialogVisible" title="承运商报价与对货主报价" width="780px">
      <template v-if="currentRoute">
        <el-table :data="currentRoute.carrierQuotes" border size="small" @row-click="selectBaseQuote">
          <el-table-column label="" width="60">
            <template #default="{ row }">
              <el-radio v-model="quoteForm.baseQuoteId" :label="row.id"><span></span></el-radio>
            </template>
          </el-table-column>
          <el-table-column prop="carrier" label="承运商" min-width="120" />
          <el-table-column prop="totalAmount" label="运输总价" width="120">
            <template #default="{ row }">¥{{ row.totalAmount }}</template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="运输单价" width="120" />
          <el-table-column prop="createdAt" label="报价时间" width="160" />
        </el-table>

        <el-form :model="quoteForm" label-width="100px" style="margin-top: 16px">
          <el-form-item label="加价方式" required>
            <el-select v-model="quoteForm.markupType" style="width: 200px">
              <el-option v-for="m in markupTypes" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="quoteForm.markupType !== '直接填写'" label="加价值" required>
            <el-input-number v-model="quoteForm.markupValue" :min="0" :controls="false" style="width: 160px" />
            <span class="unit">{{ quoteForm.markupType === '按比例加价' ? '%' : '元' }}</span>
          </el-form-item>
          <el-form-item label="对货主报价" required>
            <el-input-number v-model="quoteForm.totalAmount" :min="0" :controls="false" :disabled="quoteForm.markupType !== '直接填写'" style="width: 160px" />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="提交说明">
            <el-input v-model="quoteForm.submitRemark" type="textarea" :rows="2" maxlength="300" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitToShipper">提交给货主</el-button>
      </template>
    </el-dialog>

    <!-- ============ 承运商端：路线报价 弹窗 ============ -->
    <el-dialog v-model="carrierQuoteDialogVisible" title="路线报价详情" width="540px">
      <template v-if="currentRoute">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="路线">{{ currentRoute.origin }} → {{ currentRoute.destination }}</el-descriptions-item>
          <el-descriptions-item label="货品">{{ currentRoute.cargo }}</el-descriptions-item>
          <el-descriptions-item label="货量">{{ currentRoute.cargoQty }}{{ currentRoute.unit }}（{{ currentRoute.stowage }}）</el-descriptions-item>
          <el-descriptions-item label="竞价截止">{{ currentRoute.publishDeadline }}</el-descriptions-item>
        </el-descriptions>
        <el-form :model="carrierQuoteForm" label-width="100px" style="margin-top: 16px">
          <el-form-item label="报价方式" required>
            <el-radio-group v-model="carrierQuoteForm.quoteMode">
              <el-radio label="按运输单价">按运输单价</el-radio>
              <el-radio label="按运输总价">按运输总价</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="carrierQuoteForm.quoteMode === '按运输单价' ? '运输单价' : '运输总价'" required>
            <el-input-number v-model="carrierQuoteForm.amount" :min="0" :controls="false" style="width: 160px" />
            <span class="unit">元{{ carrierQuoteForm.quoteMode === '按运输单价' ? '/' + currentRoute.unit : '' }}</span>
          </el-form-item>
          <el-form-item label="折算结果">
            <span>{{ convertedDisplay }}</span>
          </el-form-item>
          <el-form-item label="报价备注">
            <el-input v-model="carrierQuoteForm.remark" type="textarea" :rows="2" maxlength="300" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="carrierQuoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCarrierQuote">提交报价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BackBar from '../../src/components/BackBar.vue'
import {
  inquiryTypes, stowageModes, unitMap, cargoRecommend, cargoOptions,
  addressOptions, nvoccOptions, markupTypes,
  initialInquiries, currentCarrier, carrierPool,
} from './mock-data'

const inquiries = ref(JSON.parse(JSON.stringify(initialInquiries)))
const currentRole = ref('shipper')

const shipperStatusOptions = ['草稿', '待承接', '待报价', '待确认', '已完成', '已拒绝', '已取消']
const nvoccStatusOptions = ['待承接', '已承接', '已发布', '待货主确认', '已完成', '已拒绝', '已取消']

// ============ 货主端 ============
const shipperFilter = reactive({ keyword: '', status: '' })
const createDrawerVisible = ref(false)
const shipperDetailVisible = ref(false)
const editMode = ref(false)
const editing = reactive(getEmptyInquiry())
const currentDetail = ref(null)

function getEmptyInquiry() {
  return {
    id: '', inquiryType: '长协货源询价', title: '', shipper: '广林木业有限公司',
    nvocc: '', description: '', status: '草稿', createdAt: '',
    rejectReason: '', cancelReason: '', routes: [],
  }
}

const filteredShipperInquiries = computed(() => {
  return inquiries.value.filter(i => {
    if (shipperFilter.keyword) {
      const k = shipperFilter.keyword.toLowerCase()
      if (!i.id.toLowerCase().includes(k) && !i.title.toLowerCase().includes(k)) return false
    }
    if (shipperFilter.status && i.status !== shipperFilter.status) return false
    return true
  })
})

function openCreate() {
  Object.assign(editing, getEmptyInquiry())
  editing.routes = [getEmptyRoute()]
  editMode.value = false
  createDrawerVisible.value = true
}
function openEdit(row) {
  Object.assign(editing, JSON.parse(JSON.stringify(row)))
  editMode.value = true
  createDrawerVisible.value = true
}
function getEmptyRoute() {
  return {
    id: `R-${Date.now()}`, origin: '', destination: '', cargo: '',
    stowage: '按重量', cargoQty: 0, unit: '吨', transportMode: '汽运',
    remark: '', status: '待处理', publishDeadline: '', publishRemark: '',
    carrierQuotes: [], currentQuoteVersion: null, waybillNo: '',
  }
}
function addRouteRow() {
  editing.routes.push(getEmptyRoute())
}
function onCargoChange(row) {
  const rec = cargoRecommend[row.cargo]
  if (rec) {
    row.stowage = rec.stowage
    row.unit = rec.unit
  }
}
function onStowageChange(row) {
  const units = unitMap[row.stowage] || []
  if (units.length && !units.includes(row.unit)) row.unit = units[0]
}

function saveDraft() {
  if (!editing.title?.trim()) return ElMessage.warning('请输入询价标题')
  if (!editing.nvocc) return ElMessage.warning('请选择询价对象')
  applySave('草稿', '草稿保存成功')
}
function publishInquiry() {
  if (!editing.title?.trim()) return ElMessage.warning('请输入询价标题')
  if (!editing.nvocc) return ElMessage.warning('请选择询价对象')
  if (!editing.routes.length) return ElMessage.warning('请至少添加一条路线')
  for (let i = 0; i < editing.routes.length; i++) {
    const r = editing.routes[i]
    if (!r.origin || !r.destination || !r.cargo || !r.cargoQty) {
      return ElMessage.warning(`第 ${i + 1} 条路线信息不完整`)
    }
  }
  applySave('待承接', '已发布，进入待承接')
}
function applySave(status, msg) {
  const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  const data = JSON.parse(JSON.stringify(editing))
  data.status = status
  data.createdAt = now
  if (editMode.value) {
    const idx = inquiries.value.findIndex(x => x.id === editing.id)
    if (idx >= 0) Object.assign(inquiries.value[idx], data)
  } else {
    data.id = `IQ${Date.now().toString().slice(-10)}`
    inquiries.value.unshift(data)
  }
  ElMessage.success(msg)
  createDrawerVisible.value = false
}

function openShipperDetail(row) {
  currentDetail.value = row
  shipperDetailVisible.value = true
}
function deleteInquiry(row) {
  ElMessageBox.confirm(`确认删除草稿「${row.title}」？`, '删除', { type: 'warning' })
    .then(() => {
      const idx = inquiries.value.findIndex(x => x.id === row.id)
      if (idx >= 0) inquiries.value.splice(idx, 1)
      ElMessage.success('已删除')
    }).catch(() => {})
}
function cancelInquiry(row) {
  ElMessageBox.prompt('请输入取消原因', '取消询价', { type: 'warning' })
    .then(({ value }) => {
      row.status = '已取消'
      row.cancelReason = value
      ElMessage.success('已取消')
    }).catch(() => {})
}
function reopenInquiry(row) {
  const copy = JSON.parse(JSON.stringify(row))
  copy.id = `IQ${Date.now().toString().slice(-10)}`
  copy.status = '草稿'
  copy.createdAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  copy.rejectReason = ''
  copy.cancelReason = ''
  inquiries.value.unshift(copy)
  ElMessage.success('已重新发起，进入草稿编辑')
}
function confirmRoute(r) {
  r.status = '已确认'
  ElMessage.success('已确认')
}
function rejectRoute(r) {
  ElMessageBox.prompt('请输入驳回原因', '驳回报价', { type: 'warning' })
    .then(({ value }) => {
      r.status = '已驳回'
      r.currentQuoteVersion = null
      ElMessage.success('已驳回，无车承运人可重新提交')
    }).catch(() => {})
}
function generateWaybill(r) {
  r.waybillNo = `CON${Date.now().toString().slice(-10)}`
  r.status = '已生成托运单'
  // 检查整单是否完成
  if (currentDetail.value && currentDetail.value.routes.every(x => x.status === '已生成托运单' || x.status === '已取消')) {
    currentDetail.value.status = '已完成'
  }
  ElMessage.success(`已生成指定托运单：${r.waybillNo}`)
}

// ============ 无车承运人端 ============
const nvoccFilter = reactive({ keyword: '', status: '' })
const nvoccDetailVisible = ref(false)

const filteredNvoccInquiries = computed(() => {
  return inquiries.value.filter(i => {
    if (i.status === '草稿') return false // 草稿不进入无车端
    if (nvoccFilter.keyword) {
      const k = nvoccFilter.keyword.toLowerCase()
      if (!i.id.toLowerCase().includes(k) && !i.title.toLowerCase().includes(k)) return false
    }
    if (nvoccFilter.status && nvoccStatusOf(i) !== nvoccFilter.status) return false
    return true
  })
})

function nvoccStatusOf(i) {
  // 货主端"待报价"映射为无车端"已承接"
  if (i.status === '待报价') return '已承接'
  if (i.status === '待承接') return '待承接'
  if (i.status === '待确认') return '待货主确认'
  return i.status
}

function openNvoccDetail(row) {
  currentDetail.value = row
  nvoccDetailVisible.value = true
}
function acceptInquiry(row) {
  row.status = '待报价' // 货主端"待报价"
  ElMessage.success('已承接，进入待报价')
}
function rejectInquiry(row) {
  ElMessageBox.prompt('请输入拒绝原因', '拒绝承接', { type: 'warning' })
    .then(({ value }) => {
      row.status = '已拒绝'
      row.rejectReason = value
      ElMessage.success('已拒绝')
    }).catch(() => {})
}
function publishRoute(r) {
  ElMessageBox.confirm('请输入竞价截止时间与发布备注', '发布到询价大厅', {
    type: 'info',
    confirmButtonText: '发布',
  }).then(() => {
    const now = new Date()
    now.setDate(now.getDate() + 3)
    r.publishDeadline = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
    r.status = '报价中'
    r.publishId = `R${Date.now().toString().slice(-10)}`
    // 主单已发布
    if (currentDetail.value && currentDetail.value.status === '待报价') {
      // 至少 1 条已发布，主单进入"已发布"（无车端状态）
      // 货主端仍保持"待报价"，按 PRD 规则
    }
    ElMessage.success('已发布到询价大厅')
  }).catch(() => {})
}

// ============ 报价与提交给货主 ============
const quoteDialogVisible = ref(false)
const currentRoute = ref(null)
const quoteForm = reactive({ baseQuoteId: '', markupType: '按比例加价', markupValue: 0, totalAmount: 0, submitRemark: '' })

function openQuoteDialog(r) {
  currentRoute.value = r
  quoteForm.baseQuoteId = ''
  quoteForm.markupType = '按比例加价'
  quoteForm.markupValue = 0
  quoteForm.totalAmount = 0
  quoteForm.submitRemark = ''
  quoteDialogVisible.value = true
}
function selectBaseQuote(row) {
  quoteForm.baseQuoteId = row.id
  calcTotalAmount()
}
function calcTotalAmount() {
  const base = (currentRoute.value?.carrierQuotes || []).find(q => q.id === quoteForm.baseQuoteId)
  if (!base) return
  if (quoteForm.markupType === '按比例加价') {
    quoteForm.totalAmount = Math.round(base.totalAmount * (1 + (quoteForm.markupValue || 0) / 100))
  } else if (quoteForm.markupType === '按固定金额加价') {
    quoteForm.totalAmount = base.totalAmount + (quoteForm.markupValue || 0)
  }
}
watch(() => [quoteForm.markupType, quoteForm.markupValue, quoteForm.baseQuoteId], calcTotalAmount)

function submitToShipper() {
  if (!quoteForm.baseQuoteId) return ElMessage.warning('请选择基准报价')
  if (!quoteForm.totalAmount) return ElMessage.warning('请生成或填入对货主报价')
  const base = (currentRoute.value.carrierQuotes || []).find(q => q.id === quoteForm.baseQuoteId)
  currentRoute.value.currentQuoteVersion = {
    totalAmount: quoteForm.totalAmount,
    unitPrice: Math.round(quoteForm.totalAmount / (currentRoute.value.cargoQty || 1)),
    submitRemark: quoteForm.submitRemark,
    submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    baseQuoteId: quoteForm.baseQuoteId,
    baseCarrier: base?.carrier,
    markupType: quoteForm.markupType,
    markupValue: quoteForm.markupValue,
  }
  currentRoute.value.status = '待货主确认'
  if (currentDetail.value) currentDetail.value.status = '待确认'
  ElMessage.success('已提交给货主')
  quoteDialogVisible.value = false
}

// ============ 承运商端 ============
const carrierTab = ref('hall')
const carrierQuoteDialogVisible = ref(false)
const carrierQuoteForm = reactive({ quoteMode: '按运输单价', amount: 0, remark: '' })

// 询价大厅：当前承运商未报价 + 路线仍有效的发布单
const hallRoutes = computed(() => {
  return inquiries.value.flatMap(i =>
    i.routes
      .filter(r => r.status === '报价中' && r.publishId)
      .filter(r => !r.carrierQuotes.some(q => q.carrier === currentCarrier))
      .map(r => ({ ...r, inquiryId: i.id, inquiryTitle: i.title, publishId: r.publishId }))
  )
})

// 我的报价记录
const myQuoteRecords = computed(() => {
  const records = []
  inquiries.value.forEach(i => {
    i.routes.forEach(r => {
      if (!r.publishId) return
      const myQuote = r.carrierQuotes.find(q => q.carrier === currentCarrier)
      if (!myQuote) return
      let myStatus = '已报价'
      if (r.status === '已生成托运单') {
        myStatus = r.currentQuoteVersion?.baseCarrier === currentCarrier ? '已成交' : '未入围'
      } else if (['已取消', '已失效'].includes(i.status)) {
        myStatus = '已失效'
      }
      records.push({ ...r, inquiryId: i.id, myQuote, myStatus })
    })
  })
  return records
})

function openCarrierQuote(row) {
  currentRoute.value = row
  carrierQuoteForm.quoteMode = '按运输单价'
  carrierQuoteForm.amount = 0
  carrierQuoteForm.remark = ''
  carrierQuoteDialogVisible.value = true
}
const convertedDisplay = computed(() => {
  if (!currentRoute.value) return ''
  const qty = currentRoute.value.cargoQty || 1
  if (carrierQuoteForm.quoteMode === '按运输单价') {
    return `折算总价：¥${((carrierQuoteForm.amount || 0) * qty).toFixed(0)}`
  }
  return `折算单价：¥${((carrierQuoteForm.amount || 0) / qty).toFixed(2)}/${currentRoute.value.unit}`
})
function submitCarrierQuote() {
  if (!carrierQuoteForm.amount) return ElMessage.warning('请填入报价金额')
  const qty = currentRoute.value.cargoQty || 1
  const totalAmount = carrierQuoteForm.quoteMode === '按运输单价'
    ? Math.round(carrierQuoteForm.amount * qty)
    : carrierQuoteForm.amount
  const unitPrice = carrierQuoteForm.quoteMode === '按运输单价'
    ? carrierQuoteForm.amount
    : Math.round(totalAmount / qty)
  currentRoute.value.carrierQuotes.push({
    id: `Q${Date.now()}`,
    carrier: currentCarrier,
    totalAmount,
    unitPrice,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    remark: carrierQuoteForm.remark,
  })
  ElMessage.success('已提交报价')
  carrierQuoteDialogVisible.value = false
}
function modifyQuote(row) {
  ElMessage.info('修改报价：报价池未锁定时允许修改（简化演示）')
}

// ============ 样式 ============
function inquiryStatusType(s) {
  const map = { 草稿: 'info', 待承接: 'warning', 待报价: 'primary', 待确认: 'primary', 已完成: 'success', 已拒绝: 'danger', 已取消: 'info' }
  return map[s] || 'info'
}
function routeStatusType(s) {
  const map = { 待处理: 'info', 报价中: 'primary', 待货主确认: 'warning', 已驳回: 'danger', 已确认: 'success', 已生成托运单: 'success' }
  return map[s] || 'info'
}
function quoteStatusType(s) {
  const map = { 待报价: 'info', 已报价: 'primary', 未入围: 'info', 已成交: 'success', 已失效: 'info' }
  return map[s] || 'info'
}
</script>

<style scoped>
.inquiry-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e7ebf0;
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}
.page-sub {
  font-size: 12px;
  color: #909399;
}

.role-view {
  background: #fff;
  padding: 14px;
  border: 1px solid #e7ebf0;
  border-radius: 4px;
}

.filter-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0 10px;
}
.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 12px 0 8px;
}

.unit {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.detail-head strong {
  font-size: 16px;
  color: #1f2d3d;
}
.detail-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
</style>
