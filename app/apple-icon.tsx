import { ImageResponse } from 'next/og';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: `linear-gradient(135deg, ${CORAL} 0%, ${MUSTARD} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 82,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-3px',
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
