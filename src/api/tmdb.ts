// src/api/tmdb.ts
import axios from "axios";
import type { Movie } from "../types/domains";
import type { MovieTMDB, TMDBCastItem } from "../types/tmdb";
import { mapMovie } from "./mapper";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: { api_key: import.meta.env.VITE_TMDB_API_KEY },
});

type FR = "fr-CA" | "fr-FR";
type EN = "en-US";

function isEmptyText(v?: string | null) {
  return !v || v.trim().length === 0;
}

function isEssentialMissing(m?: MovieTMDB) {
  if (!m) return true;
  const missingOverview = isEmptyText(m.overview);
  const missingTagline = isEmptyText(m.tagline);
  const missingGenres = !m.genres || m.genres.length === 0;
  return missingOverview || missingTagline || missingGenres;
}

// --- CORRECTION : inclure videos dans le fetch ---
async function fetchMovieWithCredits(id: string, language: string) {
  const { data } = await api.get<MovieTMDB>(`/movie/${id}`, {
    params: {
      language,
      append_to_response: "credits,release_dates,videos", // <-- videos ajouté
    },
  });
  return data;
}

// Fusion FR + EN
function mergeMovieFRwithEN(fr: MovieTMDB, en: MovieTMDB): MovieTMDB {
  return {
    ...fr,
    title: fr.title || en.title,
    original_title: fr.original_title || en.original_title,
    tagline: fr.tagline || en.tagline,
    overview: fr.overview || en.overview,
    poster_path: fr.poster_path ?? en.poster_path,
    backdrop_path: fr.backdrop_path ?? en.backdrop_path,
    release_date: fr.release_date ?? en.release_date,
    genres: fr.genres?.length ? fr.genres : en.genres ?? [],
    vote_average: typeof fr.vote_average === "number" ? fr.vote_average : en.vote_average,
    credits: {
      id: fr.credits?.id ?? en.credits?.id ?? fr.id,
      cast: mergeCast(fr.credits?.cast ?? [], en.credits?.cast ?? []),
      crew: fr.credits?.crew ?? en.credits?.crew ?? [],
    },
    videos: fr.videos ?? en.videos ?? { results: [] }, // <-- vidéos fusionnées
  };
}

// Complète le cast FR avec EN
function mergeCast(frCast: TMDBCastItem[], enCast: TMDBCastItem[]): TMDBCastItem[] {
  const enById = new Map(enCast.map((c) => [c.id, c]));
  const completed = frCast.map((fr) => {
    const en = enById.get(fr.id);
    return {
      ...fr,
      name: fr.name || en?.name,
      character: fr.character || en?.character,
      profile_path: fr.profile_path ?? en?.profile_path,
      order: fr.order ?? en?.order,
    };
  });
  return completed.length > 0 ? completed : enCast;
}

/**
 * Récupère le film en FR, puis complète avec EN si besoin
 */
export async function getMovieWithCastFrThenCompleteWithEn(
  id: string,
  preferredFr: FR = "fr-CA"
): Promise<{
  movie: Movie;
  languageUsed: FR | EN | "fr+en";
  usedFallback: boolean;
  completed: { overview?: boolean; tagline?: boolean; genres?: boolean; cast?: boolean };
}> {
  const fr = await fetchMovieWithCredits(id, preferredFr);

  if (!isEssentialMissing(fr)) {
    return {
      movie: mapMovie(fr),
      languageUsed: preferredFr,
      usedFallback: false,
      completed: {},
    };
  }

  const en = await fetchMovieWithCredits(id, "en-US");
  const merged = mergeMovieFRwithEN(fr, en);

  const completed = {
    overview: isEmptyText(fr.overview) && !isEmptyText(en.overview),
    tagline: isEmptyText(fr.tagline) && !isEmptyText(en.tagline),
    genres: (!fr.genres?.length && en.genres?.length > 0) || false,
    cast: (!fr.credits?.cast?.length && en.credits?.cast?.length > 0) || false,
  };

  return {
    movie: mapMovie(merged),
    languageUsed: "fr+en",
    usedFallback: true,
    completed,
  };
}
