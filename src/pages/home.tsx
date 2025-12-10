import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import downtownAbbey from "../assets/images/series_poster/downtown_abbey.webp";
import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getPopularSeries,
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
      series: MovieCard[];
    }
  | { status: "error"; error: string };

// ========================== 3D CAROUSEL COMPONENT ==========================

function Home3DCard({ movie, position }: { movie: MovieCard; position: number }) {
  const base: any = {
    position: "absolute",
    left: "50%",
    width: "14rem",
    height: "24rem",
    border: "1px solid #FFF0C4",
    transition: "0.5s",
    opacity: 0,
  };

  const styleMap: Record<number, React.CSSProperties> = {
    1: {
      ...base,
      left: "20%",
      opacity: 1,
      transform: "scale(0.8) rotateY(-2deg)",
      zIndex: 1,
      filter: "blur(5px)",
    },
    2: {
      ...base,
      left: "35%",
      opacity: 1,
      transform: "scale(0.9) rotateY(-1deg)",
      zIndex: 2,
      filter: "blur(2px)",
    },
    3: {
      ...base,
      left: "50%",
      opacity: 1,
      transform: "scale(1)",
      zIndex: 4,
    },
    4: {
      ...base,
      left: "65%",
      opacity: 1,
      transform: "scale(0.9) rotateY(1deg)",
      zIndex: 2,
      filter: "blur(2px)",
    },
    5: {
      ...base,
      left: "80%",
      opacity: 1,
      transform: "scale(0.8) rotateY(2deg)",
      zIndex: 1,
      filter: "blur(5px)",
    },
    0: {
      ...base,
      opacity: 0,
      transform: "scale(0.6)",
    },
  };

  const style = styleMap[position];

  return (
    <Link to={`/film/${movie.id}`} style={style}>
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          style={{ width: "100%", height: "100%", border: "1px solid #FFF0C4", objectFit: "cover" }}
          onError={(e) => {
            console.error("Failed to load image:", movie.posterUrl);
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "25px",
            background: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          No Poster
        </div>
      )}

      {position === 3 && <div className="carousel-3d-title">{movie.title}</div>}
    </Link>
  );
}

function HomeCarousel3D({ title, movies }: { title: string; movies: MovieCard[] }) {
  const [positions, setPositions] = useState<number[]>([]);

  useEffect(() => {
    const center = Math.floor(movies.length / 2);
    const initial = movies.map((_, i) =>
      i === center - 2
        ? 1
        : i === center - 1
        ? 2
        : i === center
        ? 3
        : i === center + 1
        ? 4
        : i === center + 2
        ? 5
        : 0
    );
    setPositions(initial);
  }, [movies]);

  const prev = () => setPositions((p) => p.map((v) => (v === 0 ? 0 : v === 1 ? 5 : v - 1)));

  const next = () => setPositions((p) => p.map((v) => (v === 5 ? 1 : v === 0 ? 0 : v + 1)));

  return (
    <section className="similar-section py-5" style={{ background: "#150804" }}>
      <div className="container">
        <h2 className="mb-4">{title}</h2>

        <div className="carousel-3d-wrapper">
          <div className="carousel-3d-arrow" onClick={prev}>
            <i className="fa fa-angle-left" />
          </div>

          <div className="carousel-3d-container">
            {movies.map((movie, index) => (
              <Home3DCard key={movie.id} movie={movie} position={positions[index]} />
            ))}
            <div className="carousel-3d-fade" />
          </div>

          <div className="carousel-3d-arrow" onClick={next}>
            <i className="fa fa-angle-right" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================== SKELETON ==========================

function HomeSkeleton() {
  return <div style={{ padding: "120px", textAlign: "center", color: "#FFF0C4" }}>Loading...</div>;
}

// ========================== HOME PAGE COMPONENT ==========================

export default function Home() {
  const [state, setState] = useState<HomeState>({ status: "idle" });

  useEffect(() => {
    let mounted = true;
    setState({ status: "loading" });

    async function load() {
      try {
        const [popular, trending, topRated, series] = await Promise.all([
          getPopularMovies(),
          getTrendingMovies(),
          getTopRatedMovies(),
          getPopularSeries(),
        ]);

        if (!mounted) return;

        // DEBUG: Vérifier les URLs générées
        console.log("=== HOME DEBUG ===");
        console.log("Premier film populaire:", popular[0]);
        console.log("URL poster:", popular[0]?.posterUrl);
        console.log("Total films chargés:", {
          popular: popular.length,
          trending: trending.length,
          topRated: topRated.length,
          series: series.length,
        });

        setState({
          status: "success",
          popular,
          trending,
          topRated,
          series,
        });
      } catch (e) {
        console.error("Erreur chargement home:", e);
        if (mounted) setState({ status: "error", error: String(e) });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ========================== ERRORS & LOADING ==========================

  if (state.status === "loading" || state.status === "idle") return <HomeSkeleton />;
  if (state.status === "error") return <div>Error: {state.error}</div>;

  const { popular, trending, topRated, series } = state;

  // ========================== HERO MOVIE ==========================

  const heroMovie = {
    id: 820446,
    title: "Downton Abbey",
    posterUrl: downtownAbbey,
  };

  return (
    <div className="home-wrapper">
      {/* HERO */}
      <div className="home-container">
        <div className="section-hero">
          <img className="img-hero" src={heroMovie.posterUrl} alt={heroMovie.title} />
          <Link to={`/film/${heroMovie.id}`} className="play-button">
            <i className="fa fa-play"></i> Play
          </Link>
        </div>
      </div>

      {/* CAROUSEL SECTIONS */}
      <HomeCarousel3D title="Popular Movies" movies={popular} />
      <HomeCarousel3D title="Trending This Week" movies={trending} />
      <HomeCarousel3D title="Top Rated Movies" movies={topRated} />
      <HomeCarousel3D title="Popular Series" movies={series} />
    </div>
  );
}
