import { ImageResponse } from 'next/og';
import { BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/utils/brand-colors';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const pictogram = getPictogramDataUri();

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
          background: BACKGROUND,
          fontFamily: 'serif',
        }}
      >
        <img
          src={pictogram}
          width={120}
          height={120}
          style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 24 }}
        />
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            letterSpacing: '-2px',
          }}
        >
          FreePeriod
        </div>
        <div style={{ fontSize: 28, color: TEXT_SECONDARY, marginTop: 16 }}>
          AI lesson planner for teachers
        </div>
      </div>
    ),
    { ...size }
  );
}
