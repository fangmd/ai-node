## 1. 本地工具目录与 get_server_ip

- [x] 1.1 在 apps/backend/src/ai/ 下创建 tools 文件夹
- [x] 1.2 实现 get_server_ip 工具（AI SDK tool，无参数，execute 固定返回 "0.0.0.0"）
- [x] 1.3 在 tools 下导出 localTools 对象（如 index.ts 汇总）

## 2. Chat 集成

- [x] 2.1 在 chat.ts 中 import localTools，在 tools(provider) 中与 provider 工具合并（{ ...providerTools, ...localTools }）并传给 streamText
