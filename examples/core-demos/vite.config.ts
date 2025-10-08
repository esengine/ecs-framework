import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3003,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
});
