import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

/**
 * base 必须与 sign.json → proxy.mount 一致（默认 /example/）。
 * 静态挂 dist 时不会注入 VITE_XRK_PUBLIC_PATH，故此处写死默认挂载前缀。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawBase = env.VITE_XRK_PUBLIC_PATH || '/example';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
  };
});
