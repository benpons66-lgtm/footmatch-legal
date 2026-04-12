import { useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types';

interface UseLocationReturn {
  userLocation: Coordinates | null;
  locationDenied: boolean;
  requestLocation: () => Promise<boolean>;
  calcDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

export function useLocation(): UseLocationReturn {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  async function requestLocation(): Promise<boolean> {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;

      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setLocationDenied(true);
        return false;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationDenied(false);
      return true;
    } catch {
      return false;
    }
  }

  /** Formule de Haversine — retourne la distance en km arrondie à 0,1 */
  function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  return { userLocation, locationDenied, requestLocation, calcDistance };
}
