import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: undefined
      }
    }
  },
  esbuild: {
    target: 'es2020'
  }
});