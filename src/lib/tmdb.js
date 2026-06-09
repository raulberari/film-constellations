const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function searchFilm(query, year = null) {
    const yearParam = year ? `&year=${year}` : "";
    const res = await fetch(
        `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}${yearParam}`,
    );
    const data = await res.json();
    if (!data.results?.length) return null;

    if (year) return data.results[0];

    const exact = data.results.find(
        (r) => r.title.toLowerCase() === query.toLowerCase(),
    );
    return exact ?? data.results[0];
}

export async function getFilmDetails(tmdbId) {
    const res = await fetch(
        `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&append_to_response=credits`,
    );

    return await res.json();
}

export function getPosterUrl(posterPath) {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

export function buildSlug(title, year) {
    return (
        title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
        "-" +
        year
    );
}
