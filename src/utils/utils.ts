// URL image générique (posters/backdrops)
export function buildImageUrl(
  path?: string | null,
  size: "w185" | "w342" | "w500" | "original" = "w342"
) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

// URL image pour profils acteurs
export function buildProfileUrl(
  path?: string | null,
  size: "w185" | "w342" | "w500" | "original" = "w185"
) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

// ✅ Format date : 20/12/2024
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso ?? "—";
  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = y.toString();
  return `${day}/${month}/${year}`;
}

// ✅ Format durée : 2h 25m
export function formatRuntime(minutes?: number | null): string {
  if (!minutes || isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Récupération de l’année d’une date ISO
export function getYear(iso?: string | null): string {
  if (!iso) return "";
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}
