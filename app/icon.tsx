import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          borderRadius: 6,
          fontFamily: 'serif',
          fontSize: 20,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.5px',
        }}
      >
        <div>
          fp
        </div>
      </div>
    ),
    { ...size }
  );
}
