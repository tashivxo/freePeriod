import { ImageResponse } from 'next/og';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const pictogram = getPictogramDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={pictogram}
          width={32}
          height={32}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>
    ),
    { ...size }
  );
}
