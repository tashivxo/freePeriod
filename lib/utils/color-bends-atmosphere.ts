import type { ColorBendsAtmosphere } from '@/lib/utils/brand-colors';
import { MIDDLE_EAST_COUNTRY_CODES } from '@/lib/utils/countries';

/** Exact `default_curriculum` presets from §10.1. Custom text does not match. */
export const MIDDLE_EAST_CURRICULA = ['UAE MOE', 'ADEK (Abu Dhabi)'] as const;

const MIDDLE_EAST_COUNTRY_CODE_SET = new Set<string>(MIDDLE_EAST_COUNTRY_CODES);
const MIDDLE_EAST_CURRICULUM_SET = new Set<string>(MIDDLE_EAST_CURRICULA);

export type ColorBendsAtmosphereSignals = {
  country: string | null;
  curriculum: string | null;
  locale: string | null;
};

export function isMiddleEastAtmosphereDefault({
  country,
  curriculum,
  locale,
}: ColorBendsAtmosphereSignals): boolean {
  const code = country?.toUpperCase();
  const countryMatch = code != null && MIDDLE_EAST_COUNTRY_CODE_SET.has(code);
  const curriculumMatch = curriculum != null && MIDDLE_EAST_CURRICULUM_SET.has(curriculum);
  return countryMatch || curriculumMatch || locale === 'ar';
}

export function resolveColorBendsAtmosphere({
  override,
  country,
  curriculum,
  locale,
}: ColorBendsAtmosphereSignals & {
  override: ColorBendsAtmosphere | null;
}): ColorBendsAtmosphere {
  if (override === 'brand' || override === 'rainbow') return override;
  return isMiddleEastAtmosphereDefault({ country, curriculum, locale }) ? 'brand' : 'rainbow';
}
