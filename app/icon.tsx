import { ImageResponse } from 'next/og';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${CORAL} 0%, ${MUSTARD} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          fp
        </span>
      </div>
    ),
    { ...size }
  );
}
