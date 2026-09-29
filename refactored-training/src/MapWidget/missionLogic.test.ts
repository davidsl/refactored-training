import { describe, expect, it } from 'vitest';
import {
  calculateMissionScore,
  calculateMissionScoreBreakdown,
  createMissionTargets,
  DEFAULT_MISSION_DIFFICULTY,
  FIELD_NOTE_LOCATION_PACKS,
  FIELD_NOTE_LOCATIONS,
  formatDistance,
  getCompassDirection,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
  MISSION_DIFFICULTIES,
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

  it('subtracts hint penalties without allowing a negative result', () => {
    expect(calculateMissionScore(3, 30, MISSION_DIFFICULTIES.standard.hintPenalty)).toBe(395);
    expect(calculateMissionScore(0, 120, MISSION_DIFFICULTIES.standard.hintPenalty)).toBe(0);
  });
});

describe('mission difficulty presets', () => {
  it('preserves standard rules as the default', () => {
    expect(DEFAULT_MISSION_DIFFICULTY).toBe('standard');
    expect(MISSION_DIFFICULTIES.standard.hitRadius).toBe(36);
    expect(MISSION_DIFFICULTIES.standard.hintAfterMisses).toBe(3);
    expect(MISSION_DIFFICULTIES.standard.hintPenalty).toBe(25);
    expect(calculateMissionScore(3, 30, 0, MISSION_DIFFICULTIES.standard.timeBonusMultiplier)).toBe(420);
  });

  it('adjusts hint, hit radius, and time bonus by difficulty', () => {
    expect(MISSION_DIFFICULTIES.relaxed.hitRadius).toBeGreaterThan(MISSION_DIFFICULTIES.expert.hitRadius);
    expect(MISSION_DIFFICULTIES.relaxed.hintAfterMisses).toBeLessThan(MISSION_DIFFICULTIES.expert.hintAfterMisses);
    expect(MISSION_DIFFICULTIES.relaxed.hintPenalty).toBeLessThan(MISSION_DIFFICULTIES.expert.hintPenalty);
    expect(calculateMissionScore(3, 30, 0, MISSION_DIFFICULTIES.relaxed.timeBonusMultiplier)).toBe(360);
    expect(calculateMissionScore(3, 30, 0, MISSION_DIFFICULTIES.expert.timeBonusMultiplier)).toBe(480);
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

  it('changes at least one target when a random draw repeats the previous set', () => {
    const firstRound = createMissionTargets(() => 0);
    const nextRound = createMissionTargets(() => 0, firstRound.map(target => target.id));
    const firstRoundIds = new Set(firstRound.map(target => target.id));

    expect(nextRound.some(target => !firstRoundIds.has(target.id))).toBe(true);
  });

  it('samples only from the selected location pack', () => {
    const bergenTargets = createMissionTargets(() => 0, [], FIELD_NOTE_LOCATION_PACKS.bergen.locations);

    expect(bergenTargets.every(target => FIELD_NOTE_LOCATION_PACKS.bergen.locations.includes(target))).toBe(true);
  });
});

describe('clue area centers', () => {
  it('keep every exact target outside the initial hit radius', () => {
    const allTargets = Object.values(FIELD_NOTE_LOCATION_PACKS).flatMap(pack => pack.locations);
    for (const target of allTargets) {
      const areaDistance = getNearestTargetDistanceMeters(
        target.clueArea,
        [{ longitude: target.longitude, latitude: target.latitude }]
      );

      expect(areaDistance).toBeGreaterThan(1500);
    }
  });
});

describe('authored field note locations', () => {
  it('have unique ids, valid geographic coordinates, and non-empty clues', () => {
    const allTargets = Object.values(FIELD_NOTE_LOCATION_PACKS).flatMap(pack => pack.locations);
    expect(new Set(allTargets.map(target => target.id)).size).toBe(allTargets.length);

    for (const target of allTargets) {
      expect(Number.isFinite(target.longitude)).toBe(true);
      expect(target.longitude).toBeGreaterThanOrEqual(-180);
      expect(target.longitude).toBeLessThanOrEqual(180);
      expect(Number.isFinite(target.latitude)).toBe(true);
      expect(target.latitude).toBeGreaterThanOrEqual(-90);
      expect(target.latitude).toBeLessThanOrEqual(90);
      expect(target.clue.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('getCompassDirection', () => {
  it('returns a useful cardinal direction from a clue area to a target', () => {
    expect(getCompassDirection({ longitude: 0, latitude: 0 }, { longitude: 1, latitude: 0 })).toBe('east');
    expect(getCompassDirection({ longitude: 0, latitude: 0 }, { longitude: 0, latitude: 1 })).toBe('north');
  });
});

describe('calculateMissionScoreBreakdown', () => {
  it('reports base points, scaled time bonus, penalties, and total', () => {
    expect(calculateMissionScoreBreakdown(3, 30, 25, 0.5)).toEqual({
      basePoints: 300,
      timeBonus: 60,
      penalties: 25,
      total: 335,
    });
  });
});