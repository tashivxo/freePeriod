import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: '#15803d', letterSpacing: '-2px' }}>
          freePeriod
        </div>
        <div style={{ fontSize: 28, color: '#166534', marginTop: 16 }}>
          AI-powered lesson plans for South African teachers
        </div>
      </div>
    ),
    { ...size }
  );
}