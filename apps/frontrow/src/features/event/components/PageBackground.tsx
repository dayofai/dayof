import styles from '../styles.module.css';

const BACKGROUND_IMG_URL =
  'https://dice-media.imgix.net/attachments/2025-09-17/54b20d50-a53b-40a2-97dd-13c219685ede.jpg?rect=0%2C351%2C1080%2C648&w=200&q=1';

export function PageBackground() {
  return (
    <div className={styles.bgContainer}>
      <div className={styles.bgGradient} />
      <div
        className={styles.bgImageBlur}
        style={{ backgroundImage: `url(${BACKGROUND_IMG_URL})` }}
      />
    </div>
  );
}
