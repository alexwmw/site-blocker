import path from 'node:path';

import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    crx({
      manifest,
      contentScripts: {
        injectCss: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        // popup and options are not required as they are explicitly referenced in the manifest
        blockPage: path.resolve(__dirname, 'block-page.html'),
        onboarding: path.resolve(__dirname, 'onboarding.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-zod': ['zod'],
        },
        entryFileNames: 'public/[name].js',
        chunkFileNames: 'public/[name]-[hash].js',
        assetFileNames: 'public/[name]-[hash].[ext]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    cors: true,
  },
});
