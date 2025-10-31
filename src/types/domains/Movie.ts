export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  year?: string;
  genres: Genre[];
  rating?: number;      // 0..10
  cast?: import("./ActorCredit").ActorCredit[]; // top 10 casting
}
