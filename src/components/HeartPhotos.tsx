import type { CSSProperties } from 'react';
import photo1 from '../assets/IundE2021.jpg';
import photo2 from '../assets/IundE2026.jpg';
import photo3 from '../assets/IundE2026.2.jpg';
import photo4 from '../assets/IundE_2015.jpg';
import photo5 from '../assets/IundE_2016.jpg';

// Heart path normalised to a 0..1 bounding box so it can clip any <img> size.
const HEART_PATH =
  'M0.5,0.889 L0.44,0.835 C0.225,0.657 0.083,0.512 0.083,0.354 ' +
  'C0.083,0.226 0.184,0.125 0.313,0.125 C0.385,0.125 0.455,0.159 0.5,0.212 ' +
  'C0.545,0.159 0.615,0.125 0.688,0.125 C0.816,0.125 0.917,0.226 0.917,0.354 ' +
  'C0.917,0.512 0.775,0.657 0.56,0.835 Z';

interface Heart {
  src: string;
  objectPosition: string;
  style: CSSProperties;
}

const hearts: Heart[] = [
  { src: photo1, objectPosition: 'center', style: { top: '4%', left: '4%', width: 'min(20vw, 130px)', transform: 'rotate(-9deg)' } },
  { src: photo2, objectPosition: 'center', style: { top: '6%', right: '4%', width: 'min(20vw, 130px)', transform: 'rotate(7deg)' } },
  { src: photo3, objectPosition: 'center', style: { top: '46%', left: '2%', width: 'min(17vw, 110px)', transform: 'rotate(-6deg)' } },
  { src: photo4, objectPosition: 'center', style: { top: '58%', right: '3%', width: 'min(20vw, 130px)', transform: 'rotate(5deg)' } },
  { src: photo5, objectPosition: 'center top', style: { top: '80%', left: '10%', width: 'min(18vw, 115px)', transform: 'rotate(-4deg)' } },
];

export default function HeartPhotos() {
  return (
    <div className="heart-photos" aria-hidden="true">
      {/* Shared heart clip path, referenced by CSS clip-path on each <img>. */}
      <svg className="heart-clip-def" width="0" height="0">
        <defs>
          <clipPath id="heart-clip" clipPathUnits="objectBoundingBox">
            <path d={HEART_PATH} />
          </clipPath>
        </defs>
      </svg>
      {hearts.map((heart, i) => (
        <div className="heart-photo" style={heart.style} key={i}>
          <img src={heart.src} alt="" loading="lazy" style={{ objectPosition: heart.objectPosition }} />
        </div>
      ))}
    </div>
  );
}
