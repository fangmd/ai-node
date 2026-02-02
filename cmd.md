

- 启动 ai 测试工具
cd apps/backend && npx @ai-sdk/devtools


# prisma

npx prisma generate

cd apps/backend && npx prisma migrate dev --name init && npx prisma generate

<!-- npx prisma migrate deploy -->