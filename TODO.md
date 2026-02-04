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

- [x] 后端需要一个日志工具 & 开启 prisma 日志 

### 中优先级

- [ ] **用户可自己设置 agent key**：用户可在前端/设置中配置自己的 Agent API Key
- [ ] ai sdk 如何打印完整的 http 请求和返回值

### 按需

- [ ] **修改密码**：需登录 + 旧密码校验
- [ ] **忘记密码 / 重置密码**：需邮箱或其它找回方式（当前无邮箱字段可后续加）
- [ ] **用户资料编辑**：用户名/头像等（User 表可扩展字段）
- [ ] **测试**：auth、ai chat 单元/集成测试；前端关键流程 E2E
- [ ] **API 文档**：OpenAPI/Swagger 或 README 中列出接口与示例
- [ ] **统一前端错误提示**：toast + 请求重试策略
- [ ] **更多 AI 本地工具**：如查库、调用内部 API
- [ ] **多模型/会话级模型选择**：若产品需要

### 已规划功能

- [ ] **支持 agent skills**：Agent 支持 skills 能力
- [ ] **docker 部署前端和后端**：前端使用 nginx 反向代理，后端使用 pm2 启动

---

## 三、推荐实施顺序

1. Chat API 鉴权 + 前端 Chat 请求带 Token（安全闭环）
2. 登出按钮 + 首页按登录态展示（体验小闭环）
3. 生产环境 API base URL（部署前必做）
4. 其余按业务需要择机做
