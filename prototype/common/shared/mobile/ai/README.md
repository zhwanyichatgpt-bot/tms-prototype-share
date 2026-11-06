# 移动端 AI 共用页

来源：Pixso「AI」页面，设计稿 750×1624，按 2x 折算到 375×812。

## 组件

- `AiRecommendHome.vue`：AI 首页（至宝推荐、单据卡片、输入区、历史抽屉），`bills`、`groups`、`objectLabel` 由产品传入。
- `AiTopBar.vue`：AI 首页与对话页顶栏，支持 `extraMenus` 追加产品入口。
- `AiHistoryDrawer.vue`：历史记录抽屉，分组由 `groups` 传入。
- `AiBillSelectPage.vue`：单据筛选与多选，`bills`、`objectLabel`、`defaultRange` 由产品传入。
- `AiBillAnalysisPage.vue`：单据分析对话，`bills`、`groups`、`objectLabel` 由产品传入。
- `AiStatusBar.vue`：智运货主端与司机端 AI 整屏页使用的 44px 状态栏；联运沿用 App 外壳状态栏。
- `ai-bill.js`：状态色调、待处理/已完成统计的通用口径。
- `ai-pages.css`：以上页面与抽屉的共用样式；字体和吉祥物在 `public/shared-mobile-assets/ai/`。

当前使用方：联运货主端（首页本地保留识图/建单弹层，其余复用）、智运货主端、智运司机端。

## 单据数据契约

```js
{
  id: 'TY202610160031',   // 业务单号，同时用于筛选
  name: '丙丰煤炭',        // 列表主标题
  status: '待执行',        // 页面展示的原始状态文案
  state: 'pending',        // pending | running | completed | done | cancelled
  origin: '大同同源煤矿场',
  destination: '张家口丰百储煤场地',
  datetime: '2026-10-16 16:08',
  date: '2026-10-16',      // 日期筛选使用 YYYY-MM-DD
}
```

`state` 同时决定状态颜色和「待处理 / 已完成」统计；`running` 计入待处理，`completed` 与 `done` 计入已完成。
