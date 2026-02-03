## 1. 配置包结构与依赖

- [x] 1.1 在 `packages/` 下新建目录 `prettier-config`，添加 `package.json`（name: `@ai-node/prettier-config`，符合 workspace 约定）
- [x] 1.2 在配置包中新增导出 Prettier 配置的入口文件（如 `index.js`），配置含 `printWidth: 120` 及必要默认项

## 2. 根目录使用共享配置

- [x] 2.1 在根目录 `package.json` 的 devDependencies 中添加 `prettier` 与 `@ai-node/prettier-config`（workspace 引用）
- [x] 2.2 在根目录添加 `prettier.config.js` 并引用 `@ai-node/prettier-config`
- [x] 2.3 在根目录添加 `format` 与 `format:check` 脚本（可选：在 turbo.json 中增加 format 任务）

## 3. 子包引用（可选）

- [x] 3.1 在 `apps/backend` 与 `apps/frontend` 的 devDependencies 中添加 `prettier` 与 `@ai-node/prettier-config`，确保本地/IDE 使用同一配置
- [x] 3.2 若子包需单独执行 format，在子包添加 `format` / `format:check` 脚本并引用根或本包配置
