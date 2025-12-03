import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/category.css";
import { discoverMovies, searchMulti, getPersonMovieCredits, type MovieCard } from "../api/tmdb";

const RESULTS_PER_PAGE = 16;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; movies: MovieCard[]; totalPages: number; page: number; query?: string };

// ==================== GENRES ====================

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

// ==================== SORT OPTIONS ====================

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Titles (from A to Z)", value: "original_title.asc" },
  { label: "Titles (from Z to A)", value: "original_title.desc" },
  { label: "Popularity - / +", value: "popularity.asc" },
  { label: "Popularity + / -", value: "popularity.desc" },
  { label: "Rating - / +", value: "vote_average.asc" },
  { label: "Rating + / -", value: "vote_average.desc" },
  { label: "Release Dates - / +", value: "release_date.asc" },
  { label: "Release Dates + / -", value: "release_date.desc" },
];

// ==================== MAIN COMPONENT ====================

export default function Category() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const discoverParams = useMemo(() => {
    const p: Record<string, any> = {
      sort_by: sortBy,
      page,
      with_watch_monetization_types: "flatrate",
    };
    if (selectedGenres.length > 0) p.with_genres = selectedGenres.join(",");
    if (dateFrom) p["primary_release_date.gte"] = dateFrom;
    if (dateTo) p["primary_release_date.lte"] = dateTo;
    return p;
  }, [sortBy, page, selectedGenres, dateFrom, dateTo]);

  useEffect(() => {
    let mounted = true;

    async function loadDefault() {
      setState({ status: "loading" });
      try {
        const { movies, totalPages } = await discoverMovies({
          sort_by: "popularity.desc",
          page,
        });

        if (!mounted) return;

        const limitedMovies = movies.slice(0, RESULTS_PER_PAGE);
        setState({
          status: "success",
          movies: limitedMovies,
          totalPages,
          page,
        });
      } catch (e) {
        if (!mounted) return;
        setState({ status: "error", error: String(e) });
      }
    }

    // Si on a un terme de recherche, on ne fait rien ici
    if (searchTerm) {
      return;
    }

    const noFilters =
      selectedGenres.length === 0 &&
      !dateFrom &&
      !dateTo &&
      (sortBy === "popularity.desc" || !sortBy);

    if (noFilters) {
      loadDefault();
    } else {
      fetchDiscover();
    }

    async function fetchDiscover() {
      setState({ status: "loading" });
      try {
        const { movies, totalPages } = await discoverMovies(discoverParams);
        if (!mounted) return;
        setState({ status: "success", movies, totalPages, page });
      } catch (e) {
        if (!mounted) return;
        setState({ status: "error", error: String(e) });
      }
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, selectedGenres, dateFrom, dateTo, sortBy]);

  // ==================== SEARCH FUNCTION ====================

  async function handleSearchSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const q = query.trim();
    setPage(1);

    if (!q) {
      setSearchTerm(undefined);
      return;
    }

    setSearchTerm(q);
    setState({ status: "loading" });

    try {
      const { movies: searchResults, personId } = await searchMulti(q, 1);

      // Fonction pour scorer la pertinence
      const scoreMovie = (movie: MovieCard, searchQuery: string) => {
        const title = (movie.title || "").toLowerCase();
        const search = searchQuery.toLowerCase();
        let score = 0;

        if (title === search) score += 1000;
        else if (title.startsWith(search)) score += 500;
        else if (title.includes(search)) score += 100;

        const year = parseInt(movie.year || "0");
        if (year >= 2020) score += 50;
        else if (year >= 2010) score += 30;
        else if (year >= 2000) score += 10;

        return score;
      };

      // Trier par pertinence
      const sortedMovies = searchResults.sort((a, b) => {
        return scoreMovie(b, q) - scoreMovie(a, q);
      });

      // Si on a des films, les afficher
      if (sortedMovies.length > 0) {
        const movies = sortedMovies.slice(0, RESULTS_PER_PAGE);
        setState({
          status: "success",
          movies,
          totalPages: Math.ceil(sortedMovies.length / RESULTS_PER_PAGE),
          page: 1,
          query: q,
        });
        return;
      }

      // Sinon, si c'est une personne, afficher ses films
      if (personId) {
        const personMovies = await getPersonMovieCredits(personId);
        const movies = personMovies.slice(0, RESULTS_PER_PAGE);
        setState({
          status: "success",
          movies,
          totalPages: 1,
          page: 1,
        });
        return;
      }

      // Aucun résultat
      setState({
        status: "success",
        movies: [],
        totalPages: 1,
        page: 1,
      });
    } catch (e) {
      setState({ status: "error", error: String(e) });
    }
  }

  function toggleGenre(id: number) {
    setPage(1);
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function goToPage(p: number) {
    if (p < 1) return;
    setPage(p);
  }

  if (state.status === "error") {
    return (
      <div className="category-page">
        <Container className="mt-3">
          <div className="error-alert">Error: {state.error}</div>
        </Container>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return <CategorySkeleton />;
  }

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
          <Col md={3}>
            <SortPanel
              isOpen={isSortOpen}
              onToggle={() => setIsSortOpen((s) => !s)}
              sortBy={sortBy}
              onSortChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
            />

            <FilterPanel
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen((s) => !s)}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(value) => {
                setDateFrom(value || undefined);
                setPage(1);
              }}
              onDateToChange={(value) => {
                setDateTo(value || undefined);
                setPage(1);
              }}
              selectedGenres={selectedGenres}
              onToggleGenre={toggleGenre}
            />
          </Col>

          <Col md={9}>
            <ResultsHeader query={state && (state as any).query} count={movies.length} />

            <PostersGrid movies={movies} />

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={goToPage} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

