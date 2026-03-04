import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      proxy: {
        "/api": {
          target: "https://api.github.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          // @ts-ignore
          configure: (proxy: any, options: any) => {
            // @ts-ignore
            proxy.on("proxyReq", (proxyReq: any, req: any, res: any) => {
              if (env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN) {
                const token = env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN;
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }
            });
          },
        },
      },
    },
  };
});
