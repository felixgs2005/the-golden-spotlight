import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Alert, Container, Row, Col, Card, Placeholder } from "react-bootstrap";
import { getMovieWithDetails } from "../api/tmdb";
import {
  getMovieTitle,
  getMoviePosterUrl,
  getMovieBackdropUrl,
  getFormattedReleaseDate,
  getFormattedRuntime,
  getMovieGenresText,
  getMovieRating,
  getMovieCastNames,
  getMovieDirector,
  getMovieStatus,
  getMovieOriginalLanguage,
  getMovieAgeRating,
  getTrailerUrl,
  getTopCast,
  getSimilarMovies,
} from "../api/mapper";
import type { Movie } from "../types/domains";
import "../styles/filmDetail.css";
import "../styles/carousel3d.css";

// ========================== HOOK RESPONSIVE ==========================

function useCarouselSize() {
  const [visibleCards, setVisibleCards] = useState(7);

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth <= 768) {
        setVisibleCards(3); // Mobile: 3 cartes
      } else if (window.innerWidth <= 992) {
        setVisibleCards(5); // Tablette: 5 cartes
      } else {
        setVisibleCards(7); // Desktop: 7 cartes
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return visibleCards;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; movie: Movie };

export default function FilmDetails() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "idle" });
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setState({ status: "loading" });

    getMovieWithDetails(id)
      .then((movie) => mounted && setState({ status: "success", movie }))
      .catch((e) => mounted && setState({ status: "error", error: String(e) }));

    return () => {
      mounted = false;
    };
  }, [id]);

  if (state.status !== "success") {
    if (state.status === "error") {
      return (
        <Alert variant="danger" className="mt-3">
          Error: {state.error}
        </Alert>
      );
    }
    return <Skeleton />;
  }

  const { movie } = state;
  const rating = getMovieRating(movie);
  const topCast = getTopCast(movie, 12);
  const similarMovies = getSimilarMovies(movie, 7);
  const trailerUrl = getTrailerUrl(movie);

  return (
    <div className="film-details-page">
      <HeroSection movie={movie} rating={rating} onPlayTrailer={() => setShowTrailer(true)} />
      <ActorsSection actors={topCast} />
      <SimilarSection movies={similarMovies} />

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <TrailerModal trailerUrl={trailerUrl} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
}

// ==================== HERO SECTION ====================