// ==================== SUBCOMPONENTS ====================

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
    <form onSubmit={onSubmit} className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder ?? "Search by movie, series or actor"}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}

function SortPanel({
  isOpen,
  onToggle,
  sortBy,
  onSortChange,
}: {
  isOpen: boolean;
  onToggle: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}) {
  return (
    <div className="panel-wrapper mb-3">
      <div className="panel-header" onClick={onToggle}>
        <div>Sort by</div>
        <div className={`panel-arrow ${isOpen ? "open" : ""}`}>▾</div>
      </div>

      {isOpen && (
        <div className="panel-content mt-3">
          {SORT_OPTIONS.map((s) => (
            <div
              key={s.value}
              onClick={() => onSortChange(s.value)}
              className={`sort-option ${sortBy === s.value ? "active" : ""}`}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  isOpen,
  onToggle,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedGenres,
  onToggleGenre,
}: {
  isOpen: boolean;
  onToggle: () => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  selectedGenres: number[];
  onToggleGenre: (id: number) => void;
}) {
  return (
    <div className="panel-wrapper">
      <div className="panel-header" onClick={onToggle}>
        <div>Filter</div>
        <div className={`panel-arrow ${isOpen ? "open" : ""}`}>▾</div>
      </div>

      {isOpen && (
        <div className="panel-content mt-3">
          <div className="filter-section mb-3">
            <div className="filter-label mb-2">Release dates</div>

            <div className="date-input-group">
              <span className="date-label">From</span>
              <input
                type="date"
                className="date-input"
                value={dateFrom ?? ""}
                onChange={(e) => onDateFromChange(e.target.value)}
              />
            </div>

            <div className="date-input-group mt-2">
              <span className="date-label">To</span>
              <input
                type="date"
                className="date-input"
                value={dateTo ?? ""}
                onChange={(e) => onDateToChange(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-label mb-2">Categories</div>
            <div className="genres-grid">
              {GENRES.map((g) => (
                <div
                  key={g.id}
                  onClick={() => onToggleGenre(g.id)}
                  className={`genre-tag ${selectedGenres.includes(g.id) ? "active" : ""}`}
                >
                  {g.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsHeader({ query, count }: { query?: string; count: number }) {
  return (
    <div className="results-header mb-3">
      <div className="results-title">
        {query ? (
          <>
            Results for <strong>{query}</strong>
          </>
        ) : (
          "Discover"
        )}
      </div>
      <div className="results-count">{count} results</div>
    </div>
  );
}

function PostersGrid({ movies }: { movies: MovieCard[] }) {
  if (!movies || movies.length === 0) {
    return <div className="no-results">No results</div>;
  }

  return (
    <Row className="g-3">
      {movies.map((m) => (
        <Col key={m.id} xs={6} md={3}>
          <MovieCardComponent movie={m} />
        </Col>
      ))}
    </Row>
  );
}

function MovieCardComponent({ movie }: { movie: MovieCard }) {
  return (
    <Link to={`/film/${movie.id}`} className="movie-card">
      <div className="movie-card-image">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} />
        ) : (
          <div className="movie-card-placeholder">
            <span>No poster</span>
          </div>
        )}

        <div className="movie-card-overlay">
          <div className="movie-card-title">{movie.title}</div>
          <div className="movie-card-year">{movie.year}</div>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="pagination mt-4">
      <button
        className="pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Prev
      </button>
      <div className="pagination-current">{currentPage}</div>
      <button
        className="pagination-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="category-page">
      <Container className="mt-3">
        <div className="skeleton skeleton-search" />

        <Row className="mt-3">
          <Col md={3}>
            <div className="skeleton skeleton-panel mb-3" />
            <div className="skeleton skeleton-panel" />
          </Col>

          <Col md={9}>
            <div className="skeleton skeleton-header mb-3" />

            <Row className="g-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Col key={i} xs={6} md={3}>
                  <div className="skeleton skeleton-card" />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
