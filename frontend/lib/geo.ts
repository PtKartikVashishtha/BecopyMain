export interface UserLocation {
  lastFetch: any;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  accuracy: number; // in kilometers
}

export const getUserLocation = async (): Promise<UserLocation> => {
  try {
    // Primary API - ipapi.co
    const response = await fetch("https://ipapi.co/json/");

    if (response.ok) {
      const data = await response.json();

      if (data.country_name && data.latitude && data.longitude) {
        return {
          country: data.country_name || "Unknown",
          countryCode: data.country_code || "XX",
          region: data.region || "Unknown",
          city: data.city || "Unknown",
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          timezone: data.timezone || "UTC",
          isp: data.org || "Unknown",
          accuracy: 20,
        };
      }
    }

    // Fallback 1: ipwho.is (HTTPS & no CORS issues)
    const fallbackResponse = await fetch("https://ipwho.is/");
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      if (fallbackData && fallbackData.success !== false) {
        return {
          country: fallbackData.country || "Unknown",
          countryCode: fallbackData.country_code || "XX",
          region: fallbackData.region || "Unknown",
          city: fallbackData.city || "Unknown",
          latitude: fallbackData.latitude || 0,
          longitude: fallbackData.longitude || 0,
          timezone: fallbackData.timezone?.id || "UTC",
          isp: fallbackData.connection?.isp || "Unknown",
          accuracy: 50,
        };
      }
    }

    // Fallback 2: Browser geolocation (requires permission)
    if (typeof window !== "undefined" && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
          );
        });

        const { latitude, longitude, accuracy } = position.coords;

        return {
          country: "Unknown",
          countryCode: "XX",
          region: "Unknown",
          city: "Unknown",
          latitude,
          longitude,
          timezone: "UTC",
          isp: "Browser Location",
          accuracy: accuracy ? accuracy / 1000 : 5,
        };
      } catch (geoError) {
        console.warn("Browser geolocation failed:", geoError);
      }
    }

    // Final fallback (hard fail-safe)
    return {
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      city: "Unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      isp: "Unknown",
      accuracy: 1000,
    };
  } catch (error) {
    console.error("Failed to fetch user location:", error);
    return {
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      city: "Unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      isp: "Unknown",
      accuracy: 1000,
    };
  }
};

// Distance calculation using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if coordinates are within radius
export const isWithinRadius = (
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean => {
  if (!userLat || !userLon || !targetLat || !targetLon) return false;
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
};
