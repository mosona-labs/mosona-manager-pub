import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3214',
                changeOrigin: true,
                ws: true,
            },
            '/avatars': {
                target: 'http://localhost:3214',
                changeOrigin: true,
                ws: true,
            }
        },
    },
    build: {
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                entryFileNames: 'index.js',
                assetFileNames: (assetInfo) =>
                    assetInfo.name === 'style.css' ? 'index.css' : 'assets/[name]-[hash][extname]',
            },
        },
    },
});
