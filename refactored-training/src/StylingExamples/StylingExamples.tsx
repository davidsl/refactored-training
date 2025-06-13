import React, { useState } from 'react';
import styles from './StylingExamples.module.css';

const StylingExamples: React.FC = () => {
  const [useRed, setUseRed] = useState(false);

  return (
    <div className={styles.examplesContainer}>
      <h2 className={styles.heading}>Styling Examples</h2>
      <section className={styles.section}>
        <h3>Button Styles</h3>
        <button className={styles.primaryButton}>Primary Button</button>
        <button className={styles.secondaryButton}>Secondary Button</button>
        <button className={styles.dangerButton}>Danger Button</button>
      </section>
      <section className={styles.section}>
        <h3>Table Example</h3>
        <table className={styles.exampleTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice</td>
              <td><span className={styles.statusActive}>Active</span></td>
              <td>95</td>
            </tr>
            <tr>
              <td>Bob</td>
              <td><span className={styles.statusInactive}>Inactive</span></td>
              <td>80</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className={styles.section}>
        <h3>Modal Example</h3>
        <div className={styles.modalExample}>
          <div className={styles.modalBox}>
            <div className={styles.modalText}>This is a modal example using the shared modal style.</div>
            <div className={styles.modalActions}>
              <button className={styles.primaryButton}>OK</button>
              <button className={styles.secondaryButton}>Cancel</button>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <h3>Loading Spinners</h3>
        <label className={styles.toggleSliderLabel}>
          <span>Use Red Theme</span>
          <span className={styles.toggleSlider}>
            <input
              type="checkbox"
              checked={useRed}
              onChange={e => setUseRed(e.target.checked)}
            />
            <span className={styles.toggleSliderTrack}>
              <span className={styles.toggleSliderThumb}></span>
            </span>
          </span>
        </label>
        <div className={styles.spinnerGrid + (useRed ? ' ' + styles.redTheme : '')}>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerCircle}></div>
            <div className={styles.spinnerLabel}>Circle Spinner</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerDots}>
              <span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Bouncing Dots</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerRotatingSquare}>
              <span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Rotating Square</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerBarHorizontal}></div>
            <div className={styles.spinnerLabel}>Horizontal Bar</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerPulse}></div>
            <div className={styles.spinnerLabel}>Pulse</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerDualRing}></div>
            <div className={styles.spinnerLabel}>Dual Ring</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerWave}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Wave</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerFlip}></div>
            <div className={styles.spinnerLabel}>Flip</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerDualColorPulse}></div>
            <div className={styles.spinnerLabel}>Dual Color Pulse</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerDotsOnRing}>
              <span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Dots on Rotating Ring</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerFlipPulse}></div>
            <div className={styles.spinnerLabel}>Flip & Pulse Combo</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerWaveBar}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Wave + Color Bar</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerSpiral}></div>
            <div className={styles.spinnerLabel}>Spiral Spinner</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerWaveDots}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.spinnerLabel}>Wave Dots Spinner</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerCircleWaveBar}>
              <div className={styles.circle}></div>
              <div className={styles.bars}>
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div className={styles.spinnerLabel}>Circle Wave Bar</div>
          </div>
          <div className={styles.spinnerExample}>
            <div className={styles.spinnerWaveOnRing}>
              <div className={styles.wave}>
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div className={styles.spinnerLabel}>Wave on Rotating Ring</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StylingExamples;
