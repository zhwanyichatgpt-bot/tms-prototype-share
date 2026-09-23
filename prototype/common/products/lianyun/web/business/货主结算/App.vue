<template>
  <div class="settlement-page">
    <!-- 顶部切换条（原型演示用） -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ pageMode === 'add' ? '新增货主结算单' : '货主结算单详情' }}</h1>
      </div>
      <div class="header-right">
        <el-radio-group v-model="pageMode" size="small">
          <el-radio-button label="add">新增页</el-radio-button>
          <el-radio-button label="detail">详情页</el-radio-button>
        </el-radio-group>
      </div>
    </header>

    <!-- ============ 新增页 ============ -->
    <div v-if="pageMode === 'add'" class="add-view">
      <!-- 基础信息 -->
      <section class="form-section" :class="{ 'annot-shipper-settlement-field-basic-info': !selectedPlans.length }">
        <h3 class="section-title">基础信息</h3>
        <el-form :model="form" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="结算对象" required>
                <el-select v-model="form.objectId" style="width: 100%">
                  <el-option v-for="o in settlementObjects" :key="o.id" :label="`${o.id} ${o.name}`" :value="o.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结算方" required>
                <el-select v-model="form.partyId" style="width: 100%" @change="onPartyChange">
                  <el-option v-for="p in settlementParties" :key="p.id" :label="`${p.id} ${p.name}`" :value="p.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结算日期" required>
                <el-date-picker v-model="form.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结算总额">
                <strong class="amount">¥{{ totalAmount.toFixed(2) }}</strong>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </section>

      <!-- 核算联运计划 -->
      <section class="form-section">
        <div class="section-header">
          <h3 class="section-title">核算联运计划</h3>
          <el-button :class="{ 'annot-shipper-settlement-action-add-plan': !selectedPlans.length }" type="primary" link @click="openPlanSelector">+ 添加联运计划</el-button>
        </div>
        <el-empty v-if="!selectedPlans.length" description="请添加联运计划" />

        <div
          v-for="(plan, pIdx) in selectedPlans"
          :key="plan.id"
          class="plan-card"
          :class="{ 'annot-shipper-settlement-rule-plan-calculation': pIdx === 0 }"
        >
          <div class="plan-card-header">
            <strong>{{ plan.id }} {{ plan.name }}</strong>
            <el-tag :class="plan.settlementType === 'whole' ? 'tag-whole' : 'tag-segment'" size="small" effect="light">
              {{ plan.settlementType === 'whole' ? '整票结算' : '分段结算' }}
            </el-tag>
            <span class="plan-route">{{ plan.route }}</span>
            <el-button link type="danger" size="small" @click="removePlan(pIdx)">移除</el-button>
          </div>

          <!-- 整票结算 -->
          <template v-if="plan.settlementType === 'whole'">
            <div class="plan-meta">
              <span>计费条件：{{ plan.billingCondition }}</span>
              <span>计费依据：{{ plan.billingBasis }}</span>
              <span v-if="!isContainerBilling(plan.billingCondition)" class="meta-inline-control">
                计划级单价：
                <el-input-number v-model="plan.unitPrice" :min="0" :controls="false" size="small" style="width: 96px" />
                {{ plan.billingUnit }}
              </span>
            </div>
            <el-table :data="plan.cargoItems" border size="small">
              <el-table-column prop="name" label="货品/箱型" min-width="120" />
              <el-table-column prop="transportTotal" label="运输总量" width="100" />
              <el-table-column prop="settledQty" label="已结算量" width="100" />
              <el-table-column prop="unsettledQty" label="未结算量" width="100" />
              <el-table-column label="本次结算量" width="140">
                <template #default="{ row }">
                  <el-input-number v-model="row.settleQty" :min="0" :max="row.unsettledQty" :controls="false" size="small" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column label="运输单价" width="140">
                <template #default="{ row }">
                  <el-input-number v-if="isContainerBilling(plan.billingCondition)" v-model="row.unitPrice" :min="0" :controls="false" size="small" style="width: 100%" />
                  <span v-else>{{ plan.unitPrice }} {{ plan.billingUnit }}</span>
                </template>
              </el-table-column>
              <el-table-column label="基础运费" width="100">
                <template #default="{ row }">¥{{ calcWholeBaseFee(row, plan).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="补贴" width="80">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openSubsidy(plan, row, 'whole', 'subsidy')">{{ row.subsidyAmount || 0 }}</el-button>
                </template>
              </el-table-column>
              <el-table-column label="扣减" width="80">
                <template #default="{ row }">
                  <el-button link type="warning" size="small" @click="openSubsidy(plan, row, 'whole', 'deduction')">{{ row.deductionAmount || 0 }}</el-button>
                </template>
              </el-table-column>
              <el-table-column label="核算运费" width="100">
                <template #default="{ row }">
                  <strong>¥{{ calcWholeRowCheckFee(row, plan).toFixed(2) }}</strong>
                </template>
              </el-table-column>
            </el-table>
          </template>

          <!-- 分段结算（异构） -->
          <template v-else>
            <div class="plan-meta">
              <span>分段结算</span>
            </div>
            <div v-for="sub in plan.subPlans" :key="sub.seq" class="sub-block">
              <div class="sub-header">
                <strong>路段{{ sub.seq }}：{{ sub.from }} → {{ sub.to }}（{{ sub.transportMode }}）</strong>
                <el-tag size="small" type="info">{{ sub.billingCondition }}</el-tag>
                <el-tag v-if="sub.billingBasis" size="small">{{ sub.billingBasis }}</el-tag>
                <span v-if="!isContainerBilling(sub.billingCondition)" class="meta-inline-control">
                  路段单价：
                  <el-input-number v-model="sub.unitPrice" :min="0" :controls="false" size="small" style="width: 96px" />
                  {{ sub.priceUnit }}
                </span>
              </div>
              <el-table :data="sub.lineItems" border size="small">
                <el-table-column prop="name" label="货品/箱型" min-width="120" />
                <el-table-column prop="transportTotal" label="运输总量" width="100" />
                <el-table-column prop="settledQty" label="已结算量" width="100" />
                <el-table-column prop="unsettledQty" label="未结算量" width="100" />
                <el-table-column label="本次结算量" width="140">
                  <template #default="{ row }">
                    <el-input-number v-model="row.currentSettleQty" :min="0" :max="row.unsettledQty" :controls="false" size="small" style="width: 100%" />
                  </template>
                </el-table-column>
                <el-table-column label="运输单价" width="140">
                  <template #default="{ row }">
                    <el-input-number v-if="isContainerBilling(sub.billingCondition)" v-model="row.unitPrice" :min="0" :controls="false" size="small" style="width: 100%" />
                    <span v-else>{{ sub.unitPrice }} {{ sub.priceUnit }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="明细金额" width="100">
                  <template #default="{ row }">¥{{ calcLineFee(row, sub).toFixed(2) }}</template>
                </el-table-column>
              <el-table-column label="补贴" width="80">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="openSubsidy(plan, { subPlan: sub, line: row }, 'segment', 'subsidy')">{{ row.subsidyAmount || 0 }}</el-button>
                </template>
              </el-table-column>
                <el-table-column label="扣减" width="80">
                  <template #default="{ row }">
                    <el-button link type="warning" size="small" @click="openSubsidy(plan, { subPlan: sub, line: row }, 'segment', 'deduction')">{{ row.deductionAmount || 0 }}</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="核算运费" width="100">
                  <template #default="{ row }">
                    <strong>¥{{ calcSegmentLineCheckFee(row, sub).toFixed(2) }}</strong>
                  </template>
                </el-table-column>
              </el-table>
              <div class="sub-subtotal">
                路段{{ sub.seq }} 小计：基础运费 ¥{{ calcSubBaseFee(sub).toFixed(2) }}，补贴 ¥{{ calcSubSubsidy(sub).toFixed(2) }}，扣减 ¥{{ calcSubDeduction(sub).toFixed(2) }}，核算 ¥{{ calcSubCheckFee(sub).toFixed(2) }}
              </div>
            </div>
          </template>

          <!-- 计划小计 -->
          <div class="plan-subtotal" :class="{ 'annot-shipper-settlement-rule-fee-adjustment': pIdx === 0 }">
            <strong>计划核算运费合计：¥{{ calcPlanCheckFee(plan).toFixed(2) }}</strong>
          </div>
        </div>

        <div v-if="selectedPlans.length" class="calc-notice">
          核算公式：核算运费 = 基础运费 + 补贴金额 − 扣减金额
        </div>
      </section>

      <!-- 底部操作栏 -->
      <footer class="page-footer">
        <el-button @click="pageMode = 'detail'">取消</el-button>
        <el-button :class="{ 'annot-shipper-settlement-action-submit': selectedPlans.length }" type="primary" :loading="submitting" @click="submitSettlement">提交结算单</el-button>
      </footer>
    </div>

    <!-- ============ 详情页 ============ -->
    <div v-else class="detail-view">
      <!-- 基础信息 + 全单费用汇总 -->
      <section class="form-section annot-shipper-settlement-field-detail-basic-info">
        <h3 class="section-title">基础信息</h3>
        <div class="info-grid">
          <div><span>结算单号</span><strong>{{ detail.settlementNo }}</strong></div>
          <div class="annot-shipper-settlement-action-status-payment"><span>状态</span><el-tag :type="detailStatusType(detail.status)" size="small">{{ detail.status }}</el-tag></div>
          <div><span>结算对象</span><strong>{{ detail.settlementObject }}</strong></div>
          <div><span>结算方</span><strong>{{ detail.settlementParty }}</strong></div>
          <div><span>结算日期</span><strong>{{ detail.settlementDate }}</strong></div>
          <div><span>创建人</span><strong>{{ detail.creator }}</strong></div>
          <div><span>创建时间</span><strong>{{ detail.createTime }}</strong></div>
          <div><span>备注</span><strong>{{ detail.remark || '-' }}</strong></div>
        </div>

        <div class="fee-summary-bar annot-shipper-settlement-field-fee-overview">
          <div class="fee-cell"><span>基础运费合计</span><strong>¥{{ detail.feeSummary.baseFee.toLocaleString() }}</strong></div>
          <div class="fee-divider"></div>
          <div class="fee-cell"><span>补贴金额合计</span><strong>¥{{ detail.feeSummary.subsidy.toLocaleString() }}</strong></div>
          <div class="fee-divider"></div>
          <div class="fee-cell"><span>扣减金额合计</span><strong>¥{{ detail.feeSummary.deduction.toLocaleString() }}</strong></div>
          <div class="fee-divider"></div>
          <div class="fee-cell highlight"><span>结算总额</span><strong>¥{{ detail.feeSummary.total.toLocaleString() }}</strong></div>
          <el-button v-if="detail.status === '待打款'" type="primary" @click="confirmPay">确认打款</el-button>
        </div>
      </section>

      <!-- 主内容区：左计划汇总 + 右计费详情 -->
      <div class="detail-main">
        <!-- 左侧：联运计划汇总 -->
        <div class="detail-left">
          <h4 class="sub-title">联运计划汇总（点击切换）</h4>
          <div
            v-for="p in detail.plans"
            :key="p.id"
            class="plan-summary-card"
            :class="{ active: selectedPlanId === p.id }"
            @click="selectedPlanId = p.id"
          >
            <div class="card-head">
              <strong>{{ p.id }}</strong>
              <el-tag :class="p.type === 'whole' ? 'tag-whole' : 'tag-segment'" size="small" effect="light">{{ p.type === 'whole' ? '整票结算' : '分段结算' }}</el-tag>
            </div>
            <div class="card-line">{{ p.name }}</div>
            <div class="card-line" v-if="p.type === 'whole'">{{ p.billingCondition }} · {{ p.billingBasis }}</div>
            <div class="card-line" v-else>异构分段</div>
            <div class="card-line">{{ p.cargoSummary }}</div>
            <div class="card-fee">
              <span>基础运费 ¥{{ p.baseFee.toLocaleString() }}</span>
              <span>补贴 ¥{{ p.subsidy.toLocaleString() }}</span>
              <span>扣减 ¥{{ p.deduction.toLocaleString() }}</span>
            </div>
            <div class="card-fee-total">核算运费 ¥{{ p.checkFee.toLocaleString() }}</div>
          </div>
        </div>

        <!-- 右侧：计费详情 -->
        <div class="detail-right">
          <template v-if="currentPlan">
            <!-- 计费类型 -->
            <div class="calc-group">
              <h4 class="calc-title">计费类型</h4>
              <div class="info-grid">
                <div><span>联运计划号</span><strong>{{ currentPlan.id }}</strong></div>
                <div><span>结算方式</span><strong>{{ currentPlan.type === 'whole' ? '整票结算' : '分段结算' }}</strong></div>
                <div v-if="currentPlan.type === 'whole'"><span>计费条件</span><strong>{{ currentPlan.billingCondition }}</strong></div>
                <div v-if="currentPlan.type === 'whole'"><span>计费依据</span><strong>{{ currentPlan.billingBasis }}</strong></div>
                <div><span>运输路线</span><strong>{{ currentPlan.route }}</strong></div>
                <div><span>计价方式</span><strong>{{ currentPlan.pricingMethod }}</strong></div>
              </div>
            </div>

            <!-- 基础运费 -->
            <div class="calc-group">
              <h4 class="calc-title">基础运费</h4>
              <template v-if="currentPlan.type === 'whole'">
                <el-table :data="currentPlan.items" border size="small">
                  <el-table-column prop="name" label="货品/箱型" min-width="120" />
                  <el-table-column prop="transportTotal" label="运输总量" width="100" />
                  <el-table-column prop="settledQty" label="已结算量" width="100" />
                  <el-table-column prop="unsettledQty" label="未结算量" width="100" />
                  <el-table-column prop="settleQty" label="本次结算量" width="100" />
                  <el-table-column prop="unitPrice" label="运输单价" width="100" />
                  <el-table-column prop="baseFee" label="基础运费" width="100">
                    <template #default="{ row }">¥{{ row.baseFee.toLocaleString() }}</template>
                  </el-table-column>
                </el-table>
              </template>
              <template v-else>
                <div v-for="sub in currentPlan.subPlans" :key="sub.seq" class="sub-block">
                  <div class="sub-header">
                    <strong>路段{{ sub.seq }}：{{ sub.from }} → {{ sub.to }}（{{ sub.transportMode }}）</strong>
                    <el-tag size="small" type="info">{{ sub.billingCondition }}</el-tag>
                    <el-tag v-if="sub.billingBasis" size="small">{{ sub.billingBasis }}</el-tag>
                    <span v-if="!isContainerBilling(sub.billingCondition)">单价：{{ sub.unitPrice }} {{ sub.priceUnit }}</span>
                    <span v-else>箱型单价见明细</span>
                  </div>
                  <el-table :data="sub.lineItems" border size="small">
                    <el-table-column prop="name" label="货品/箱型" min-width="120" />
                    <el-table-column prop="transportTotal" label="运输总量" width="100" />
                    <el-table-column prop="settledQty" label="已结算量" width="100" />
                    <el-table-column prop="unsettledQty" label="未结算量" width="100" />
                    <el-table-column prop="currentSettleQty" label="本次结算量" width="100" />
                    <el-table-column label="运输单价" width="110">
                      <template #default="{ row }">{{ row.unitPrice ?? sub.unitPrice }} {{ sub.priceUnit }}</template>
                    </el-table-column>
                    <el-table-column prop="lineFee" label="明细金额" width="100">
                      <template #default="{ row }">¥{{ row.lineFee.toLocaleString() }}</template>
                    </el-table-column>
                    <el-table-column prop="subsidy" label="补贴" width="90">
                      <template #default="{ row }">¥{{ (row.subsidy || 0).toLocaleString() }}</template>
                    </el-table-column>
                    <el-table-column prop="deduction" label="扣减" width="90">
                      <template #default="{ row }">¥{{ (row.deduction || 0).toLocaleString() }}</template>
                    </el-table-column>
                    <el-table-column label="核算运费" width="110">
                      <template #default="{ row }">¥{{ (row.lineFee + (row.subsidy || 0) - (row.deduction || 0)).toLocaleString() }}</template>
                    </el-table-column>
                  </el-table>
                  <div class="sub-subtotal">路段小计：¥{{ sub.subtotal.checkFee.toLocaleString() }}</div>
                </div>
              </template>
            </div>

            <!-- 补贴费用 -->
            <div class="calc-group">
              <h4 class="calc-title">补贴费用</h4>
              <el-table :data="currentPlan.subsidyRows" border size="small" empty-text="无补贴">
                <el-table-column v-if="currentPlan.type === 'segment'" prop="segment" label="所属路段" width="120" />
                <el-table-column prop="name" label="货品/箱型" min-width="120" />
                <el-table-column prop="item" label="补贴项目" min-width="140" />
                <el-table-column label="金额" width="120">
                  <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 扣减费用 -->
            <div class="calc-group">
              <h4 class="calc-title">扣减费用</h4>
              <el-table :data="currentPlan.deductionRows" border size="small" empty-text="无扣减">
                <el-table-column v-if="currentPlan.type === 'segment'" prop="segment" label="所属路段" width="120" />
                <el-table-column prop="name" label="货品/箱型" min-width="120" />
                <el-table-column prop="item" label="扣减项目" min-width="140" />
                <el-table-column label="金额" width="120">
                  <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 核算结果 -->
            <div class="calc-group">
              <h4 class="calc-title">核算结果</h4>
              <div class="result-bar">
                <div class="result-row">
                  <span>基础运费合计</span>
                  <strong>¥{{ currentPlan.baseFee.toLocaleString() }}</strong>
                </div>
                <div class="result-row">
                  <span>补贴金额合计</span>
                  <strong class="subsidy-color">+ ¥{{ currentPlan.subsidy.toLocaleString() }}</strong>
                </div>
                <div class="result-row">
                  <span>扣减金额合计</span>
                  <strong class="deduction-color">- ¥{{ currentPlan.deduction.toLocaleString() }}</strong>
                </div>
                <div class="result-divider"></div>
                <div class="result-row result-final">
                  <span>核算运费</span>
                  <strong>¥{{ currentPlan.checkFee.toLocaleString() }}</strong>
                </div>
                <div class="result-formula">核算运费 = 基础运费合计 + 补贴金额合计 - 扣减金额合计</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ============ 计划选择抽屉 ============ -->
    <el-drawer v-model="planSelectorVisible" title="添加联运计划" direction="rtl" size="960px" :append-to-body="false">
      <el-empty v-if="!candidatePlans.length" description="当前结算方暂无可结算联运计划" />
      <el-table class="annot-shipper-settlement-field-selectable-plans" :data="candidatePlans" border @selection-change="onPlanSelectChange">
        <el-table-column type="selection" width="50" :selectable="row => row.selectable" />
        <el-table-column prop="id" label="联运计划号" width="160" />
        <el-table-column prop="route" label="路线" min-width="160" />
        <el-table-column prop="cargoSummary" label="货品" min-width="140" />
        <el-table-column prop="transportMode" label="运输方式" width="100" />
        <el-table-column prop="shipperCompany" label="托运企业" min-width="160" />
        <el-table-column label="运输总量" min-width="220">
          <template #default="{ row }">{{ buildPlanQuantitySummary(row, 'total') }}</template>
        </el-table-column>
        <el-table-column label="待结算总量" min-width="220">
          <template #default="{ row }">{{ buildPlanQuantitySummary(row, 'unsettled') }}</template>
        </el-table-column>
        <el-table-column label="计价方式" min-width="180">
          <template #default="{ row }">{{ getPlanPricingSummary(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="!row.selectable" type="info" size="small">不可选</el-tag>
            <el-tag v-else type="success" size="small">可选</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="不可选原因" min-width="160">
          <template #default="{ row }">{{ row.selectable ? '-' : row.unselectableReason }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="planSelectorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddPlans">确认添加</el-button>
      </template>
    </el-drawer>

    <!-- ============ 补贴扣减维护弹窗 ============ -->
    <el-dialog
      v-model="subsidyDialogVisible"
      :title="subsidyType === 'subsidy' ? '维护补贴项' : '维护扣减项'"
      width="640px"
      :append-to-body="false"
    >
      <el-table :data="subsidyItems" border size="small">
        <el-table-column label="项目名称" min-width="160">
          <template #default="{ row }"><el-input v-model="row.name" size="small" placeholder="项目名称" /></template>
        </el-table-column>
        <el-table-column label="金额" width="160">
          <template #default="{ row }"><el-input-number v-model="row.amount" :min="0" :controls="false" size="small" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }"><el-input v-model="row.remark" size="small" /></template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="subsidyItems.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" link size="small" style="margin-top: 10px" @click="subsidyItems.push({ name: '', amount: 0, remark: '' })">+ 添加{{ subsidyType === 'subsidy' ? '补贴' : '扣减' }}项</el-button>
      <template #footer>
        <el-button @click="subsidyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSubsidy">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  settlementObjects, settlementParties,
  getPlansByParty, detailSnapshot,
} from './mock-data'
import {
  buildPlanQuantitySummary,
  formatLocalDate,
  validateAdjustmentItems,
} from './settlement-rules.mjs'

