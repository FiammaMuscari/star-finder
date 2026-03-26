import type { ClientRequest } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["GITHUB_"]);

  const apiProxy: ProxyOptions = {
    target: "https://api.github.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq: ClientRequest) => {
        if (env.GITHUB_TOKEN) {
          proxyReq.setHeader("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
        }
      });
    },
  };

  return {
    server: {
      proxy: {
        "/api": apiProxy,
      },
    },
  };
});
