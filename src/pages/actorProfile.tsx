import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Container } from "react-bootstrap";
import "../styles/actorProfile.css";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const DEFAULT_LANGUAGE = "en-US";

type MovieCard = {
  id: number;
  title: string;
  posterUrl?: string;
  year?: string;
};

type Actor = {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  profile_path?: string;
  known_for_department?: string;
  gender?: number;
  popularity?: number;
};

type SimilarActor = {
  id: number;
  name: string;
  profile_path?: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "success";
      actor: Actor;
      movies: MovieCard[];
      totalCredits: number;
      similarActors: SimilarActor[];
    };

function posterUrlFromPath(path?: string | null, size: "w342" | "w500" = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}

function mapMovie(item: any): MovieCard {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Untitled",
    posterUrl: posterUrlFromPath(item.poster_path),
    year: item.release_date ? item.release_date.slice(0, 4) : "",
  };
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function calculateAge(birthday?: string, deathday?: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getGenderText(gender?: number): string {
  if (gender === 1) return "Female";
  if (gender === 2) return "Male";
  return "Unknown";
}

// ==================== MAIN COMPONENT ====================

export default function ActorProfile() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "idle" });
  const [showFullBio, setShowFullBio] = useState(false);
  const [carouselPosition, setCarouselPosition] = useState(3);

  useEffect(() => {
    let mounted = true;

    async function fetchActorData() {
      setState({ status: "loading" });

      try {
        const [actorResp, creditsResp] = await Promise.all([
          axios.get(`${TMDB_BASE}/person/${id}`, {
            params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE },
          }),
          axios.get(`${TMDB_BASE}/person/${id}/movie_credits`, {
            params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE },
          }),
        ]);

        if (!mounted) return;

        const actor = actorResp.data;
        const allMovies = creditsResp.data.cast ?? [];
        const totalCredits = allMovies.length;

        const topMovies = allMovies
          .map(mapMovie)
          .filter((m: MovieCard) => m.posterUrl)
          .sort((a: MovieCard, b: MovieCard) => Number(b.year) - Number(a.year))
          .slice(0, 7);

        const coStarsMap = new Map<
          number,
          { id: number; name: string; profile_path: string | null; count: number }
        >();

        const movieIds = allMovies.slice(0, 10).map((m: any) => m.id);

        const castPromises = movieIds.map(async (movieId: number) => {
          try {
            const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/credits`, {
              params: { api_key: TMDB_API_KEY },
            });
            return response.data.cast || [];
          } catch {
            return [];
          }
        });

        const allCasts = await Promise.all(castPromises);

        allCasts.forEach((cast: any[]) => {
          cast.slice(0, 10).forEach((castMember: any) => {
            if (castMember.id !== actor.id) {
              const existing = coStarsMap.get(castMember.id);
              if (existing) {
                existing.count++;
              } else {
                coStarsMap.set(castMember.id, {
                  id: castMember.id,
                  name: castMember.name,
                  profile_path: castMember.profile_path,
                  count: 1,
                });
              }
            }
          });
        });

        const similarActors = Array.from(coStarsMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
          .map(({ id, name, profile_path }) => ({ id, name, profile_path }));

        setState({ status: "success", actor, movies: topMovies, totalCredits, similarActors });
      } catch (e) {
        if (!mounted) return;
        setState({ status: "error", error: String(e) });
      }
    }

    fetchActorData();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (state.status === "loading" || state.status === "idle") {
    return <ActorSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className="actor-page">
        <Container className="py-4">
          <div className="error-message">Error: {state.error}</div>
        </Container>
      </div>
    );
  }

  const { actor, movies, totalCredits, similarActors } = state;
  const age = calculateAge(actor.birthday, actor.deathday);

  return (
    <div className="actor-page">
      <Container className="py-5">
        <div className="actor-hero">
          <div>
            <ActorPhoto actor={actor} />
            <PersonalInformation actor={actor} age={age} totalCredits={totalCredits} />
          </div>

          <div>
            <div className="actor-title-block">
              <div className="actor-deco"></div>
              <h1 className="actor-name">{actor.name}</h1>
            </div>

            <ActorBiography
              biography={actor.biography}
              showFullBio={showFullBio}
              onToggleBio={() => setShowFullBio(!showFullBio)}
            />

            <FilmographySection
              movies={movies}
              carouselPosition={carouselPosition}
              onPrev={() => setCarouselPosition(Math.max(0, carouselPosition - 1))}
              onNext={() => setCarouselPosition(Math.min(movies.length - 1, carouselPosition + 1))}
            />
          </div>
        </div>

        <SeeAlsoSection actors={similarActors} />
      </Container>
    </div>
  );
}

// ==================== SUBCOMPONENTS ====================

function ActorPhoto({ actor }: { actor: Actor }) {
  return (
    <div className="actor-photo-container">
      {actor.profile_path ? (
        <img
          src={posterUrlFromPath(actor.profile_path, "w500")}
          alt={actor.name}
          className="actor-photo"
        />
      ) : (
        <div className="actor-photo-placeholder">No photo</div>
      )}
    </div>
  );
}

function ActorBiography({
  biography,
  showFullBio,
  onToggleBio,
}: {
  biography: string;
  showFullBio: boolean;
  onToggleBio: () => void;
}) {
  const maxLength = 1000;
  const needsReadMore = biography && biography.length > maxLength;

  const displayBio =
    showFullBio || !needsReadMore ? biography : biography.substring(0, maxLength) + "...";

  return (
    <div className="actor-info">
      {biography ? (
        <>
          <p className="actor-biography">{displayBio}</p>
          {needsReadMore && (
            <button className="read-more-button" onClick={onToggleBio}>
              {showFullBio ? "Show Less" : "Read More"}
            </button>
          )}
        </>
      ) : (
        <p className="actor-biography">No biography available.</p>
      )}
    </div>
  );
}

// ==================== PERSONAL INFORMATION ====================

function PersonalInformation({
  actor,
  age,
  totalCredits,
}: {
  actor: Actor;
  age: number | null;
  totalCredits: number;
}) {
  const rawPopularity = actor.popularity || 0;
  const popularityScore =
    rawPopularity > 0
      ? Math.min(100, Math.round((Math.log10(rawPopularity + 1) / Math.log10(101)) * 100))
      : 0;

  return (
    <div className="personal-info mt-4">
      {/* ⭐ Bottom decoration corners */}
      <div className="corner-bl"></div>
      <div className="corner-br"></div>

      <h3 className="personal-info-title">Personal Information</h3>

      <InfoItem label="Famous For">{actor.known_for_department || "Acting"}</InfoItem>

      <InfoItem label="Known Credits">{totalCredits}</InfoItem>

      <InfoItem label="Gender">{getGenderText(actor.gender)}</InfoItem>

      <InfoItem label="Date of Birth">
        {formatDate(actor.birthday)}
        {age && !actor.deathday && <span className="age-text"> ({age} years old)</span>}
      </InfoItem>

      {actor.deathday && (
        <InfoItem label="Date of Death">
          {formatDate(actor.deathday)}
          {age && <span className="age-text"> (aged {age})</span>}
        </InfoItem>
      )}

      <InfoItem label="Content Score">
        <div className="content-score">
          <StarRating percentage={popularityScore} />
          <span className="score-value">{popularityScore}%</span>
        </div>
      </InfoItem>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{children}</div>
    </div>
  );
}

function StarRating({ percentage }: { percentage: number }) {
  return (
    <div className="star-rating">
      <div className="star-background">★</div>
      <div className="star-fill" style={{ width: `${percentage}%` }}>
        ★
      </div>
    </div>
  );
}

// ==================== FILMOGRAPHY ====================

function FilmographySection({
  movies,
  carouselPosition,
  onPrev,
  onNext,
}: {
  movies: MovieCard[];
  carouselPosition: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [positions, setPositions] = useState<number[]>([]);

  useEffect(() => {
    if (movies.length === 0) return;
    const newPositions = movies.map((_, i) => {
      const diff = i - carouselPosition;
      if (diff === -2) return 1;
      if (diff === -1) return 2;
      if (diff === 0) return 3;
      if (diff === 1) return 4;
      if (diff === 2) return 5;
      return 0;
    });
    setPositions(newPositions);
  }, [movies, carouselPosition]);

  if (movies.length === 0) return null;

  return (
    <section className="filmography-section">
      <h2 className="section-title">Famous For</h2>

      <div className="carousel-container">
        <button className="carousel-arrow carousel-arrow-left" onClick={onPrev}>
          <i className="fa fa-angle-left"></i>
        </button>

        <div className="carousel-content">
          {movies.map((movie, index) => (
            <FilmCard key={movie.id} movie={movie} position={positions[index]} />
          ))}
        </div>

        <button className="carousel-arrow carousel-arrow-right" onClick={onNext}>
          <i className="fa fa-angle-right"></i>
        </button>
      </div>

      <div className="filmography-link">
        <Link to="#">See filmography</Link>
      </div>
    </section>
  );
}

function FilmCard({ movie, position }: { movie: MovieCard; position: number }) {
  const getPositionStyles = () => {
    const baseStyle = {
      position: "absolute" as const,
      left: "50%",
      height: "24rem",
      width: "14rem",
      borderRadius: "8px",
      zIndex: 0,
      opacity: 0,
      transform: "translate(-50%, 0) scale(1)",
      transition: "all 0.5s ease-in-out",
      overflow: "hidden",
    };

    switch (position) {
      case 1:
        return {
          ...baseStyle,
          left: "20%",
          zIndex: 1,
          transform: "translate(-50%, 0) scale(0.8)",
          opacity: 1,
          filter: "blur(3px)",
        };
      case 2:
        return {
          ...baseStyle,
          left: "35%",
          zIndex: 2,
          transform: "translate(-50%, 0) scale(0.9)",
          opacity: 1,
          filter: "blur(1px)",
        };
      case 3:
        return {
          ...baseStyle,
          left: "50%",
          zIndex: 4,
          transform: "translate(-50%, 0) scale(1)",
          opacity: 1,
          filter: "blur(0px)",
        };
      case 4:
        return {
          ...baseStyle,
          left: "65%",
          zIndex: 2,
          transform: "translate(-50%, 0) scale(0.9)",
          opacity: 1,
          filter: "blur(1px)",
        };
      case 5:
        return {
          ...baseStyle,
          left: "80%",
          zIndex: 1,
          transform: "translate(-50%, 0) scale(0.8)",
          opacity: 1,
          filter: "blur(3px)",
        };
      default:
        return baseStyle;
    }
  };

  const isCenter = position === 3;

  return (
    <Link to={`/film/${movie.id}`} className="film-card" style={getPositionStyles()}>
      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={movie.title} className="film-card-img" />
      ) : (
        <div className="film-card-placeholder">No poster</div>
      )}

      {isCenter && (
        <div className="film-card-overlay">
          <div className="film-card-title">{movie.title}</div>
        </div>
      )}
    </Link>
  );
}

// ==================== SEE ALSO ====================

function SeeAlsoSection({ actors }: { actors: SimilarActor[] }) {
  if (actors.length === 0) return null;

  return (
    <section className="see-also-section py-5">
      <h2 className="section-title mb-4">Worked With</h2>

      <div className="similar-actors-scroll">
        {actors.map((actor) => (
          <SimilarActorCard key={actor.id} actor={actor} />
        ))}
      </div>
    </section>
  );
}

function SimilarActorCard({ actor }: { actor: SimilarActor }) {
  return (
    <Link to={`/actor/${actor.id}`} className="similar-actor-card">
      <div className="similar-actor-photo-container">
        {actor.profile_path ? (
          <img
            src={posterUrlFromPath(actor.profile_path)}
            alt={actor.name}
            className="similar-actor-photo"
          />
        ) : (
          <div className="similar-actor-photo-placeholder">
            <span>?</span>
          </div>
        )}
      </div>
      <p className="similar-actor-name">{actor.name}</p>
      <span className="actor-view-profile">View Profile →</span>
    </Link>
  );
}

// ==================== SKELETON ====================

function ActorSkeleton() {
  return (
    <div className="actor-page">
      <Container className="py-5">
        <div className="skeleton skeleton-photo mb-4" />
        <div className="skeleton skeleton-info" />
      </Container>
    </div>
  );
}
