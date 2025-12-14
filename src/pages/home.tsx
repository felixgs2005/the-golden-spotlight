import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import "../styles/carousel3d.css";

import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getComingSoon,
  type MovieCard,
} from "../api/tmdb";

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

function Home3DCard({
  movie,
  position,
  totalVisible,
}: {
  movie: MovieCard;
  position: number;
  totalVisible: number;
}) {
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
      <img src={movie.posterUrl} alt={movie.title} />

      {isCenter && (
        <div className={`carousel-card-overlay ${hover ? "visible" : ""}`}>
          <div className="carousel-overlay-title">{movie.title}</div>
          {movie.year && <div className="carousel-overlay-year">{movie.year}</div>}
        </div>
      )}
    </Link>
  );
}

// ========================== CAROUSEL ==========================

function HomeCarousel3D({ title, movies }: { title: string; movies: MovieCard[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCards = useCarouselSize();

  const positions = Array.from({ length: visibleCards }, (_, i) => i + 1);

  const prev = () => setStartIndex((prev) => (prev - 1 + movies.length) % movies.length);

  const next = () => setStartIndex((prev) => (prev + 1) % movies.length);

  return (
    <section className="carousel-section">
      <div className="carousel-shell">
        {/* TITLE */}
        <h2 className="carousel-title">{title}</h2>

        {/* ART DECO FRAME */}
        <div className="carousel-frame">
          <div className="corner-bottom"></div>

          <div className="carousel-frame-inner">
            <div className="carousel-3d-wrapper">
              {/* LEFT ARROW */}
              <button className="carousel-arrow left" onClick={prev} aria-label="Previous">
                <i className="fa fa-angle-left" />
              </button>

              {/* 3D CARDS */}
              <div className="carousel-3d-container">
                {positions.map((pos, i) => {
                  const movieIndex = (startIndex + i) % movies.length;
                  return (
                    <Home3DCard
                      key={i}
                      movie={movies[movieIndex]}
                      position={pos}
                      totalVisible={visibleCards}
                    />
                  );
                })}
              </div>

              {/* RIGHT ARROW */}
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
        if (mounted) {
          setState({ status: "error", error: String(e) });
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.status !== "success") return <div>Loading...</div>;

  const { popular, trending, topRated, comingSoon } = state;

  const heroMovie = popular[0];
  const heroImageUrl = heroMovie?.backdropUrl || heroMovie?.posterUrl || "";

  return (
    <div className="home-wrapper">
      {/* HERO */}
      <div className="home-container">
        <div className="section-hero">
          <div className="hero-inner">
            <img className="img-hero" src={heroImageUrl} alt={heroMovie?.title || ""} />

            {heroMovie && (
              <Link to={`/film/${heroMovie.id}`} className="play-button">
                <i className="fa fa-play"></i> Play
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CAROUSELS */}
      <HomeCarousel3D title="Popular Movies" movies={popular} />
      <HomeCarousel3D title="Trending This Week" movies={trending} />
      <HomeCarousel3D title="Top Rated Movies" movies={topRated} />
      <HomeCarousel3D title="Coming Soon" movies={comingSoon} />
    </div>
  );
}
