import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import styles from './ClickingGame.module.css';

type UpgradeKey = 'click' | 'cursor' | 'farm' | 'factory';

type Upgrade = {
  key: UpgradeKey;
  title: string;
  description: string;
  baseCost: number;
  costScale: number;
  gainPerLevel: number;
};

const SAVE_KEY = 'clickingGameSaveV2';

const UPGRADES: Upgrade[] = [
  {
    key: 'click',
    title: 'Neural Primer',
    description: '+1 serotonin per tap',
    baseCost: 15,
    costScale: 1.5,
    gainPerLevel: 1,
  },
  {
    key: 'cursor',
    title: 'Micro Drip',
    description: '+0.3 serotonin per sec',
    baseCost: 35,
    costScale: 1.58,
    gainPerLevel: 0.3,
  },
  {
    key: 'farm',
    title: 'Mood Greenhouse',
    description: '+1.2 serotonin per sec',
    baseCost: 140,
    costScale: 1.64,
    gainPerLevel: 1.2,
  },
  {
    key: 'factory',
    title: 'Synapse Reactor',
    description: '+6 serotonin per sec',
    baseCost: 900,
    costScale: 1.72,
    gainPerLevel: 6,
  },
];

type SaveData = {
  points: number;
  lifetime: number;
  levels: Record<UpgradeKey, number>;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
};

const defaultLevels: Record<UpgradeKey, number> = {
  click: 0,
  cursor: 0,
  farm: 0,
  factory: 0,
};

function formatValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(1);
}

function nextCost(baseCost: number, costScale: number, level: number) {
  return Math.floor(baseCost * Math.pow(costScale, level));
}

