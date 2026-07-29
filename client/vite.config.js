import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to the Express server during development.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,

    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});