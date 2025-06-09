import styles from './About.module.css';

function About() {
  return (
    <div className={styles.aboutContainer}>
      <h2>About Map Explorer</h2>
      <p>
        Map Explorer is a demo project showcasing how to integrate maps into modern web applications.
        Use it as a starting point for your own location-based ideas!
      </p>
    </div>
  );
}

export default About;
