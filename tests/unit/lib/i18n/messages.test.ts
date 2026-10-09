import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

const FREEPERIOD_TEMPLATE_EXPORT_DESC: Record<Locale, string> = {
  en: 'Download the FreePeriod template lesson plan or fill in your own template.',
  ar: 'حمّل خطة الدرس بقالب FreePeriod أو املأ قالبك الخاص.',
  es: 'Descarga el plan de clase de la plantilla FreePeriod o rellena tu propia plantilla.',
  fr: 'Téléchargez le plan de cours modèle FreePeriod ou remplissez votre propre modèle.',
  'zh-Hans': '下载 FreePeriod 模板教案，或填写你自己的模板。',
};

describe('landing.featureExportAnywhereDesc', () => {
  it('names the FreePeriod template instead of a generic DOCX download', () => {
    expect(getMessages('en').landing.featureExportAnywhereDesc).toBe(
      FREEPERIOD_TEMPLATE_EXPORT_DESC.en,
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).not.toMatch(/DOCX/i);
  });

  it.each(LOCALES)('aligns %s with FreePeriod template vs own-template naming', (locale) => {
    const desc = getMessages(locale).landing.featureExportAnywhereDesc;
    expect(desc).toBe(FREEPERIOD_TEMPLATE_EXPORT_DESC[locale]);
    expect(desc).toContain('FreePeriod');
    expect(desc).not.toMatch(/DOCX/i);
  });
});
