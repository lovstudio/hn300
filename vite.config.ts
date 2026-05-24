import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { lovinspPlugin } from "lovinsp";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [lovinspPlugin({ bundler: "vite" }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
