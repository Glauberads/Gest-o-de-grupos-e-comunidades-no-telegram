import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) {
              return "vendor-recharts";
            }

            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }

            if (id.includes("react-router")) {
              return "vendor-router";
            }

            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            return "vendor";
          }
        }
      }
    }
  }
});
