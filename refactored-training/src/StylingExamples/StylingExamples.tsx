import React, { useMemo, useState } from 'react';
import ReusableTable, { type TableColumn } from '../components/ReusableTable/ReusableTable';
import styles from './StylingExamples.module.css';

type PreviewRow = {
  component: string;
  status: 'Ready' | 'Draft' | 'Review';
  owner: string;
};

const previewRows: PreviewRow[] = [
  { component: 'Hero Banner', status: 'Ready', owner: 'Ari' },
  { component: 'Leaderboard Panel', status: 'Review', owner: 'Mila' },
  { component: 'Settings Drawer', status: 'Draft', owner: 'Kai' },
  { component: 'Game Tile', status: 'Ready', owner: 'Nova' },
];

const previewColumns: Array<TableColumn<PreviewRow>> = [
  { key: 'component', header: 'Component' },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: value => {
      const status = String(value) as PreviewRow['status'];
      const badgeClass =
        status === 'Ready' ? styles.badgeReady : status === 'Review' ? styles.badgeReview : styles.badgeDraft;

      return <span className={`${styles.statusBadge} ${badgeClass}`}>{status}</span>;
    },
  },
  { key: 'owner', header: 'Owner', align: 'center' },
];

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
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Design Playground</p>
          <h2>Styling Examples</h2>
          <p className={styles.heroText}>
            A curated surface to test spacing, color language, interaction cues, and motion behavior before shipping.
          </p>
        </div>
        <div className={styles.heroChips}>
          <span className={styles.chip}>Layout rhythm</span>
          <span className={styles.chip}>Component states</span>
          <span className={styles.chip}>Motion tokens</span>
        </div>
      </header>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <h3>Controls</h3>
          <div className={styles.buttonRow}>
            <button className={styles.primaryButton}>Primary Action</button>
            <button className={styles.ghostButton}>Ghost Action</button>
            <button className={styles.warningButton}>Destructive</button>
          </div>

          <div className={styles.toggleGroup}>
            <label className={styles.toggle}>
              <span>Compact mode</span>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={event => setCompactMode(event.target.checked)}
              />
            </label>
            <label className={styles.toggle}>
              <span>Warm palette loaders</span>
              <input
                type="checkbox"
                checked={warmPalette}
                onChange={event => setWarmPalette(event.target.checked)}
              />
            </label>
          </div>
        </article>

        <article className={styles.panel}>
          <h3>Card + Modal Preview</h3>
          <div className={styles.cardPreview}>
            <div>
              <strong>Daily Challenge</strong>
              <p>Clear a 16x16 board with fewer than 60 moves.</p>
            </div>
            <button className={styles.primaryButton}>Join Challenge</button>
          </div>

          <div className={styles.modalMock}>
            <div className={styles.modalTitle}>Confirm action</div>
            <p>This area mirrors the modal hierarchy and button emphasis.</p>
            <div className={styles.modalActions}>
              <button className={styles.primaryButton}>Confirm</button>
              <button className={styles.ghostButton}>Cancel</button>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <h3>Table Preview</h3>
          <div className={styles.tableHolder}>
            <ReusableTable
              columns={previewColumns}
              rows={previewRows}
              caption="Component implementation status"
              emptyMessage="No components in preview."
            />
          </div>
        </article>
      </section>

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
              onChange={event => setSpinnerSpeed(Number(event.target.value))}
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
    </div>
  );
};

export default StylingExamples;
