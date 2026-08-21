# TMS3.0 原型验证项目 Skill 主源

本目录是本项目由 Codex 维护的 Skill 正文主源。

规则：

- 只在 Codex 主源中修改项目 Skill。
- `.agents/skills` 和 `.claude/skills` 只保留软链接入口。
- 项目 Skill 的 references、templates、scripts、agents 与 `SKILL.md` 一起保存在主源目录。
- 工具专属 Agent 配置不自动跨工具复制；需要适配时单独登记。
- 迁移前必须确认整个 Skill 目录的内容一致，不能只比较 `SKILL.md`。

检查现有入口：

```bash
python3 .codex/skill-source/sync_links.py --check
```

根据 `manifest.json` 补建缺失的软链接：

```bash
python3 .codex/skill-source/sync_links.py
```

脚本不会覆盖真实文件或目录；遇到旧副本时会输出 `REVIEW`，需要先人工比较和迁移。
