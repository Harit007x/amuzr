## Deployment steps after installing pm2, nginx

- step 1
pnpm i

- step 2
pnpm run build

- step 3
pm2 start pnpm --name "ws" -- start