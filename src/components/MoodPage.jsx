import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    getPosterUrl,
} from "../lib/tmdb.js";
import useStore from "../store.js";
import { useAnalyzingMessage } from "../hooks/useAnalyzingMessage.js";

function MoodPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const moods = useStore((state) => state.moods);
    const setMood = useStore((state) => state.setMood);
    const status = useStore((state) => state.status);
    const setStatus = useStore((state) => state.setStatus);
    const message = useAnalyzingMessage(status);

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
                    body: JSON.stringify({ mood: label, slug }),
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

    useEffect(() => {
        document.title = `${label} • Film Constellations`;
        return () => {
            document.title = "Film Constellations";
        };
    }, [label]);

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
                        <p className="mood-center-text poster">{label}</p>
                        <div className="loader-spinner" />
                        <p className="loader-text">{message}</p>
                    </div>
                </div>
            </div>
        );

    if (status === "error") return <p>Something went wrong.</p>;

    let validFilms = [];
    if (mood) {
        validFilms = mood.films
            .filter((item) => item.tmdbData !== null)
            .slice(0, 12);
    }
    return (
        <div className="full-page">
            <a href="/" className="logo">
                <h1>Film Constellations</h1>
            </a>
            {mood && (
                <div className="orbit-zone">
                    <div className="constellation-left">
                        {validFilms.slice(0, 6).map((item) => (
                            <a
                                key={item.title}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleFilmClick(item);
                                }}
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
                            </a>
                        ))}
                    </div>

                    <div className="text-center-container">
                        <div
                            style={{
                                height: 20,
                                background: "red",
                                margin: "0 10px",
                            }}
                        ></div>
                        {Array.from({ length: 16 }, (key, index) => (
                            <p
                                className="mood-center-text"
                                key={index}
                                index={index}
                            >
                                {label}
                            </p>
                        ))}
                    </div>

                    <div className="constellation-right">
                        {validFilms.slice(6, 12).map((item) => (
                            <a
                                key={item.title}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleFilmClick(item);
                                }}
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
                            </a>
                        ))}
                    </div>

                    <div className="mobile-constellation">
                        {validFilms.map((item) => (
                            <a
                                key={`mobile-${item.title}`}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleFilmClick(item);
                                }}
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
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MoodPage;
