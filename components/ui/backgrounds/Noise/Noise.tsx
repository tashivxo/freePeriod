'use client';

import { useRef, useEffect } from 'react';
import './Noise.css';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

const Noise = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
}: NoiseProps) => {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = patternSize;
    canvas.height = patternSize;

    let frame = 0;
    let animationFrameId: number;

    function drawGrain() {
      animationFrameId = requestAnimationFrame(drawGrain);
      frame++;
      if (frame % patternRefreshInterval !== 0) return;

      const imageData = ctx!.createImageData(patternSize, patternSize);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 256);
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }
      ctx!.putImageData(imageData, 0, 0);
    }

    drawGrain();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [patternSize, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      ref={grainRef}
      className="noise-overlay"
      style={{
        imageRendering: 'pixelated',
        transform: `scale(${1 / (1 / (patternScaleX || 1))}, ${1 / (1 / (patternScaleY || 1))})`,
        transformOrigin: 'top left',
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default Noise;
