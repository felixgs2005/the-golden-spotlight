import type { Movie } from "../types/domains";
import type { MovieTMDB, TMDBCastItem } from "../types/tmdb";
import { buildImageUrl, buildProfileUrl, getYear } from "../utils/utils";
import type { ActorCredit } from "../types/domains/ActorCredit";

/** Transforme les données TMDB en format Movie utilisé dans ton app */
export function mapMovie(tmdb: MovieTMDB): Movie {
  const director = tmdb.credits?.crew?.find((c) => c.job === "Director")?.name ?? undefined;

  // Recherche la première bande-annonce YouTube
  const trailer =
    tmdb.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer")?.key ??
    undefined;

  return {
    id: tmdb.id,
    title: tmdb.title,
    originalTitle: tmdb.original_title,
    tagline: tmdb.tagline || undefined,
    overview: tmdb.overview || undefined,
    posterUrl: buildImageUrl(tmdb.poster_path, "w342"),
    backdropUrl: buildImageUrl(tmdb.backdrop_path, "w780"),
    releaseDate: tmdb.release_date || undefined,
    year: getYear(tmdb.release_date),
    genres: (tmdb.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    rating: typeof tmdb.vote_average === "number" ? tmdb.vote_average : undefined,
    runtime: tmdb.runtime || undefined,
    status: tmdb.status || undefined,
    originalLanguage: tmdb.original_language || undefined,
    cast: mapCast(tmdb.credits?.cast ?? []),
    director,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer}` : undefined,
    similar: mapSimilar(tmdb.similar?.results ?? []),
    ageRating: getAgeRating(tmdb, "CA"),
  };
}

/** Transforme la liste du cast TMDB en liste d’ActorCredit */
export function mapCast(cast: TMDBCastItem[]): ActorCredit[] {
  const sorted = [...cast].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).slice(0, 10);

  return sorted.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || undefined,
    profileUrl: buildProfileUrl(c.profile_path, "w185"),
    order: c.order,
  }));
}

/** Transforme les films similaires */
export function mapSimilar(similar: any[]): Movie[] {
  return similar.map((s) => ({
    id: s.id,
    title: s.title,
    posterUrl: buildImageUrl(s.poster_path, "w342"),
    year: getYear(s.release_date),
  }));
}

function getAgeRating(tmdb: MovieTMDB, country = "CA"): string | undefined {
  const releaseInfo = tmdb.release_dates?.results?.find(r => r.iso_3166_1 === country);
  if (!releaseInfo) return undefined;

  const cert = releaseInfo.release_dates?.[0]?.certification;
  return cert || undefined;
}
