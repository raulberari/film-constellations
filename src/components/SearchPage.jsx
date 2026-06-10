import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    getFilmImages,
    buildMoodSlug,
} from "../lib/tmdb.js";
import useStore from "../store.js";

function SearchPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setFilm = useStore((state) => state.setFilm);
    const navigate = useNavigate();

    async function handleSearch() {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const yearMatch = query.trim().match(/^(.*?)\s+(\d{4})$/);
            const title = yearMatch ? yearMatch[1].trim() : query.trim();
            const year = yearMatch ? yearMatch[2] : null;

            const result = await searchFilm(title, year);

            if (result) {
                const queryLen = title.trim().length;
                const resultLen = result.title.trim().length;
                const isConfident = resultLen <= queryLen * 1.5;

                if (!isConfident) {
                    const moodSlug = buildMoodSlug(query.trim());
                    navigate(`/mood/${moodSlug}`);
                    return;
                }
                const details = await getFilmDetails(result.id);
                const bestPoster = await getFilmImages(result.id);
                if (bestPoster) details.poster_path = bestPoster;
                const filmYear = details.release_date?.slice(0, 4);
                const slug = buildSlug(details.title, filmYear);
                setFilm(slug, { metadata: details, analysis: null });
                navigate(`/film/${slug}`);
            } else {
                // treat as mood
                const moodSlug = buildMoodSlug(query.trim());
                navigate(`/mood/${moodSlug}`);
            }
        } catch (err) {
            setError("Something went wrong.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSearch();
    }

    return (
        <div className="search-page">
            <div className="search-inner">
                <h1 className="search-title">Film Constellations</h1>
                <p className="search-subtitle">
                    A film, a director, a country, a mood
                </p>
                <div className="search-row">
                    <input
                        className="search-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Beau Travail, Jia Zhangke, melancholy..."
                        autoFocus
                    />
                    <button
                        className="search-button"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? "..." : "Search"}
                    </button>
                </div>
                {error && <p className="search-error">{error}</p>}
            </div>
        </div>
    );
}

export default SearchPage;
