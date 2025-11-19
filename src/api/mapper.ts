// src/api/mapper.ts
import type { Movie } from "../types/domains";
import type { MovieTMDB, TMDBCastItem } from "../types/tmdb";
import type { ActorCredit } from "../types/domains/ActorCredit";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const VIDEO_TYPES_PRIORITY = ["Trailer", "Teaser", "Clip"] as const;

// ==================== CORE MAPPER ====================

export function mapMovie(tmdb: MovieTMDB): Movie {
  const director = tmdb.credits?.crew?.find((c) => c.job === "Director")?.name ?? undefined;
  const trailerKey = findBestTrailer(tmdb.videos?.results ?? []);
  const ageRating = extractAgeRating(tmdb, "US");

  return {
    id: tmdb.id,
    title: tmdb.title ?? tmdb.name ?? "",
    originalTitle: tmdb.original_title ?? tmdb.original_name,
    tagline: tmdb.tagline || undefined,
    overview: tmdb.overview || undefined,
    posterUrl: buildImageUrl(tmdb.poster_path, "w342"),
    backdropUrl: buildImageUrl(tmdb.backdrop_path, "w780"),
    releaseDate: tmdb.release_date || undefined,
    year: extractYear(tmdb.release_date),
    genres: (tmdb.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    rating: typeof tmdb.vote_average === "number" ? tmdb.vote_average : undefined,
    runtime: tmdb.runtime || undefined,
    status: tmdb.status || undefined,
    originalLanguage: tmdb.original_language || undefined,
    cast: mapCast(tmdb.credits?.cast ?? []),
    director,
    trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : undefined,
    similar: mapSimilar(tmdb.similar?.results ?? []),
    ageRating,
  };
}

// ==================== HELPERS FOR FILM DETAILS PAGE ====================

export function getMovieTitle(movie: Movie): string {
  return movie.title || "Untitled";
}

export function getMoviePosterUrl(movie: Movie): string | undefined {
  return movie.posterUrl;
}

export function getMovieBackdropUrl(movie: Movie): string | undefined {
  return movie.backdropUrl;
}

export function getFormattedReleaseDate(movie: Movie): string {
  return formatDate(movie.releaseDate);
}

export function getFormattedRuntime(movie: Movie): string {
  return formatRuntime(movie.runtime);
}

export function getMovieGenresText(movie: Movie): string {
  if (!movie.genres || movie.genres.length === 0) return "—";
  return movie.genres.map((g) => g.name).join(", ");
}

export function getMovieRating(movie: Movie): { stars: string; percentage: string } | null {
  if (typeof movie.rating !== "number") return null;

  const starsCount = Math.round(movie.rating / 2);
  const stars = "★".repeat(starsCount) + "☆".repeat(5 - starsCount);
  const percentage = Math.round(movie.rating * 10);

  return { stars, percentage: `${percentage}%` };
}

export function getMovieCastNames(movie: Movie, limit: number = 3): string {
  if (!movie.cast || movie.cast.length === 0) return "—";
  return movie.cast
    .slice(0, limit)
    .map((c) => c.name)
    .join(", ");
}

export function getMovieDirector(movie: Movie): string {
  return movie.director ?? "N/A";
}

export function getMovieStatus(movie: Movie): string {
  return movie.status ?? "—";
}

export function getMovieOriginalLanguage(movie: Movie): string {
  const code = movie.originalLanguage;
  if (!code) return "—";
  return getLanguageName(code);
}

// ==================== LANGUAGE MAPPING ====================

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: "English",
    fr: "French",
    es: "Spanish",
    de: "German",
    it: "Italian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    pt: "Portuguese",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    sv: "Swedish",
    no: "Norwegian",
    da: "Danish",
    fi: "Finnish",
    pl: "Polish",
    tr: "Turkish",
    th: "Thai",
    vi: "Vietnamese",
    id: "Indonesian",
    he: "Hebrew",
    cs: "Czech",
    hu: "Hungarian",
    ro: "Romanian",
    uk: "Ukrainian",
    el: "Greek",
    fa: "Persian",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    ur: "Urdu",
    ms: "Malay",
    ca: "Catalan",
    sr: "Serbian",
    hr: "Croatian",
    sk: "Slovak",
    bg: "Bulgarian",
    lt: "Lithuanian",
    lv: "Latvian",
    et: "Estonian",
    sl: "Slovenian",
    is: "Icelandic",
    ga: "Irish",
    cy: "Welsh",
    eu: "Basque",
    gl: "Galician",
    af: "Afrikaans",
    sq: "Albanian",
    am: "Amharic",
    hy: "Armenian",
    az: "Azerbaijani",
    be: "Belarusian",
    bs: "Bosnian",
    ka: "Georgian",
    kk: "Kazakh",
    km: "Khmer",
    ky: "Kyrgyz",
    lo: "Lao",
    mk: "Macedonian",
    mn: "Mongolian",
    my: "Burmese",
    ne: "Nepali",
    ps: "Pashto",
    si: "Sinhala",
    sw: "Swahili",
    tg: "Tajik",
    tk: "Turkmen",
    uz: "Uzbek",
    yi: "Yiddish",
    zu: "Zulu",
  };

  return languages[code.toLowerCase()] || code.toUpperCase();
}

export function getMovieAgeRating(movie: Movie): string | undefined {
  return movie.ageRating;
}

export function getTrailerUrl(movie: Movie): string | undefined {
  return movie.trailerUrl;
}

export function getTopCast(movie: Movie, limit: number = 5): ActorCredit[] {
  return movie.cast?.slice(0, limit) ?? [];
}

export function getSimilarMovies(movie: Movie, limit: number = 6): Movie[] {
  return movie.similar?.slice(0, limit) ?? [];
}

// ==================== INTERNAL MAPPING FUNCTIONS ====================

function mapCast(cast: TMDBCastItem[]): ActorCredit[] {
  const sorted = [...cast].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).slice(0, 10);

  return sorted.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || undefined,
    profileUrl: buildProfileUrl(c.profile_path),
    order: c.order,
  }));
}

function mapSimilar(similar: any[]): Movie[] {
  return similar.map((s) => ({
    id: s.id,
    title: s.title,
    posterUrl: buildImageUrl(s.poster_path, "w342"),
    year: extractYear(s.release_date),
  }));
}

// ==================== UTILITY FUNCTIONS ====================

function buildImageUrl(
  path?: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342"
): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

function buildProfileUrl(path?: string | null, size: "w185" | "w342" = "w185"): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso ?? "—";

  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRuntime(minutes?: number | null): string {
  if (!minutes || isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function extractYear(iso?: string | null): string {
  if (!iso) return "";
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}

function findBestTrailer(videos: any[]): string | undefined {
  if (!videos || videos.length === 0) return undefined;

  // Filter YouTube videos only
  const youtubeVideos = videos.filter((v) => v.site === "YouTube");
  if (youtubeVideos.length === 0) return undefined;

  // Search in priority order: Trailer -> Teaser -> Clip
  for (const type of VIDEO_TYPES_PRIORITY) {
    const video = youtubeVideos.find((v) => v.type === type);
    if (video) return video.key;
  }

  // Fallback to first YouTube video
  return youtubeVideos[0]?.key;
}

function extractAgeRating(tmdb: MovieTMDB, country: string = "US"): string | undefined {
  const releaseInfo = tmdb.release_dates?.results?.find((r: any) => r.iso_3166_1 === country);

  if (!releaseInfo) return undefined;

  const valid = releaseInfo.release_dates.find((r: any) => r.certification?.trim() !== "");

  return valid?.certification || undefined;
}
