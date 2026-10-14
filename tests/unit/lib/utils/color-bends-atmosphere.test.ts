import { COLOR_BENDS_ATMOSPHERE_STORAGE_KEY } from '@/lib/utils/brand-colors';
import {
  isMiddleEastAtmosphereDefault,
  MIDDLE_EAST_CURRICULA,
  resolveColorBendsAtmosphere,
} from '@/lib/utils/color-bends-atmosphere';
import {
  COMMON_COUNTRY_CODES,
  COMMON_COUNTRY_ITEMS,
  COUNTRY_ITEMS,
  MIDDLE_EAST_COUNTRY_CODES,
} from '@/lib/utils/countries';

describe('COLOR_BENDS_ATMOSPHERE_STORAGE_KEY', () => {
  it('is the sticky override key', () => {
    expect(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY).toBe('fp-color-bends-atmosphere');
  });
});

describe('isMiddleEastAtmosphereDefault', () => {
  it('is true for an ME country alone', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: 'AE', curriculum: 'GCSE', locale: 'en' }),
    ).toBe(true);
  });

  it('is true for an ME curriculum alone', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: null, curriculum: 'UAE MOE', locale: 'en' }),
    ).toBe(true);
    expect(
      isMiddleEastAtmosphereDefault({
        country: null,
        curriculum: 'ADEK (Abu Dhabi)',
        locale: 'en',
      }),
    ).toBe(true);
  });

  it('is true for Arabic locale alone', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: 'GB', curriculum: 'GCSE', locale: 'ar' }),
    ).toBe(true);
  });

  it('is false when country, curriculum, and locale all miss', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: 'GB', curriculum: 'GCSE', locale: 'en' }),
    ).toBe(false);
  });

  it('is false when every signal is null', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: null, curriculum: null, locale: null }),
    ).toBe(false);
  });

  it('matches a lowercase country code', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: 'ae', curriculum: 'GCSE', locale: 'en' }),
    ).toBe(true);
  });

  it('does not treat ar-AE or a custom curriculum as Middle East', () => {
    expect(
      isMiddleEastAtmosphereDefault({ country: 'GB', curriculum: 'GCSE', locale: 'ar-AE' }),
    ).toBe(false);
    expect(
      isMiddleEastAtmosphereDefault({ country: 'GB', curriculum: 'Saudi', locale: 'en' }),
    ).toBe(false);
  });
});

describe('resolveColorBendsAtmosphere', () => {
  it('returns brand when any single ME signal is true', () => {
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: 'AE',
        curriculum: 'GCSE',
        locale: 'en',
      }),
    ).toBe('brand');
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: null,
        curriculum: 'UAE MOE',
        locale: 'en',
      }),
    ).toBe('brand');
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: 'GB',
        curriculum: 'GCSE',
        locale: 'ar',
      }),
    ).toBe('brand');
  });

  it('returns rainbow when no ME signal is true', () => {
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: 'GB',
        curriculum: 'GCSE',
        locale: 'en',
      }),
    ).toBe('rainbow');
  });

  it('returns rainbow when country, curriculum, and locale are null', () => {
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: null,
        curriculum: null,
        locale: null,
      }),
    ).toBe('rainbow');
  });

  it('lets an explicit override win', () => {
    expect(
      resolveColorBendsAtmosphere({
        override: 'rainbow',
        country: 'AE',
        curriculum: 'UAE MOE',
        locale: 'ar',
      }),
    ).toBe('rainbow');
    expect(
      resolveColorBendsAtmosphere({
        override: 'brand',
        country: 'GB',
        curriculum: 'GCSE',
        locale: 'en',
      }),
    ).toBe('brand');
  });

  it('still matches a lowercase country code', () => {
    expect(
      resolveColorBendsAtmosphere({
        override: null,
        country: 'ae',
        curriculum: 'GCSE',
        locale: 'en',
      }),
    ).toBe('brand');
  });
});

describe('country lists', () => {
  it('ships the full ISO alpha-2 list as picker items', () => {
    expect(COUNTRY_ITEMS).toHaveLength(249);
    expect(new Set(COUNTRY_ITEMS.map((item) => item.value)).size).toBe(249);
    for (const item of COUNTRY_ITEMS) {
      expect(item.value).toMatch(/^[A-Z]{2}$/);
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('keeps the §10.3 common group in display order', () => {
    expect(COMMON_COUNTRY_CODES).toEqual(['AE', 'SA', 'GB', 'US', 'IN', 'AU', 'ZA']);
    expect(COMMON_COUNTRY_ITEMS.map((item) => item.name)).toEqual([
      'United Arab Emirates',
      'Saudi Arabia',
      'United Kingdom',
      'United States',
      'India',
      'Australia',
      'South Africa',
    ]);
  });

  it('locks the §10.1 Middle East country and curriculum lists', () => {
    expect(MIDDLE_EAST_COUNTRY_CODES).toEqual([
      'AE',
      'BH',
      'KW',
      'OM',
      'QA',
      'SA',
      'IQ',
      'JO',
      'LB',
      'SY',
      'PS',
      'YE',
      'IR',
      'EG',
    ]);
    expect(MIDDLE_EAST_CURRICULA).toEqual(['UAE MOE', 'ADEK (Abu Dhabi)']);
    const codes = new Set(COUNTRY_ITEMS.map((item) => item.value));
    for (const code of MIDDLE_EAST_COUNTRY_CODES) {
      expect(codes.has(code)).toBe(true);
    }
  });
});