const pageMode = ref('add')
const submitting = ref(false)

// ============ 新增页 ============
const form = reactive({ objectId: 'OBJ001', partyId: '', date: formatLocalDate(), remark: '', totalAmount: 0 })
const selectedPlans = ref([])
const planSelectorVisible = ref(false)
const tempSelected = ref([])
const lastConfirmedPartyId = ref('')

const candidatePlans = computed(() => {
  const all = getPlansByParty(form.partyId)
  return all.map(p => {
    const alreadySelected = selectedPlans.value.some(sp => sp.id === p.id)
    return {
      ...p,
      selectable: p.selectable && !alreadySelected,
      unselectableReason: alreadySelected ? '已添加到本结算单' : p.unselectableReason,
    }
  })
})

function onPartyChange(nextPartyId) {
  if (selectedPlans.value.length) {
    ElMessageBox.confirm('修改结算方将清空已选联运计划，是否继续？', '确认', { type: 'warning' })
      .then(() => {
        selectedPlans.value = []
        lastConfirmedPartyId.value = nextPartyId
      })
      .catch(() => {
        form.partyId = lastConfirmedPartyId.value
      })
    return
  }
  lastConfirmedPartyId.value = nextPartyId
}

function openPlanSelector() {
  if (!form.partyId) return ElMessage.warning('请先选择结算方')
  tempSelected.value = []
  planSelectorVisible.value = true
}
function onPlanSelectChange(rows) {
  tempSelected.value = rows
}
function confirmAddPlans() {
  tempSelected.value.forEach(p => {
    const copy = JSON.parse(JSON.stringify(p))
    // 整票：初始化 settleQty = unsettledQty
    if (copy.settlementType === 'whole') {
      copy.cargoItems.forEach(c => { c.settleQty = c.unsettledQty })
    } else {
      copy.subPlans.forEach(s => s.lineItems.forEach(l => { l.currentSettleQty = l.unsettledQty }))
    }
    selectedPlans.value.push(copy)
  })
  planSelectorVisible.value = false
  ElMessage.success(`已添加 ${tempSelected.value.length} 个联运计划`)
  tempSelected.value = []
}
function removePlan(idx) {
  selectedPlans.value.splice(idx, 1)
}

