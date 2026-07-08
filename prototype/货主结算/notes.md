# 货主结算原型记录

## Annotation Update 2026-07-05 正式原型标注

- 本次仅补充原型标注接入与标注内容，不修改页面业务逻辑。
- 标注范围：货主结算新增页、详情页、添加联运计划、补贴/扣减维护、提交校验、详情页计费拆解。
- 标注产物：`public/annotation/shipper-settlement.spec.yaml`。
- 标注运行时：`public/annotation/annotation-core.js`、`public/annotation/annotation-core.css`、`public/annotation/vendor/js-yaml.min.js`，版本见 `public/annotation/version.json`。

### Input Gate

- 已读取 PRD：`prd/多式联运_货主结算_PRD_v1.md`。
- 已读取业务规则：`context/business-rules/03-跨模块业务原则/联运计划结算分层原则.md`。
- 已读取讨论记录：`discussions/2026-06-02_多式联运_货主结算功能讨论.md`。
- 已读取页面源码：`prototype/货主结算/App.vue`、`prototype/货主结算/mock-data.js`。
- 未发现既有有效 `spec.yaml`；zcode 临时草稿未作为正式依据保留。
- 来源冲突说明：2026-06-02 讨论记录中的早期 MVP 口径曾倾向“不维护路段级货主已结算量”；当前 PRD 已在 2026-07-04 异构分段模型中更新为“分段结算按子计划级独立维护结算量”。本次标注以最新 PRD 和业务规则为准。

### Validation Gate

- YAML 结构：`meta` + `units[]`。
- 标注单元数量：8 个。
- 页面锚点：已为关键区域补充 `annotation-*` 稳定 class，仅用于标注锚点，不改变布局和业务逻辑。
- 动态锚点：添加联运计划抽屉、补贴/扣减弹窗只有打开后才存在，属于预期行为。

### Reverse Review Gate

- 异常与边界已覆盖：不可选联运计划原因、结算方切换清空、结算量不可增加、重复占用阻断、详情页不展示 OA/依据/运单选择/内部占用明细。
- 状态动作已覆盖：待审核、待打款、已打款、已作废下确认打款按钮展示规则。
- 上游来源已覆盖：联运计划、内部运单、既有运输结算模块。
- 下游影响已覆盖：提交生成货主结算单、进入待审核、占用结算量、后续状态流转。
- 剩余建议人工复查：当前页面为迁移原型，部分业务动作使用 mock 数据演示；标注表达以 PRD 规则为准，未进行真实后端接口联调。

### Write-Back Gate

- 结果：none-with-reason。
- 原因：本次标注未引入新的业务规则，只把已有 PRD 和业务规则翻译为研发可读的页面标注。
- 未更新 PRD、业务规则或待确认事项。

### Evolution Write-Back Gate

- 结果：none-with-reason。
- 原因：本次是对 zcode 非标准标注实现的清理和按既有 skill 标准重做；没有产生需要反哺到全局 skill 的新方法。

### Untested Scope

- 未进行浏览器视觉定位验收。
- 未验证 `?edit=1` 下通过 File System Access API 写回 spec 的能力。
- 未做后端接口、权限和真实状态流转联调。

## Update 2026-07-07 运输单价层级收口

- 本次根据用户确认的规则调整货主结算新增页：散货 / 普货不再按货品行分别维护运输单价，整票按联运计划级维护单价，分段按子计划（路段）级维护单价。
- 集装箱仍按箱型维护运输单价；整票和分段均允许不同箱型使用不同单价。
- 同步更新 PRD、业务规则和标注 YAML；原型 mock 数据补充“多货品共用计划级单价”和“不同箱型不同单价”样例。
- 未进行真实后端接口、权限和状态流转联调。

## Annotation Update 2026-07-07 调整补贴/扣减标注锚点

- 问题：④“补贴/扣减维护”原锚点绑定在动态弹窗 `.annotation-add-adjustment-dialog` 上，页面初始状态未打开弹窗时 DOM 不存在，导致标注开启后出现 1、2、3、5 跳号。
- 用户复核：将 ④ 放在表格补贴金额入口会与业务数字冲突，应放回点击补贴或扣减后出现的维护弹窗。
- 调整：移除表格补贴入口锚点，改为在弹窗正文顶部增加 `.annotation-add-adjustment-dialog-anchor`；弹窗打开和关闭后触发 `AnnotationCore.refresh()`，让 ④ 只在弹窗内出现。
- Validation Gate：已检查 `spec.yaml` 中 ④ 的 `anchor_selector` 指向页面源码中存在的弹窗内稳定 class；动态弹窗未打开时主页面不显示 ④ 属于预期行为。
- Write-Back Gate：none-with-reason。本次只修正标注锚点，不改变业务规则。
- Evolution Write-Back Gate：none-with-reason。该问题属于当前页面动态弹窗锚点选择不当，未沉淀为通用运行时规则。
