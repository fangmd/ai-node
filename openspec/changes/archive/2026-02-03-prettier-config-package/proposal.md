# Proposal: Prettier 配置包（Monorepo）

## Why

当前仓库未统一代码格式化配置，各 app/package 风格可能不一致；且缺少单行宽度等统一约定（如 120 字符）。在 monorepo 下抽出一个共享的 Prettier 配置包，可让 backend、frontend 及所有 packages 复用同一套规则，便于维护和 Code Review。

## 前后端能否共用一个配置包？（结论：可以）

- **Prettier 与运行环境无关**：只做源码格式化（JS/TS/JSON/CSS/HTML/Markdown 等），不区分「前端」或「后端」，同一份配置在 Node 或浏览器项目里行为一致。
- **技术栈一致**：backend 与 frontend 均为 TypeScript + ESM，对引号、分号、缩进、行宽等需求一致，无需两套配置。
- **Monorepo 惯例**：在 `packages/` 下提供 `@ai-node/prettier-config`，被 `apps/backend`、`apps/frontend` 及 `packages/*` 通过 `extends` 引用，是常见且推荐的做法。

因此采用**一个配置包、全仓库共用**即可，无需为前端/后端分别建包。

## What Changes

- 在 `packages/` 下新增 Prettier 配置包（如 `@ai-node/prettier-config`），导出可被 `prettier.config.js` 或 package 名引用的配置。
- 配置中**单行最大字符数（printWidth）设为 120**，其余选项按项目惯例保持简洁。
- 根目录及需要统一格式的 app/package 在 `package.json` 中依赖该包，并配置 Prettier 使用该共享配置（及可选 format 脚本）。

## Capabilities

### New Capabilities

- `prettier-config`: 提供 monorepo 内共享的 Prettier 配置包，包含 printWidth 120 等规则，供 backend、frontend 及 packages 复用。

### Modified Capabilities

- （无：不修改现有 spec 的行为要求。）

## Impact

- **新增**：`packages/prettier-config`（或类似命名）及对应 `package.json`、配置文件。
- **依赖**：根或各 app/package 的 `devDependencies` 增加对 Prettier 及该配置包的引用。
- **配置**：根或各子包中通过 `prettier.config.js` / `"prettier": "@ai-node/prettier-config"` 等方式引用；可选在根或子包增加 `format` / `format:check` 脚本。
- **影响范围**：所有使用该配置的 TypeScript/JavaScript/JSON 等文件的格式化行为将统一为 120 字符行宽及同一套规则。