function getPlanPricingSummary(plan) {
  if (plan.settlementType === 'whole') {
    return isContainerBilling(plan.billingCondition)
      ? '按箱型单价计费'
      : `${plan.billingCondition} · ${plan.billingBasis} · ${plan.unitPrice}${plan.billingUnit}`
  }
  return '各子计划按自身条件、依据和单价计费'
}

// 计算函数
function isContainerBilling(condition) {
  return condition === '按集装箱'
}
function getWholeUnitPrice(row, plan) {
  return isContainerBilling(plan.billingCondition) ? (row.unitPrice ?? 0) : (plan.unitPrice ?? 0)
}
function getLineUnitPrice(row, sub) {
  return isContainerBilling(sub.billingCondition) ? (row.unitPrice ?? 0) : (sub.unitPrice ?? 0)
}
function calcWholeBaseFee(row, plan) {
  return (row.settleQty || 0) * getWholeUnitPrice(row, plan)
}
function calcWholeRowCheckFee(row, plan) {
  return calcWholeBaseFee(row, plan) + (row.subsidyAmount || 0) - (row.deductionAmount || 0)
}
function calcLineFee(row, sub) {
  return (row.currentSettleQty || 0) * getLineUnitPrice(row, sub)
}
function calcSegmentLineCheckFee(row, sub) {
  return calcLineFee(row, sub) + (row.subsidyAmount || 0) - (row.deductionAmount || 0)
}
function calcSubBaseFee(sub) {
  return sub.lineItems.reduce((s, l) => s + calcLineFee(l, sub), 0)
}
function calcSubSubsidy(sub) {
  return sub.lineItems.reduce((s, l) => s + (l.subsidyAmount || 0), 0)
}
function calcSubDeduction(sub) {
  return sub.lineItems.reduce((s, l) => s + (l.deductionAmount || 0), 0)
}
function calcSubCheckFee(sub) {
  return calcSubBaseFee(sub) + calcSubSubsidy(sub) - calcSubDeduction(sub)
}
function calcPlanCheckFee(plan) {
  if (plan.settlementType === 'whole') {
    return plan.cargoItems.reduce((s, c) => s + calcWholeRowCheckFee(c, plan), 0)
  }
  return plan.subPlans.reduce((s, sub) => s + calcSubCheckFee(sub), 0)
}

