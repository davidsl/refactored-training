import React from 'react';
import styles from '../StylingExamples.module.css';

const HeroSection: React.FC = () => {
  return (
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
  );
};

export default HeroSection;
