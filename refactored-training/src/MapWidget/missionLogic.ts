export type ScreenPoint = { x: number; y: number };
export type GeographicPoint = { longitude: number; latitude: number };

export type FieldNoteTarget = {
  id: string;
  longitude: number;
  latitude: number;
  clueArea: GeographicPoint;
  clue: string;
};

export type MissionScoreBreakdown = {
  basePoints: number;
  timeBonus: number;
  penalties: number;
  total: number;
};

export const MISSION_TARGET_COUNT = 3;

export const FIELD_NOTE_LOCATIONS: FieldNoteTarget[] = [
  {
    id: 'oslo-central-station',
    longitude: 10.7522,
    latitude: 59.9111,
    clueArea: { longitude: 10.72, latitude: 59.926 },
    clue: 'Look near the main railway station on the east side of the city center.',
  },
  {
    id: 'vigeland-park',
    longitude: 10.701652,
    latitude: 59.92659,
    clueArea: { longitude: 10.723, latitude: 59.944 },
    clue: 'Search the sculpture park in the western part of the city.',
  },
  {
    id: 'ekeberg-park',
    longitude: 10.7596363,
    latitude: 59.898599,
    clueArea: { longitude: 10.735, latitude: 59.918 },
    clue: 'Climb to the hillside sculpture park southeast of the center.',
  },
  {
    id: 'holmenkollen',
    longitude: 10.6695,
    latitude: 59.9637,
    clueArea: { longitude: 10.642, latitude: 59.939 },
    clue: 'Head uphill to the famous ski jump above the city.',
  },
  {
    id: 'botanical-garden',
    longitude: 10.7713,
    latitude: 59.9186,
    clueArea: { longitude: 10.745, latitude: 59.937 },
    clue: 'Find the green garden near the museums in Tøyen.',
  },
  {
    id: 'fornebu-park',
    longitude: 10.6154924,
    latitude: 59.8966338,
    clueArea: { longitude: 10.647, latitude: 59.914 },
    clue: 'Explore the park on the former airport peninsula.',
  },
  {
    id: 'sandvika-town-square',
    longitude: 10.525,
    latitude: 59.8905,
    clueArea: { longitude: 10.548, latitude: 59.91 },
    clue: 'Find the public town square in Sandvika, west of Oslo.',
  },
  {
    id: 'lysaker-station',
    longitude: 10.6369779,
    latitude: 59.9134453,
    clueArea: { longitude: 10.66, latitude: 59.934 },
    clue: 'Search by the busy station between Oslo and Bærum.',
  },
  {
    id: 'baerums-verk',
    longitude: 10.5051,
    latitude: 59.9463,
    clueArea: { longitude: 10.534, latitude: 59.968 },
    clue: 'Find the old ironworks village northwest of Sandvika.',
  },
  {
    id: 'asker-station',
    longitude: 10.4344797,
    latitude: 59.8334885,
    clueArea: { longitude: 10.462, latitude: 59.856 },
    clue: 'Search around the railway station in Asker.',
  },
  {
    id: 'ski-station',
    longitude: 10.8342804,
    latitude: 59.7190333,
    clueArea: { longitude: 10.862, latitude: 59.741 },
    clue: 'Head south to the station in the town of Ski.',
  },
  {
    id: 'drobak-square',
    longitude: 10.629,
    latitude: 59.663,
    clueArea: { longitude: 10.658, latitude: 59.684 },
    clue: 'Look in the town center at the southern end of the fjord.',
  },
  {
    id: 'lillestrom-station',
    longitude: 11.0451526,
    latitude: 59.9534148,
    clueArea: { longitude: 11.079, latitude: 59.978 },
    clue: 'Find the station northeast of Oslo, beside the river.',
  },
  {
    id: 'toyens-park',
    longitude: 10.7776971,
    latitude: 59.9199446,
    clueArea: { longitude: 10.746, latitude: 59.935 },
    clue: 'Search the park just east of the city center.',
  },
];

export const BERGEN_NOTE_LOCATIONS: FieldNoteTarget[] = [
  {
    id: 'bergen-station',
    longitude: 5.3333972,
    latitude: 60.390279,
    clueArea: { longitude: 5.31, latitude: 60.41 },
    clue: 'Find Bergen\'s central railway station beside the old city center.',
  },
  {
    id: 'bergen-bryggen',
    longitude: 5.3229328,
    latitude: 60.397725,
    clueArea: { longitude: 5.29, latitude: 60.41 },
    clue: 'Search the historic wooden wharf along the harbor.',
  },
  {
    id: 'bergenhus-fortress',
    longitude: 5.3178547,
    latitude: 60.4001102,
    clueArea: { longitude: 5.35, latitude: 60.418 },
    clue: 'Head to the old fortress overlooking the harbor.',
  },
  {
    id: 'bergen-floibanen',
    longitude: 5.3291305,
    latitude: 60.3966916,
    clueArea: { longitude: 5.30, latitude: 60.375 },
    clue: 'Find the lower station of the mountain funicular.',
  },
  {
    id: 'bergen-nygardsparken',
    longitude: 5.3284239,
    latitude: 60.383895,
    clueArea: { longitude: 5.36, latitude: 60.402 },
    clue: 'Look in the large public park south of the city center.',
  },
  {
    id: 'bergen-fish-market',
    longitude: 5.324236,
    latitude: 60.394678,
    clueArea: { longitude: 5.36, latitude: 60.376 },
    clue: 'Search the open-air fish market by the harbor.',
  },
];