const totalAmount = computed(() => selectedPlans.value.reduce((s, p) => s + calcPlanCheckFee(p), 0))

function submitSettlement() {
  if (!form.objectId) return ElMessage.warning('请选择结算对象')
  if (!form.partyId) return ElMessage.warning('请选择结算方')
  if (!form.date) return ElMessage.warning('请选择结算日期')
  if (!selectedPlans.value.length) return ElMessage.warning('请至少添加一个联运计划')
  for (const p of selectedPlans.value) {
    if (p.settlementType === 'whole') {
      if (!isContainerBilling(p.billingCondition) && (!p.unitPrice || p.unitPrice <= 0)) return ElMessage.warning(`计划 ${p.id} 计划级运输单价需大于 0`)
      for (const c of p.cargoItems) {
        if (!c.settleQty || c.settleQty <= 0) return ElMessage.warning(`计划 ${p.id} 本次结算量需大于 0`)
        if (c.settleQty > c.unsettledQty) return ElMessage.warning(`计划 ${p.id} 本次结算量不得超过未结算量`)
        if (isContainerBilling(p.billingCondition) && (!c.unitPrice || c.unitPrice <= 0)) return ElMessage.warning(`计划 ${p.id} ${c.name} 箱型单价需大于 0`)
      }
    } else {
      for (const sub of p.subPlans) {
        if (!isContainerBilling(sub.billingCondition) && (!sub.unitPrice || sub.unitPrice <= 0)) return ElMessage.warning(`计划 ${p.id} 路段${sub.seq} 路段单价需大于 0`)
        for (const l of sub.lineItems) {
          if ((l.currentSettleQty || 0) > l.unsettledQty) return ElMessage.warning(`计划 ${p.id} 路段${sub.seq} 本次结算量不得超过未结算量`)
          if (isContainerBilling(sub.billingCondition) && (!l.unitPrice || l.unitPrice <= 0)) return ElMessage.warning(`计划 ${p.id} 路段${sub.seq} ${l.name} 箱型单价需大于 0`)
        }
      }
    }
  }
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    ElMessage.success('提交成功，结算单进入待审核')
    pageMode.value = 'detail'
  }, 800)
}

