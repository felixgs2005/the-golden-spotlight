export interface TMDBCastItem {
  id: number;              // person id
  name: string;
  character?: string | null;
  profile_path?: string | null;
  order?: number | null;
  cast_id?: number;        // pas utilisé ici
  credit_id?: string;      // pas utilisé ici
}

export interface TMDBCredits {
  id: number;              // movie id
  cast: TMDBCastItem[];
}
