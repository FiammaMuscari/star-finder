export const config = {
    runtime: 'edge', // Usamos Edge Functions de Vercel (más rápidas y ligeras)
};

function buildGitHubHeaders(token) {
    const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Star-Finder-App",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function fetchGitHubSearch(githubUrl, token) {
    return fetch(githubUrl, {
        headers: buildGitHubHeaders(token),
    });
}

export default async function handler(req) {
    const url = new URL(req.url);
    // Vercel leerá automáticamente el token desde su panel de variables de entorno
    const token = process.env.GITHUB_TOKEN?.trim();

    // El frontend le pega a "/api/search/repositories?q=...". Solo pasamos la query ("?q=...") a GitHub
    const githubUrl = `https://api.github.com/search/repositories${url.search}`;

    try {
        let response = await fetchGitHubSearch(githubUrl, token);

        // Si el token configurado en Vercel está ausente, revocado o es inválido,
        // GitHub devuelve 401. Reintentamos sin Authorization para evitar romper la app;
        // GitHub permite búsquedas anónimas, aunque con menor límite de rate limit.
        if (response.status === 401 && token) {
            response = await fetchGitHubSearch(githubUrl);
        }

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
