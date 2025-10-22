import { Button } from '@/components/ui/button';
import styles from '../styles.module.css';

export function TopTrack() {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className={`mb-1 ${styles.topTrackTitle}`}>Top track</h3>
          <div className={`${styles.topTrackSub}`}>
            dj g2g - MY HUMPS JUST WANNA VROOM VROOM
          </div>
        </div>
        <div className="flex items-center">
          <audio preload="none">
            <source src="https://p.scdn.co/mp3-preview/4e9d92ec8bfdb91cfe23e7b162e9a5a67a98a7b8?cid=921526b9c2da4b7b96e197790a02347e" />
          </audio>
          <Button aria-label="Play preview" size="icon" variant="subtle">
            <svg
              fill="none"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 6 19 12 8.5 18V6Z"
                stroke="currentColor"
                strokeLinecap="square"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
