import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/filmDetail.css";
import { Alert, Container, Row, Col, Card, Placeholder } from "react-bootstrap";
import { getMovieWithCastFrThenCompleteWithEn } from "../api/tmdb.ts";
import { formatDate, formatRuntime } from "../utils/utils";
import type { Movie } from "../types/domains";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "success";
      movie: Movie;
      languageUsed: string;
      usedFallback: boolean;
      completed: {
        overview?: boolean;
        tagline?: boolean;
        genres?: boolean;
        cast?: boolean;
      };
    };

export default function FilmDetails() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setState({ status: "loading" });
    getMovieWithCastFrThenCompleteWithEn(id, "fr-CA")
      .then((res) => mounted && setState({ status: "success", ...res }))
      .catch((e) => mounted && setState({ status: "error", error: String(e) }));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (state.status !== "success") {
    if (state.status === "error")
      return (
        <Alert variant="danger" className="mt-3">
          Erreur: {state.error}
        </Alert>
      );
    return <Skeleton />;
  }

  const { movie, languageUsed, usedFallback, completed } = state;

  // Safe vote calculation (movie.rating peut être undefined)
  const vote =
    typeof movie.rating === "number" ? Math.round((movie.rating ?? 0) * 10) / 10 : undefined;

  // helper pour afficher des étoiles (0-5) à partir d'une note sur 10
  const renderStars = (rating?: number) => {
    if (typeof rating !== "number") return "—";
    const stars = Math.round((rating / 10) * 5); // convert 0-10 -> 0-5
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
    <div className="film-details-page">
      {/* Section principale avec fond (protection si pas de backdrop) */}
      <section
        className="film-hero"
        style={{
          backgroundImage: movie.backdropUrl ? `url(${movie.backdropUrl})` : undefined,
        }}
      >
        <div className="overlay" />

        <div className="container over-overlay py-5 d-flex flex-wrap align-items-start">
          {/* Affiche */}
          <div className="poster col-md-3 mb-4">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} />
            ) : (
              <div>
                <span className="text-muted">Aucune affiche</span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="col-md-8 ms-md-5" text-light>
            <Row>
              {/* Colonne gauche : titre + synopsis */}
              <Col md={8}>
                <h1 className="fw-bold">{movie.title}</h1>

                <div className="d-flex align-items-center flex-wrap gap-2 mb-3 text-light">
                  {/* Badge âge / maturité */}
                  {movie.ageRating && (
                    <span
                      className="badge-age fw-bold"
                      style={{
                        backgroundColor: "#f5d7b7",
                        color: "#150804",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {movie.ageRating}
                    </span>
                  )}

                  {/* Date de sortie */}
                  <span>{formatDate(movie.releaseDate)}</span>

                  {/* Durée */}
                  <span>— {formatRuntime(movie.runtime)}</span>

                  {/* Genres */}
                  <span>
                    —{" "}
                    {(movie.genres ?? []).length > 0
                      ? movie.genres.map((g) => g.name).join(", ")
                      : "—"}
                  </span>
                </div>

                <div className="rating mb-2">
                  <span className="text-warning">{"★".repeat(Math.round(movie.rating / 2))}</span>{" "}
                  {Math.round(movie.rating * 10)}%
                </div>

                <p className="mb-3" style={{ maxWidth: "600px" }}>
                  {movie.overview ?? <span className="text-muted">Aucun synopsis disponible.</span>}
                </p>
              </Col>

              {/* Colonne droite : détails */}
              <Col
                md={4}
                className="text-md-end text-light mt-4 mt-md-0 d-flex flex-column align-items-md-end align-items-start position-relative"
              >
                <div className="detail-item mb-3">
                  <strong className="d-block text-uppercase small">Status</strong>
                  <span className="resultDetailsRight">{movie.status ?? "—"}</span>
                </div>

                <div className="detail-item mb-3">
                  <strong className="d-block text-uppercase small">Original Language</strong>
                  <span className="resultDetailsRight">
                    {(movie.originalLanguage ?? "—").toUpperCase()}
                  </span>
                </div>

                <div className="detail-item mb-3">
                  <strong className="d-block text-uppercase small">Starring</strong>
                  <span className="resultDetailsRight">
                    {(movie.cast ?? [])
                      .slice(0, 3)
                      .map((c) => c.name)
                      .join(", ") || "—"}
                  </span>
                </div>

                <div className="detail-item mb-3">
                  <strong className="d-block text-uppercase small">Director</strong>
                  <span className="resultDetailsRight">{movie.director ?? "N/A"}</span>
                </div>

                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="play-button mt-auto"
                  >
                    ▶ Watch Trailer
                  </a>
                )}
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* Section Acteurs */}
      <section className="actors-section py-5">
        <div className="container">
          <h2 className="text-light mb-4">Actors</h2>
          <div className="d-flex flex-wrap justify-content-center gap-4 text-center">
            {(movie.cast ?? []).slice(0, 5).map((actor) => (
              <div
                key={actor.id}
                className="actor-card p-3 border"
              >
                {actor.profileUrl ? (
                  <img
                    src={actor.profileUrl}
                    alt={actor.name}
                    className="img-fluid rounded-circle mb-2"
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: "#333",
                    }}
                  />
                )}
                <p className="text-light mb-0">{actor.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Similar Titles */}
      <section className="similar-section py-5" style={{ background: "#150804", color: "#f5d7b7" }}>
        <div className="container">
          <h2 className="mb-4">Similar titles</h2>
          <div className="d-flex gap-3 overflow-auto pb-3">
            {(movie.similar ?? []).slice(0, 6).map((sim) => (
              <Link
                key={sim.id}
                to={`/film/${sim.id}`}
                className="text-decoration-none text-light"
                style={{ display: "inline-block" }}
              >
                {sim.posterUrl ? (
                  <img
                    src={sim.posterUrl}
                    alt={sim.title}
                    style={{
                      width: 140,
                      borderRadius: 6,
                      transition: "transform 0.2s",
                    }}
                    className="shadow-sm"
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                ) : (
                  <div
                    style={{
                      width: 140,
                      height: 210,
                      borderRadius: 6,
                      background: "#333",
                    }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Skeleton() {
  return (
    <Container className="mt-3">
      <Placeholder as="div" animation="glow">
        <Placeholder xs={12} style={{ height: 180, borderRadius: 12 }} />
      </Placeholder>
      <Row className="mt-3">
        <Col md={3}>
          <Placeholder as={Card} animation="glow" className="p-0">
            <div style={{ aspectRatio: "2/3" }} className="w-100 bg-light" />
          </Placeholder>
        </Col>
        <Col md={9}>
          <Placeholder as="h1" animation="glow">
            <Placeholder xs={6} />
          </Placeholder>
          <Placeholder as="p" animation="glow">
            <Placeholder xs={8} />
          </Placeholder>
          <Placeholder as="p" animation="glow">
            <Placeholder xs={10} />
          </Placeholder>
        </Col>
      </Row>
    </Container>
  );
}
