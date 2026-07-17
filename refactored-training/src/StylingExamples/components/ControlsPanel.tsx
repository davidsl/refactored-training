import React from 'react';
import styles from '../StylingExamples.module.css';
import DemoButton from './DemoButton';

type ControlsPanelProps = {
  compactMode: boolean;
  warmPalette: boolean;
  onCompactModeChange: (nextValue: boolean) => void;
  onWarmPaletteChange: (nextValue: boolean) => void;
};

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  compactMode,
  warmPalette,
  onCompactModeChange,
  onWarmPaletteChange,
}) => {
  return (
    <article className={styles.panel}>
      <h3>Controls</h3>

      <div className={styles.controlsSection}>
        <p className={styles.controlsLabel}>Buttons</p>
        <div className={styles.buttonRow}>
          <DemoButton variant="primary">Primary Action</DemoButton>
          <DemoButton variant="ghost">Ghost Action</DemoButton>
          <DemoButton variant="warning">Destructive</DemoButton>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <p className={styles.controlsLabel}>Input examples</p>
        <div className={styles.controlsFieldGrid}>
          <label className={styles.controlsField}>
            Search
            <input className={styles.controlsInput} type="text" placeholder="Find component..." />
          </label>
          <label className={styles.controlsField}>
            Priority
            <select className={styles.controlsSelect} defaultValue="normal">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <p className={styles.controlsLabel}>View mode</p>
        <div className={styles.segmentGroup} role="radiogroup" aria-label="View mode examples">
          <button type="button" className={`${styles.segmentButton} ${styles.segmentButtonActive}`} aria-pressed="true">
            Grid
          </button>
          <button type="button" className={styles.segmentButton} aria-pressed="false">
            List
          </button>
          <button type="button" className={styles.segmentButton} aria-pressed="false">
            Split
          </button>
        </div>
      </div>

      <div className={styles.toggleGroup}>
        <label className={styles.toggle}>
          <span>Compact mode</span>
          <input type="checkbox" checked={compactMode} onChange={event => onCompactModeChange(event.target.checked)} />
        </label>
        <label className={styles.toggle}>
          <span>Warm palette loaders</span>
          <input type="checkbox" checked={warmPalette} onChange={event => onWarmPaletteChange(event.target.checked)} />
        </label>
      </div>
    </article>
  );
};

export default ControlsPanel;
