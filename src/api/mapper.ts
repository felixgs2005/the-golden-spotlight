// src/api/mapper.ts
import type { Movie } from "../types/domains";
import type { MovieTMDB, TMDBCastItem } from "../types/tmdb";
import { buildImageUrl, buildProfileUrl, getYear } from "../utils/utils";
import type { ActorCredit } from "../types/domains/ActorCredit";

/** Transforme les données TMDB en format Movie utilisé dans ton app */
export function mapMovie(tmdb: MovieTMDB): Movie {
  const director = tmdb.credits?.crew?.find((c) => c.job === "Director")?.name ?? undefined;

  // --- Trailer robuste ---
  const trailer = tmdb.videos?.results?.find(
    (v) => v.site === "YouTube" && ["Trailer", "Teaser"].includes(v.type)
  )?.key;

  const ageRating = getAgeRating(tmdb, "CA");

  return {
    id: tmdb.id,
    title: (tmdb.title ?? tmdb.name) as string,
    originalTitle: (tmdb.original_title ?? tmdb.originalName) as any,
    tagline: tmdb.tagline || undefined,
    overview: tmdb.overview || undefined,
    posterUrl: buildImageUrl((tmdb as any).poster_path, "w342"),
    backdropUrl: buildImageUrl((tmdb as any).backdrop_path, "w780"),
    releaseDate: (tmdb as any).release_date || undefined,
    year: getYear((tmdb as any).release_date),
    genres: (tmdb.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    rating: typeof (tmdb as any).vote_average === "number" ? (tmdb as any).vote_average : undefined,
    runtime: tmdb.runtime || undefined,
    status: tmdb.status || undefined,
    originalLanguage: (tmdb as any).original_language || undefined,
    cast: mapCast((tmdb as any).credits?.cast ?? []),
    director,
    // --- lien vers YouTube ou recherche si aucun trailer ---
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer}` : undefined, // fallback géré dans FilmDetails.tsx
    similar: mapSimilar((tmdb as any).similar?.results ?? []),
    ageRating,
  };
}

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

export function mapSimilar(similar: any[]): Movie[] {
  return similar.map((s) => ({
    id: s.id,
    title: s.title,
    posterUrl: buildImageUrl(s.poster_path, "w342"),
    year: getYear(s.release_date),
  }));
}

function getAgeRating(tmdb: MovieTMDB, country = "CA"): string | undefined {
  const releaseInfo = (tmdb as any).release_dates?.results?.find(
    (r: any) => r.iso_3166_1 === country
  );
  if (!releaseInfo) return undefined;

  const valid = releaseInfo.release_dates.find((r: any) => r.certification?.trim() !== "");
  return valid?.certification || undefined;
}