// ============ 补贴扣减 ============
const subsidyDialogVisible = ref(false)
const subsidyType = ref('subsidy')
const subsidyItems = ref([])
let subsidyTarget = null

function openSubsidy(plan, target, planType, type) {
  subsidyType.value = type
  subsidyTarget = { plan, target, planType }
  if (planType === 'whole') {
    subsidyItems.value = JSON.parse(JSON.stringify(target[type === 'subsidy' ? 'subsidyItems' : 'deductionItems'] || []))
  } else {
    subsidyItems.value = JSON.parse(JSON.stringify(target.line[type === 'subsidy' ? 'subsidyItems' : 'deductionItems'] || []))
  }
  subsidyDialogVisible.value = true
}
function confirmSubsidy() {
  const validation = validateAdjustmentItems(subsidyItems.value)
  if (!validation.valid) return ElMessage.warning(validation.message)
  const valid = JSON.parse(JSON.stringify(subsidyItems.value))
  const total = validation.total
  const { plan, target, planType } = subsidyTarget
  const key = subsidyType.value === 'subsidy' ? 'subsidyItems' : 'deductionItems'
  const amountKey = subsidyType.value === 'subsidy' ? 'subsidyAmount' : 'deductionAmount'
  if (planType === 'whole') {
    target[key] = valid
    target[amountKey] = total
  } else {
    target.line[key] = valid
    target.line[amountKey] = total
  }
  subsidyDialogVisible.value = false
  ElMessage.success(`已维护${subsidyType.value === 'subsidy' ? '补贴' : '扣减'} ¥${total}`)
}

