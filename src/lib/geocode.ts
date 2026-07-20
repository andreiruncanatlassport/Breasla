/**
 * Geocodare gratuita prin Nominatim (OpenStreetMap) — transforma o adresa
 * text in coordonate lat/lng, necesare pentru cautarea pe raza geografica.
 *
 * Politica de utilizare Nominatim: maxim 1 request/secunda, User-Agent obligatoriu.
 * Pentru volum mare (mii de firme), ia in calcul un provider platit (ex. Google
 * Geocoding API) — pentru cateva sute de firme, Nominatim e suficient si gratuit.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(
  adresa: string,
  localitate?: string | null,
  judet?: string | null
): Promise<GeocodeResult | null> {
  const query = [adresa, localitate, judet, "Romania"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ro&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim cere un User-Agent identificabil — inlocuieste cu domeniul tau real.
      "User-Agent": "ReteauaAC-App/1.0 (contact@domeniul-tau.ro)",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const results = await res.json();
  const first = results?.[0];
  if (!first) return null;

  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name,
  };
}
