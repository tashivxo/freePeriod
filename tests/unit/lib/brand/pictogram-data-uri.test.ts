import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

describe('getPictogramDataUri', () => {
  it('returns a PNG data URI', () => {
    const uri = getPictogramDataUri();
    expect(uri).toMatch(/^data:image\/png;base64,/);
    expect(uri.length).toBeGreaterThan(100);
  });
});