// ============ 详情页 ============
const detail = detailSnapshot
const selectedPlanId = ref(detail.plans[0]?.id)
const currentPlan = computed(() => detail.plans.find(p => p.id === selectedPlanId.value))

function detailStatusType(s) {
  const map = { 待审核: 'warning', 待打款: 'primary', 已打款: 'success', 已作废: 'info' }
  return map[s] || 'info'
}
function confirmPay() {
  ElMessageBox.confirm('确认打款？打款后结算单进入已打款状态。', '确认打款', { type: 'info' })
    .then(() => {
      detail.status = '已打款'
      ElMessage.success('已确认打款')
    }).catch(() => {})
}
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

.settlement-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px 20px 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e7ebf0;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-section {
  background: #fff;
  border: 1px solid #e7ebf0;
  border-radius: 4px;
  padding: 18px 20px;
  margin-bottom: 14px;
}
.section-title {
  position: relative;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 16px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  background: #165dff;
  transform: translateY(-50%);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.section-header .section-title {
  margin: 0;
}

.amount {
  color: #f53f3f;
  font-size: 18px;
  font-weight: 600;
}

.plan-card {
  background: #f7f9fc;
  border-radius: 4px;
  padding: 14px;
  margin-bottom: 14px;
}
.plan-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.plan-card-header strong {
  font-size: 14px;
  color: #1f2d3d;
}
.plan-route {
  flex: 1;
  font-size: 13px;
  color: #606266;
}
.plan-meta {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  flex-wrap: wrap;
  min-height: 28px;
}
.plan-meta > span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
}
.meta-inline-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sub-block {
  margin-top: 12px;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
}
.sub-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  font-size: 13px;
}
.sub-header strong {
  color: #1f2d3d;
}
.sub-subtotal {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
  text-align: right;
}

