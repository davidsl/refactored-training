export type ScreenPoint = { x: number; y: number };
export type GeographicPoint = { longitude: number; latitude: number };

export type FieldNoteTarget = {
  id: string;
  longitude: number;
  latitude: number;
  clue: string;
};

export const MISSION_TARGET_COUNT = 3;

export const FIELD_NOTE_LOCATIONS: FieldNoteTarget[] = [
  {
    id: 'oslo-central-station',
    longitude: 10.7522,
    latitude: 59.9111,
    clue: 'Look near the main railway station on the east side of the city center.',
  },
  {
    id: 'vigeland-park',
    longitude: 10.7005,
    latitude: 59.927,
    clue: 'Search the sculpture park in the western part of the city.',
  },
  {
    id: 'ekeberg-park',
    longitude: 10.7681,
    latitude: 59.9002,
    clue: 'Climb to the hillside sculpture park southeast of the center.',
  },
  {
    id: 'holmenkollen',
    longitude: 10.6695,
    latitude: 59.9637,
    clue: 'Head uphill to the famous ski jump above the city.',
  },
  {
    id: 'botanical-garden',
    longitude: 10.7713,
    latitude: 59.9186,
    clue: 'Find the green garden near the museums in Tøyen.',
  },
  {
    id: 'fornebu-park',
    longitude: 10.6205,
    latitude: 59.895,
    clue: 'Explore the park on the former airport peninsula.',
  },
  {
    id: 'sandvika-station',
    longitude: 10.525,
    latitude: 59.8905,
    clue: 'Look around the station in the town west of Oslo.',
  },
  {
    id: 'lysaker-station',
    longitude: 10.635,
    latitude: 59.913,
    clue: 'Search by the busy station between Oslo and Bærum.',
  },
  {
    id: 'baerums-verk',
    longitude: 10.5051,
    latitude: 59.9463,
    clue: 'Find the old ironworks village northwest of Sandvika.',
  },
  {
    id: 'asker-station',
    longitude: 10.434,
    latitude: 59.834,
    clue: 'Search around the railway station in Asker.',
  },
  {
    id: 'ski-station',
    longitude: 10.835,
    latitude: 59.719,
    clue: 'Head south to the station in the town of Ski.',
  },
  {
    id: 'drobak-square',
    longitude: 10.629,
    latitude: 59.663,
    clue: 'Look in the town center at the southern end of the fjord.',
  },
  {
    id: 'lillestrom-station',
    longitude: 11.05,
    latitude: 59.956,
    clue: 'Find the station northeast of Oslo, beside the river.',
  },
  {
    id: 'toyens-park',
    longitude: 10.774,
    latitude: 59.915,
    clue: 'Search the park just east of the city center.',
  },
];

export const TARGET_HIT_RADIUS = 36;
export const MISSION_BEST_SCORE_KEY = 'field-investigator-best-score';
const EARTH_RADIUS_METERS = 6_371_000;

export function createMissionTargets(random: () => number = Math.random): FieldNoteTarget[] {
  const shuffledLocations = [...FIELD_NOTE_LOCATIONS];

  for (let index = shuffledLocations.length - 1; index > 0; index--) {
    const swapIndex = Math.min(index, Math.floor(random() * (index + 1)));
    [shuffledLocations[index], shuffledLocations[swapIndex]] =
      [shuffledLocations[swapIndex], shuffledLocations[index]];
  }

  return shuffledLocations.slice(0, MISSION_TARGET_COUNT);
}

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