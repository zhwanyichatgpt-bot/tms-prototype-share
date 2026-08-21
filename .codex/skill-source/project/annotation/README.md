# Annotation Skill

项目内原型标注能力，支持 Vue 3 和 React。

核心特点：

- 读取本项目 PRD、业务规则和实际页面，不跨项目取数。
- 按业务关系合并内容，不按字段和按钮机械打点。
- 同一路由按 `group` 区分列表、详情、页签、抽屉和弹窗，并分别从 1 编号。
- 页面、弹窗和抽屉之间自动隔离；自定义浮层通过 `data-annotation-*` 接入。
- 内容支持 Markdown 标题、列表、表格和公式。
- 顶部“原型标注”控制显示；本地“标注编辑”显性控制编辑，正式构建不可编辑。

详细流程见 [SKILL.md](SKILL.md)，数据契约见 [references/annotation-spec.md](references/annotation-spec.md)。
