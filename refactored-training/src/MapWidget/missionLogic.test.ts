import { describe, expect, it } from 'vitest';
import {
  calculateMissionScore,
  formatDistance,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
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