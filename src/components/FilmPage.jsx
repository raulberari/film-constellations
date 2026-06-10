import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    searchFilm,
    getFilmDetails,
    buildSlug,
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

    const director = metadata?.credits?.crew?.find(
        (p) => p.job === "Director",
    )?.name;
    const year = metadata?.release_date?.slice(0, 4);
    const runtime = metadata?.runtime;
    const country = metadata?.production_countries?.[0]?.name;

    useEffect(() => {
        if (!metadata) return;
        if (analysis) return;
        if (status === "analyzing") return;

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
                setStatus("done");
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

    if (!film)
        return (
            <p>
                Film not found. <a href="/">Go back.</a>
            </p>
        );

    if (status === "analyzing")
        return (
            <div className="loader-page">
                <div className="loader-inner">
                    <div className="loader-spinner" />
                    <p className="loader-text">Analyzing</p>
                </div>
            </div>
        );

    if (status === "error") return <p>Something went wrong.</p>;

    return (
        <div className="full-page">
            <a href="/" className="logo">
                <h1>Film Analysis</h1>
            </a>
            <div className="film-page">
                <div className="film-left">
                    {metadata?.poster_path && (
                        <img
                            className="film-poster"
                            src={getPosterUrl(metadata.poster_path)}
                            alt={metadata.title}
                        />
                    )}
                    <div className="film-details">
                        <h1 className="film-title">
                            {metadata?.title} ({year})
                        </h1>
                        <p className="film-meta">
                            {director}
                            {runtime && <> &nbsp;·&nbsp; {runtime} min</>}
                            {country && <> &nbsp;·&nbsp; {country}</>}
                        </p>
                        {analysis && (
                            <>
                                <div className="film-tags">
                                    {analysis.themes.map((t) => (
                                        <span key={t} className="tag">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <p className="film-mood">
                                    <span className="mood-primary">
                                        {analysis.mood.primary}
                                    </span>
                                    <span className="mood-descriptors">
                                        {" "}
                                        · {analysis.mood.descriptors.join(
                                            ", ",
                                        )}{" "}
                                        ·{" "}
                                    </span>
                                    <span>{analysis.mood.tone}</span>
                                </p>
                                <hr className="divider" />
                                <p className="essay-label">Essay</p>
                                <p className="essay">{analysis.essay}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="film-right">
                    {analysis && (
                        <>
                            <p className="constellation-label">Constellation</p>
                            <div className="constellation-grid">
                                {analysis.constellation.map((item) => (
                                    <div
                                        key={item.title}
                                        className="c-card"
                                        onClick={() =>
                                            handleConstellationClick(item)
                                        }
                                    >
                                        {item.tmdbData?.poster_path ? (
                                            <img
                                                className="c-poster"
                                                src={getPosterUrl(
                                                    item.tmdbData.poster_path,
                                                )}
                                                alt={item.title}
                                            />
                                        ) : (
                                            <div className="c-poster c-poster-empty" />
                                        )}
                                        <div className="c-info">
                                            <p className="c-title">
                                                {item.title}
                                            </p>
                                            <p className="c-meta">
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
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FilmPage;
