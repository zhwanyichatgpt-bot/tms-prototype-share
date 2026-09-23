> 当前产品目录已于 2026-09-12 整理；本文件保留历史迁移依据。现行位置见 [本次整理报告](2026-09-12-产品架构整理/整理报告.md)及路径对照。

---
title: 北港水运资料迁移索引
需求归属: project
所属项目: beigang
研发版本: TMS-BEIGANG-202608-01
修订: pending
状态: 已整理
date: 2026-08-22
---

# 北港水运资料迁移索引

## 1. 迁移结论

本轮已将能够明确判定为北港定制的“社会运力采购闭环”资料完成归属整理，并将原型源码统一迁入 `prototype/projects/beigang/`，页面注册继续标记为 `project / beigang`。

## 2. 已迁移资料

| 类型 | 原路径 | 当前路径 | 归属 |
|---|---|---|---|
| 讨论记录 | `discussions/承运商分包外采_流程梳理.md` | `discussions/projects/beigang/products/lianyun/承运商分包外采_流程梳理.md` | 北港定制 |
| PRD | `prd/承运管理_社会运力采购闭环_PRD_v1.md` | `prd/projects/beigang/products/lianyun/承运管理_社会运力采购闭环_PRD_v1.md` | 北港定制 |

## 3. 北港原型页面

| pageKey | 页面 | 源码位置 | 归属 |
|---|---|---|---|
| `transportPlan` | 水运计划 | `prototype/projects/beigang/products/lianyun/web/运输计划/` | `project / beigang` |
| `shipownerMobileHome` | 承运商企业移动端 | `prototype/projects/beigang/operation-apps/shipowner/mobile移动端/` | `project / beigang` |
| `cargoBiddingDetail` | 货源竞价详情页 | `prototype/projects/beigang/operation-apps/shipowner/mobile移动端/CargoBiddingDetail.vue` | `project / beigang` |
| `biddingQuotePage` | 移动端报价填写页 | `prototype/projects/beigang/operation-apps/shipowner/mobile移动端/BiddingQuotePage.vue` | `project / beigang` |

## 4. 保留在通用层的资料

| 资料 | 保留理由 |
|---|---|
| `prd/common/products/lianyun/运输余量扣量与返还控制_PRD_v1.md` | 定义跨运单、计划和调度任务的通用扣量与返还规则，不仅服务北港。 |
| `context/business-rules/common/products/lianyun/03-跨模块业务原则/运输余量扣量与返还控制原则.md` | 为系统级跨模块业务原则，北港版本可引用，不改变其通用归属。 |
| `context/business-rules/common/products/lianyun/02-统一术语与字段口径/计费条件与计费依据口径.md` | 为计费口径通用基线，北港报价页只引用。 |

## 5. 标注与版本处理

- 北港原型的旧公共标注仍保留在 `public/annotations/`，并已修正讨论记录和 PRD 来源路径。
- 创建北港研发版本时，系统会为纳入页面生成按 `versionId/pageKey` 隔离的标注数据。
- 北港试验版本已创建为 `TMS-BEIGANG-202608-01`；当前尚未首次发布研发地址，所以 `修订` 保持 `pending`。

## 6. 后续试验

已创建北港定制版本 `TMS-BEIGANG-202608-01`，版本名称为“北港水运1.0.3.4”，计划上线日期为 2026-08-28。下一步先在本地查看需求目录和4个原型页面，确认后再发布固定研发地址。