.plan-subtotal {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #dfe3ea;
  font-size: 14px;
}
.plan-subtotal strong {
  color: #f53f3f;
}

.calc-notice {
  padding: 10px 14px;
  background: #f2f6ff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  text-align: center;
  margin-top: 10px;
}

.page-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  border-top: 1px solid #e7ebf0;
  z-index: 10;
}

/* 详情页样式 - 按源文件还原 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 20px;
  margin-bottom: 14px;
}
.info-grid > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
}
.info-grid span {
  color: #86909c;
  font-size: 13px;
  flex-shrink: 0;
}
.info-grid strong {
  color: #1d2129;
  font-weight: 500;
  font-size: 14px;
}

.fee-summary-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 14px 24px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 12px;
}
.fee-cell {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 12px;
}
.fee-cell span {
  font-size: 13px;
  color: #86909c;
}
.fee-cell strong {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}
.fee-cell.highlight strong {
  font-size: 16px;
  font-weight: 600;
  color: #165dff;
}
.fee-divider {
  width: 1px;
  height: 20px;
  background: #e8e8e8;
}

.detail-main {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.detail-left {
  width: 58%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 18px 16px;
  flex-shrink: 0;
}
.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 10px;
}
.plan-summary-card {
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-left: 3px solid transparent;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.plan-summary-card:hover {
  border-color: #bedaff;
  background: #f7faff;
}
.plan-summary-card.active {
  border-left: 3px solid #165dff;
  border-color: #bedaff;
  background: #f0f5ff;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.card-head strong {
  font-size: 13px;
  color: #1f2d3d;
  font-weight: 600;
}
.card-line {
  font-size: 12px;
  color: #4e5969;
  margin-bottom: 4px;
}
.card-fee {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #86909c;
  margin-top: 6px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px dashed #e8e8e8;
}
.card-fee-total {
  font-size: 14px;
  color: #165dff;
  font-weight: 600;
  margin-top: 4px;
}

.detail-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.calc-group {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 18px 16px;
}
.calc-title {
  position: relative;
  padding-left: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 12px;
}
.calc-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  background: #165dff;
  transform: translateY(-50%);
}
.calc-group .info-grid {
  margin-bottom: 0;
}

.result-bar {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 14px 16px;
}
.result-bar > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  font-size: 13px;
}
.result-bar > .result-divider {
  border-top: 1px dashed #e0e0e0;
  margin: 6px 0;
  padding: 0;
}
.result-bar span {
  color: #86909c;
}
.result-bar strong {
  color: #1d2129;
  font-weight: 500;
}
.result-bar .subsidy-color { color: #165dff; }
.result-bar .deduction-color { color: #f53f3f; }
.result-bar .result-final strong {
  font-size: 18px;
  font-weight: 700;
  color: #165dff;
}
.result-formula {
  text-align: center;
  font-size: 12px;
  color: #86909c;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
}

@media (max-width: 1200px) {
  .detail-main {
    flex-direction: column;
  }
  .detail-left {
    width: 100%;
  }
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 结算方式 tag 配色（按源文件）*/
.tag-whole {
  background: #e8f3ff !important;
  color: #165dff !important;
  border-color: transparent !important;
}
.tag-segment {
  background: #f5e8ff !important;
  color: #722ed1 !important;
  border-color: transparent !important;
}
</style>
