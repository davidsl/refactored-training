export type MotionPreset = 'crisp' | 'balanced' | 'cinematic';

// Change this single constant to switch the app-wide motion feel.
export const ACTIVE_MOTION_PRESET: MotionPreset = 'balanced';

export const MOTION_PRESET_CLASS = `motion-${ACTIVE_MOTION_PRESET}`;

type DelayPreset = {
  leaderboardRowStepMs: number;
  leaderboardRowMaxMs: number;
  leaderboardCardDelayMs: [number, number, number, number];
  mineRowStepMs: number;
  mineRowMaxMs: number;
  mineTileRowWeightMs: number;
  mineTileColWeightMs: number;
  mineTileMaxMs: number;
};

export const MOTION_DELAY_PRESETS: Record<MotionPreset, DelayPreset> = {
  crisp: {
    leaderboardRowStepMs: 28,
    leaderboardRowMaxMs: 260,
    leaderboardCardDelayMs: [24, 64, 104, 144],
    mineRowStepMs: 18,
    mineRowMaxMs: 180,
    mineTileRowWeightMs: 12,
    mineTileColWeightMs: 5,
    mineTileMaxMs: 300,
  },
  balanced: {
    leaderboardRowStepMs: 34,
    leaderboardRowMaxMs: 300,
    leaderboardCardDelayMs: [30, 80, 130, 180],
    mineRowStepMs: 22,
    mineRowMaxMs: 220,
    mineTileRowWeightMs: 16,
    mineTileColWeightMs: 7,
    mineTileMaxMs: 380,
  },
  cinematic: {
    leaderboardRowStepMs: 48,
    leaderboardRowMaxMs: 420,
    leaderboardCardDelayMs: [42, 112, 182, 252],
    mineRowStepMs: 30,
    mineRowMaxMs: 300,
    mineTileRowWeightMs: 22,
    mineTileColWeightMs: 10,
    mineTileMaxMs: 560,
  },
};