export type LocationPackId = 'oslofjord' | 'bergen';

export type FieldNoteLocationPack = {
  id: LocationPackId;
  name: string;
  center: GeographicPoint;
  zoom: number;
  locations: FieldNoteTarget[];
};

export const FIELD_NOTE_LOCATION_PACKS: Record<LocationPackId, FieldNoteLocationPack> = {
  oslofjord: {
    id: 'oslofjord',
    name: 'Oslofjord',
    center: { longitude: 10.7, latitude: 59.9 },
    zoom: 9,
    locations: FIELD_NOTE_LOCATIONS,
  },
  bergen: {
    id: 'bergen',
    name: 'Bergen',
    center: { longitude: 5.324, latitude: 60.391 },
    zoom: 13,
    locations: BERGEN_NOTE_LOCATIONS,
  },
};

export const TARGET_HIT_RADIUS = 36;
export const MISSION_BEST_SCORE_KEY = 'field-investigator-best-score';
export const GIVE_UP_SCORE_PENALTY = 50;
export const MISSION_DIFFICULTIES = {
  relaxed: {
    label: 'Relaxed',
    hitRadius: 50,
    hintAfterMisses: 2,
    hintPenalty: 10,
    timeBonusMultiplier: 0.5,
  },
  standard: {
    label: 'Standard',
    hitRadius: TARGET_HIT_RADIUS,
    hintAfterMisses: 3,
    hintPenalty: 25,
    timeBonusMultiplier: 1,
  },
  expert: {
    label: 'Expert',
    hitRadius: 24,
    hintAfterMisses: 4,
    hintPenalty: 40,
    timeBonusMultiplier: 1.5,
  },
} as const;

export type MissionDifficulty = keyof typeof MISSION_DIFFICULTIES;
export const DEFAULT_MISSION_DIFFICULTY: MissionDifficulty = 'standard';
const EARTH_RADIUS_METERS = 6_371_000;

export function createMissionTargets(
  random: () => number = Math.random,
  previousTargetIds: readonly string[] = [],
  locations: FieldNoteTarget[] = FIELD_NOTE_LOCATIONS
): FieldNoteTarget[] {
  const shuffledLocations = [...locations];

  for (let index = shuffledLocations.length - 1; index > 0; index--) {
    const swapIndex = Math.min(index, Math.floor(random() * (index + 1)));
    [shuffledLocations[index], shuffledLocations[swapIndex]] =
      [shuffledLocations[swapIndex], shuffledLocations[index]];
  }

  const targets = shuffledLocations.slice(0, MISSION_TARGET_COUNT);
  const previousIds = new Set(previousTargetIds);
  const repeatsPreviousSet = previousIds.size === targets.length &&
    targets.every(target => previousIds.has(target.id));

  if (repeatsPreviousSet) {
    const replacement = shuffledLocations.find(target => !previousIds.has(target.id));
    if (replacement) targets[0] = replacement;
  }

  return targets;
}

export function isWithinHitRadius(
  clickPoint: ScreenPoint,
  targetPoint: ScreenPoint,
  radius = TARGET_HIT_RADIUS
): boolean {
  return Math.hypot(clickPoint.x - targetPoint.x, clickPoint.y - targetPoint.y) <= radius;
}

export function calculateMissionScore(
  foundCount: number,
  elapsedSeconds: number,
  penalty = 0,
  timeBonusMultiplier = 1
): number {
  return calculateMissionScoreBreakdown(foundCount, elapsedSeconds, penalty, timeBonusMultiplier).total;
}

export function calculateMissionScoreBreakdown(
  foundCount: number,
  elapsedSeconds: number,
  penalty = 0,
  timeBonusMultiplier = 1
): MissionScoreBreakdown {
  const basePoints = Math.max(0, foundCount) * 100;
  const timeBonus = Math.round(
    Math.max(0, 180 - Math.max(0, elapsedSeconds) * 2) * Math.max(0, timeBonusMultiplier)
  );
  const penalties = Math.max(0, penalty);

  return {
    basePoints,
    timeBonus,
    penalties,
    total: Math.max(0, basePoints + timeBonus - penalties),
  };
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

export function getCompassDirection(from: GeographicPoint, to: GeographicPoint): string {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const y = Math.sin(longitudeDifference) * Math.cos(toLatitude);
  const x = Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDifference);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];

  return directions[Math.round(bearing / 45) % directions.length];
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}