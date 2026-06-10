import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    buildMoodSlug,
    getPosterUrl,
} from "../lib/tmdb.js";
import useStore from "../store.js";

function FilmPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const films = useStore((state) => state.films);
    const setFilm = useStore((state) => state.setFilm);
    const status = useStore((state) => state.status);
    const setStatus = useStore((state) => state.setStatus);

    const film = films[slug];
    const metadata = film?.metadata;
    const analysis = film?.analysis;
    const directors =
        metadata?.credits?.crew
            ?.filter((p) => p.job === "Director")
            .map((p) => p.name) ?? [];
    const director = directors.join(", ");
    const countries = metadata?.production_countries?.map((c) => c.name) ?? [];

    const year = metadata?.release_date?.slice(0, 4);
    const runtime = metadata?.runtime;
    const country = metadata?.production_countries?.[0]?.name;

    useEffect(() => {
        if (film) return;
        if (!slug) return;

        async function fetchFromSlug() {
            setStatus("fetching");
            try {
                const yearMatch = slug.match(/-(\d{4})$/);
                const year = yearMatch ? yearMatch[1] : null;
                const titleSlug = year
                    ? slug.slice(0, slug.lastIndexOf("-" + year))
                    : slug;
                const title = titleSlug.replace(/-/g, " ");

                const result = await searchFilm(title, year);
                if (!result) {
                    setStatus("error");
                    return;
                }

                const details = await getFilmDetails(result.id);
                const filmYear = details.release_date?.slice(0, 4);
                const correctSlug = buildSlug(details.title, filmYear);

                setFilm(correctSlug, { metadata: details, analysis: null });
                setStatus("idle");

                if (correctSlug !== slug) {
                    navigate(`/film/${correctSlug}`, { replace: true });
                }
            } catch (_) {
                setStatus("error");
            }
        }

        fetchFromSlug();
    }, [slug, film]);

    useEffect(() => {
        if (!metadata) return;
        if (analysis) return;
        if (status === "analyzing") return;
        if (status === "fetching") return;

        async function analyzeFilm() {
            setStatus("analyzing");
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ film: metadata }),
                });
                const data = await res.json();

                const constellationWithMeta = await Promise.all(
                    data.constellation.map(async (item) => {
                        const result = await searchFilm(item.title, item.year);
                        const details = result
                            ? await getFilmDetails(result.id)
                            : null;
                        const itemDirector = details?.credits?.crew?.find(
                            (p) => p.job === "Director",
                        )?.name;
                        return {
                            ...item,
                            tmdbData: details,
                            director: itemDirector,
                            slug: details
                                ? buildSlug(
                                      details.title,
                                      details.release_date?.slice(0, 4),
                                  )
                                : null,
                        };
                    }),
                );

                setFilm(slug, {
                    metadata,
                    analysis: { ...data, constellation: constellationWithMeta },
                });
                setTimeout(() => setStatus("done"), 0);
            } catch (_) {
                setStatus("error");
            }
        }

        analyzeFilm();
    }, [slug, metadata]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleConstellationClick(item) {
        if (!item.slug || !item.tmdbData) return;
        setFilm(item.slug, { metadata: item.tmdbData, analysis: null });
        navigate(`/film/${item.slug}`);
    }

    if (status === "analyzing" || status === "fetching")
        return (
            <div className="full-page">
                <a href="/" className="logo">
                    <h1>Film Constellations</h1>
                </a>
                <div className="loader-page">
                    <div className="loader-inner">
                        <div
                            className="poster-center"
                            style={{
                                position: "static",
                                transform: "none",
                                marginBottom: "1rem",
                            }}
                        >
                            {metadata?.poster_path && (
                                <img
                                    className="poster-img"
                                    src={getPosterUrl(metadata.poster_path)}
                                    alt={metadata.title}
                                    onLoad={(e) =>
                                        e.target.classList.add("loaded")
                                    }
                                />
                            )}
                            <p className="poster-name">{metadata?.title}</p>
                            <p className="poster-dir">
                                {director} · {year}
                            </p>
                        </div>
                        <div className="loader-spinner" />
                        <p className="loader-text">Analyzing</p>
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

            {analysis && (
                <>
                    <div className="orbit-zone">
                        <div className="constellation-left">
                            {analysis.constellation.slice(0, 6).map((item) => (
                                <div
                                    key={item.title}
                                    className="c-node"
                                    onClick={() =>
                                        handleConstellationClick(item)
                                    }
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
                                                    e.target.classList.add(
                                                        "loaded",
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="c-thumb c-thumb-empty" />
                                        )}
                                        <div className="c-body">
                                            <p className="c-title">
                                                {item.title}
                                            </p>
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
                            {metadata?.poster_path ? (
                                <img
                                    className="poster-img"
                                    src={getPosterUrl(metadata.poster_path)}
                                    alt={metadata.title}
                                    onLoad={(e) =>
                                        e.target.classList.add("loaded")
                                    }
                                />
                            ) : (
                                <div className="poster-placeholder" />
                            )}
                            <p className="poster-name">{metadata?.title}</p>
                            <p className="poster-dir">
                                {director} · {year}
                            </p>
                        </div>

                        <div className="constellation-right">
                            {analysis.constellation.slice(6, 12).map((item) => (
                                <div
                                    key={item.title}
                                    className="c-node"
                                    onClick={() =>
                                        handleConstellationClick(item)
                                    }
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
                                                    e.target.classList.add(
                                                        "loaded",
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="c-thumb c-thumb-empty" />
                                        )}
                                        <div className="c-body">
                                            <p className="c-title">
                                                {item.title}
                                            </p>
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
                            {analysis.constellation.map((item) => (
                                <div
                                    key={`mobile-${item.title}`}
                                    className="c-node"
                                    onClick={() =>
                                        handleConstellationClick(item)
                                    }
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
                                                    e.target.classList.add(
                                                        "loaded",
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="c-thumb c-thumb-empty" />
                                        )}
                                        <div className="c-body">
                                            <p className="c-title">
                                                {item.title}
                                            </p>
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

                    <div className="essay-zone">
                        <h1 className="film-title-huge">{metadata?.title}</h1>
                        <p className="film-meta-line">
                            {year} ·{" "}
                            {directors.map((d, i) => (
                                <span key={d}>
                                    <span
                                        className="theme-link"
                                        onClick={() =>
                                            navigate(
                                                `/mood/${buildMoodSlug(d)}`,
                                            )
                                        }
                                    >
                                        {d}
                                    </span>
                                    {i < directors.length - 1 ? ", " : ""}
                                </span>
                            ))}
                            {runtime && ` · ${runtime} min`}
                            {countries.length > 0 && (
                                <>
                                    {" · "}
                                    {countries.map((c, i) => (
                                        <span key={c}>
                                            <span
                                                className="theme-link"
                                                onClick={() =>
                                                    navigate(
                                                        `/mood/${buildMoodSlug(c)}`,
                                                    )
                                                }
                                            >
                                                {c}
                                            </span>
                                            {i < countries.length - 1
                                                ? ", "
                                                : ""}
                                        </span>
                                    ))}
                                </>
                            )}
                        </p>
                        <p className="film-themes-line">
                            {analysis.themes.map((t, i) => (
                                <span key={t}>
                                    <span
                                        className="theme-link"
                                        onClick={() =>
                                            navigate(
                                                `/mood/${buildMoodSlug(t)}`,
                                            )
                                        }
                                    >
                                        {t}
                                    </span>
                                    {i < analysis.themes.length - 1
                                        ? " · "
                                        : ""}
                                </span>
                            ))}
                        </p>
                        <p className="film-mood-line">
                            {analysis.mood.primary} ·{" "}
                            {analysis.mood.descriptors.join(", ")} ·{" "}
                            {analysis.mood.tone}
                        </p>
                        <div className="essay-body">
                            <p className="essay-text">{analysis.essay}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default FilmPage;
