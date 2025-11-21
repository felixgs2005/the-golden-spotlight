import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Button, Placeholder, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/category.css";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const DEFAULT_LANGUAGE = "en-US";
const RESULTS_PER_PAGE = 16; // 4x4

type MovieCard = {
  id: number;
  title: string;
  posterUrl?: string;
  year?: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; movies: MovieCard[]; totalPages: number; page: number; query?: string };

function posterUrlFromPath(path?: string | null, size: "w342" | "w500" = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}

// Convert TMDB discover/movie results item to MovieCard
function mapDiscoverResult(item: any): MovieCard {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Untitled",
    posterUrl: posterUrlFromPath(item.poster_path),
    year: item.release_date ? item.release_date.slice(0, 4) : "",
  };
}

// Convert movie credit (actor credits) to MovieCard
function mapCreditToMovie(item: any): MovieCard {
  return {
    id: item.id,
    title: item.title ?? item.original_title ?? item.name ?? "Untitled",
    posterUrl: posterUrlFromPath(item.poster_path),
    year: item.release_date ? item.release_date.slice(0, 4) : "",
  };
}

// ----------------------- GENRES (ids used by TMDB) -----------------------
const GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 16, name: "Animation" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantastic" },
  { id: 10752, name: "War" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science-Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10770, name: "Telefilm" },
  { id: 37, name: "Western" },
];

// ----------------------- SORT OPTIONS -----------------------
const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Titles (from A to Z)", value: "original_title.asc" },
  { label: "Titles (from Z to A)", value: "original_title.desc" },
  { label: "Popularity + / -", value: "popularity.asc" },
  { label: "Popularity - / +", value: "popularity.desc" },
  { label: "Rating + / -", value: "vote_average.asc" },
  { label: "Rating - / +", value: "vote_average.desc" },
  { label: "Release Dates + / -", value: "release_date.asc" },
  { label: "Release Dates - / +", value: "release_date.desc" },
];

