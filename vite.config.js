import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const githubBase = repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? githubBase : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
});

