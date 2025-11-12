export interface TMDBGenre {
  id: number;
  name: string;
}

// Calqué sur /movie/{id}
export interface MovieTMDB {
  id: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  year?: number;
  genres?: { id: number; name: string }[];
  rating?: number;
  runtime?: number;
  status?: string;
  originalLanguage?: string;
  cast?: ActorCredit[];
  director?: string;
  trailerUrl?: string;
  similar?: Movie[];
  ageRating?: string;
}
