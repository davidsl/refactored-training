import React from 'react';
import styles from './StylingExamples.module.css';

const StylingExamples: React.FC = () => {
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
    </div>
  );
};

export default StylingExamples;
