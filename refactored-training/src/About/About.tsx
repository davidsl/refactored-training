import styles from './About.module.css';

function About() {
  return (
    <div className={styles.aboutContainer}>
      <h2>About This Site</h2>

      <section className={styles.section}>
        <h3>Introduction</h3>
        <p>
          This project is a front-end training playground built with React and TypeScript. It combines
          practical UI exercises with small interactive apps so you can practice component design,
          state management, styling, and browser storage in one place.
        </p>
      </section>

      <section className={styles.section}>
        <h3>What This Site Is For</h3>
        <p>
          The site is organized into tabs that showcase different features: a complete Minesweeper
          game, a persistent clicker game, a leaderboard, and reusable style experiments. Instead of
          being a single-purpose product, this workspace is intended as a learning and refactoring
          environment where each tab demonstrates a different development concept.
        </p>
      </section>

      <section className={styles.section}>
        <h3>How To Use It</h3>
        <p>
          Navigate between tabs to explore each feature independently. Try gameplay tabs to test logic
          and persistence behavior, and use the styling tab to inspect UI patterns that can be reused
          across future projects.
        </p>
      </section>
    </div>
  );
}

export default About;
