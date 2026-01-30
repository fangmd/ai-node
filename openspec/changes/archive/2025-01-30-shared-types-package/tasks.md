# 实现任务：共享类型包

## 1. 新增共享类型包

- [x] 1.1 创建目录 `packages/types` 及 `package.json`（name: `@ai-node/types`，version、exports/types 或 main 指向入口）
- [x] 1.2 在 `packages/types` 下添加 `index.ts`，定义并导出 `ApiResponse<T>`（code、msg、data，T 默认 object）
- [x] 1.3 （可选）在 `packages/types` 下添加 `tsconfig.json`，extends 根目录 base，用于该包内类型检查

## 2. 扩展 workspace

- [x] 2.1 在根目录 `pnpm-workspace.yaml` 的 `packages` 中增加 `packages/*`
- [x] 2.2 在根目录执行 `pnpm install`，确认 `@ai-node/types` 可被其他 workspace 包解析

## 3. 后端迁移

- [x] 3.1 在 `apps/backend/package.json` 的 dependencies 中加入 `"@ai-node/types": "workspace:*"`
- [x] 3.2 修改 `apps/backend/src/response.ts`：删除本地 `ApiResponse` 类型定义，改为 `import type { ApiResponse } from "@ai-node/types"`
- [x] 3.3 运行 backend 的 `pnpm build` 与 `pnpm dev`，确认无类型错误且接口行为不变

## 4. 前端接入

- [x] 4.1 在 `apps/frontend/package.json` 的 dependencies 中加入 `"@ai-node/types": "workspace:*"`
- [x] 4.2 在调用后端 API 的代码中按需使用 `ApiResponse<T>` 做响应类型标注（若无调用处可暂不添加使用示例）
- [x] 4.3 运行 frontend 的 `pnpm build` 与 `pnpm dev`，确认类型检查通过
