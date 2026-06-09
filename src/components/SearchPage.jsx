import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchFilm, getFilmDetails, buildSlug } from "../lib/tmdb";
import useStore from "../store";

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
            const result = await searchFilm(query);
            if (!result) {
                setError("No film found.");
                setLoading(false);
                return;
            }

            const details = await getFilmDetails(result.id);
            const year = details.release_date?.slice(0, 4);
            const slug = buildSlug(details.title, year);

            setFilm(slug, { metadata: details, analysis: null });
            navigate(`/film/${slug}`);
        } catch (err) {
            console.err(err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            handleSearch();
        }
    }

    return (
        <main>
            <h1>Film Analysis</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search a film..."
            />
            <button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
            </button>
            {error && <p>{error}</p>}
        </main>
    );
}

export default SearchPage;
