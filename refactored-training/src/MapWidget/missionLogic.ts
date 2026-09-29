export type ScreenPoint = { x: number; y: number };
export type GeographicPoint = { longitude: number; latitude: number };

export type FieldNoteTarget = {
  id: string;
  longitude: number;
  latitude: number;
  clue: string;
};

export const FIELD_NOTE_TARGETS: FieldNoteTarget[] = [
  {
    id: 'old-harbor',
    longitude: 10.7272,
    latitude: 59.9091,
    clue: 'Look for the old harbor where the city meets the fjord.',
  },
  {
    id: 'island-crossing',
    longitude: 10.7419,
    latitude: 59.891,
    clue: 'Cross to the island just south of the harbor.',
  },
  {
    id: 'peninsula-tip',
    longitude: 10.649,
    latitude: 59.862,
    clue: 'Head across the fjord to the peninsula\'s northern tip.',
  },
];

export const TARGET_HIT_RADIUS = 36;
export const MISSION_BEST_SCORE_KEY = 'field-investigator-best-score';
const EARTH_RADIUS_METERS = 6_371_000;

export function isWithinHitRadius(
  clickPoint: ScreenPoint,
  targetPoint: ScreenPoint,
  radius = TARGET_HIT_RADIUS
): boolean {
  return Math.hypot(clickPoint.x - targetPoint.x, clickPoint.y - targetPoint.y) <= radius;
}

export function calculateMissionScore(foundCount: number, elapsedSeconds: number): number {
  const baseScore = Math.max(0, foundCount) * 100;
  const timeBonus = Math.max(0, 180 - Math.max(0, elapsedSeconds) * 2);
  return baseScore + timeBonus;
}

export function getNearestTargetDistanceMeters(
  location: GeographicPoint,
  targets: GeographicPoint[]
): number | null {
  if (targets.length === 0) return null;

  const latitudeRadians = toRadians(location.latitude);
  const targetDistances = targets.map(target => {
    const latitudeDifference = toRadians(target.latitude - location.latitude);
    const longitudeDifference = toRadians(target.longitude - location.longitude);
    const haversine =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(latitudeRadians) * Math.cos(toRadians(target.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
  });

  return Math.min(...targetDistances);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}