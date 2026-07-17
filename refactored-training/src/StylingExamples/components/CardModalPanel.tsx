import React from 'react';
import styles from '../StylingExamples.module.css';

const CardModalPanel: React.FC = () => {
  return (
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
  );
};

export default CardModalPanel;
