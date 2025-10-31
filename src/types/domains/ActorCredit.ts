export interface ActorCredit {
  id: number;
  name: string;
  character?: string;
  profileUrl?: string;  // URL Image profil
  order?: number;       // ordre d'apparition (tri TMDB)
}
