# 共享类型包 — 技术设计

## Context

- 当前 `ApiResponse<T>` 定义在 `apps/backend/src/response.ts` 中，前端无法直接引用。
- 后端已有 `success` / `fail` 工具函数，依赖 Hono 的 `Context`，适合继续留在 backend。
- 根目录 `pnpm-workspace.yaml` 目前仅声明 `apps/*`，需扩展以支持 `packages/*`。
- 项目使用 pnpm + Turborepo，需保证 types 包被正确纳入工作区与构建顺序。

## Goals / Non-Goals

**目标：**

- 在 `packages/types` 下新增共享类型包，作为前后端类型定义的唯一来源。
- 将 `ApiResponse<T>` 迁移至该包并导出，后端从该包导入类型，前端可依赖该包做 API 响应类型。
- 保持现有 API 响应 JSON 形态与后端 `success`/`fail` 行为不变。

**非目标：**

- 不迁移 `success`/`fail` 实现到共享包（它们依赖 Hono，留在 backend 更合适）。
- 不在此变更中增加除 `ApiResponse` 以外的新类型；后续可按需在 `packages/types` 中扩展。

## Decisions

1. **包名与路径**  
   - 包名：`@ai-node/types`（或与 repo 名一致的 scope），路径：`packages/types`。  
   - 理由：与 monorepo 惯例一致，便于 `apps/backend`、`apps/frontend` 通过 workspace 依赖引用。

2. **构建方式**  
   - 采用「仅源码、不构建」：包内只提供 `.ts` 源文件，由消费方（backend/frontend）的 TypeScript 直接编译。  
   - 理由：类型包无运行时，无需打包；减少构建步骤与 turbo 缓存复杂度。若后续需要发布到 npm 再考虑 `tsup` 等产出 `.d.ts`。

3. **导出方式**  
   - `packages/types` 根目录设 `index.ts`，导出 `ApiResponse`；`package.json` 的 `main`/`types` 指向该入口，或使用 `exports` 字段。  
   - 理由：单一入口简单清晰，后续类型增多时可再分子模块（如 `response.ts`）并在 index 中 re-export。

4. **Workspace 与依赖**  
   - 在根目录 `pnpm-workspace.yaml` 中增加 `packages/*`。  
   - `apps/backend` 与 `apps/frontend` 的 `package.json` 中增加对 `@ai-node/types` 的 workspace 依赖（如 `"@ai-node/types": "workspace:*"`）。  
   - 理由：保证安装与解析一致，避免版本漂移。

5. **后端改动**  
   - `apps/backend/src/response.ts` 删除本地 `ApiResponse` 定义，改为从 `@ai-node/types` 导入；`success`/`fail` 签名与实现保持不变。  
   - 理由：最小化行为变更，仅移动类型定义位置。

## Risks / Trade-offs

| 风险 / 权衡 | 缓解 |
|-------------|------|
| 未在 turbo 中声明 types 包导致依赖顺序问题 | 若采用无构建方案，types 无 `build` 输出，仅需保证 `pnpm install` 后 workspace 可解析；若有 `build` 脚本可放在 pipeline 中作为 backend/frontend 的依赖。 |
| 前端/后端 TypeScript 配置不兼容（如 strict、module） | 共享包使用与根 `tsconfig.base.json` 兼容的选项，仅含类型定义，避免复杂语法。 |
| 后续类型增多后入口臃肿 | 在 design 中约定：新增类型可先放在独立文件（如 `api.ts`），在 `index.ts` 中统一 re-export。 |

## Migration Plan

1. **新增包**  
   - 在仓库根目录下创建 `packages/types`。  
   - 添加 `package.json`（name: `@ai-node/types`，version、exports/types 等）。  
   - 添加 `index.ts`，定义并导出 `ApiResponse<T>`（与当前 backend 定义一致）。  
   - 可选：添加 `tsconfig.json`，`extends` 根目录 base，仅用于该包内类型检查。

2. **扩展 workspace**  
   - 修改根目录 `pnpm-workspace.yaml`，在 `packages` 中加入 `packages/*`。  
   - 在根目录执行 `pnpm install`，确认 `@ai-node/types` 可被解析。

3. **后端迁移**  
   - 在 `apps/backend/package.json` 的 dependencies 中加入 `"@ai-node/types": "workspace:*"`。  
   - 修改 `apps/backend/src/response.ts`：删除 `ApiResponse` 类型定义，改为 `import type { ApiResponse } from "@ai-node/types"`。  
   - 运行 backend 的 build/dev 与现有测试，确认无类型错误且接口行为不变。

4. **前端接入**  
   - 在 `apps/frontend/package.json` 的 dependencies 中加入 `"@ai-node/types": "workspace:*"`。  
   - 在调用后端 API 的代码中，按需使用 `ApiResponse<T>` 做响应类型标注。  
   - 运行 frontend 的 build/dev，确认类型检查通过。

5. **回滚**  
   - 若需回滚：恢复 `response.ts` 中的本地 `ApiResponse` 定义，移除 backend/frontend 对 `@ai-node/types` 的依赖，并从 workspace 中移除 `packages/types` 或保留包但不引用。

## Open Questions

- 无。包名若需与现有 npm org 或项目命名一致，可在实现前确定 `@ai-node/types` 或替换为实际 scope。
