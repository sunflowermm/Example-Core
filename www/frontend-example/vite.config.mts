import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawBase = env.VITE_XRK_PUBLIC_PATH || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 4173
    },
    preview: {
      host: '0.0.0.0',
      port: 4173
    }
  };
});

