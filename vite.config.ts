import type { ClientRequest } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import {
  buildUnavailableTrendingPayload,
  getTrendingPayload,
} from "./server/trending-service.js";
import { normalizeLanguage, normalizePeriod } from "./server/trending.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["GITHUB_"]);

  const apiProxy: ProxyOptions = {
    target: "https://api.github.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/search/, "/search"),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq: ClientRequest) => {
        if (env.GITHUB_TOKEN) {
          proxyReq.setHeader("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
        }
      });
    },
  };

  return {
    plugins: [
      {
        name: "local-trending-api",
        configureServer(server) {
          server.middlewares.use("/api/trending", async (req, res) => {
            try {
              const url = new URL(req.url || "/api/trending", "http://localhost");
              const period = normalizePeriod(url.searchParams.get("period") || "today");
              const language = normalizeLanguage(url.searchParams.get("language") || "");
              const payload = await getTrendingPayload(period, language);

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(buildUnavailableTrendingPayload("today")));
            }
          });
        },
      },
    ],
    server: {
      proxy: {
        "/api/search": apiProxy,
      },
    },
  };
});
