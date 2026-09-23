# TMS 产品原型与需求工作区

本仓维护产品讨论、PRD、业务规则、设计、Vue 原型、标注及研发交付版本。原型和 Mock 不等同于生产系统能力。

## 从这里开始

- [产品架构与目录治理规范](context/project-rules/产品架构与目录治理规范.md)：新任务的产品、端、通用/定制及资料落点。
- [当前功能与产品目录](migration/2026-09-12-产品架构整理/功能归属清单.md)：20 个已注册页面，不把规划产品算作已实现功能。
- [本次整理报告](migration/2026-09-12-产品架构整理/整理报告.md)：迁移、验证和历史遗留范围。
- [研发版本规则](context/project-rules/原型评审与研发版本发布规则.md)：版本范围、地址、变更与发布边界。
- [项目执行规则](AGENTS.md)：协作与验证要求。

## 目录

| 目录 | 用途 |
|---|---|
| prd/ | 按产品、项目或共用端归属的 PRD |
| discussions/ | 讨论依据；历史讨论不覆盖当前定版规则 |
| context/business-rules/ | 业务模型、术语和跨模块规则 |
| context/project-rules/ | 当前架构、源码治理和发布制度 |
| design/ | 按归属维护的设计与研发说明 |
| prototype/common/products/ | 通用企业产品原型 |
| prototype/common/operation-apps/ | 按需建设的共用专业移动端 |
| prototype/common/shared/ | 公共框架与组件 |
| prototype/projects/ | 各项目差异实现，不复制整套通用产品 |
| src/、review/ | 唯一工作台、注册、路由及版本管理工具 |
| public/annotations/、public/review-data/ | 公共标注及版本交付数据 |
| migration/ | 路径对照、迁移记录和遗留清单 |

目前产品为 lianyun（至简联运）、zhiyun（至简智运）、chuanyun（至简船运）、lowaltitude（低空产品，名称待定）。共用端为 driver、shipowner、pilot。空目录不代表能力已实现，不要求预先创建全部组合。

## 日常使用

1. 开始新功能前确定产品/共用端、Web/mobile、通用/项目及版本。
2. 查现有同主题文档，在正确归属下更新；来源不明进入待确认，不默认写入通用。
3. 注册新页面时同步源码、产品元信息和证据路径；保持 page key 稳定。
4. `npm run check:architecture` 检查目录和引用；`npm run build` 自动先运行该检查。
5. `npm run test:review` 验证评审逻辑；`npm run test:settlement` 验证结算规则。
6. `npm run dev` 启动本地原型。公开发布仍须按具体版本单独授权。

现有业务 Web 归联运；北港与广林继续为定制。北港船东端保留定制身份，不自动提升为通用。铁路保留在联运，增值服务与低空/智运/船运的未实现功能按后续需求建设。