function ClickingGame() {
  const ADMIN_CHEAT_AMOUNT = 10_000;

  const audioContextRef = useRef<AudioContext | null>(null);
  const clickToneIndexRef = useRef(0);
  const previousPointsRef = useRef(0);
  const pointsPulseTimeoutRef = useRef<number | null>(null);

  const [points, setPoints] = useState<number>(() => {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return 0;
    try {
      const parsed = JSON.parse(stored) as SaveData;
      return Number(parsed.points) || 0;
    } catch {
      return 0;
    }
  });
  const [lifetime, setLifetime] = useState<number>(() => {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return 0;
    try {
      const parsed = JSON.parse(stored) as SaveData;
      return Number(parsed.lifetime) || 0;
    } catch {
      return 0;
    }
  });
  const [levels, setLevels] = useState<Record<UpgradeKey, number>>(() => {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return defaultLevels;
    try {
      const parsed = JSON.parse(stored) as SaveData;
      return {
        click: Number(parsed.levels?.click) || 0,
        cursor: Number(parsed.levels?.cursor) || 0,
        farm: Number(parsed.levels?.farm) || 0,
        factory: Number(parsed.levels?.factory) || 0,
      };
    } catch {
      return defaultLevels;
    }
  });
  const [clickBurst, setClickBurst] = useState(false);
  const [flareActive, setFlareActive] = useState(false);
  const [serotoninPulse, setSerotoninPulse] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored) as SaveData;
      return parsed.soundEnabled ?? true;
    } catch {
      return true;
    }
  });
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored) as SaveData;
      return parsed.hapticsEnabled ?? true;
    } catch {
      return true;
    }
  });

  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const clickPower = 1 + levels.click;
  const passivePerSecond = useMemo(
    () => levels.cursor * 0.3 + levels.farm * 1.2 + levels.factory * 6,
    [levels.cursor, levels.farm, levels.factory]
  );

  const beatDurationSeconds = useMemo(() => {
    const capped = Math.min(passivePerSecond, 120);
    return 4.2 - (capped / 120) * 2.2;
  }, [passivePerSecond]);

  const vibeLabel = useMemo(() => {
    if (lifetime >= 25000) return 'Euphoric Flow';
    if (lifetime >= 7000) return 'Balanced';
    if (lifetime >= 1500) return 'Stabilizing';
    if (lifetime >= 300) return 'Regulating';
    return 'Baseline';
  }, [lifetime]);

  const visualStage = useMemo(() => {
    if (levels.factory >= 10) return 'Transcendent Canopy';
    if (levels.factory >= 3) return 'Prismatic Canopy';
    if (levels.farm >= 4) return 'Blooming Canopy';
    if (levels.cursor >= 2) return 'Charged Canopy';
    return 'Seedling Canopy';
  }, [levels.cursor, levels.farm, levels.factory]);

  const coreClassName = [
    styles.mainCore,
    clickBurst ? styles.mainCoreBurst : '',
    levels.cursor > 0 ? styles.mainCoreCharged : '',
    levels.farm > 0 ? styles.mainCoreBloom : '',
    levels.factory > 0 ? styles.mainCorePrismatic : '',
    levels.factory >= 10 ? styles.mainCoreAscended : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const saveData: SaveData = { points, lifetime, levels, soundEnabled, hapticsEnabled };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [points, lifetime, levels, soundEnabled, hapticsEnabled]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (passivePerSecond <= 0) return;
      const gain = passivePerSecond / 5;
      setPoints(prev => prev + gain);
      setLifetime(prev => prev + gain);
    }, 200);

    return () => window.clearInterval(tick);
  }, [passivePerSecond]);

  useEffect(() => {
    let flareTimeout: number | null = null;
    let flareOffTimeout: number | null = null;

    const scheduleFlare = () => {
      const nextDelay = 7000 + Math.random() * 9000;
      flareTimeout = window.setTimeout(() => {
        if (Math.random() < 0.28) {
          setFlareActive(true);
          flareOffTimeout = window.setTimeout(() => {
            setFlareActive(false);
          }, 950);
        }
        scheduleFlare();
      }, nextDelay);
    };

    scheduleFlare();

    return () => {
      if (flareTimeout) window.clearTimeout(flareTimeout);
      if (flareOffTimeout) window.clearTimeout(flareOffTimeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pointsPulseTimeoutRef.current) {
        window.clearTimeout(pointsPulseTimeoutRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (points > previousPointsRef.current) {
      setSerotoninPulse(true);
      if (pointsPulseTimeoutRef.current) {
        window.clearTimeout(pointsPulseTimeoutRef.current);
      }
      pointsPulseTimeoutRef.current = window.setTimeout(() => {
        setSerotoninPulse(false);
      }, 260);
    }
    previousPointsRef.current = points;
  }, [points]);

  function getAudioContext() {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }
    const AudioContextCtor =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    const ctx = new AudioContextCtor();
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return ctx;
  }

  function playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
    startAt = ctx.currentTime
  ) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function playClickSound() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    clickToneIndexRef.current += 1;
    const variant = clickToneIndexRef.current % 3;
    const baseFrequency = 240 + variant * 18 + Math.random() * 24;
    playTone(ctx, baseFrequency, 0.055, 'triangle', 0.05);
    playTone(ctx, baseFrequency * 1.85, 0.04, 'sine', 0.02, ctx.currentTime + 0.012);
  }

  function playUpgradeSound() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const root = 300 + Math.random() * 16;
    const now = ctx.currentTime;
    playTone(ctx, root, 0.09, 'triangle', 0.05, now);
    playTone(ctx, root * 1.25, 0.1, 'triangle', 0.05, now + 0.065);
    playTone(ctx, root * 1.5, 0.14, 'sine', 0.045, now + 0.14);
  }

  function triggerHaptics(pattern: number | number[]) {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate(pattern);
  }

  function clickMainButton() {
    setPoints(prev => prev + clickPower);
    setLifetime(prev => prev + clickPower);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 120);
    playClickSound();
    triggerHaptics(8);
  }

  function buyUpgrade(upgrade: Upgrade) {
    const level = levels[upgrade.key];
    const cost = nextCost(upgrade.baseCost, upgrade.costScale, level);
    if (points < cost) return;
    setPoints(prev => prev - cost);
    setLevels(prev => ({ ...prev, [upgrade.key]: prev[upgrade.key] + 1 }));
    playUpgradeSound();
    triggerHaptics([12, 18, 14]);
  }

  function resetProgress() {
    setPoints(0);
    setLifetime(0);
    setLevels(defaultLevels);
  }

  function applyAdminCheat() {
    setPoints(prev => prev + ADMIN_CHEAT_AMOUNT);
    setLifetime(prev => prev + ADMIN_CHEAT_AMOUNT);
    playUpgradeSound();
    triggerHaptics([20, 24, 20]);
  }

  function handleParallaxMove(event: MouseEvent<HTMLDivElement>) {
    const area = event.currentTarget;
    const rect = area.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const py = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
    area.style.setProperty('--parallax-x', `${px.toFixed(2)}px`);
    area.style.setProperty('--parallax-y', `${py.toFixed(2)}px`);
  }

  function handleParallaxLeave(event: MouseEvent<HTMLDivElement>) {
    const area = event.currentTarget;
    area.style.setProperty('--parallax-x', '0px');
    area.style.setProperty('--parallax-y', '0px');
  }

  const clickAreaStyle = {
    '--beat-duration': `${beatDurationSeconds.toFixed(2)}s`,
  } as CSSProperties;

  const serotoninDisplayClass = serotoninPulse
    ? `${styles.serotoninDisplay} ${styles.serotoninDisplayPulse}`
    : styles.serotoninDisplay;

  const serotoninFieldClass = serotoninPulse
    ? `${styles.serotoninFieldReadout} ${styles.serotoninFieldReadoutPulse}`
    : styles.serotoninFieldReadout;

  return (
    <section className={styles.gameCard}>
      <header className={styles.header}>
        <h2>Serotonin Farm</h2>
        <p>Cultivate serotonin with each tap, then automate growth through lab upgrades.</p>
      </header>

      <div className={serotoninDisplayClass} aria-live="polite">
        <span className={styles.serotoninDisplayLabel}>Total Serotonin</span>
        <strong className={styles.serotoninDisplayValue}>{formatValue(points)}</strong>
        <span className={styles.serotoninDisplayMeta}>Harvest velocity: {formatValue(passivePerSecond)} / sec</span>
      </div>

      <div className={styles.statsBar}>
        <div>
          <span>Serotonin</span>
          <strong>{formatValue(points)}</strong>
        </div>
        <div>
          <span>Per Tap</span>
          <strong>{formatValue(clickPower)}</strong>
        </div>
        <div>
          <span>Harvest / sec</span>
          <strong>{formatValue(passivePerSecond)}</strong>
        </div>
        <div>
          <span>State</span>
          <strong>{vibeLabel}</strong>
        </div>
      </div>

      <div className={styles.feedbackControls}>
        <button
          type="button"
          className={soundEnabled ? styles.feedbackToggle : `${styles.feedbackToggle} ${styles.feedbackToggleOff}`}
          onClick={() => setSoundEnabled(prev => !prev)}
        >
          Sound: {soundEnabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          className={
            hapticsEnabled && canVibrate
              ? styles.feedbackToggle
              : `${styles.feedbackToggle} ${styles.feedbackToggleOff}`
          }
          onClick={() => setHapticsEnabled(prev => !prev)}
          disabled={!canVibrate}
        >
          Haptics: {canVibrate ? (hapticsEnabled ? 'On' : 'Off') : 'Unsupported'}
        </button>
      </div>

      <div className={styles.mainPanel}>
        <div
          className={flareActive ? `${styles.clickArea} ${styles.clickAreaFlare}` : styles.clickArea}
          style={clickAreaStyle}
          onMouseMove={handleParallaxMove}
          onMouseLeave={handleParallaxLeave}
        >
          <div className={serotoninFieldClass} aria-hidden="true">
            {formatValue(points)}
          </div>
          <div className={styles.ambientField} aria-hidden="true">
            <span className={styles.ambientOrb} />
            <span className={styles.ambientOrb} />
            <span className={styles.ambientOrb} />
            <span className={styles.ambientOrb} />
            <span className={styles.ambientOrb} />
            <span className={styles.ambientOrb} />
          </div>
          <div className={styles.coreWrap}>
            <button
              type="button"
              aria-label="Main click button"
              className={coreClassName}
              onClick={clickMainButton}
            >
              +{clickPower.toFixed(0)}
            </button>
          </div>
          <p className={styles.coreStage}>Canopy stage: {visualStage}</p>
          <p className={styles.clickHint}>Each tap cultivates serotonin. Upgrades sustain long-term growth.</p>
        </div>

        <aside className={styles.shopPanel}>
          <div className={styles.shopHeader}>
            <h3>Cultivation Lab</h3>
            <div className={styles.shopActionButtons}>
              <button type="button" className={styles.adminCheatButton} onClick={applyAdminCheat}>
                Lab Override +{formatValue(ADMIN_CHEAT_AMOUNT)}
              </button>
              <button type="button" className={styles.resetButton} onClick={resetProgress}>
                Reboot
              </button>
            </div>
          </div>
          <div className={styles.shopList}>
            {UPGRADES.map(upgrade => {
              const level = levels[upgrade.key];
              const cost = nextCost(upgrade.baseCost, upgrade.costScale, level);
              const canBuy = points >= cost;

              return (
                <button
                  key={upgrade.key}
                  type="button"
                  className={canBuy ? styles.shopItem : `${styles.shopItem} ${styles.shopItemDisabled}`}
                  onClick={() => buyUpgrade(upgrade)}
                  disabled={!canBuy}
                >
                  <div className={styles.shopTopRow}>
                    <strong>{upgrade.title}</strong>
                    <span>Lv {level}</span>
                  </div>
                  <p>{upgrade.description}</p>
                  <div className={styles.shopBottomRow}>
                    <span>Next Dose Cost</span>
                    <strong>{formatValue(cost)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
          <p className={styles.totalLabel}>Lifetime serotonin: {formatValue(lifetime)}</p>
        </aside>
      </div>
    </section>
  );
}

export default ClickingGame;
