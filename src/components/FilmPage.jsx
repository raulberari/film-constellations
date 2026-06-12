import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
    buildMoodSlug,
    getPosterUrl,
    getFilmImages,
} from "../lib/tmdb.js";
import useStore from "../store.js";
import { useAnalyzingMessage } from "../hooks/useAnalyzingMessage.js";

function FilmPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const films = useStore((state) => state.films);
    const setFilm = useStore((state) => state.setFilm);
    const status = useStore((state) => state.status);
    const setStatus = useStore((state) => state.setStatus);
    const [essayLoading, setEssayLoading] = useState(false);
    const message = useAnalyzingMessage(status);
    const essayMessage = useAnalyzingMessage(
        essayLoading ? "analyzing" : "idle",
    );

    const film = films[slug];
    const metadata = film?.metadata;
    const constellation = film?.constellation;
    const essay = film?.essay;
    const directors =
        metadata?.credits?.crew
            ?.filter((p) => p.job === "Director")
            .map((p) => p.name) ?? [];
    const director = directors.join(", ");
    const countries = metadata?.production_countries?.map((c) => c.name) ?? [];

    const year = metadata?.release_date?.slice(0, 4);
    const runtime = metadata?.runtime;

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

                setFilm(correctSlug, {
                    metadata: details,
                    constellation: null,
                    essay: null,
                });
                setStatus("idle");

                if (correctSlug !== slug) {
                    navigate(`/film/${correctSlug}`, { replace: true });
                }
            } catch (err) {
                setStatus("error");
                console.error(err);
            }
        }

        fetchFromSlug();
    }, [slug, film]);

    // EFFECT 1 — constellation (controls the loading screen)
    useEffect(() => {
        if (!metadata) return;
        if (constellation) return;
        if (status === "analyzing" || status === "fetching") return;

        async function fetchConstellation() {
            setStatus("analyzing");
            try {
                const res = await fetch("/api/constellation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ film: metadata, slug }),
                });
                const data = await res.json();

                const constellationWithMeta = await Promise.all(
                    data.constellation.map(async (item) => {
                        const result = await searchFilm(item.title, item.year);
                        const details = result
                            ? await getFilmDetails(result.id)
                            : null;
                        const bestPoster = details
                            ? await getFilmImages(result.id)
                            : null;
                        if (bestPoster && details)
                            details.poster_path = bestPoster;
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
                    ...film,
                    constellation: {
                        themes: data.themes,
                        constellation: constellationWithMeta,
                    },
                });
                setTimeout(() => setStatus("done"), 0);
            } catch (err) {
                setStatus("error");
                console.error(err);
            }
        }

        fetchConstellation();
    }, [slug, metadata, constellation, status]); // eslint-disable-line react-hooks/exhaustive-deps

    // EFFECT 2 — essay (silent, no status changes)
    useEffect(() => {
        if (!metadata) return;
        if (essay) return;

        async function fetchEssay() {
            setEssayLoading(true);
            try {
                const res = await fetch("/api/essay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ film: metadata, slug }),
                });
                const data = await res.json();
                const currentFilm = useStore.getState().films[slug];
                setFilm(slug, { ...currentFilm, essay: { essay: data.essay } });
            } catch (err) {
                console.error(err);
            } finally {
                setEssayLoading(false);
            }
        }

        fetchEssay();
    }, [slug, metadata, essay]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!metadata) return;
        const year = metadata.release_date?.slice(0, 4);
        document.title = `${metadata.title} (${year}) • Film Constellations`;
        return () => {
            document.title = "Film Constellations";
        };
    }, [metadata]);

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
                                marginTop: "56px",
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
                        <p className="loader-text">{message}</p>
                    </div>
                </div>
            </div>
        );

    if (status === "error") return <p>Something went wrong.</p>;

    let validConstellation = [];
    if (constellation) {
        const seenIds = new Set([metadata?.id]);
        validConstellation = constellation.constellation
            .filter((item) => item.tmdbData !== null)
            .filter((item) => {
                if (seenIds.has(item.tmdbData.id)) return false;
                seenIds.add(item.tmdbData.id);
                return true;
            })
            .slice(0, 12);
    }
    return (
        <div className="full-page">
            <a href="/" className="logo">
                <h1>Film Constellations</h1>
            </a>
            {constellation && (
                <div className="orbit-zone">
                    <div className="constellation-left">
                        {validConstellation.slice(0, 6).map((item) => (
                            <a
                                key={item.title}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleConstellationClick(item);
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

                    <div className="poster-center">
                        {metadata?.poster_path ? (
                            <img
                                className="poster-img"
                                src={getPosterUrl(metadata.poster_path)}
                                alt={metadata.title}
                                onLoad={(e) => e.target.classList.add("loaded")}
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
                        {validConstellation.slice(6, 12).map((item) => (
                            <a
                                key={item.title}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleConstellationClick(item);
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
                        {validConstellation.map((item) => (
                            <a
                                key={`mobile-${item.title}`}
                                className="c-node"
                                href={
                                    item.slug ? `/film/${item.slug}` : undefined
                                }
                                onClick={(e) => {
                                    if (!item.slug) return;
                                    e.preventDefault();
                                    handleConstellationClick(item);
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
            <div className="essay-zone">
                <h1 className="film-title-huge">{metadata?.title}</h1>
                <p className="film-meta-line">
                    {year} ·{" "}
                    {directors.map((d, i) => (
                        <span key={d}>
                            <a
                                className="theme-link"
                                href={`/mood/${buildMoodSlug(d)}`}
                            >
                                {d}
                            </a>
                            {i < directors.length - 1 ? ", " : ""}
                        </span>
                    ))}
                    {runtime && ` · ${runtime} min`}
                    {countries.length > 0 && (
                        <>
                            {" · "}
                            {countries.map((c, i) => (
                                <span key={c}>
                                    <a
                                        className="theme-link"
                                        href={`/mood/${buildMoodSlug(c)}`}
                                    >
                                        {c}
                                    </a>
                                    {i < countries.length - 1 ? ", " : ""}
                                </span>
                            ))}
                        </>
                    )}
                </p>
                {constellation && (
                    <p className="film-themes-line">
                        {constellation.themes.map((t, i) => (
                            <span key={t}>
                                <a
                                    className="theme-link"
                                    href={`/mood/${buildMoodSlug(t)}`}
                                >
                                    {t}
                                </a>
                                {i < constellation.themes.length - 1
                                    ? " · "
                                    : ""}
                            </span>
                        ))}
                    </p>
                )}
                {essayLoading && !essay && (
                    <div>
                        <div className="loader-spinner" />
                        <p
                            className="loader-text"
                            style={{ textAlign: "center" }}
                        >
                            {essayMessage}
                        </p>
                    </div>
                )}
                {essay && (
                    <div className="essay-body">
                        {essay?.essay?.split("\n").map((para, i) => (
                            <p key={i} className="essay-text">
                                {para}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FilmPage;
