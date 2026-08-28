export const pageCatalog = Object.freeze([
  {
    key: 'waybillManage', scope: 'common', projectId: null,
    requirement: 'TMS 通用托运单管理', remark: '用于验证托运单列表、详情和创建流程。',
    sourcePaths: ['prototype/common/business/web/托运单管理/'], evidencePaths: ['prd/托运单管理_托运单创建与管理_PRD_v1.md'],
  },
  {
    key: 'waybillDetail', scope: 'common', projectId: null,
    requirement: 'TMS 通用托运单管理', remark: '用于验证待执行状态下的托运单详情、费用、货品与联运路段北斗轨迹。',
    sourcePaths: [
      'prototype/common/business/web/托运单管理/详情/',
      'prototype/common/business/web/_shared/tms-web-shell/',
    ],
    evidencePaths: [
      'prd/托运单管理_托运单创建与管理_PRD_v1.md',
      'context/project-rules/Pixso设计稿还原与原型源码治理规范.md',
    ],
  },
  {
    key: 'waybillQuote', scope: 'common', projectId: null,
    requirement: 'TMS 通用承运商报价', remark: '用于验证承运商查看托运需求并提交报价。',
    sourcePaths: ['prototype/common/portal/承运商报价/'], evidencePaths: ['prd/托运单管理_承运商报价页面_PRD_v2.md'],
  },
  {
    key: 'inquiryHall', scope: 'common', projectId: null,
    requirement: 'TMS 通用货源大厅', remark: '用于验证承运商查看货源、进入详情和参与报价的入口。',
    sourcePaths: ['prototype/common/portal/货源大厅/'], evidencePaths: ['prd/托运单管理_承运商报价页面_PRD_v2.md'],
  },
  {
    key: 'multimodalCreate', scope: 'common', projectId: null,
    requirement: 'TMS 通用多式联运', remark: '用于验证多式联运计划的创建和路线组织。',
    sourcePaths: ['prototype/common/business/web/联运计划管理/创建联运计划/'], evidencePaths: ['prd/多式联运_创建联运计划_PRD_v1.md'],
  },
  {
    key: 'multimodalManage', scope: 'common', projectId: null,
    requirement: 'TMS 通用多式联运', remark: '用于验证联运计划列表、状态和管理操作。',
    sourcePaths: [
      'prototype/common/business/web/联运计划管理/App.vue',
      'prototype/common/business/web/联运计划管理/mock-data.js',
    ],
    evidencePaths: ['prd/多式联运_联运计划管理页_PRD_v1.md'],
  },
  {
    key: 'shipperSettlement', scope: 'common', projectId: null,
    requirement: 'TMS 通用货主结算', remark: '用于验证货主结算单据、费用和确认流程。',
    sourcePaths: ['prototype/common/business/web/货主结算/'], evidencePaths: ['prd/多式联运_货主结算_PRD_v1.md'],
  },
  {
    key: 'containerPlan', scope: 'common', projectId: null,
    requirement: 'TMS 通用公路计划', remark: '用于验证集装箱运输计划创建和上下游衔接。',
    sourcePaths: ['prototype/common/business/web/集装箱计划创建/'], evidencePaths: ['prd/公路计划管理_集装箱运输计划创建_PRD_v1.md'],
  },
  {
    key: 'transportChannel', scope: 'common', projectId: null,
    requirement: 'TMS 通用运输通道', remark: '用于验证运输通道、运输方案和发布管理。',
    sourcePaths: ['prototype/common/business/web/运输通道管理/'], evidencePaths: ['prd/运输通道管理_运输通道与运输方案管理_PRD_v2.md'],
  },
  {
    key: 'transportTask', scope: 'common', projectId: null,
    requirement: 'TMS 通用运输任务', remark: '用于验证运输任务卡片流转、调度状态、指派进度与操作。',
    sourcePaths: [
      'prototype/common/business/web/运输任务/',
      'prototype/common/business/web/_shared/tms-web-shell/',
    ],
    evidencePaths: [
      'context/project-rules/Pixso设计稿还原与原型源码治理规范.md',
      '.planning/2026-08-24-tms-web-frame-refactor/TMS-Web通用框架与源码治理任务清单.md',
    ],
  },
  {
    key: 'waybillCenter', scope: 'common', projectId: null,
    requirement: 'TMS 通用运单中心', remark: '用于验证运单类型面板、状态筛选、运单列表与操作。',
    sourcePaths: [
      'prototype/common/business/web/运单中心/App.vue',
      'prototype/common/business/web/运单中心/mock-data.js',
      'prototype/common/business/web/运单中心/waybill-center.css',
      'prototype/common/business/web/运单中心/components/',
      'prototype/common/business/web/_shared/tms-web-shell/',
    ],
    evidencePaths: [
      'context/project-rules/Pixso设计稿还原与原型源码治理规范.md',
    ],
  },
  {
    key: 'waybillCenterDetail', scope: 'common', projectId: null,
    requirement: 'TMS 通用运单中心', remark: '用于验证运单详情的运输路线、地图轨迹与费用区。',
    sourcePaths: ['prototype/common/business/web/运单中心/详情/'],
    evidencePaths: [
      'context/project-rules/Pixso设计稿还原与原型源码治理规范.md',
    ],
  },
  {
    key: 'waybillCenterBeigang', scope: 'project', projectId: 'beigang',
    requirement: '北港运单中心地址及运输单价变更', remark: '用于验证北港定制卸货地址及运输单价变更的发起、处理、撤回与视角差异；源自通用运单中心；已纳入 TMS-BEIGANG-202608-02（北港1.0.3.5版本）。',
    sourcePaths: [
      'prototype/projects/beigang/运单中心/App.vue',
      'prototype/projects/beigang/运单中心/mock-data.js',
      'prototype/projects/beigang/运单中心/address-change-store.js',
      'prototype/projects/beigang/运单中心/notes.md',
      'prototype/projects/beigang/运单中心/waybill-center.css',
      'prototype/projects/beigang/运单中心/components/',
      'prototype/common/business/web/_shared/tms-web-shell/',
    ],
    evidencePaths: ['prd/projects/beigang/运单中心_卸货地址及运输单价变更_PRD_v1.md'],
  },
  {
    key: 'waybillCenterDetailBeigang', scope: 'project', projectId: 'beigang',
    requirement: '北港运单中心地址及运输单价变更', remark: '用于验证北港运单详情的地址变更页签、变更对比与处理进度时间线抽屉；已纳入 TMS-BEIGANG-202608-02（北港1.0.3.5版本）。',
    sourcePaths: ['prototype/projects/beigang/运单中心/详情/'],
    evidencePaths: ['prd/projects/beigang/运单中心_卸货地址及运输单价变更_PRD_v1.md'],
  },
  {
    key: 'transportPlan', scope: 'project', projectId: 'beigang',
    requirement: '北港水运1.0.3.4', remark: '用于验证北港水运计划及社会运力发布、竞价和调度衔接。',
    sourcePaths: ['prototype/projects/beigang/运输计划/'], evidencePaths: ['prd/projects/beigang/承运管理_社会运力采购闭环_PRD_v1.md'],
  },
  {
    key: 'shipownerMobileHome', scope: 'project', projectId: 'beigang',
    requirement: '北港水运1.0.3.4', remark: '用于验证北港承运商企业移动端的货源大厅、运力大厅和订单中心。',
    sourcePaths: ['prototype/projects/beigang/企业移动端/'], evidencePaths: ['prd/projects/beigang/承运管理_社会运力采购闭环_PRD_v1.md'],
  },
  {
    key: 'cargoBiddingDetail', scope: 'project', projectId: 'beigang',
    requirement: '北港水运1.0.3.4', remark: '用于验证北港移动端货源或运力竞价详情。',
    sourcePaths: ['prototype/projects/beigang/企业移动端/'], evidencePaths: ['prd/projects/beigang/承运管理_社会运力采购闭环_PRD_v1.md'],
  },
  {
    key: 'biddingQuotePage', scope: 'project', projectId: 'beigang',
    requirement: '北港水运1.0.3.4', remark: '用于验证北港移动端参与竞价时的报价填写和提交。',
    sourcePaths: ['prototype/projects/beigang/企业移动端/'], evidencePaths: ['prd/projects/beigang/承运管理_社会运力采购闭环_PRD_v1.md'],
  },
  {
    key: 'shipownerWaybill', scope: 'project', projectId: 'beigang',
    requirement: '北港水运1.0.3.4；北港运单中心地址及运输单价变更', remark: '用于验证北港船东移动端的运单列表、运单详情和卸货地址变更处理；地址变更能力已纳入 TMS-BEIGANG-202608-02（北港1.0.3.5版本）。',
    sourcePaths: ['prototype/projects/beigang/船东/'], evidencePaths: [
      'prd/projects/beigang/承运管理_社会运力采购闭环_PRD_v1.md',
      'prd/projects/beigang/运单中心_卸货地址及运输单价变更_PRD_v1.md',
    ],
  },
  {
    key: 'inquiryShipper', scope: 'project', projectId: 'guanglin',
    requirement: '广林项目货源询价', remark: '用于验证广林项目货主、无车承运人和承运商三端询价闭环。',
    sourcePaths: ['prototype/projects/guanglin/广林询价三端/'], evidencePaths: ['prd/projects/guanglin/'],
  },
])
