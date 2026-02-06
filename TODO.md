# 项目功能分析与待办

## 一、当前已实现能力

| 模块         | 能力                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Monorepo** | Turborepo + pnpm，backend (Hono) + frontend (React/Vite)，packages/types                                            |
| **后端基础** | CORS、统一响应格式、健康检查 `/health`、环境变量集中管理                                                            |
| **用户认证** | User 表（Prisma/MySQL）、注册/登录 API、JWT 签发与校验、`jwtAuth` 中间件、`GET /api/me`                             |
| **AI 对话**  | `POST /api/ai/chat` 流式 UI 消息、环境配置 Provider/Model（OpenAI、DeepSeek）、web_search、本地工具 `get_server_ip` |
| **前端**     | 首页、About、登录/注册页、Chat 页（useChat + 流式 + 工具展示）、个人信息页、路由保护（/chat、/me）                  |
| **前端 API** | `request()` 带 Bearer、`getMe()`、401 时清 token 并跳转登录                                                         |

---

## 二、待办列表（Todo List）

### 高优先级


### 中优先级

- [ ] qwen3 aliyun response 接口不兼容 tools 调用


### 低优先级

- [ ] **AI SDK 打印完整 HTTP 请求/返回（可开关、脱敏）**：封装自定义 `fetch` 记录 URL/方法/耗时/状态码/响应摘要
- [ ] **migrate 执行策略可控**：后端启动跑 `prisma migrate deploy` 改为可开关（如 `RUN_MIGRATIONS=true`），避免扩容/滚动发布冲突
- [ ] **Prisma 生产依赖可靠性**：检查 Docker runner 阶段 `--ignore-scripts` 是否导致缺少 Prisma 引擎；必要时调整安装/复制产物
- [ ] **请求日志增强**：补齐 requestId/耗时/用户 id（已登录），错误结构统一，提升排障与前端 toast 体验
- [ ] **统一前端错误提示**：toast + 请求重试策略（对 401/5xx/网络错误区分处理）
- [ ] **移除 compose 中硬编码敏感信息**：`DATABASE_URL`/公网 IP/账号密码改用 `.env` 或 `env_file`，并确保不进 git
- [ ] **生产环境密钥强校验**：`NODE_ENV=production` 时缺失 `JWT_SECRET`/`AI_KEY_ENCRYPTION_SECRET` 直接启动失败（禁止弱默认值）
- [ ] **清理 Prisma 配置敏感输出**：移除 `prisma.config.ts` 打印 `DATABASE_URL`；避免加载 `.env.example` 污染运行环境
- [ ] **Docker 健康检查**：backend 增加 `/health` healthcheck，frontend 依赖 backend 健康再启动（减少 502/冷启动问题）

### 按需

- [ ] **修改密码**：需登录 + 旧密码校验
- [ ] **忘记密码 / 重置密码**：需邮箱或其它找回方式（当前无邮箱字段可后续加）
- [ ] **用户资料编辑**：用户名/头像等（User 表可扩展字段）
- [ ] **会话/消息沉淀能力**：会话列表、历史回放、重命名/删除、自动标题（可选 AI）
- [ ] **限流与防爆破**：登录/注册/`/api/ai/chat` 增加简单 rate limit（按 IP/用户）
- [ ] **测试**：auth、ai chat 单元/集成测试；前端关键流程 E2E
- [ ] **API 文档**：OpenAPI/Swagger 或 README 中列出接口与示例
- [ ] **更多 AI 本地工具**：如查库、调用内部 API

### 已规划功能

---

## 三、推荐实施顺序

   - compose 移除硬编码敏感信息 + 生产密钥强校验（安全与合规）
   - Docker 健康检查 + migrate 可控（部署稳定性）
   - AI SDK 打印完整 HTTP 请求/返回（排障效率提升）
   - 请求日志增强 + 前端错误 toast（可观测性与体验）
   - 修改密码（先闭环站内账号体系）
   - API 文档（接口可维护、便于部署联调）
   - 会话/消息沉淀（把现有表变成产品能力）
   - 测试（auth、ai chat；前端关键流程 E2E）
   - 忘记密码 / 重置密码（引入邮箱后再做）
   - 更多 AI 本地工具（按业务扩展）

## 已完成项目


