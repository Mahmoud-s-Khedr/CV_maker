import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // Files in public/ are copied as-is to dist/ — this includes manifest.json and icons/
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Disable code splitting — each entry must be a self-contained file for MV3
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html'),
        'service-worker': resolve(__dirname, 'background/service-worker.ts'),
        'linkedin-profile': resolve(__dirname, 'content/linkedin-profile.ts'),
        'linkedin-job': resolve(__dirname, 'content/linkedin-job.ts'),
      },
      output: {
        // Preserve directory structure in output
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker') return 'background/service-worker.js';
          if (chunk.name === 'linkedin-profile') return 'content/linkedin-profile.js';
          if (chunk.name === 'linkedin-job') return 'content/linkedin-job.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // No code splitting for content scripts / service worker
        manualChunks: undefined,
      },
    },
    // Minify for distribution
    minify: true,
    // Target modern Chrome (MV3 requires Chrome 88+)
    target: 'es2020',
  },
});
