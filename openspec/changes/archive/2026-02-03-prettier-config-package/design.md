# Design: Prettier 配置包

## Context

- 当前 monorepo 使用 pnpm workspaces（`apps/*`, `packages/*`），已有 `@ai-node/types` 等共享包。
- Backend 与 frontend 均无 Prettier 配置，格式化规则未统一；需求为单行 120 字符（printWidth: 120）且全仓库共用一套配置。
- 约束：保持与现有 packages 命名与结构一致（如 `packages/prettier-config`，包名 `@ai-node/prettier-config`），使用 pnpm 管理依赖。

## Goals / Non-Goals

**Goals:**

- 在 `packages/` 下新增一个 Prettier 配置包，导出可被引用的一份配置（含 printWidth: 120）。
- 根目录及 apps/packages 通过依赖该包统一使用该配置；可选在根或子包增加 format 脚本。

**Non-Goals:**

- 不强制为每个子包单独配置 Prettier（可由根统一配置或按需在子包引用）；不引入 Prettier 插件或与 ESLint 集成的具体实现细节（可后续迭代）。

## Decisions

### 配置包形式：导出 JS 配置对象

- **选择**：包内提供 `index.js`（或 `prettier.config.js`）导出配置对象，供 `prettier.config.js` 中 `module.exports = require('@ai-node/prettier-config')` 或 `export default require('@ai-node/prettier-config')` 使用。
- **理由**：与 Prettier 官方推荐的 “shareable config” 用法一致，子包只需依赖并引用即可，无需复制配置内容。
- **备选**：仅发布 JSON 配置 — 表达能力弱，无法做条件分支，故不采用。

### 包名与目录

- **选择**：`packages/prettier-config`，包名 `@ai-node/prettier-config`，与 `@ai-node/types` 命名风格一致。
- **理由**：与现有 monorepo 包命名一致，便于在根与各 app 中统一引用。

### printWidth 与其它选项

- **选择**：配置中明确设置 `printWidth: 120`；其余选项（如 `semi`、`singleQuote`、`tabWidth`）采用 Prettier 默认或仅做少量、明确约定（如 `semi: true`），不在设计文档中穷举，由实现时保持简洁。
- **理由**：需求明确为“单行 120”；其它保持默认可减少争议并便于后续统一调整。

### 根与子包如何引用

- **选择**：根目录可安装 `prettier` + `@ai-node/prettier-config` 并增加 `prettier.config.js` 引用该包；apps/backend、apps/frontend 等若需本地运行 Prettier 则在其 devDependencies 中加入 `prettier` 与 `@ai-node/prettier-config`，并通过根级或本地的 `prettier.config.js` 引用。若根级已配置且 Prettier 能发现根配置，则子包可不重复建配置文件。
- **理由**：优先“根目录一份配置、全仓库生效”，若工具链不支持再在子包按需引用；实现时可在 tasks 中细化为“根配置 + 根 format 脚本”或“根 + 子包各加依赖与引用”。

## Risks / Trade-offs

- **[Risk]** 根与子包同时存在 Prettier 配置时优先级或发现顺序可能令人困惑。  
  **Mitigation**：明确约定“根目录为唯一配置来源”或“子包仅通过 extends/require 引用 @ai-node/prettier-config”，不在子包内再写一套独立选项。

- **[Risk]** 新增包后若未在 CI 或 pre-commit 中跑 format check，格式仍可能漂移。  
  **Mitigation**：本次仅交付配置包与引用方式；CI/format 脚本可在 tasks 中列为可选任务或后续迭代。

## Migration Plan

1. 新增 `packages/prettier-config` 及 `package.json`、导出配置的入口文件，不修改现有业务代码。
2. 根目录（及需要格式化的 app/package）添加对 `prettier` 与 `@ai-node/prettier-config` 的 devDependency，并添加或更新 `prettier.config.js` 引用该包。
3. 可选：在根或子包添加 `format` / `format:check` 脚本；后续可再接入 lint-staged 或 CI。
4. 无回滚数据变更；若需回退，移除对配置包的依赖与 `prettier.config.js` 中的引用即可。

## Open Questions

- 是否在本次变更中为根目录添加 `format` 与 `format:check` 脚本并纳入 `turbo.json`：建议在 tasks 中列为可选任务，由实现阶段决定。
