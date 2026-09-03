import type { CSSProperties } from 'react';
import photo1 from '../assets/IundE2021.jpg';
import photo2 from '../assets/IundE2026.jpg';
import photo3 from '../assets/IundE2026.2.jpg';
import photo4 from '../assets/IundE_2015.jpg';
import photo5 from '../assets/IundE_2016.jpg';

const HEART_PATH =
  'M12,21.35 L10.55,20.03 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 ' +
  'C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 ' +
  'C22,12.28 18.6,15.36 13.45,20.04 Z';

interface Heart {
  src: string;
  style: CSSProperties;
  align?: string;
}

const hearts: Heart[] = [
  { src: photo1, style: { top: '4%', left: '4%', width: 'min(20vw, 130px)', transform: 'rotate(-9deg)' } },
  { src: photo2, style: { top: '6%', right: '4%', width: 'min(20vw, 130px)', transform: 'rotate(7deg)' } },
  { src: photo3, style: { top: '46%', left: '2%', width: 'min(17vw, 110px)', transform: 'rotate(-6deg)' } },
  { src: photo4, style: { top: '58%', right: '3%', width: 'min(20vw, 130px)', transform: 'rotate(5deg)' } },
  {
    src: photo5,
    style: { top: '80%', left: '10%', width: 'min(18vw, 115px)', transform: 'rotate(-4deg)' },
    align: 'xMidYMin slice',
  },
];

export default function HeartPhotos() {
  return (
    <div className="heart-photos" aria-hidden="true">
      {hearts.map((heart, i) => (
        <div className="heart-photo" style={heart.style} key={i}>
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <defs>
              <clipPath id={`heart-clip-${i}`}>
                <path d={HEART_PATH} />
              </clipPath>
            </defs>
            <image
              href={heart.src}
              x="0"
              y="0"
              width="24"
              height="24"
              preserveAspectRatio={heart.align ?? 'xMidYMid slice'}
              clipPath={`url(#heart-clip-${i})`}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
