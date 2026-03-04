import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Solo cargar las variables que empiecen con GITHUB_ en lugar de todas las variables del sistema ("")
  const env = loadEnv(mode, process.cwd(), ["GITHUB_"]);
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
              if (env.GITHUB_TOKEN) {
                const token = env.GITHUB_TOKEN;
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }
            });
          },
        },
      },
    },
  };
});
