import { useState, useEffect } from "react";
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
    {
        url: "https://image.tmdb.org/t/p/original/4lmi9qr9qcECzvoRLhUymTHeDKW.jpg",
        film: "Xiao Wu (1997)",
        slug: "/film/pickpocket-1997",
        position: "70%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/myaJXaFqaQQ9KVcSbiuTaf1KhJN.jpg",
        film: "Too Early / Too Late (1982)",
        slug: "/film/too-early-too-late-1982",
    },
    {
        url: "https://image.tmdb.org/t/p/original/6t1Ea7Oq46jmtUpcm5ZTYws57Tq.jpg",
        film: "Manhunter (1986)",
        slug: "/film/manhunter-1986",
    },
    {
        url: "https://image.tmdb.org/t/p/original/8Xmq8ZZiuWXNy7xPsMVDPEAgNuJ.jpg",
        film: "Heat (1995)",
        slug: "/film/heat-1995",
        position: "42%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/liVaHQe4pAzRCdV8aObKVLshBa8.jpg",
        film: "Goodbye, Dragon Inn (2003)",
        slug: "/film/goodbye-dragon-inn-2003",
        position: "40%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/jgI58K8ipmPmS72DrWpwvuPHB3z.jpg",
        film: "Made in Hong Kong (1997)",
        slug: "/film/made-in-hong-kong-1997",
        position: "20%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/bOHq7n79I3gNDI3yMGidlLadJGA.jpg",
        film: "Goodbye to Language (2014)",
        slug: "/film/goodbye-to-language-2014",
        position: "20%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/fXOoyuuvCkoXp0b43YqEYiipHkN.jpg",
        film: "Red Desert (1964)",
        slug: "/film/red-desert-1964",
    },
    {
        url: "https://image.tmdb.org/t/p/original/v39RYlCUnlhn9nVZFM5TIcvGPrY.jpg",
        film: "Mulholland Drive (2001)",
        slug: "/film/mulholland-drive-2001",
        position: "65%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/9eUKLg2HAxE86b0DmQMN5VAxU9B.jpg",
        film: "The Color of Pomegranates (1969)",
        slug: "/film/the-color-of-pomegranates-1969",
    },
    {
        url: "https://image.tmdb.org/t/p/original/2834YQ1Zq8UP6fwJIVZtnhYU0Cs.jpg",
        film: "Paris, Texas (1984)",
        slug: "/film/paris-texas-1984",
        position: "55%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/sUy6Ti0zTGnQffeyMRq03xIOu9E.jpg",
        film: "The Cranes are Flying (1957)",
        slug: "/film/the-cranes-are-flying-1957",
        position: "60%",
    },
    {
        url: "https://image.tmdb.org/t/p/original/lmq6cfQNKcjlcKT4BF1pHy9i4Ud.jpg",
        film: "Hours for Jerome (1982)",
        slug: "/film/hours-for-jerome-1982",
    },
];

const backdrop = BACKDROPS[Math.floor(Math.random() * BACKDROPS.length)];

function SearchPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setFilm = useStore((state) => state.setFilm);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Film Constellations";
    }, []);

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
            style={{
                backgroundImage: `url(${backdrop.url})`,
                backgroundPosition: backdrop.position ?? "50% 50%",
            }}
        >
            <div className="search-inner">
                <div className="search-title-container">
                    <div className="red-square" />
                    <h1 className="search-title">film constellations</h1>
                </div>
                <p className="search-subtitle">
                    A map of cinema built through association.
                </p>
                <div className="search-row">
                    <input
                        className="search-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Beau Travail, Jia Zhangke, interiority..."
                        autoFocus
                    />
                    <button
                        className="search-button"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </div>
                {error && <p className="search-error">{error}</p>}
            </div>
        </div>
    );
}

export default SearchPage;
