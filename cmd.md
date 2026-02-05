- 启动 ai 测试工具
  cd apps/backend && npx @ai-sdk/devtools

# prisma

cd apps/backend && npx prisma generate

cd apps/backend && npx prisma migrate dev --name init && npx prisma generate

<!-- npx prisma migrate deploy -->


# docker

docker-compose -f my-docker-compose.yml up -d


- 重新构建前端

```
docker compose -f my-docker-compose.yml up -d --build frontend
```

- 只重新部署后端：

```
docker compose -f my-docker-compose.yml up -d --build backend
docker compose -f my-docker-compose.yml logs -f backend
```