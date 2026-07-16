import React from 'react';
import styles from '../StylingExamples.module.css';

type MotionLabSectionProps = {
  warmPalette: boolean;
  spinnerSpeed: number;
  onSpinnerSpeedChange: (nextValue: number) => void;
};

const MotionLabSection: React.FC<MotionLabSectionProps> = ({
  warmPalette,
  spinnerSpeed,
  onSpinnerSpeedChange,
}) => {
  return (
    <section className={`${styles.loaderPanel} ${warmPalette ? styles.loaderPanelWarm : ''}`}>
      <div className={styles.loaderHeader}>
        <div>
          <h3>Motion Lab</h3>
          <div className={styles.loaderLegend}>
            <span>Rotational</span>
            <span>Pulse</span>
            <span>Linear</span>
            <span>Transform</span>
          </div>
        </div>
        <label className={styles.speedControl}>
          <span>Speed</span>
          <input
            type="range"
            min={0.6}
            max={1.8}
            step={0.1}
            value={spinnerSpeed}
            onChange={event => onSpinnerSpeedChange(Number(event.target.value))}
          />
          <strong>{spinnerSpeed.toFixed(1)}x</strong>
        </label>
      </div>

      <div className={styles.loaderGrid}>
        <div className={styles.loaderTile} data-family="Rotational" title="Rotational loader">
          <div className={styles.loaderRing}></div>
          <span>Ring</span>
        </div>
        <div className={styles.loaderTile} data-family="Pulse" title="Pulse and bounce loader">
          <div className={styles.loaderDots}>
            <span></span><span></span><span></span>
          </div>
          <span>Dots</span>
        </div>
        <div className={styles.loaderTile} data-family="Linear" title="Linear wave loader">
          <div className={styles.loaderBars}>
            <span></span><span></span><span></span><span></span>
          </div>
          <span>Bars</span>
        </div>
        <div className={styles.loaderTile} data-family="Rotational" title="Orbiting loader">
          <div className={styles.loaderOrbit}></div>
          <span>Orbit</span>
        </div>
        <div className={styles.loaderTile} data-family="Pulse" title="Pulse scale loader">
          <div className={styles.loaderPulse}></div>
          <span>Pulse</span>
        </div>
        <div className={styles.loaderTile} data-family="Rotational" title="Dual ring spinner">
          <div className={styles.loaderDualRing}></div>
          <span>Dual Ring</span>
        </div>
        <div className={styles.loaderTile} data-family="Linear" title="Vertical wave bars">
          <div className={styles.loaderWave}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span>Wave</span>
        </div>
        <div className={styles.loaderTile} data-family="Transform" title="3D flip loader">
          <div className={styles.loaderFlip}></div>
          <span>Flip</span>
        </div>
        <div className={styles.loaderTile} data-family="Rotational" title="Spiral spinner">
          <div className={styles.loaderSpiral}></div>
          <span>Spiral</span>
        </div>
        <div className={styles.loaderTile} data-family="Linear" title="Horizontal sweep bar">
          <div className={styles.loaderSweep}></div>
          <span>Sweep</span>
        </div>
        <div className={styles.loaderTile} data-family="Pulse" title="Ripple pulse loader">
          <div className={styles.loaderRipple}></div>
          <span>Ripple</span>
        </div>
        <div className={styles.loaderTile} data-family="Transform" title="Stepped cube transform">
          <div className={styles.loaderCube}></div>
          <span>Cube</span>
        </div>
      </div>
    </section>
  );
};

export default MotionLabSection;
