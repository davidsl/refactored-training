import { useEffect, useMemo, useState } from 'react';
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
    title: 'Better Click',
    description: '+1 joy per click',
    baseCost: 15,
    costScale: 1.5,
    gainPerLevel: 1,
  },
  {
    key: 'cursor',
    title: 'Auto Cursor',
    description: '+0.3 joy per second',
    baseCost: 35,
    costScale: 1.58,
    gainPerLevel: 0.3,
  },
  {
    key: 'farm',
    title: 'Joy Farm',
    description: '+1.2 joy per second',
    baseCost: 140,
    costScale: 1.64,
    gainPerLevel: 1.2,
  },
  {
    key: 'factory',
    title: 'Happiness Factory',
    description: '+6 joy per second',
    baseCost: 900,
    costScale: 1.72,
    gainPerLevel: 6,
  },
];

type SaveData = {
  points: number;
  lifetime: number;
  levels: Record<UpgradeKey, number>;
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

  const clickPower = 1 + levels.click;
  const passivePerSecond = useMemo(
    () => levels.cursor * 0.3 + levels.farm * 1.2 + levels.factory * 6,
    [levels.cursor, levels.farm, levels.factory]
  );

  const vibeLabel = useMemo(() => {
    if (lifetime >= 25000) return 'Radiating Joy';
    if (lifetime >= 7000) return 'Very Cozy';
    if (lifetime >= 1500) return 'Comfy';
    if (lifetime >= 300) return 'Getting Warm';
    return 'Fresh Start';
  }, [lifetime]);

  const visualStage = useMemo(() => {
    if (levels.factory >= 10) return 'Ascended Core';
    if (levels.factory >= 3) return 'Prismatic Core';
    if (levels.farm >= 4) return 'Bloom Core';
    if (levels.cursor >= 2) return 'Charged Core';
    return 'Starter Core';
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
    const saveData: SaveData = { points, lifetime, levels };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [points, lifetime, levels]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (passivePerSecond <= 0) return;
      const gain = passivePerSecond / 5;
      setPoints(prev => prev + gain);
      setLifetime(prev => prev + gain);
    }, 200);

    return () => window.clearInterval(tick);
  }, [passivePerSecond]);

  function clickMainButton() {
    setPoints(prev => prev + clickPower);
    setLifetime(prev => prev + clickPower);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 120);
  }

  function buyUpgrade(upgrade: Upgrade) {
    const level = levels[upgrade.key];
    const cost = nextCost(upgrade.baseCost, upgrade.costScale, level);
    if (points < cost) return;
    setPoints(prev => prev - cost);
    setLevels(prev => ({ ...prev, [upgrade.key]: prev[upgrade.key] + 1 }));
  }

  function resetProgress() {
    setPoints(0);
    setLifetime(0);
    setLevels(defaultLevels);
  }

  return (
    <section className={styles.gameCard}>
      <header className={styles.header}>
        <h2>Clicking Game</h2>
        <p>Grow your joy by clicking, then buy upgrades so your score keeps rising passively.</p>
      </header>

      <div className={styles.statsBar}>
        <div>
          <span>Joy</span>
          <strong>{formatValue(points)}</strong>
        </div>
        <div>
          <span>Per Click</span>
          <strong>{formatValue(clickPower)}</strong>
        </div>
        <div>
          <span>Passive / sec</span>
          <strong>{formatValue(passivePerSecond)}</strong>
        </div>
        <div>
          <span>Mood</span>
          <strong>{vibeLabel}</strong>
        </div>
      </div>

      <div className={styles.mainPanel}>
        <div className={styles.clickArea}>
          <button
            type="button"
            aria-label="Main click button"
            className={coreClassName}
            onClick={clickMainButton}
          >
            +{clickPower.toFixed(0)}
          </button>
          <p className={styles.coreStage}>Visual stage: {visualStage}</p>
          <p className={styles.clickHint}>Every click gives joy. Upgrades make it snowball.</p>
        </div>

        <aside className={styles.shopPanel}>
          <div className={styles.shopHeader}>
            <h3>Upgrade Shop</h3>
            <button type="button" className={styles.resetButton} onClick={resetProgress}>
              Reset
            </button>
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
                    <span>Next Cost</span>
                    <strong>{formatValue(cost)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
          <p className={styles.totalLabel}>Lifetime joy: {formatValue(lifetime)}</p>
        </aside>
      </div>
    </section>
  );
}

export default ClickingGame;
