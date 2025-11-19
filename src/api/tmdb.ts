import axios from "axios";
import type { Movie } from "../types/domains";
import type { MovieTMDB } from "../types/tmdb";
import { mapMovie } from "./mapper";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: { api_key: import.meta.env.VITE_TMDB_API_KEY },
});

const DEFAULT_LANGUAGE = "en-US";

// ==================== SEPARATED FETCH FUNCTIONS ====================

async function fetchMovieDetails(id: string, language: string = DEFAULT_LANGUAGE) {
  const { data } = await api.get<MovieTMDB>(`/movie/${id}`, {
    params: { language },
  });
  return data;
}

async function fetchMovieCredits(id: string, language: string = DEFAULT_LANGUAGE) {
  const { data } = await api.get(`/movie/${id}/credits`, {
    params: { language },
  });
  return data;
}

async function fetchMovieVideos(id: string, language: string = DEFAULT_LANGUAGE) {
  const { data } = await api.get(`/movie/${id}/videos`, {
    params: { language },
  });
  return data;
}

async function fetchMovieReleaseDates(id: string) {
  const { data } = await api.get(`/movie/${id}/release_dates`);
  return data;
}

async function fetchSimilarMovies(id: string, language: string = DEFAULT_LANGUAGE) {
  const { data } = await api.get(`/movie/${id}/similar`, {
    params: { language },
  });
  return data;
}

// ==================== MAIN EXPORT FUNCTION ====================

export async function getMovieWithDetails(id: string): Promise<Movie> {
  try {
    // Fetch all data in parallel
    const [details, credits, videos, releaseDates, similar] = await Promise.all([
      fetchMovieDetails(id),
      fetchMovieCredits(id),
      fetchMovieVideos(id),
      fetchMovieReleaseDates(id),
      fetchSimilarMovies(id),
    ]);

    // Combine all data
    const combinedData: MovieTMDB = {
      ...details,
      credits,
      videos,
      release_dates: releaseDates,
      similar,
    };

    // Map to domain model
    return mapMovie(combinedData);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
}
