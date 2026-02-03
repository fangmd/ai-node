# prettier-config

## Purpose

Monorepo 内共享的 Prettier 配置包，统一 printWidth 120 等格式化规则，供 backend、frontend 及 packages 复用。

## Requirements

### Requirement: 共享配置包存在且可被引用

仓库 SHALL 在 `packages/` 下提供 Prettier 配置包（如 `@ai-node/prettier-config`）。该包 MUST 导出可被 `prettier.config.js` 或 package 名直接引用的配置对象。

#### Scenario: 子包引用配置包

- **WHEN** 任意 app 或 package 在 `package.json` 中声明对该配置包的 devDependency 并配置 Prettier 使用该包
- **THEN** 运行 Prettier 时使用该共享配置且无报错

### Requirement: 单行最大字符数为 120

共享配置 MUST 将 `printWidth` 设为 `120`，使单行可显示文字数量为 120 字符。

#### Scenario: 格式化时应用 120 行宽

- **WHEN** 使用该配置对超过 120 字符的行执行格式化
- **THEN** Prettier 按 120 字符行宽进行换行

### Requirement: 全仓库可统一使用

Backend、frontend 及 `packages/*` 中需要统一格式的包 SHALL 能够通过依赖该配置包并引用其配置来使用同一套规则，无需各自维护一份 Prettier 配置。

#### Scenario: 多应用使用同一配置

- **WHEN** backend 与 frontend 均依赖并引用该配置包
- **THEN** 两处格式化结果遵循相同规则（含 printWidth 120）
