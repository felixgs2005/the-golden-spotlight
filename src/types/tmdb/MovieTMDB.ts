export interface TMDBGenre {
  id: number;
  name: string;
}

// Calqué sur /movie/{id}
export interface MovieTMDB {
  id: number;
  title: string;               // localisé
  original_title: string;
  tagline?: string | null;
  overview?: string | null;
  poster_path?: string | null;   // "/abc.jpg"
  backdrop_path?: string | null; // "/xyz.jpg"
  release_date?: string | null;  // "YYYY-MM-DD"
  genres?: TMDBGenre[];          // présent sur /movie/{id}
  vote_average?: number;         // 0..10
}
