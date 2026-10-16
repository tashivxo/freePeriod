import { ADEK_PACK } from '@/lib/curriculum/packs/adek';
import { AQA_PACK } from '@/lib/curriculum/packs/aqa';
import { CAMBRIDGE_A_LEVEL_PACK } from '@/lib/curriculum/packs/cambridge-a-level';
import { CAMBRIDGE_IGCSE_PACK } from '@/lib/curriculum/packs/cambridge-igcse';
import { CAPS_PACK } from '@/lib/curriculum/packs/caps';
import { CBSE_PACK } from '@/lib/curriculum/packs/cbse';
import { COMMON_CORE_PACK } from '@/lib/curriculum/packs/common-core';
import { EDEXCEL_PACK } from '@/lib/curriculum/packs/edexcel';
import { GCSE_PACK } from '@/lib/curriculum/packs/gcse';
import { OCR_PACK } from '@/lib/curriculum/packs/ocr';
import { UAE_MOE_PACK } from '@/lib/curriculum/packs/uae-moe';

const PACKS = [
  ADEK_PACK, AQA_PACK, CAMBRIDGE_A_LEVEL_PACK, CAMBRIDGE_IGCSE_PACK, CAPS_PACK, CBSE_PACK,
  COMMON_CORE_PACK, EDEXCEL_PACK, GCSE_PACK, OCR_PACK, UAE_MOE_PACK,
];

describe('curriculum pack copy', () => {
  it.each(PACKS.map((p) => [p.id, p]))('%s displayName and helper text contain no em dash', (_id, pack) => {
    expect(pack.displayName).not.toContain('\u2014');
    expect(pack.uiHelperText ?? '').not.toContain('\u2014');
  });

  it.each(PACKS.map((p) => [p.id, p]))('%s displayName uses ", Guideline Pack"', (_id, pack) => {
    expect(pack.displayName).toMatch(/, Guideline Pack$/);
  });
});
