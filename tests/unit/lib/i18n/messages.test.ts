import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

const LESSON_EDIT_COPY: Record<
  Locale,
  { edited: string; savedToast: string; discardChanges: string }
> = {
  en: {
    edited: 'Edited',
    savedToast: 'Saved. Downloads use your edits.',
    discardChanges: 'Discard changes?',
  },
  ar: {
    edited: 'تم التعديل',
    savedToast: 'تم الحفظ. التنزيلات تستخدم تعديلاتك.',
    discardChanges: 'هل تريد تجاهل التغييرات؟',
  },
  es: {
    edited: 'Editado',
    savedToast: 'Guardado. Las descargas usan tus ediciones.',
    discardChanges: '¿Descartar cambios?',
  },
  fr: {
    edited: 'Modifié',
    savedToast: 'Enregistré. Les téléchargements utilisent vos modifications.',
    discardChanges: 'Ignorer les modifications ?',
  },
  'zh-Hans': {
    edited: '已编辑',
    savedToast: '已保存。下载将使用你的修改。',
    discardChanges: '放弃更改？',
  },
};


const FREEPERIOD_TEMPLATE_EXPORT_DESC: Record<Locale, string> = {
  en: 'Download the Free Period template lesson plan or fill in your own template.',
  ar: 'حمّل خطة الدرس بقالب Free Period template أو املأ قالبك الخاص.',
  es: 'Descarga el plan de clase de la plantilla Free Period template o rellena tu propia plantilla.',
  fr: 'Téléchargez le plan de cours modèle Free Period template ou remplissez votre propre modèle.',
  'zh-Hans': '下载 Free Period template 教案，或填写你自己的模板。',
};

describe('landing.featureExportAnywhereDesc', () => {
  it('names the Free Period template instead of a generic DOCX download', () => {
    expect(getMessages('en').landing.featureExportAnywhereDesc).toBe(
      FREEPERIOD_TEMPLATE_EXPORT_DESC.en,
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).toContain(
      'Free Period template',
    );
    expect(getMessages('en').landing.featureExportAnywhereDesc).not.toContain(
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

  it.each(LOCALES)('aligns %s with Free Period template vs own-template naming', (locale) => {
    const desc = getMessages(locale).landing.featureExportAnywhereDesc;
    expect(desc).toBe(FREEPERIOD_TEMPLATE_EXPORT_DESC[locale]);
    expect(desc).toContain('Free Period template');
    expect(desc).not.toMatch(/DOCX/i);
  });
});

describe('lesson edit copy', () => {
  it.each(LOCALES)('ships Edited, saved toast, and discard copy for %s', (locale) => {
    const lesson = getMessages(locale).lesson;
    const expected = LESSON_EDIT_COPY[locale];

    expect(lesson.edited).toBe(expected.edited);
    expect(lesson.savedToast).toBe(expected.savedToast);
    expect(lesson.discardChanges).toBe(expected.discardChanges);
    expect(lesson.savedToast).not.toContain('\u2014');
    expect(lesson.discardChanges).not.toContain('\u2014');
  });
});

