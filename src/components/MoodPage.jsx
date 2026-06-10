import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    getPosterUrl,
} from "../lib/tmdb.js";
import useStore from "../store.js";

function MoodPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const moods = useStore((state) => state.moods);
    const setMood = useStore((state) => state.setMood);
    const status = useStore((state) => state.status);
    const setStatus = useStore((state) => state.setStatus);

    const mood = moods[slug];
    const label = slug.replace(/-/g, " ");

    useEffect(() => {
        if (mood) return;

        async function fetchMood() {
            setStatus("analyzing");
            try {
                const res = await fetch("/api/mood", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mood: label }),
                });
                const data = await res.json();

                const filmsWithMeta = await Promise.all(
                    data.films.map(async (item) => {
                        const result = await searchFilm(item.title, item.year);
                        const details = result
                            ? await getFilmDetails(result.id)
                            : null;
                        const director = details?.credits?.crew?.find(
                            (p) => p.job === "Director",
                        )?.name;
                        return {
                            ...item,
                            tmdbData: details,
                            director,
                            slug: details
                                ? buildSlug(
                                      details.title,
                                      details.release_date?.slice(0, 4),
                                  )
                                : null,
                        };
                    }),
                );

                setMood(slug, { films: filmsWithMeta });
                setTimeout(() => setStatus("done"), 0);
            } catch (err) {
                setStatus("error");
                console.error(err);
            }
        }

        fetchMood();
    }, [slug, mood]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleFilmClick(item) {
        if (!item.slug || !item.tmdbData) return;
        const { setFilm } = useStore.getState();
        setFilm(item.slug, { metadata: item.tmdbData, analysis: null });
        navigate(`/film/${item.slug}`);
    }

    if (status === "analyzing")
        return (
            <div className="full-page">
                <a href="/" className="logo">
                    <h1>Film Constellations</h1>
                </a>
                <div className="loader-page">
                    <div className="loader-inner">
                        <div className="loader-spinner" />
                        <p className="loader-text">Finding films</p>
                    </div>
                </div>
            </div>
        );

    if (status === "error") return <p>Something went wrong.</p>;

    return (
        <div className="full-page">
            <a href="/" className="logo">
                <h1>Film Constellations</h1>
            </a>
            {mood && (
                <div className="orbit-zone">
                    <div className="constellation-left">
                        {mood.films.slice(0, 6).map((item) => (
                            <div
                                key={item.title}
                                className="c-node"
                                onClick={() => handleFilmClick(item)}
                            >
                                <div className="c-card-inner">
                                    {item.tmdbData?.poster_path ? (
                                        <img
                                            className="c-thumb"
                                            src={getPosterUrl(
                                                item.tmdbData.poster_path,
                                            )}
                                            alt={item.title}
                                            onLoad={(e) =>
                                                e.target.classList.add("loaded")
                                            }
                                        />
                                    ) : (
                                        <div className="c-thumb c-thumb-empty" />
                                    )}
                                    <div className="c-body">
                                        <p className="c-title">{item.title}</p>
                                        <p className="c-year">
                                            {item.director && (
                                                <>{item.director} · </>
                                            )}
                                            {item.year}
                                        </p>
                                        <p className="c-relation">
                                            {item.relation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="poster-center">
                        <p className="mood-center-text">{label}</p>
                    </div>

                    <div className="constellation-right">
                        {mood.films.slice(6, 12).map((item) => (
                            <div
                                key={item.title}
                                className="c-node"
                                onClick={() => handleFilmClick(item)}
                            >
                                <div className="c-card-inner">
                                    {item.tmdbData?.poster_path ? (
                                        <img
                                            className="c-thumb"
                                            src={getPosterUrl(
                                                item.tmdbData.poster_path,
                                            )}
                                            alt={item.title}
                                            onLoad={(e) =>
                                                e.target.classList.add("loaded")
                                            }
                                        />
                                    ) : (
                                        <div className="c-thumb c-thumb-empty" />
                                    )}
                                    <div className="c-body">
                                        <p className="c-title">{item.title}</p>
                                        <p className="c-year">
                                            {item.director && (
                                                <>{item.director} · </>
                                            )}
                                            {item.year}
                                        </p>
                                        <p className="c-relation">
                                            {item.relation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mobile-constellation">
                        {mood.films.map((item) => (
                            <div
                                key={`mobile-${item.title}`}
                                className="c-node"
                                onClick={() => handleFilmClick(item)}
                            >
                                <div className="c-card-inner">
                                    {item.tmdbData?.poster_path ? (
                                        <img
                                            className="c-thumb"
                                            src={getPosterUrl(
                                                item.tmdbData.poster_path,
                                            )}
                                            alt={item.title}
                                            onLoad={(e) =>
                                                e.target.classList.add("loaded")
                                            }
                                        />
                                    ) : (
                                        <div className="c-thumb c-thumb-empty" />
                                    )}
                                    <div className="c-body">
                                        <p className="c-title">{item.title}</p>
                                        <p className="c-year">
                                            {item.director && (
                                                <>{item.director} · </>
                                            )}
                                            {item.year}
                                        </p>
                                        <p className="c-relation">
                                            {item.relation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MoodPage;
