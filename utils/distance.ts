// utils/distance.ts — FootMatch
// Calcul de distance géodésique (formule de Haversine)
// Réutilisable par tout l'app, depuis App.tsx ou les screens

/**
 * Calcule la distance en kilomètres entre deux points GPS
 * en utilisant la formule de Haversine.
 *
 * @param lat1 Latitude du point 1 (en degrés décimaux)
 * @param lon1 Longitude du point 1 (en degrés décimaux)
 * @param lat2 Latitude du point 2 (en degrés décimaux)
 * @param lon2 Longitude du point 2 (en degrés décimaux)
 * @returns Distance en km, arrondie à 1 décimale
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/**
 * Trie un tableau d'objets par distance croissante depuis un point GPS.
 * Les objets sans coordonnées GPS valides sont relégués en fin de liste.
 *
 * @param items       Tableau d'objets à trier
 * @param userLat     Latitude de l'utilisateur
 * @param userLon     Longitude de l'utilisateur
 * @param getCoords   Fonction qui extrait { latitude, longitude } d'un item
 * @returns Nouveau tableau trié par distance croissante
 */
export function sortByProximity<T>(
  items: T[],
  userLat: number,
  userLon: number,
  getCoords: (item: T) => { latitude?: number | null; longitude?: number | null },
): T[] {
  return [...items].sort((a, b) => {
    const ca = getCoords(a);
    const cb = getCoords(b);
    const hasA = ca.latitude != null && ca.longitude != null;
    const hasB = cb.latitude != null && cb.longitude != null;
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1;
    if (!hasB) return -1;
    const distA = haversineDistance(userLat, userLon, ca.latitude!, ca.longitude!);
    const distB = haversineDistance(userLat, userLon, cb.latitude!, cb.longitude!);
    return distA - distB;
  });
}

/** Coordonnées de Perpignan (fallback si géolocalisation inactive) */
export const PERPIGNAN_COORDS = { latitude: 42.6977, longitude: 2.8956 };
