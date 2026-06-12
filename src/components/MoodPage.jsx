import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    getPosterUrl,
} from "../lib/tmdb.js";
import useStore from "../store.js";
import Logo from "./Logo.jsx";

function MoodPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const moods = useStore((state) => state.moods);
    const setMood = useStore((state) => state.setMood);
    const status = useStore((state) => state.status);
    const setStatus = useStore((state) => state.setStatus);
    const [tick, setTick] = useState(0);

    const mood = moods[slug];
    const label = slug.replace(/-/g, " ");

    const glitches = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => ({
                seed: (tick * 3 + i * 7) % 100,
                radius: (1 + ((tick * Math.random() + i) % 5)) / 10,
            })),
        [tick],
    );
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

    useEffect(() => {
        if (mood) return; // stop once loaded
        const interval = setInterval(() => {
            setTick((t) => t + 1);
        }, 150);
        return () => clearInterval(interval);
    }, [mood]);

    function handleFilmClick(item) {
        if (!item.slug || !item.tmdbData) return;
        const { setFilm } = useStore.getState();
        setFilm(item.slug, { metadata: item.tmdbData, analysis: null });
        navigate(`/film/${item.slug}`);
    }

    let validFilms = [];
    if (mood) {
        validFilms = mood.films
            .filter((item) => item.tmdbData !== null)
            .slice(0, 12);
    }
    return (
        <div className="full-page">
            <Logo />
            <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                    {glitches.map((g, i) => (
                        <filter key={i} id={`glitch-${i}`}>
                            <feTurbulence
                                type="turbulence"
                                baseFrequency="0.01"
                                numOctaves="1"
                                seed={g.seed}
                                result="noise"
                            />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="noise"
                                scale="10"
                                xChannelSelector="R"
                                yChannelSelector="G"
                                result="warped"
                            />
                            <feMorphology
                                operator="dilate"
                                radius={g.radius}
                                in="warped"
                            />
                        </filter>
                    ))}
                </defs>
            </svg>
            {status === "error" && (
                <div className="loader-page">
                    <p>Something went wrong.</p>
                </div>
            )}
            {status === "analyzing" && (
                <div className="loader-page">
                    <div className="loader-inner">
                        <p
                            className="mood-center-text poster"
                            style={{ filter: `url(#glitch-0)` }}
                        >
                            {label}
                        </p>
                        {/* <div className="loader-spinner" /> */}
                    </div>
                </div>
            )}
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
                        {Array.from({ length: 16 }, (_, index) => (
                            <p
                                className="mood-center-text"
                                key={index}
                                style={{ filter: `url(#glitch-${index})` }}
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
