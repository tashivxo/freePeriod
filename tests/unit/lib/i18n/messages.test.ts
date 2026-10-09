import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

const FREEPERIOD_TEMPLATE_EXPORT_DESC: Record<Locale, string> = {
  en: 'Download the Free Period Template lesson plan or fill in your own template.',
  ar: 'حمّل خطة الدرس بقالب Free Period Template أو املأ قالبك الخاص.',
  es: 'Descarga el plan de clase de la plantilla Free Period Template o rellena tu propia plantilla.',
  fr: 'Téléchargez le plan de cours modèle Free Period Template ou remplissez votre propre modèle.',
  'zh-Hans': '下载 Free Period Template 教案，或填写你自己的模板。',
};

describe('landing.featureExportAnywhereDesc', () => {
  it('names the Free Period Template instead of a generic DOCX download', () => {
    expect(getMessages('en').landing.featureExportAnywhereDesc).toBe(
      FREEPERIOD_TEMPLATE_EXPORT_DESC.en,
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).toContain(
      'Free Period Template',
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).not.toContain(
      'free period template',
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).not.toMatch(/DOCX/i);
    expect(getMessages('en').landing.featureExportAnywhereDesc).not.toContain(
      'Download lesson plan (FreePeriod template)',
    );
  });

  it.each(LOCALES)('aligns %s with Free Period Template vs own-template naming', (locale) => {
    const desc = getMessages(locale).landing.featureExportAnywhereDesc;
    expect(desc).toBe(FREEPERIOD_TEMPLATE_EXPORT_DESC[locale]);
    expect(desc).toContain('Free Period Template');
    expect(desc).not.toMatch(/DOCX/i);
  });
});
