const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function searchFilm(query, year = null) {
    async function fetchResults(q, y) {
        const yearParam = y ? `&year=${y}` : "";
        const res = await fetch(
            `${BASE_URL}/search/movie?query=${encodeURIComponent(q)}&api_key=${API_KEY}${yearParam}`,
        );
        const data = await res.json();
        return data.results ?? [];
    }

    function stripArticles(str) {
        return str
            .toLowerCase()
            .replace(/^(the|a|an) /, "")
            .trim();
    }

    let results = await fetchResults(query, year);
    if (!results.length && year) {
        results = await fetchResults(query, null);
    }
    if (!results.length) return null;

    const normalQ = query.toLowerCase();
    const strippedQ = stripArticles(query);

    // exact match first
    const exact = results.find(
        (r) =>
            r.title.toLowerCase() === normalQ ||
            r.original_title.toLowerCase() === normalQ,
    );
    if (exact) return exact;

    // article-stripped match second
    const stripped = results.find(
        (r) =>
            stripArticles(r.title) === strippedQ ||
            stripArticles(r.original_title) === strippedQ,
    );
    if (stripped) return stripped;

    // fall back to highest popularity among results
    return results.sort((a, b) => b.popularity - a.popularity)[0];
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
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
        "-" +
        year
    );
}

export function buildMoodSlug(mood) {
    return mood
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export async function getFilmImages(tmdbId) {
    const res = await fetch(
        `${BASE_URL}/movie/${tmdbId}/images?api_key=${API_KEY}`,
    );
    const data = await res.json();
    const posters = data.posters ?? [];
    if (!posters.length) return null;

    const top3ByVoteCount = [...posters]
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 3);

    return top3ByVoteCount[0].file_path ?? null;
}
