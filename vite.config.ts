import type { ClientRequest } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import { readSnapshotStore } from "./server/trending-snapshots.js";
import { buildTrendingResponse, normalizePeriod } from "./server/trending.js";

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
              const snapshotStore = await readSnapshotStore();
              const payload = buildTrendingResponse(snapshotStore, period, 10);

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  period: "today",
                  days: 0,
                  ready: false,
                  message: "Unable to read trending snapshot data right now.",
                  items: [],
                })
              );
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
