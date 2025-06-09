import styles from './Home.module.css';

function Home() {
  return (
    <div className={styles.homeContainer}>
      <h2>Welcome to the Map Explorer!</h2>
      <p>
        Discover interesting places, events, and services near you using our interactive map.
      </p>
    </div>
  );
}

export default Home;
