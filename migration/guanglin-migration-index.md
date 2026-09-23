> 当前产品目录已于 2026-09-12 整理；本文件保留历史迁移依据。现行位置见 [本次整理报告](2026-09-12-产品架构整理/整理报告.md)及路径对照。

---
title: 广林项目资料迁移索引
需求归属: project
所属项目: guanglin
研发版本: TMS-GUANGLIN-202608-01
修订: pending
状态: 已整理
date: 2026-08-22
---

# 广林项目资料迁移索引

## 1. 迁移结论

本轮已整理能够明确判定为广林定制的货源询价资料，包括三份讨论记录、一份总览 PRD 和货主端、无车承运人端、承运商端三份子 PRD；原型源码已迁入 `prototype/projects/guanglin/`，并通过页面注册信息标记为 `project / guanglin`。

## 2. 已迁移讨论记录

| 原路径 | 当前路径 |
|---|---|
| `discussions/2026-05-15_询价管理_长协询价与广林项目定制流程讨论.md` | `discussions/projects/guanglin/products/lianyun/2026-05-15_询价管理_长协询价与广林项目定制流程讨论.md` |
| `discussions/2026-05-16_货源询价_广林项目定制PRD拆分与原型重构讨论.md` | `discussions/projects/guanglin/products/lianyun/2026-05-16_货源询价_广林项目定制PRD拆分与原型重构讨论.md` |
| `discussions/2026-05-16_货源询价_路线明细行内维护与配载方式讨论.md` | `discussions/projects/guanglin/products/lianyun/2026-05-16_货源询价_路线明细行内维护与配载方式讨论.md` |

## 3. 已迁移 PRD

| 原路径 | 当前路径 |
|---|---|
| `prd/货源询价_广林项目定制总览_PRD_v1.md` | `prd/projects/guanglin/products/lianyun/货源询价_广林项目定制总览_PRD_v1.md` |
| `prd/货源询价管理_货主端_PRD_v1.md` | `prd/projects/guanglin/products/lianyun/货源询价管理_货主端_PRD_v1.md` |
| `prd/询价管理_无车承运人端_PRD_v1.md` | `prd/projects/guanglin/products/lianyun/询价管理_无车承运人端_PRD_v1.md` |
| `prd/询价大厅_承运商端_PRD_v1.md` | `prd/projects/guanglin/products/lianyun/询价大厅_承运商端_PRD_v1.md` |

## 4. 广林原型

| pageKey | 页面 | 源码位置 | 归属 |
|---|---|---|---|
| `inquiryShipper` | 货源询价（广林三端） | `prototype/projects/guanglin/products/lianyun/web/广林询价三端/` | `project / guanglin` |

## 5. 标注与版本处理

- 当前没有 `inquiryShipper` 的公共原型标注文件。
- 广林研发版本已创建为 `TMS-GUANGLIN-202608-01`，当前尚未发布研发地址，所以 `修订` 保持 `pending`。
- 创建研发版本时，再为纳入页面生成按 `versionId/pageKey` 隔离的标注数据。

## 6. 原型核对项

- 现有讨论和 PRD 明确记录：旧版六个 Tab 串联流程不作为最终研发页面结构。
- 创建广林研发版本前，需要核对当前 `prototype/projects/guanglin/products/lianyun/web/广林询价三端/` 是否已经按货主端、无车承运人端、承运商端的列表页和详情页结构完成重构。
- 未完成核对前，不把该原型作为已经满足当前四份 PRD 的正式研发交付内容。
