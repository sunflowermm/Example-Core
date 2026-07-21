# frontend-example（前端工程 · 特殊挂载）

本目录是 **有 `sign.json` 的前端工程**，与无 sign 的普通静态（如 `/xrk`）规则不同。权威说明：[docs/www-mount.md](../../../../docs/www-mount.md)。

- 磁盘目录名：`frontend-example`
- 对外 URL：`sign.proxy.mount` → **`/example`**
- 日常：`serve=static`，主服挂 `dist/`；改代码后本目录 `pnpm build`

```bash
pnpm install && pnpm build
# 打开 http://<主服>/example/
```

HMR：`serve`→`proxy`，`enabled`→`true`，重启主服。
