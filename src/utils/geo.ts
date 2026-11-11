/**
 * Geolocation utilities for Kumon Jambon GPS validation
 */

// Default GPS center for Kumon Jambon (Yogyakarta)
export const DEFAULT_KUMON_JAMBON_COORDS = {
  lat: -7.7691427,
  lng: 110.3548331,
  address: "Jl. Jambon, Ruko IBC No. 12 A-B, Yogyakarta",
  radiusMeters: 50,
};

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance into human readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Checks if current time is within tolerance (10:00 WIB start + 15 min tolerance)
 * Returns { isLate: boolean, lateMinutes: number, formattedCheckInTime: string }
 */
export function evaluateAttendanceTime(
  currentTime: Date,
  workStartTime: string = "10:00",
  gracePeriodMinutes: number = 15
): {
  isLate: boolean;
  lateMinutes: number;
  formattedCheckInTime: string;
  statusText: string;
} {
  const [startHour, startMin] = workStartTime.split(":").map(Number);
  
  // Create schedule cutoff targets for today
  const targetStartTime = new Date(currentTime);
  targetStartTime.setHours(startHour, startMin, 0, 0);

  const graceCutoffTime = new Date(currentTime);
  graceCutoffTime.setHours(startHour, startMin + gracePeriodMinutes, 0, 0);

  const hours = String(currentTime.getHours()).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");
  const formattedCheckInTime = `${hours}:${minutes}:${seconds} WIB`;

  if (currentTime.getTime() <= graceCutoffTime.getTime()) {
    // Within 10:15 WIB
    return {
      isLate: false,
      lateMinutes: 0,
      formattedCheckInTime,
      statusText: "Tepat Waktu",
    };
  } else {
    // Past 10:15 WIB
    const diffMs = currentTime.getTime() - targetStartTime.getTime();
    const lateMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return {
      isLate: true,
      lateMinutes,
      formattedCheckInTime,
      statusText: `Terlambat ${lateMinutes} Menit`,
    };
  }
}
