import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    cssTarget: "safari15",
  },
  server: {
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
    },
  },
});
