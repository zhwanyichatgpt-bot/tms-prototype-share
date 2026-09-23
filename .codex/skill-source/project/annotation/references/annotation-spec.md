# 标注生成与数据规范

本文件提供 Annotation Skill 的字段契约和快速检查标准。业务取舍以 `SKILL.md` 为准。

## 页面与分组

- 一个独立路由对应一个 `public/annotations/{routeKey}.json`。
- 同一路由的列表、详情、页签、抽屉、弹窗和自定义浮层使用不同 `group`。
- 每个 `group` 独立从 1 编号；JSON 数组顺序就是组内阅读顺序。
- 当前可见数量不设固定上限；根据业务独立性、空间密度和单条内容长度动态决定。

## JSON 结构

```json
{
  "page": "transportPlan",
  "title": "运输计划",
  "updatedAt": "2026-08-20",
  "annotations": [
    {
      "id": "annot-transport-plan-rule-list-actions",
      "type": "selector",
      "selector": ".annot-transport-plan-rule-list-actions",
      "position": { "x": 0, "y": 0 },
      "title": "计划状态与操作",
      "content": "**状态与操作**\n\n| 状态 | 操作 |\n|---|---|\n| 待执行 | 编辑、发布运力 |",
      "category": "rule",
      "source": "运输计划 PRD 第4章",
      "container": "page",
      "group": "list",
      "createdAt": "2026-08-20"
    }
  ]
}
```

## 字段

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | string | 与注入 class 同名，全局唯一 |
| `type` | `selector` / `position` | 自动生成的正式标注使用 `selector` |
| `selector` | string | 固定为 `.{id}` |
| `position` | object | `position` 类型保存屏幕坐标；`selector` 类型初始为 `{ "x": 0, "y": 0 }`，拖动后保存相对宿主默认锚点的偏移量 |
| `title` | string | 直接说明业务主题，避免“说明”“快照”等空泛词 |
| `content` | string | 支持 Markdown，最多 3 个主题区块 |
| `category` | string | `filter` / `field` / `action` / `rule` / `custom` |
| `source` | string | 对应 PRD、业务规则或实际页面来源；仅在 JSON 和编辑器中保留，研发查看面板不展示 |
| `container` | string | `page` / `modal` / `drawer` |
| `group` | string | 当前页面状态的稳定英文标识 |
| `createdAt` | string | `YYYY-MM-DD` |

版本同步时不强制新增内容指纹或同步状态字段。当前实现以 `pageKey / group / selector / source` 和实际文件差异确定影响范围；未来引入自动同步引擎时，再通过兼容升级增加结构化来源和指纹，不能提前把尚未实现的字段当作现有契约。

编辑模式允许拖动正式的 selector 标注。拖动只更新 `position` 偏移，不改变 `type`，也不清空 `selector`。后续修改标注文案或执行版本同步时，应保留用户已经调整的偏移；仅在宿主变更导致旧偏移失效或用户明确要求重置时归零。

## 内容结构选择

| 内容关系 | 使用方式 |
|---|---|
| 步骤、校验顺序、状态流转 | 有序列表 |
| 并列字段、条件和结果 | 无序列表 |
| 状态、条件、操作、结果的对应关系 | 表格 |
| 金额、数量、运量计算 | 单独公式或代码样式 |
| 不可逆限制、异常处理 | 独立“注意”段落 |

短内容保持短句，不强制套表格。强关联内容优先合并，避免同一区域多个点。

## 研发扫读检查

- 标题能否脱离正文直接说明业务主题。
- 正文是否先给结论，并把并列规则改成列表。
- 必填、选填、只读和不同状态是否分组表达。
- 展示范围、内容、操作和结果是否按实现顺序组织。
- 是否存在仅复述页面导航、字段名称、普通复制操作的低价值标注。
- 相邻标注是否重复；合并后是否反而形成超过 3 个主题区块的长文。
- 当前状态可见点通常以少量关键主题为宜，`3～6` 个仅作检查参考，不作为验收硬限制。

## 定位与容器

- class：`annot-{pageKey}-{category}-{slug}`。
- selector：只使用新注入的 `.annot-*`，不依赖原有 class 或 UI 库。
- 条件显示内容锚定到当前状态稳定可见的业务容器。
- 自定义 modal 根节点：`data-annotation-container="modal"`。
- 自定义 modal 内容节点：`data-annotation-content="modal"`。
- 自定义 drawer 使用相同规则，将值改为 `drawer`。

## 快速验收

```text
[ ] JSON 能解析
[ ] selector 注入均唯一
[ ] selector 标注的 position 为有效相对偏移，更新既有标注时未误清零用户位置
[ ] 每个页面状态都有 group
[ ] 组内顺序符合操作路径
[ ] 同屏标注没有密集遮挡，也没有因过度合并形成超长内容
[ ] 弹窗/抽屉打开后底层点隐藏
[ ] 当前容器编号从 1 开始
[ ] 长内容已使用列表/表格/公式分段
[ ] 已执行保持/修改/新增/合并/删除的全页精简审查
[ ] 研发查看面板不展示 source，编辑数据仍保留来源
[ ] 构建通过
```
