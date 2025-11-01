import React, { useState } from 'react';
import styles from './Thumbnails.module.css';

const Thumbnails: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  function handleAdd() {
    if (input.trim()) {
      setImages([...images, input.trim()]);
      setInput('');
    }
  }

  return (
    <div className={styles.thumbnailsContainer}>
      <h2>Thumbnail Generator</h2>
      <div className={styles.inputRow}>
        <input
          type="text"
          placeholder="Enter image URL"
          value={input}
          onChange={e => setInput(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.addButton}>Add</button>
      </div>
      <div className={styles.grid}>
        {images.map((url, idx) => (
          <div key={idx} className={styles.thumbBox}>
            <img src={url} alt={`Thumbnail ${idx + 1}`} className={styles.thumbImg} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Thumbnails;
