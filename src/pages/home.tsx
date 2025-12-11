import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getComingSoon,
  type MovieCard,
} from "../api/tmdb";

// ========================== STATE TYPE ==========================

type HomeState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      popular: MovieCard[];
      trending: MovieCard[];
      topRated: MovieCard[];
      comingSoon: MovieCard[];
    }
  | { status: "error"; error: string };

// ========================== 3D CARD ==========================

function Home3DCard({ movie, position }: { movie: MovieCard; position: number }) {
  const [hover, setHover] = useState(false);

  const base: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    width: "14rem",
    height: "24rem",
    border: "3px solid #FFF0C4",
    transition: "0.45s ease",
    opacity: 0,
    overflow: "hidden",
  };

  const styleMap: Record<number, React.CSSProperties> = {
    1: {
      ...base,
      transform: "translateX(-50%) translateX(-420px) scale(0.78)",
      opacity: 1,
      zIndex: 1,
    },
    2: {
      ...base,
      transform: "translateX(-50%) translateX(-280px) scale(0.85)",
      opacity: 1,
      zIndex: 2,
    },
    3: {
      ...base,
      transform: "translateX(-50%) translateX(-140px) scale(0.92)",
      opacity: 1,
      zIndex: 3,
    },
    4: { ...base, transform: "translateX(-50%) scale(1)", opacity: 1, zIndex: 5 },
    5: {
      ...base,
      transform: "translateX(-50%) translateX(140px) scale(0.92)",
      opacity: 1,
      zIndex: 3,
    },
    6: {
      ...base,
      transform: "translateX(-50%) translateX(280px) scale(0.85)",
      opacity: 1,
      zIndex: 2,
    },
    7: {
      ...base,
      transform: "translateX(-50%) translateX(420px) scale(0.78)",
      opacity: 1,
      zIndex: 1,
    },
    0: { ...base, opacity: 0, transform: "scale(0.5)" },
  };

  const isCenter = position === 4;

  return (
    <Link
      to={`/film/${movie.id}`}
      style={{
        ...styleMap[position],
        pointerEvents: isCenter ? "auto" : "none",
        borderColor: isCenter && hover ? "#8C1007" : "#FFF0C4",
      }}
      onMouseEnter={() => isCenter && setHover(true)}
      onMouseLeave={() => isCenter && setHover(false)}
    >
      <img
        src={movie.posterUrl}
        alt={movie.title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {isCenter && (
        <div className={`home-full-overlay ${hover ? "visible" : ""}`}>
          <div className="home-overlay-text">
            <div className="home-overlay-title">{movie.title}</div>
            {movie.year && <div className="home-overlay-year">{movie.year}</div>}
          </div>
        </div>
      )}
    </Link>
  );
}

// ========================== CAROUSEL ==========================

function HomeCarousel3D({ title, movies }: { title: string; movies: MovieCard[] }) {
  const [startIndex, setStartIndex] = useState(0);

  const positions = [1, 2, 3, 4, 5, 6, 7];

  const prev = () => setStartIndex((prev) => (prev - 1 + movies.length) % movies.length);
  const next = () => setStartIndex((prev) => (prev + 1) % movies.length);

  return (
    <section className="similar-section py-5" style={{ background: "#150804" }}>
      <div className="container">
        <h2 className="mb-4">{title}</h2>

        <div className="carousel-3d-wrapper">
          <div className="carousel-3d-arrow" onClick={prev}>
            <i className="fa fa-angle-left" />
          </div>

          <div className="carousel-3d-container">
            {positions.map((pos, i) => {
              const movieIndex = (startIndex + i) % movies.length;
              return <Home3DCard key={i} movie={movies[movieIndex]} position={pos} />;
            })}
          </div>

          <div className="carousel-3d-arrow" onClick={next}>
            <i className="fa fa-angle-right" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================== PAGE HOME ==========================

export default function Home() {
  const [state, setState] = useState<HomeState>({ status: "idle" });

  useEffect(() => {
    let mounted = true;
    setState({ status: "loading" });

    async function load() {
      try {
        const [popular, trending, topRated, comingSoon] = await Promise.all([
          getPopularMovies(),
          getTrendingMovies(),
          getTopRatedMovies(),
          getComingSoon(),
        ]);

        if (!mounted) return;

        setState({
          status: "success",
          popular,
          trending,
          topRated,
          comingSoon,
        });
      } catch (e) {
        if (mounted) setState({ status: "error", error: String(e) });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.status !== "success") return <div>Loading...</div>;

  const { popular, trending, topRated, comingSoon } = state;

  const heroMovie = popular.length > 0 ? popular[0] : null;
  const heroImageUrl = heroMovie?.backdropUrl || heroMovie?.posterUrl || "";

  return (
    <div className="home-wrapper">
      {/* HERO */}
      <div className="home-container">
        <div className="section-hero">
          <img className="img-hero" src={heroImageUrl} alt={heroMovie?.title || ""} />
          {heroMovie && (
            <Link to={`/film/${heroMovie.id}`} className="play-button">
              <i className="fa fa-play"></i> Play
            </Link>
          )}
        </div>
      </div>

      {/* CAROUSEL SECTIONS */}
      <HomeCarousel3D title="Popular Movies" movies={popular} />
      <HomeCarousel3D title="Trending This Week" movies={trending} />
      <HomeCarousel3D title="Top Rated Movies" movies={topRated} />
      <HomeCarousel3D title="Coming Soon" movies={comingSoon} />
    </div>
  );
}
