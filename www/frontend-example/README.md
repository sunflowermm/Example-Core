# frontend-example（前端工程）

有 `sign.json`。权威：[docs/www-mount.md](../../../../docs/www-mount.md)。

| `enabled` | 行为 |
|-----------|------|
| `false`（当前） | 只 build，不启进程，挂 `dist` → **`/example/`** |
| `true` | 启 `pnpm dev` + 反代 |

```bash
# 本地也可手动：pnpm build
# 主服启动时若缺 dist 会自动 pnpm build
```