function HeroSection({
  movie,
  rating,
  onPlayTrailer,
}: {
  movie: Movie;
  rating: ReturnType<typeof getMovieRating>;
  onPlayTrailer: () => void;
}) {
  const backdropUrl = getMovieBackdropUrl(movie);
  const posterUrl = getMoviePosterUrl(movie);
  const ageRating = getMovieAgeRating(movie);
  const trailerUrl = getTrailerUrl(movie);

  return (
    <section
      className="film-hero"
      style={{
        backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
      }}
    >
      <div className="overlay-hero-filmDetails" />

      <div className="container over-overlay py-5 d-flex flex-wrap align-items-start">
        <PosterColumn posterUrl={posterUrl} title={getMovieTitle(movie)} />

        <div className="col-md-8 ms-md-5 text-light">
          <Row>
            <Col md={8}>
              <MovieInfo movie={movie} rating={rating} ageRating={ageRating} />
            </Col>

            <Col
              md={4}
              className="text-md-end text-light mt-4 mt-md-0 d-flex flex-column align-items-md-end align-items-start"
            >
              <MovieDetails movie={movie} trailerUrl={trailerUrl} onPlayTrailer={onPlayTrailer} />
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
}

// ==================== POSTER COLUMN ====================

function PosterColumn({ posterUrl, title }: { posterUrl?: string; title: string }) {
  return (
    <div className="poster col-md-3 mb-4">
      {posterUrl ? (
        <img src={posterUrl} alt={title} />
      ) : (
        <div>
          <span className="text-muted">No poster available</span>
        </div>
      )}
    </div>
  );
}

// ==================== MOVIE INFO ====================

function MovieInfo({
  movie,
  rating,
  ageRating,
}: {
  movie: Movie;
  rating: ReturnType<typeof getMovieRating>;
  ageRating?: string;
}) {
  return (
    <>
      <h1 className="fw-bold">{getMovieTitle(movie)}</h1>

      <div className="d-flex align-items-center flex-wrap gap-2 mb-3 text-light">
        {ageRating && (
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
            {ageRating}
          </span>
        )}

        <span>{getFormattedReleaseDate(movie)}</span>
        <span>— {getFormattedRuntime(movie)}</span>
        <span>— {getMovieGenresText(movie)}</span>
      </div>

      <RatingDisplay rating={rating} />

      <p className="mb-3" style={{ maxWidth: "600px" }}>
        {movie.overview ?? <span className="text-muted">No synopsis available.</span>}
      </p>
    </>
  );
}

// ==================== RATING DISPLAY ====================

function RatingDisplay({ rating }: { rating: ReturnType<typeof getMovieRating> }) {
  if (!rating) {
    return (
      <div className="rating mb-2">
        <span className="text-muted">No rating available</span>
      </div>
    );
  }

  return (
    <div className="rating mb-2">
      <span className="">{rating.stars}</span> {rating.percentage}
    </div>
  );
}

// ==================== TRAILER BUTTON ====================

function TrailerButton({ trailerUrl, onPlay }: { trailerUrl?: string; onPlay: () => void }) {
  if (!trailerUrl) {
    return <span className="text-muted mt-auto">No trailer available</span>;
  }

  return (
    <button onClick={onPlay} className="play-button mt-auto">
      ▶ Trailer
    </button>
  );
}

// ==================== TRAILER MODAL ====================

function TrailerModal({ trailerUrl, onClose }: { trailerUrl: string; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const embedUrl = trailerUrl.includes("watch?v=")
    ? trailerUrl.replace("watch?v=", "embed/")
    : trailerUrl;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "transparent",
          border: "none",
          color: "#FFF0C4",
          fontSize: "2rem",
          cursor: "pointer",
          zIndex: 10000,
          padding: "10px",
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        ×
      </button>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1000px",
          aspectRatio: "16/9",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={embedUrl}
          title="Movie Trailer"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "8px",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// ==================== MOVIE DETAILS ====================

function MovieDetails({
  movie,
  trailerUrl,
  onPlayTrailer,
}: {
  movie: Movie;
  trailerUrl?: string;
  onPlayTrailer: () => void;
}) {
  return (
    <>
      <DetailItem label="Status" value={getMovieStatus(movie)} />
      <DetailItem label="Original Language" value={getMovieOriginalLanguage(movie)} />
      <DetailItem label="Starring" value={getMovieCastNames(movie, 3)} />
      <DetailItem label="Director" value={getMovieDirector(movie)} />

      <div className="mt-auto pt-3">
        <TrailerButton trailerUrl={trailerUrl} onPlay={onPlayTrailer} />
      </div>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item mb-3">
      <strong className="d-block text-uppercase small">{label}</strong>
      <span className="resultDetailsRight">{value}</span>
    </div>
  );
}

// ==================== ACTORS SECTION ====================

function ActorsSection({ actors }: { actors: any[] }) {
  if (actors.length === 0) return null;

  return (
    <section className="actors-section py-5">
      <div className="container">
        <h2 className="text-light mb-4">Actors</h2>
        <div className="actors-scroll-container">
          {actors.slice(0, 12).map((actor) => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActorCard({ actor }: { actor: any }) {
  return (
    <Link to={`/actor/${actor.id}`} className="actor-card">
      <div className="actor-photo-card-container p-3">
        {actor.profileUrl ? (
          <img src={actor.profileUrl} alt={actor.name} className="actor-photo-card" />
        ) : (
          <div className="actor-photo-placeholder">
            <span>?</span>
          </div>
        )}
      </div>
      <p className="name-actor">{actor.name}</p>
      <span className="actor-known-for">Known For →</span>
    </Link>
  );
}

// ==================== SIMILAR SECTION (RESPONSIVE) ====================

function SimilarSection({ movies }: { movies: Movie[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCards = useCarouselSize();

  const positions = Array.from({ length: visibleCards }, (_, i) => i + 1);

  const prev = () => {
    setStartIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const next = () => {
    setStartIndex((prev) => (prev + 1) % movies.length);
  };

  if (movies.length === 0) return null;

  return (
    <section className="carousel-section">
      <div className="carousel-shell">
        <h2 className="carousel-title">Similar titles</h2>

        <div className="carousel-frame">
          <div className="corner-bottom"></div>

          <div className="carousel-frame-inner">
            <div className="carousel-3d-wrapper">
              <button className="carousel-arrow left" onClick={prev} aria-label="Previous">
                <i className="fa fa-angle-left" />
              </button>

              <div className="carousel-3d-container">
                {positions.map((pos, i) => {
                  const movieIndex = (startIndex + i) % movies.length;
                  return (
                    <SimilarMovieCard
                      key={i}
                      movie={movies[movieIndex]}
                      position={pos}
                      totalVisible={visibleCards}
                    />
                  );
                })}
              </div>

              <button className="carousel-arrow right" onClick={next} aria-label="Next">
                <i className="fa fa-angle-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SimilarMovieCard({
  movie,
  position,
  totalVisible,
}: {
  movie: Movie;
  position: number;
  totalVisible: number;
}) {
  const posterUrl = getMoviePosterUrl(movie);
  const [hover, setHover] = useState(false);

  // Tailles de cartes selon le nombre visible
  const cardSizes: Record<number, { width: string; height: string }> = {
    7: { width: "14rem", height: "24rem" },
    5: { width: "11rem", height: "19rem" },
    3: { width: "7rem", height: "13rem" },
  };

  const size = cardSizes[totalVisible as 7 | 5 | 3];

  const base: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    width: size.width,
    height: size.height,
    border: "3px solid #FFF0C4",
    transition: "0.45s ease",
    opacity: 0,
    overflow: "hidden",
  };

  // Configurations pour 7, 5 et 3 cartes
  const styleConfigs: Record<number, Record<number, React.CSSProperties>> = {
    7: {
      1: {
        ...base,
        transform: "translateX(-50%) translateX(-420px) scale(0.5)",
        opacity: 1,
        zIndex: 1,
      },
      2: {
        ...base,
        transform: "translateX(-50%) translateX(-300px) scale(0.68)",
        opacity: 1,
        zIndex: 2,
      },
      3: {
        ...base,
        transform: "translateX(-50%) translateX(-170px) scale(0.85)",
        opacity: 1,
        zIndex: 3,
      },
      4: { ...base, transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1, zIndex: 5 },
      5: {
        ...base,
        transform: "translateX(-50%) translateX(170px) scale(0.85)",
        opacity: 1,
        zIndex: 3,
      },
      6: {
        ...base,
        transform: "translateX(-50%) translateX(300px) scale(0.68)",
        opacity: 1,
        zIndex: 2,
      },
      7: {
        ...base,
        transform: "translateX(-50%) translateX(420px) scale(0.5)",
        opacity: 1,
        zIndex: 1,
      },
    },
    5: {
      1: {
        ...base,
        transform: "translateX(-50%) translateX(-225px) scale(0.7)",
        opacity: 1,
        zIndex: 1,
      },
      2: {
        ...base,
        transform: "translateX(-50%) translateX(-125px) scale(0.85)",
        opacity: 1,
        zIndex: 2,
      },
      3: { ...base, transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1, zIndex: 5 },
      4: {
        ...base,
        transform: "translateX(-50%) translateX(125px) scale(0.85)",
        opacity: 1,
        zIndex: 2,
      },
      5: {
        ...base,
        transform: "translateX(-50%) translateX(225px) scale(0.7)",
        opacity: 1,
        zIndex: 1,
      },
    },
    3: {
      1: {
        ...base,
        transform: "translateX(-50%) translateX(-95px) scale(0.8)",
        opacity: 1,
        zIndex: 1,
      },
      2: { ...base, transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1, zIndex: 5 },
      3: {
        ...base,
        transform: "translateX(-50%) translateX(95px) scale(0.8)",
        opacity: 1,
        zIndex: 1,
      },
    },
  };

  const centerPosition = Math.ceil(totalVisible / 2);
  const isCenter = position === centerPosition;
  const styleMap = styleConfigs[totalVisible as 7 | 5 | 3];

  return (
    <Link
      to={`/film/${movie.id}`}
      className="carousel-card"
      style={{
        ...styleMap[position],
        pointerEvents: isCenter ? "auto" : "none",
        borderColor: isCenter && hover ? "#8C1007" : "#FFF0C4",
      }}
      onMouseEnter={() => isCenter && setHover(true)}
      onMouseLeave={() => isCenter && setHover(false)}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={movie.title} />
      ) : (
        <div className="movie-card-placeholder">No poster</div>
      )}

      {isCenter && (
        <div className={`carousel-card-overlay ${hover ? "visible" : ""}`}>
          <div className="carousel-overlay-title">{movie.title}</div>
          <div className="carousel-overlay-year">{movie.year}</div>
        </div>
      )}
    </Link>
  );
}

// ==================== SKELETON ====================

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
