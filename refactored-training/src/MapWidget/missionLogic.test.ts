import { describe, expect, it } from 'vitest';
import {
  calculateMissionScore,
  createMissionTargets,
  FIELD_NOTE_LOCATIONS,
  formatDistance,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
  MISSION_TARGET_COUNT,
} from './missionLogic';

describe('isWithinHitRadius', () => {
  it('accepts clicks within the target radius, including the edge', () => {
    expect(isWithinHitRadius({ x: 10, y: 10 }, { x: 46, y: 10 })).toBe(true);
  });

  it('rejects clicks outside the target radius', () => {
    expect(isWithinHitRadius({ x: 10, y: 10 }, { x: 47, y: 10 })).toBe(false);
  });
});

describe('calculateMissionScore', () => {
  it('rewards a complete, fast investigation', () => {
    expect(calculateMissionScore(3, 30)).toBe(420);
  });

  it('never gives a negative time bonus', () => {
    expect(calculateMissionScore(3, 120)).toBe(300);
  });
});

describe('getNearestTargetDistanceMeters', () => {
  it('returns the distance to the nearest target', () => {
    const distance = getNearestTargetDistanceMeters(
      { longitude: 0, latitude: 0 },
      [
        { longitude: 1, latitude: 0 },
        { longitude: 0, latitude: 0.25 },
      ]
    );

    expect(distance).toBeCloseTo(27_798, -1);
  });

  it('returns null when no targets remain', () => {
    expect(getNearestTargetDistanceMeters({ longitude: 0, latitude: 0 }, [])).toBeNull();
  });
});

describe('formatDistance', () => {
  it('uses metres for nearby field notes', () => {
    expect(formatDistance(642.4)).toBe('642 m');
  });

  it('uses one decimal place for longer distances', () => {
    expect(formatDistance(2_456)).toBe('2.5 km');
  });
});

describe('createMissionTargets', () => {
  it('selects the expected number of unique locations from the pool', () => {
    const targets = createMissionTargets(() => 0);

    expect(targets).toHaveLength(MISSION_TARGET_COUNT);
    expect(new Set(targets.map(target => target.id)).size).toBe(MISSION_TARGET_COUNT);
    expect(targets.every(target => FIELD_NOTE_LOCATIONS.includes(target))).toBe(true);
  });

  it('can choose a different set for another round', () => {
    const firstRound = createMissionTargets(() => 0);
    const secondRound = createMissionTargets(() => 0.99);

    expect(secondRound.map(target => target.id)).not.toEqual(firstRound.map(target => target.id));
  });
});