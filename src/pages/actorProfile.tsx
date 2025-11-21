import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";
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
  place_of_birth?: string;
  profile_path?: string;
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

export default function ActorProfile() {
  const { id } = useParams<{ id: string }>();
  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<MovieCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchActor() {
      setLoading(true);
      setError(null);
      try {
        const actorResp = await axios.get(`${TMDB_BASE}/person/${id}`, {
          params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE },
        });

        const creditsResp = await axios.get(`${TMDB_BASE}/person/${id}/movie_credits`, {
          params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE },
        });

        if (!mounted) return;

        setActor(actorResp.data);
        const topMovies = (creditsResp.data.cast ?? [])
          .map(mapMovie)
          .sort((a, b) => Number(b.year) - Number(a.year))
          .slice(0, 12);
        setMovies(topMovies);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchActor();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="actor-page"><Container>Loading...</Container></div>;
  if (error) return <div className="actor-page"><Container>Error: {error}</Container></div>;
  if (!actor) return <div className="actor-page"><Container>No actor found.</Container></div>;

  return (
    <div className="actor-page">
      <Container className="py-4">
        <Row className="mb-4">
          <Col md={4}>
            {actor.profile_path ? (
              <img
                src={posterUrlFromPath(actor.profile_path, "w500")}
                alt={actor.name}
                className="actor-photo"
              />
            ) : (
              <div className="actor-photo-placeholder">No photo</div>
            )}
          </Col>
          <Col md={8}>
            <h2 className="actor-name">{actor.name}</h2>
            {actor.birthday && <p><strong>Born:</strong> {actor.birthday}</p>}
            {actor.place_of_birth && <p><strong>Place of Birth:</strong> {actor.place_of_birth}</p>}
            {actor.biography && <p className="actor-biography">{actor.biography}</p>}
          </Col>
        </Row>

        <h3 className="actor-movies-title">Known For</h3>
        <Row className="g-3">
          {movies.map((m) => (
            <Col key={m.id} xs={6} md={3}>
              <Link to={`/film/${m.id}`} className="movie-card">
                {m.posterUrl ? (
                  <img src={m.posterUrl} alt={m.title} className="movie-card-img" />
                ) : (
                  <div className="movie-card-placeholder">No poster</div>
                )}
                <div className="movie-card-title">{m.title}</div>
                {m.year && <div className="movie-card-year">{m.year}</div>}
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}
