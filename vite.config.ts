import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    fileParallelism: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
