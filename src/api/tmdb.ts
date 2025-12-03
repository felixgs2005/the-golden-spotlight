import axios from "axios";
import type { Movie } from "../types/domains";
import type { MovieTMDB } from "../types/tmdb";
import { mapMovie } from "./mapper";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: { api_key: import.meta.env.VITE_TMDB_API_KEY },
});

const DEFAULT_LANGUAGE = "en-US";

// ==================== MOVIE CARD TYPE ====================
export type MovieCard = {
  id: number;
  title: string;
  posterUrl?: string;
  year?: string;
};

// ==================== HELPER: BUILD IMAGE URL ====================
export function buildImageUrl(
  path?: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342"
): string | undefined {
  if (!path) return undefined;

  // Assurer qu'il y a un slash au début
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
}

// ==================== HELPER: MAP TO MOVIE CARD ====================
function mapToMovieCard(item: any): MovieCard {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Untitled",
    posterUrl: buildImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.slice(0, 4) : "",
  };
}

// ==================== FILM DETAILS (existing) ====================
export async function getMovieWithDetails(id: string): Promise<Movie> {
  try {
    const [details, credits, videos, releaseDates, similar] = await Promise.all([
      api.get<MovieTMDB>(`/movie/${id}`, { params: { language: DEFAULT_LANGUAGE } }),
      api.get(`/movie/${id}/credits`, { params: { language: DEFAULT_LANGUAGE } }),
      api.get(`/movie/${id}/videos`, { params: { language: DEFAULT_LANGUAGE } }),
      api.get(`/movie/${id}/release_dates`),
      api.get(`/movie/${id}/similar`, { params: { language: DEFAULT_LANGUAGE } }),
    ]);

    const combinedData: MovieTMDB = {
      ...details.data,
      credits: credits.data,
      videos: videos.data,
      release_dates: releaseDates.data,
      similar: similar.data,
    };

    return mapMovie(combinedData);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
}

// ==================== HOME PAGE ====================
export async function getPopularMovies(): Promise<MovieCard[]> {
  const { data } = await api.get("/movie/popular", {
    params: { language: DEFAULT_LANGUAGE },
  });
  return (data.results ?? []).map(mapToMovieCard);
}

export async function getTrendingMovies(): Promise<MovieCard[]> {
  const { data } = await api.get("/trending/movie/week", {
    params: { language: DEFAULT_LANGUAGE },
  });
  return (data.results ?? []).map(mapToMovieCard);
}

export async function getTopRatedMovies(): Promise<MovieCard[]> {
  const { data } = await api.get("/movie/top_rated", {
    params: { language: DEFAULT_LANGUAGE },
  });
  return (data.results ?? []).map(mapToMovieCard);
}

export async function getPopularSeries(): Promise<MovieCard[]> {
  const { data } = await api.get("/tv/popular", {
    params: { language: DEFAULT_LANGUAGE },
  });
  return (data.results ?? []).map(mapToMovieCard);
}

// ==================== CATEGORY PAGE ====================
export async function discoverMovies(params: Record<string, any>): Promise<{
  movies: MovieCard[];
  totalPages: number;
}> {
  const { data } = await api.get("/discover/movie", {
    params: {
      language: DEFAULT_LANGUAGE,
      include_adult: false,
      ...params,
    },
  });

  return {
    movies: (data.results ?? []).map(mapToMovieCard),
    totalPages: data.total_pages ?? 1,
  };
}

export async function searchMulti(
  query: string,
  page = 1
): Promise<{
  movies: MovieCard[];
  personId?: number;
}> {
  const { data } = await api.get("/search/multi", {
    params: {
      language: DEFAULT_LANGUAGE,
      query,
      page,
      include_adult: false,
    },
  });

  const results = data.results ?? [];
  const movies = results.filter((r: any) => r.media_type === "movie").map(mapToMovieCard);
  const person = results.find((r: any) => r.media_type === "person");

  return {
    movies,
    personId: person?.id,
  };
}

export async function getPersonMovieCredits(personId: number): Promise<MovieCard[]> {
  const { data } = await api.get(`/person/${personId}/movie_credits`, {
    params: { language: DEFAULT_LANGUAGE },
  });

  return (data.cast ?? [])
    .map((item: any) => ({
      ...mapToMovieCard(item),
      year: item.release_date ? item.release_date.slice(0, 4) : "",
    }))
    .sort((a: any, b: any) => Number(b.year) - Number(a.year));
}

// ==================== ACTOR PROFILE ====================
export type ActorProfile = {
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

export async function getActorProfile(id: string): Promise<ActorProfile> {
  const { data } = await api.get(`/person/${id}`, {
    params: { language: DEFAULT_LANGUAGE },
  });
  return data;
}

export async function getActorMovies(id: string): Promise<MovieCard[]> {
  const { data } = await api.get(`/person/${id}/movie_credits`, {
    params: { language: DEFAULT_LANGUAGE },
  });

  return (data.cast ?? [])
    .map(mapToMovieCard)
    .filter((m: MovieCard) => m.posterUrl)
    .sort((a: any, b: any) => Number(b.year) - Number(a.year))
    .slice(0, 7);
}

export type SimilarActor = {
  id: number;
  name: string;
  profile_path?: string;
};

export async function getSimilarActors(id: string): Promise<SimilarActor[]> {
  const { data } = await api.get(`/person/${id}/movie_credits`, {
    params: { language: DEFAULT_LANGUAGE },
  });

  const allMovies = data.cast ?? [];
  const movieIds = allMovies.slice(0, 10).map((m: any) => m.id);

  // Fetch casts for top movies
  const castPromises = movieIds.map(async (movieId: number) => {
    try {
      const response = await api.get(`/movie/${movieId}/credits`);
      return response.data.cast || [];
    } catch {
      return [];
    }
  });

  const allCasts = await Promise.all(castPromises);

  // Count co-stars
  const coStarsMap = new Map<
    number,
    { id: number; name: string; profile_path: string | null; count: number }
  >();

  allCasts.forEach((cast: any[]) => {
    cast.slice(0, 10).forEach((member: any) => {
      if (member.id !== Number(id)) {
        const existing = coStarsMap.get(member.id);
        if (existing) {
          existing.count++;
        } else {
          coStarsMap.set(member.id, {
            id: member.id,
            name: member.name,
            profile_path: member.profile_path,
            count: 1,
          });
        }
      }
    });
  });

  return Array.from(coStarsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map(({ id, name, profile_path }) => ({ id, name, profile_path }));
}
