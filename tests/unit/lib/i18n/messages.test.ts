import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

const LESSON_EDIT_COPY: Record<
  Locale,
  {
    edited: string;
    savedToast: string;
    discardEdits: string;
    leaveWithoutSaving: string;
    save: string;
    cancel: string;
    saveFailed: string;
  }
> = {
  en: {
    edited: 'Edited',
    savedToast: 'Saved. Downloads use your edits.',
    discardEdits: 'Discard your edits?',
    leaveWithoutSaving: 'Leave without saving your edits?',
    save: 'Save',
    cancel: 'Cancel',
    saveFailed: "Couldn't save, try again",
  },
  ar: {
    edited: 'تم التعديل',
    savedToast: 'تم الحفظ. التنزيلات تستخدم تعديلاتك.',
    discardEdits: 'هل تريد تجاهل تعديلاتك؟',
    leaveWithoutSaving: 'المغادرة دون حفظ تعديلاتك؟',
    save: 'حفظ',
    cancel: 'إلغاء',
    saveFailed: 'تعذر الحفظ، حاول مرة أخرى',
  },
  es: {
    edited: 'Editado',
    savedToast: 'Guardado. Las descargas usan tus ediciones.',
    discardEdits: '¿Descartar tus ediciones?',
    leaveWithoutSaving: '¿Salir sin guardar tus ediciones?',
    save: 'Guardar',
    cancel: 'Cancelar',
    saveFailed: 'No se pudo guardar, inténtalo de nuevo',
  },
  fr: {
    edited: 'Modifié',
    savedToast: 'Enregistré. Les téléchargements utilisent vos modifications.',
    discardEdits: 'Ignorer vos modifications ?',
    leaveWithoutSaving: 'Quitter sans enregistrer vos modifications ?',
    save: 'Enregistrer',
    cancel: 'Annuler',
    saveFailed: "Échec de l'enregistrement, réessayez",
  },
  'zh-Hans': {
    edited: '已编辑',
    savedToast: '已保存。下载将使用你的修改。',
    discardEdits: '放弃你的修改？',
    leaveWithoutSaving: '不保存修改并离开？',
    save: '保存',
    cancel: '取消',
    saveFailed: '无法保存，请重试',
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
  it.each(LOCALES)('ships Edited, saved toast, and edit-action copy for %s', (locale) => {
    const lesson = getMessages(locale).lesson;
    const expected = LESSON_EDIT_COPY[locale];

    expect(lesson.edited).toBe(expected.edited);
    expect(lesson.savedToast).toBe(expected.savedToast);
    expect(lesson.discardEdits).toBe(expected.discardEdits);
    expect(lesson.leaveWithoutSaving).toBe(expected.leaveWithoutSaving);
    expect(lesson.save).toBe(expected.save);
    expect(lesson.cancel).toBe(expected.cancel);
    expect(lesson.saveFailed).toBe(expected.saveFailed);

    for (const value of Object.values(expected)) {
      expect(value).not.toContain('\u2014');
    }
  });
});

