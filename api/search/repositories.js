export const config = {
    runtime: 'edge', // Usamos Edge Functions de Vercel (más rápidas y ligeras)
};

export default async function handler(req) {
    const url = new URL(req.url);
    // Vercel leerá automáticamente el token desde su panel de variables de entorno
    const token = process.env.GITHUB_TOKEN;

    // El frontend le pega a "/api/search/repositories?q=...". Solo pasamos la query ("?q=...") a GitHub
    const githubUrl = `https://api.github.com/search/repositories${url.search}`;

    try {
        const response = await fetch(githubUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Star-Finder-App",
            },
        });

        // Leer la respuesta de la API de GitHub
        const data = await response.json();

        // Retornársela al frontend con permisos para cachear un momento y ayudar a la performance general
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "s-maxage=60, stale-while-revalidate=120"
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Hubo un problema de conectividad" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
