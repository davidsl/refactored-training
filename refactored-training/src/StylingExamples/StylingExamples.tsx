import React, { useMemo, useState } from 'react';
import styles from './StylingExamples.module.css';
import HeroSection from './components/HeroSection';
import ControlsPanel from './components/ControlsPanel';
import CardModalPanel from './components/CardModalPanel';
import TablePreviewPanel from './components/TablePreviewPanel';
import MotionLabSection from './components/MotionLabSection';

const StylingExamples: React.FC = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [warmPalette, setWarmPalette] = useState(false);
  const [spinnerSpeed, setSpinnerSpeed] = useState(1);

  const rootStyle = useMemo(
    () => ({
      '--demo-spin-duration': `${(1.1 / spinnerSpeed).toFixed(2)}s`,
    }) as React.CSSProperties,
    [spinnerSpeed],
  );

  return (
    <div className={`${styles.examplesPage} ${compactMode ? styles.compactMode : ''}`} style={rootStyle}>
      <HeroSection />

      <section className={styles.grid}>
        <ControlsPanel
          compactMode={compactMode}
          warmPalette={warmPalette}
          onCompactModeChange={setCompactMode}
          onWarmPaletteChange={setWarmPalette}
        />
        <CardModalPanel />
        <TablePreviewPanel />
      </section>

      <MotionLabSection
        warmPalette={warmPalette}
        spinnerSpeed={spinnerSpeed}
        onSpinnerSpeedChange={setSpinnerSpeed}
      />
    </div>
  );
};

export default StylingExamples;
