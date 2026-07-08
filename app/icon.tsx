import { ImageResponse } from 'next/og';
import { BACKGROUND } from '@/lib/utils/brand-colors';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const pictogram = getPictogramDataUri();
  const markSize = 26;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUND,
        }}
      >
        <img
          src={pictogram}
          width={markSize}
          height={markSize}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>
    ),
    { ...size }
  );
}
