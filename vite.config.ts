import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    svgr({
      svgrOptions: { 
        icon: true, 
        exportType: 'named', 
        namedExport: 'ReactComponent' 
      }
    }), 
    miaodaDevPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React和第三方库分开打包
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-library': ['echarts', 'echarts-for-react'],
          // 首页特定逻辑
          'home-page': ['./src/pages/HomePage.tsx']
        }
      }
    },
    // 生成资源哈希值，优化缓存
    assetsDir: 'assets',
    // 启用压缩，使用默认的esbuild
    minify: 'esbuild',
    // 配置esbuild选项
    esbuild: {
      drop: ['console', 'debugger']
    }
  },
  // 启用预加载
  server: {
    headers: {
      'Link': '</assets/index.css>; rel=preload; as=style, </assets/index.js>; rel=preload; as=script'
    }
  }
});