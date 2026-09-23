# 小简AI二级页面 T0–T5

- 首页样式优化（小简AI首页）：沿用 Pixso「工作台（优化）」150:290 的头部版式——弥散渐变背景、Ai 闪标与“深度解读 运输委托”标题、副标题、白猫图均直接使用导出素材（`public/zhiyun-mobile-assets/ai-report/`）。页面内容结构保持原方案不变（整体运输概况、小简分析计划卡、风险进展、结算与付款、常运线路行情、向小简提问）。

- 页面类型：移动端 AI 业务二级页，复用货主端首页的 375×812 手机壳、#3A65FF 主色、白色圆角业务卡片与固定底部操作栏。
- 本批范围：T2 安全进展、T3 结算与付款、T4 常运线路行情、T5 关联对话与调整页收口。
- 组件树：`App.vue` 页面状态（`subPage.key`）→ `AiHomePage.vue` 方案入口 / `AiPublishAdjustPage.vue` / `AiCargoRiskPage.vue` / `AiSettlementPage.vue` / `AiMarketInsightPage.vue` / `AiConversationPage.vue`。
- 导航约定：二级页与对话页用 `v-show` 常驻以保留滚动、展开、平台选择与测算输入；首页用 `aiHomeState` 恢复滚动位置；二级页与对话页隐藏主 Tab，AI 首页保留主 Tab。
- 对话约定：对话页带 `context` 与 `from` 来源；进入时先展示关联对象与已有分析，用户实际发送才出现用户消息，模拟回复固定标注“模拟回复 · 未接通真实AI”。
- Mock 数据：`ai-home-data.js` 统一管理计划、风险事件、结算事项、行情与测算；金额为数字并即时计算（结算 30000+12600=42600；行情 500×310 与 500×300）。日期基准统一为 6月18日。
- 视觉来源：计划卡沿用设计稿「货源卡片」结构；平台行复用 `shared/PlatformSelectRow.vue`；主色 #3A65FF。
- 视觉规范（新增页面一律沿用，不自建风格）：
  - 字号只取系统既有档位——导航标题 17px/600；卡片标题 15px/700；结论与正文强调 14px/500；行文本 13px；次要说明 12px；辅助 11px；标签注释 10px；金额与数值 19px/700（同货源卡运输总价）。
  - 卡片统一 `border-radius:10px; padding:14px; margin-bottom:8px`；卡头统一 `card-author`（猫头像 22px + 11px 灰字）配 `card-kicker`（10px 辅助）。
  - 按钮统一：次要动作 `cargo-action`（82×30、圆角 16、13px/600、描边 #d9dce3）；底部主操作 `ask-button` + `submit-button`（高 44、圆角 8、15px/700）；链接 `footer-link`（13px/500、#3A65FF）。
  - 弹层统一 `overlay` + `sheet`（圆角 12px 12px 0 0、padding 16px、行用 `summary-row`）；提示条统一 `notice`；空态统一 `empty-state`。
  - 控件基础规则用 `font-family:inherit`，不要用 `font:inherit` 简写（会重置按钮字号与字重，压过上面的档位）。
- 模拟标注口径：调整发布页沿用 T1 产品要求，页面不出现“模拟数据/模拟成功”字样；安全进展、结算付款、行情三页按本批要求标注示例来源（照片、地图、账单、行情样本），具体见交付报告待确认项。
- 模拟交互：调整页提交显示提交中，随后模拟首平台失败、次平台成功；失败项可单独重试，重试复用同一记录不新增发布记录；提交前复核最新剩余量，变化时更新并要求再次核对，已接满时提示无需扩大发布。
- 开发用模拟开关（不进入业务主界面）：调整页挂载后可在控制台使用 `window.__zhiyunAdjustSim.setLatestRemaining(n)` 模拟剩余量变化或归零，`window.__zhiyunAdjustSim.failPlatforms(['xiang'])` 调整失败平台。
- 待后续：真实平台接口、并发额度控制、结算计重与付款通道、运单详情与接单进展明细页、真实 AI 对话。
