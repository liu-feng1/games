import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './',
  // 确保使用相对路径
  base: "./",
  build: {
    // 添加 commonjs 插件支持
    commonjsOptions: {
      include: [/node_modules/],
    },
    assetsInlineLimit: 0,
    // 确保资源路径正确
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: "assets/[name].[ext]",
        chunkFileNames: "assets/[name].js",
        entryFileNames: "assets/[name].js",
      },
    },
    // 输出到根目录
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // 添加 vue 路径映射
      vue: resolve(__dirname, "node_modules/vue/dist/vue.esm-bundler.js"),
    },
  },
});