// ----------------------- API CALLS -----------------------
async function discoverMovies(params: Record<string, any>) {
  const resp = await axios.get(`${TMDB_BASE}/discover/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      language: DEFAULT_LANGUAGE,
      include_adult: false,
      ...params,
    },
  });
  return resp.data;
}

async function getPopularMovies(page = 1) {
  const resp = await axios.get(`${TMDB_BASE}/movie/popular`, {
    params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE, page },
  });
  return resp.data;
}

async function searchMulti(query: string, page = 1) {
  const resp = await axios.get(`${TMDB_BASE}/search/multi`, {
    params: {
      api_key: TMDB_API_KEY,
      language: DEFAULT_LANGUAGE,
      query,
      page,
      include_adult: false,
    },
  });
  return resp.data;
}

async function getPersonMovieCredits(personId: number) {
  const resp = await axios.get(`${TMDB_BASE}/person/${personId}/movie_credits`, {
    params: { api_key: TMDB_API_KEY, language: DEFAULT_LANGUAGE },
  });
  return resp.data;
}

// ----------------------- COMPONENT -----------------------
export default function Category() {
  const [state, setState] = useState<State>({ status: "idle" });

  // Search / filters state
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Build discover params memoized
  const discoverParams = useMemo(() => {
    const p: Record<string, any> = {
      sort_by: sortBy,
      page,
      with_watch_monetization_types: "flatrate", // optional
    };
    if (selectedGenres.length > 0) p.with_genres = selectedGenres.join(",");
    if (dateFrom) p["primary_release_date.gte"] = dateFrom;
    if (dateTo) p["primary_release_date.lte"] = dateTo;
    return p;
  }, [sortBy, page, selectedGenres, dateFrom, dateTo]);

  // Fetch default popular on mount or when no searchTerm
  useEffect(() => {
    let mounted = true;
    async function loadDefault() {
      setState({ status: "loading" });
      try {
        const data = await getPopularMovies(page);
        if (!mounted) return;
        const movies: MovieCard[] = (data.results ?? [])
          .slice(0, RESULTS_PER_PAGE)
          .map(mapDiscoverResult);
        const totalPages = Math.ceil((data.total_results ?? movies.length) / RESULTS_PER_PAGE);
        setState({ status: "success", movies, totalPages, page });
      } catch (e) {
        if (!mounted) return;
        setState({ status: "error", error: String(e) });
      }
    }

    // if there's no searchTerm and no filters applied -> show popular
    const noFilters =
      !searchTerm &&
      selectedGenres.length === 0 &&
      !dateFrom &&
      !dateTo &&
      (sortBy === "popularity.desc" || !sortBy);

    if (noFilters) {
      loadDefault();
    } else {
      // if filters exist but no explicit search term, call discover
      fetchDiscover();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, selectedGenres, dateFrom, dateTo, sortBy]);

  // Fetch discover helper
  async function fetchDiscover() {
    setState({ status: "loading" });
    try {
      const data = await discoverMovies({ ...discoverParams });
      const movies: MovieCard[] = (data.results ?? []).map(mapDiscoverResult);
      const totalPages = data.total_pages ?? 1;
      setState({ status: "success", movies, totalPages, page });
    } catch (e) {
      setState({ status: "error", error: String(e) });
    }
  }

  // Search handler (search multi)
  async function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    setPage(1);
    setSearchTerm(q || undefined);

    if (!q) {
      // clear search -> fallback to discover/popular (effect will trigger)
      setSearchTerm(undefined);
      return;
    }

    setState({ status: "loading" });

    try {
      const data = await searchMulti(q, 1);

      // If there is a person result EXACT match or first person result; prefer person if query looks like a name?
      // We'll look for first person in results; if present and there are no movie hits or user searched clearly actor name,
      // we fetch that person's movie credits. Behavior: if there are movie hits too, include them as well (movies first).
      const results: any[] = data.results ?? [];

      // Extract movie results
      const movieResults = results.filter((r) => r.media_type === "movie").map(mapDiscoverResult);

      // If there are person results and there are no (or few) movie results, fetch person's credits
      const personResult = results.find((r) => r.media_type === "person");

      if ((movieResults.length === 0 || movieResults.length < 4) && personResult) {
        const credits = await getPersonMovieCredits(personResult.id);
        // credits.cast is array of movies actor played in — map and sort by popularity / release_date
        const creditsMovies = (credits.cast ?? []).map(mapCreditToMovie).sort((a: any, b: any) => {
          // prefer more recent/popular — fallback to id
          return (b.year ?? 0) - (a.year ?? 0);
        });
        // unique by id
        const unique = Array.from(new Map(creditsMovies.map((m) => [m.id, m])).values());
        const movies = unique.slice(0, RESULTS_PER_PAGE);
        const totalPages = 1;
        setState({ status: "success", movies, totalPages, page: 1, query: q });
        return;
      }

      // Otherwise show movieResults; if not many movie results but person exists, append their credits
      let movies: MovieCard[] = movieResults;
      if (movies.length < RESULTS_PER_PAGE && personResult) {
        const credits = await getPersonMovieCredits(personResult.id);
        const creditsMovies = (credits.cast ?? []).map(mapCreditToMovie);
        const merged = [...movies, ...creditsMovies];
        // unique and slice
        const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
        movies = unique.slice(0, RESULTS_PER_PAGE);
      } else {
        movies = movies.slice(0, RESULTS_PER_PAGE);
      }

      setState({ status: "success", movies, totalPages: 1, page: 1, query: q });
    } catch (e) {
      setState({ status: "error", error: String(e) });
    }
  }

  // Toggle genre selection
  function toggleGenre(id: number) {
    setPage(1);
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  // Pagination handlers
  function goToPage(p: number) {
    if (p < 1) return;
    setPage(p);
  }

  // UI render
  if (state.status === "error") {
    return (
      <Container className="mt-3">
        <Alert variant="danger">Error: {state.error}</Alert>
      </Container>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return <CategorySkeleton />;
  }

  // success
  const { movies, totalPages } = state;

  return (
    <div className="category-page pb-5">
      <Container className="py-4">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Ex : Casablanca, Rita Hayworth"
        />

        <Row className="mt-3">
          {/* Left column: Sort + Filters */}
          <Col md={3}>
            <div style={{ marginBottom: "1rem" }}>
              <div
                className="p-3 rounded"
                style={{
                  background: "#3b0b0b",
                  border: "2px solid #f5d7b7",
                  borderRadius: 12,
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setIsSortOpen((s) => !s)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>Sort by</div>
                  <div style={{ transform: isSortOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
                </div>
              </div>

              {isSortOpen && (
                <div
                  className="p-3 mt-3"
                  style={{
                    background: "#3b0b0b",
                    border: "2px solid #f5d7b7",
                    borderRadius: 12,
                    color: "#f5d7b7",
                  }}
                >
                  {SORT_OPTIONS.map((s) => (
                    <div
                      key={s.value}
                      onClick={() => {
                        setSortBy(s.value);
                        setPage(1);
                      }}
                      style={{
                        padding: "0.45rem 0",
                        cursor: "pointer",
                        color: sortBy === s.value ? "#fff" : "#f5d7b7",
                        fontSize: "0.95rem",
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div
                className="p-3 rounded"
                style={{
                  background: "#3b0b0b",
                  border: "2px solid #f5d7b7",
                  borderRadius: 12,
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setIsFilterOpen((s) => !s)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>Filter</div>
                  <div style={{ transform: isFilterOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▾
                  </div>
                </div>
              </div>

              {isFilterOpen && (
                <div
                  className="p-3 mt-3"
                  style={{
                    background: "#3b0b0b",
                    border: "2px solid #f5d7b7",
                    borderRadius: 12,
                    color: "#f5d7b7",
                  }}
                >
                  {/* Release dates */}
                  <div className="mb-3">
                    <div className="mb-2">Release dates</div>
                    <div className="d-flex gap-2 align-items-center">
                      <div style={{ fontSize: 12, minWidth: 40 }}>From</div>
                      <Form.Control
                        type="date"
                        value={dateFrom ?? ""}
                        onChange={(e) => {
                          setDateFrom(e.target.value || undefined);
                          setPage(1);
                        }}
                        style={{ maxWidth: 150, background: "#fff" }}
                      />
                    </div>

                    <div className="d-flex gap-2 align-items-center mt-2">
                      <div style={{ fontSize: 12, minWidth: 40 }}>To</div>
                      <Form.Control
                        type="date"
                        value={dateTo ?? ""}
                        onChange={(e) => {
                          setDateTo(e.target.value || undefined);
                          setPage(1);
                        }}
                        style={{ maxWidth: 150, background: "#fff" }}
                      />
                    </div>
                  </div>

                  {/* Categories (genres) */}
                  <div>
                    <div className="mb-2">Categories</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {GENRES.map((g) => {
                        const active = selectedGenres.includes(g.id);
                        return (
                          <div
                            key={g.id}
                            onClick={() => toggleGenre(g.id)}
                            style={{
                              cursor: "pointer",
                              padding: "0.35rem 0.25rem",
                              color: active ? "#150804" : "#f5d7b7",
                              background: active ? "#f5d7b7" : "transparent",
                              borderRadius: 6,
                              fontSize: 14,
                              transition: "all 0.15s ease",
                            }}
                          >
                            {g.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* Right column: Grid */}
          <Col md={9}>
            <div
              className="mb-3"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ color: "#fff" }}>
                {state && (state as any).query ? (
                  <span>
                    Results for <strong style={{ color: "#f5d7b7" }}>{(state as any).query}</strong>
                  </span>
                ) : (
                  <span>Discover</span>
                )}
              </div>

              <div style={{ color: "#f5d7b7" }}>{movies.length} results</div>
            </div>

            <PostersGrid movies={movies} />

            <div className="mt-4 d-flex justify-content-center align-items-center gap-2">
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <div style={{ color: "#f5d7b7" }}>{page}</div>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= (totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

// ----------------------- SUB-COMPONENTS -----------------------

function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  placeholder,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  placeholder?: string;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="d-flex gap-2">
        <Form.Control
          placeholder={placeholder ?? "Search by movie, series or actor"}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </div>
    </form>
  );
}

function PostersGrid({ movies }: { movies: MovieCard[] }) {
  if (!movies || movies.length === 0) {
    return <div style={{ color: "#f5d7b7" }}>No results</div>;
  }

  return (
    <Row className="g-3">
      {movies.map((m) => (
        <Col key={m.id} xs={6} md={3}>
          <Link to={`/film/${m.id}`} className="text-decoration-none">
            <div
              style={{
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                minHeight: 1,
                background: "#222",
              }}
            >
              {m.posterUrl ? (
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", paddingTop: "150%", background: "#333" }}>
                  <div style={{ padding: 12, color: "#666" }}>No poster</div>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "0.5rem",
                  background: "linear-gradient(180deg, transparent, rgba(21,8,4,0.9))",
                  color: "#f5d7b7",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 12, color: "#f0d7b7", opacity: 0.9 }}>{m.year}</div>
              </div>
            </div>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

function CategorySkeleton() {
  return (
    <Container className="mt-3">
      <Placeholder as="div" animation="glow">
        <Placeholder xs={12} style={{ height: 56, borderRadius: 8 }} />
      </Placeholder>

      <Row className="mt-3">
        <Col md={3}>
          <Placeholder as="div" animation="glow" className="p-3" style={{ borderRadius: 12 }}>
            <Placeholder xs={12} style={{ height: 40 }} />
            <div className="mt-3">
              <Placeholder xs={12} style={{ height: 200 }} />
            </div>
          </Placeholder>
        </Col>

        <Col md={9}>
          <div>
            <Placeholder as="div" animation="glow">
              <Placeholder xs={8} />
            </Placeholder>
          </div>

          <Row className="g-3 mt-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Col key={i} xs={6} md={3}>
                <Placeholder as="div" animation="glow" style={{ height: 220, borderRadius: 8 }} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
