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

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso ?? "";
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
}

export function getYear(iso?: string | null) {
  if (!iso) return "";
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}
