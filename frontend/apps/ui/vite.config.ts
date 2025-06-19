import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  /*
  build: {
    minify: false, // 🔧 Disable minification
    sourcemap: true, // Optional: include source maps for better debugging
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable automatic code splitting
      }
    }
  },
  */
  optimizeDeps: {
    include: ['viewer']
  },
  resolve: {
    alias: [
      {find: "@", replacement: "/src"},
      // https://github.com/tabler/tabler-icons/issues/1233#issuecomment-2428245119
      // https://stackoverflow.com/questions/79194970/tabler-icons-for-react-slowing-down-app-on-initial-load
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      {
        find: "@tabler/icons-react",
        replacement: "@tabler/icons-react/dist/esm/icons/index.mjs"
      },
    ],
    // Add dedupe to use the versions from apps/ui for workspace packages
    dedupe: ['@mantine/core', '@mantine/hooks', '@tabler/icons-react', 'clsx', 'react', 'react-dom']
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "/src/_mantine";`
      }
    }
  }
})
