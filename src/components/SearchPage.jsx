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

const BACKDROPS = [
    "https://image.tmdb.org/t/p/original/4lmi9qr9qcECzvoRLhUymTHeDKW.jpg",
    "https://image.tmdb.org/t/p/original/myaJXaFqaQQ9KVcSbiuTaf1KhJN.jpg",
    "https://image.tmdb.org/t/p/original/ipb79nkUA2qNiN7SyYKLS5evRL5.jpg",
    "https://image.tmdb.org/t/p/original/6t1Ea7Oq46jmtUpcm5ZTYws57Tq.jpg",
    "https://image.tmdb.org/t/p/original/8Xmq8ZZiuWXNy7xPsMVDPEAgNuJ.jpg",
    "https://image.tmdb.org/t/p/original/liVaHQe4pAzRCdV8aObKVLshBa8.jpg",
    "https://image.tmdb.org/t/p/original/ph1yt4KitbSLqS4VouDUBUkXpnm.jpg",
    "https://image.tmdb.org/t/p/original/uAUTW2JakzaqO2YxFDc0GQ6SkIc.jpg",
    "https://image.tmdb.org/t/p/original/jgI58K8ipmPmS72DrWpwvuPHB3z.jpg",
    "https://image.tmdb.org/t/p/original/bOHq7n79I3gNDI3yMGidlLadJGA.jpg",
    "https://image.tmdb.org/t/p/original/fXOoyuuvCkoXp0b43YqEYiipHkN.jpg",
    "https://image.tmdb.org/t/p/original/y9p3ZfDc0H6MjxddeZ9e5ufbstV.jpg",
    "https://image.tmdb.org/t/p/original/9eUKLg2HAxE86b0DmQMN5VAxU9B.jpg",
    "https://image.tmdb.org/t/p/original/2834YQ1Zq8UP6fwJIVZtnhYU0Cs.jpg",
    "https://image.tmdb.org/t/p/original/sUy6Ti0zTGnQffeyMRq03xIOu9E.jpg",
    "https://01185108087561430683.googlegroups.com/attach/1722334ecd751/Hours-for-Jerome-Part-1-program-2_press.jpg?part=0.3&view=1&vt=ANaJVrHqzV2AW8IRCjm_dEiWz4LozlQm_Y9HLRbOFL9fMe9S2_DUheo_osR0hnv9oO4DAT7nrf7GLKvxNfpHanKAY1nV1mbV_Dn-84M969RXI5ArEVUamg0",
];

const backdrop = BACKDROPS[Math.floor(Math.random() * BACKDROPS.length)];

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
        <div
            className="search-page"
            style={{ backgroundImage: `url(${backdrop})` }}
        >
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
