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

const BACKGROUND_COPY: Record<
  Locale,
  {
    background: string;
    backgroundDescription: string;
    backgroundBrand: string;
    backgroundRainbow: string;
    backgroundZenLocked: string;
  }
> = {
  en: {
    background: 'Background',
    backgroundDescription: 'Colour of the moving bands behind the app.',
    backgroundBrand: 'FreePeriod colours',
    backgroundRainbow: 'Multicolour',
    backgroundZenLocked: 'Turn Zen Mode off to change this.',
  },
  ar: {
    background: 'الخلفية',
    backgroundDescription: 'لون الأشرطة المتحركة خلف التطبيق.',
    backgroundBrand: 'ألوان FreePeriod',
    backgroundRainbow: 'متعدد الألوان',
    backgroundZenLocked: 'أوقف وضع الهدوء لتغيير هذا.',
  },
  es: {
    background: 'Fondo',
    backgroundDescription: 'Color de las bandas en movimiento detrás de la aplicación.',
    backgroundBrand: 'Colores FreePeriod',
    backgroundRainbow: 'Multicolor',
    backgroundZenLocked: 'Desactiva el Modo Zen para cambiar esto.',
  },
  fr: {
    background: 'Arrière-plan',
    backgroundDescription: 'Couleur des bandes en mouvement derrière l’application.',
    backgroundBrand: 'Couleurs FreePeriod',
    backgroundRainbow: 'Multicolore',
    backgroundZenLocked: 'Désactivez le Mode Zen pour modifier ceci.',
  },
  'zh-Hans': {
    background: '背景',
    backgroundDescription: '应用背后流动色带的颜色。',
    backgroundBrand: 'FreePeriod 色彩',
    backgroundRainbow: '多色',
    backgroundZenLocked: '关闭禅模式后即可更改。',
  },
};

describe('settings background copy', () => {
  it.each(LOCALES)('ships Background tile copy for %s', (locale) => {
    const settings = getMessages(locale).settings;
    const expected = BACKGROUND_COPY[locale];

    expect(settings.background).toBe(expected.background);
    expect(settings.backgroundDescription).toBe(expected.backgroundDescription);
    expect(settings.backgroundBrand).toBe(expected.backgroundBrand);
    expect(settings.backgroundRainbow).toBe(expected.backgroundRainbow);
    expect(settings.backgroundZenLocked).toBe(expected.backgroundZenLocked);
    expect(settings.backgroundBrand).toContain('FreePeriod');

    for (const value of Object.values(expected)) {
      expect(value).not.toContain('\u2014');
    }
  });
});

const UPLOAD_COPY: Record<
  Locale,
  {
    browse: string;
    errorAuth: string;
    errorNetwork: string;
    errorTooLarge: string;
    errorWrongType: string;
    errorGeneric: string;
    inputAriaTemplate: string;
    fileFallback: string;
    filesSuffix: string;
  }
> = {
  en: {
    browse: 'browse',
    errorAuth: 'Please sign in again to upload.',
    errorNetwork: 'Upload failed. Check your connection and try again.',
    errorTooLarge: '{name} is too large. The maximum size is {size}.',
    errorWrongType: 'This file type is not supported. Please choose a different file.',
    errorGeneric: "Couldn't upload this file. Please try again.",
    inputAriaTemplate: 'Upload lesson plan template',
    fileFallback: 'file',
    filesSuffix: 'files',
  },
  ar: {
    browse: 'تصفح',
    errorAuth: 'يرجى تسجيل الدخول مرة أخرى للرفع.',
    errorNetwork: 'فشل الرفع. تحقق من اتصالك وحاول مرة أخرى.',
    errorTooLarge: '{name} كبير جدا. الحد الأقصى {size}.',
    errorWrongType: 'نوع الملف غير مدعوم. يرجى اختيار ملف مختلف.',
    errorGeneric: 'تعذر رفع هذا الملف. يرجى المحاولة مرة أخرى.',
    inputAriaTemplate: 'رفع قالب خطة الدرس',
    fileFallback: 'ملف',
    filesSuffix: 'ملفات',
  },
  es: {
    browse: 'explorar',
    errorAuth: 'Vuelve a iniciar sesión para subir.',
    errorNetwork: 'Error al subir. Comprueba tu conexión e inténtalo de nuevo.',
    errorTooLarge: '{name} es demasiado grande. El tamaño máximo es {size}.',
    errorWrongType: 'Este tipo de archivo no es compatible. Elige otro archivo.',
    errorGeneric: 'No se pudo subir este archivo. Inténtalo de nuevo.',
    inputAriaTemplate: 'Subir plantilla de plan de clase',
    fileFallback: 'archivo',
    filesSuffix: 'archivos',
  },
  fr: {
    browse: 'parcourir',
    errorAuth: 'Veuillez vous reconnecter pour téléverser.',
    errorNetwork: 'Échec du téléversement. Vérifiez votre connexion et réessayez.',
    errorTooLarge: '{name} est trop volumineux. La taille maximale est {size}.',
    errorWrongType: 'Ce type de fichier n’est pas pris en charge. Veuillez en choisir un autre.',
    errorGeneric: 'Impossible de téléverser ce fichier. Veuillez réessayer.',
    inputAriaTemplate: 'Téléverser un modèle de plan de cours',
    fileFallback: 'fichier',
    filesSuffix: 'fichiers',
  },
  'zh-Hans': {
    browse: '浏览',
    errorAuth: '请重新登录后再上传。',
    errorNetwork: '上传失败。请检查网络连接后重试。',
    errorTooLarge: '{name} 太大。最大大小为 {size}。',
    errorWrongType: '不支持此文件类型。请选择其他文件。',
    errorGeneric: '无法上传此文件。请重试。',
    inputAriaTemplate: '上传教案模板',
    fileFallback: '文件',
    filesSuffix: '文件',
  },
};

describe('generate upload copy', () => {
  it.each(LOCALES)('ships DocumentUploadZone strings for %s', (locale) => {
    const upload = getMessages(locale).generate.upload;
    const expected = UPLOAD_COPY[locale];

    expect(upload.browse).toBe(expected.browse);
    expect(upload.errorAuth).toBe(expected.errorAuth);
    expect(upload.errorNetwork).toBe(expected.errorNetwork);
    expect(upload.errorTooLarge).toBe(expected.errorTooLarge);
    expect(upload.errorWrongType).toBe(expected.errorWrongType);
    expect(upload.errorGeneric).toBe(expected.errorGeneric);
    expect(upload.inputAriaTemplate).toBe(expected.inputAriaTemplate);
    expect(upload.fileFallback).toBe(expected.fileFallback);
    expect(upload.filesSuffix).toBe(expected.filesSuffix);

    expect(upload.inputAriaCurriculum).toBeTruthy();
    expect(upload.errorTooLarge).toContain('{name}');
    expect(upload.errorTooLarge).toContain('{size}');
    expect(upload.errorEmpty).toContain('{name}');
    expect(upload.errorNoText).toBeTruthy();
    expect(upload.errorTimeout).toBeTruthy();
    expect(upload.errorParse).toBeTruthy();
    expect(upload.uploadingFile).toContain('{name}');
    expect(upload.curriculumHeading).toBeTruthy();
    expect(upload.templateHeading).toBeTruthy();
    expect(upload.dragDropPrompt).toBeTruthy();
    expect(upload.uploading).toBeTruthy();
    expect(upload.parsing).toBeTruthy();
    expect(upload.helpMax).toContain('{size}');
    expect(upload.retry).toBeTruthy();
    expect(upload.retryAria).toContain('{name}');
    expect(upload.removeAria).toContain('{name}');
    expect(upload.uploadingFile).toContain('{name}');
    expect(upload.readingFile).toContain('{name}');
    expect(upload.extractedText).toBeTruthy();
    expect(upload.extractedRegion).toBeTruthy();
    expect(upload.selectedFile).toBeTruthy();
    expect(upload.ready).toBeTruthy();
    expect(upload.errorEmpty).toBeTruthy();

    for (const value of Object.values(upload)) {
      expect(value).not.toContain('\u2014');
    }
  });

  it('keeps Arabic and Chinese as real translations, not English copies', () => {
    const en = getMessages('en').generate.upload;
    const ar = getMessages('ar').generate.upload;
    const zh = getMessages('zh-Hans').generate.upload;

    expect(ar.browse).not.toBe(en.browse);
    expect(ar.errorAuth).not.toBe(en.errorAuth);
    expect(zh.browse).not.toBe(en.browse);
    expect(zh.errorNetwork).not.toBe(en.errorNetwork);
    expect(ar.dragDropPrompt).toMatch(/[\u0600-\u06FF]/);
    expect(zh.dragDropPrompt).toMatch(/[\u4e00-\u9fff]/);
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

type ExtraMessages = {
  history?: {
    title?: string;
    searchPlaceholder?: string;
    planLesson?: string;
    allSubjects?: string;
  };
  onboarding?: Record<string, string>;
  countries?: { common?: string; all?: string };
};

function extra(locale: Locale): ExtraMessages {
  return getMessages(locale) as unknown as ExtraMessages;
}

const HISTORY_SEARCH: Record<Locale, string> = {
  en: 'Search by title...',
  ar: 'ابحث حسب العنوان...',
  es: 'Buscar por título...',
  fr: 'Rechercher par titre...',
  'zh-Hans': '按标题搜索...',
};

const COUNTRY_GROUPS: Record<Locale, { common: string; all: string }> = {
  en: { common: 'Common', all: 'All countries' },
  ar: { common: 'شائع', all: 'كل البلدان' },
  es: { common: 'Comunes', all: 'Todos los países' },
  fr: { common: 'Courants', all: 'Tous les pays' },
  'zh-Hans': { common: '常用', all: '所有国家' },
};

const ONBOARDING_REQUIRED: Record<Locale, { whereDoYouTeach: string; selectCurriculum: string }> = {
  en: {
    whereDoYouTeach: 'Where do you teach?',
    selectCurriculum: 'Select your curriculum',
  },
  ar: {
    whereDoYouTeach: 'أين تُدرّس؟',
    selectCurriculum: 'اختر منهجك',
  },
  es: {
    whereDoYouTeach: '¿Dónde das clase?',
    selectCurriculum: 'Selecciona tu currículo',
  },
  fr: {
    whereDoYouTeach: 'Où enseignez-vous ?',
    selectCurriculum: 'Sélectionnez votre programme',
  },
  'zh-Hans': {
    whereDoYouTeach: '你在哪里任教？',
    selectCurriculum: '选择你的课程纲要',
  },
};

describe('history search copy', () => {
  it.each(LOCALES)('ships Search by title placeholder for %s', (locale) => {
    const placeholder = extra(locale).history?.searchPlaceholder;
    expect(placeholder).toBe(HISTORY_SEARCH[locale]);
    expect(placeholder).not.toContain('\u2014');
  });
});

describe('onboarding copy', () => {
  it.each(LOCALES)('ships onboarding headings and country group labels for %s', (locale) => {
    const onboarding = extra(locale).onboarding;
    const countries = extra(locale).countries;
    const expected = ONBOARDING_REQUIRED[locale];
    const groups = COUNTRY_GROUPS[locale];

    expect(onboarding?.whereDoYouTeach).toBe(expected.whereDoYouTeach);
    expect(onboarding?.selectCurriculum).toBe(expected.selectCurriculum);
    expect(onboarding?.subjectAria).toBeTruthy();
    expect(onboarding?.whatDoYouTeach).toBeTruthy();
    expect(onboarding?.next).toBeTruthy();
    expect(onboarding?.back).toBeTruthy();
    expect(onboarding?.finish).toBeTruthy();
    expect(countries?.common).toBe(groups.common);
    expect(countries?.all).toBe(groups.all);

    for (const value of Object.values(onboarding ?? {})) {
      expect(value).not.toContain('\u2014');
    }
    expect(groups.common).not.toContain('\u2014');
    expect(groups.all).not.toContain('\u2014');
  });

  it('keeps Arabic and Chinese as real translations, not English copies', () => {
    const en = extra('en').onboarding;
    const ar = extra('ar').onboarding;
    const zh = extra('zh-Hans').onboarding;

    expect(ar?.whereDoYouTeach).not.toBe(en?.whereDoYouTeach);
    expect(zh?.selectCurriculum).not.toBe(en?.selectCurriculum);
    expect(ar?.whereDoYouTeach).toMatch(/[\u0600-\u06FF]/);
    expect(zh?.selectCurriculum).toMatch(/[\u4e00-\u9fff]/);
  });
});

const GENERATE_FORM_KEYS = [
  'heading',
  'documentTitle',
  'subject',
  'grade',
  'curriculum',
  'duration',
  'selectSubject',
  'selectGrade',
  'selectCurriculum',
  'selectDuration',
  'customDuration',
  'durationMinutes',
  'durationShort',
  'focusLabel',
  'focusPlaceholder',
  'modeLabel',
  'selectMode',
  'modeFast',
  'modeQuality',
  'modeFastDescription',
  'modeQualityDescription',
  'upgradeToPro',
  'unlockQuality',
  'submit',
  'generating',
  'waitingForUpload',
  'alignmentTitle',
  'alignmentBody',
  'alignmentAria',
  'errorRequestFailed',
  'errorNoStream',
  'errorIncomplete',
  'errorConnectionLost',
] as const;

describe('generate form copy', () => {
  it.each(LOCALES)('ships generate chrome, mode, and alignment strings for %s', (locale) => {
    const generate = getMessages(locale).generate as unknown as Record<string, string>;
    for (const key of GENERATE_FORM_KEYS) {
      expect(generate[key]).toBeTruthy();
      expect(generate[key]).not.toContain('\u2014');
    }
    expect(generate.durationMinutes).toContain('{minutes}');
    expect(generate.durationShort).toContain('{minutes}');
    expect(generate.documentTitle).toContain('FreePeriod');
  });

  it('keeps Arabic and Chinese generate chrome as real translations', () => {
    const en = getMessages('en').generate as unknown as Record<string, string>;
    const ar = getMessages('ar').generate as unknown as Record<string, string>;
    const zh = getMessages('zh-Hans').generate as unknown as Record<string, string>;

    expect(ar.heading).not.toBe(en.heading);
    expect(ar.focusLabel).not.toBe(en.focusLabel);
    expect(ar.modeFast).not.toBe(en.modeFast);
    expect(zh.heading).not.toBe(en.heading);
    expect(zh.submit).not.toBe(en.submit);
    expect(ar.heading).toMatch(/[\u0600-\u06FF]/);
    expect(zh.heading).toMatch(/[\u4e00-\u9fff]/);
  });
});

const HISTORY_DOCUMENT_TITLE: Record<Locale, string> = {
  en: 'Lesson Plan History | FreePeriod',
  ar: 'سجل خطط الدروس | FreePeriod',
  es: 'Historial de planes de clase | FreePeriod',
  fr: 'Historique des plans de cours | FreePeriod',
  'zh-Hans': '教案历史 | FreePeriod',
};

const SETTINGS_DOCUMENT_TITLE: Record<Locale, string> = {
  en: 'Settings | FreePeriod',
  ar: 'الإعدادات | FreePeriod',
  es: 'Ajustes | FreePeriod',
  fr: 'Paramètres | FreePeriod',
  'zh-Hans': '设置 | FreePeriod',
};

const HISTORY_DELETE_ARIA: Record<Locale, string> = {
  en: 'Delete {title}',
  ar: 'حذف {title}',
  es: 'Eliminar {title}',
  fr: 'Supprimer {title}',
  'zh-Hans': '删除 {title}',
};

const SETTINGS_PLAN_FREE: Record<Locale, string> = {
  en: 'Free',
  ar: 'مجاني',
  es: 'Gratis',
  fr: 'Gratuit',
  'zh-Hans': '免费',
};

describe('history and settings leftover English copy', () => {
  it.each(LOCALES)('ships history documentTitle and deleteAria for %s', (locale) => {
    const history = getMessages(locale).history as unknown as Record<string, string>;
    expect(history.documentTitle).toBe(HISTORY_DOCUMENT_TITLE[locale]);
    expect(history.documentTitle).toContain('FreePeriod');
    expect(history.documentTitle).toContain(' | ');
    expect(history.documentTitle).not.toContain('\u2014');
    expect(history.deleteAria).toBe(HISTORY_DELETE_ARIA[locale]);
    expect(history.deleteAria).toContain('{title}');
    expect(history.deleteAria).not.toContain('\u2014');
  });

  it.each(LOCALES)('ships settings documentTitle and plan names for %s', (locale) => {
    const settings = getMessages(locale).settings as unknown as Record<string, string>;
    expect(settings.documentTitle).toBe(SETTINGS_DOCUMENT_TITLE[locale]);
    expect(settings.documentTitle).toContain('FreePeriod');
    expect(settings.documentTitle).toContain(' | ');
    expect(settings.documentTitle).not.toContain('\u2014');
    expect(settings.planFree).toBe(SETTINGS_PLAN_FREE[locale]);
    expect(settings.planPro).toBe('Pro');
    expect(settings.planProPlus).toBe('Pro+');
    expect(settings.planWithTrial).toContain('{plan}');
    expect(settings.planWithTrial).toContain('{days}');
    expect(settings.planWithTrialOne).toContain('{plan}');
    expect(settings.planWithTrialOne).toContain('{days}');
    expect(settings.planFree).not.toContain('\u2014');
    expect(settings.planPro).not.toContain('\u2014');
    expect(settings.planProPlus).not.toContain('\u2014');
  });

  it('keeps Arabic and Chinese history/settings leftovers as real translations', () => {
    const enHistory = getMessages('en').history as unknown as Record<string, string>;
    const arHistory = getMessages('ar').history as unknown as Record<string, string>;
    const zhHistory = getMessages('zh-Hans').history as unknown as Record<string, string>;
    const enSettings = getMessages('en').settings as unknown as Record<string, string>;
    const arSettings = getMessages('ar').settings as unknown as Record<string, string>;
    const zhSettings = getMessages('zh-Hans').settings as unknown as Record<string, string>;

    expect(arHistory.documentTitle).not.toBe(enHistory.documentTitle);
    expect(zhHistory.documentTitle).not.toBe(enHistory.documentTitle);
    expect(arHistory.deleteAria).not.toBe(enHistory.deleteAria);
    expect(zhHistory.deleteAria).not.toBe(enHistory.deleteAria);
    expect(arSettings.documentTitle).not.toBe(enSettings.documentTitle);
    expect(zhSettings.documentTitle).not.toBe(enSettings.documentTitle);
    expect(arSettings.planFree).not.toBe(enSettings.planFree);
    expect(zhSettings.planFree).not.toBe(enSettings.planFree);

    expect(arHistory.documentTitle).toMatch(/[\u0600-\u06FF]/);
    expect(arHistory.deleteAria).toMatch(/[\u0600-\u06FF]/);
    expect(arSettings.documentTitle).toMatch(/[\u0600-\u06FF]/);
    expect(arSettings.planFree).toMatch(/[\u0600-\u06FF]/);
    expect(zhHistory.documentTitle).toMatch(/[\u4e00-\u9fff]/);
    expect(zhHistory.deleteAria).toMatch(/[\u4e00-\u9fff]/);
    expect(zhSettings.documentTitle).toMatch(/[\u4e00-\u9fff]/);
    expect(zhSettings.planFree).toMatch(/[\u4e00-\u9fff]/);
  });
});

describe('dashboard leftover English copy', () => {
  it.each(LOCALES)('ships dashboard greeting and empty-state strings for %s', (locale) => {
    const dashboard = getMessages(locale).dashboard;
    expect(dashboard.greeting).toContain('{name}');
    expect(dashboard.greetingFallback).toBeTruthy();
    expect(dashboard.newLessonPlan).toBeTruthy();
    expect(dashboard.noLessons).toBeTruthy();
    expect(dashboard.generateLesson).toBeTruthy();
    expect(dashboard.greeting).not.toContain('\u2014');
    expect(dashboard.noLessons).not.toContain('\u2014');
  });

  it('keeps Arabic and Chinese dashboard copy as real translations', () => {
    const en = getMessages('en').dashboard;
    const ar = getMessages('ar').dashboard;
    const zh = getMessages('zh-Hans').dashboard;

    expect(ar.greeting).not.toBe(en.greeting);
    expect(zh.newLessonPlan).not.toBe(en.newLessonPlan);
    expect(ar.greeting).toMatch(/[\u0600-\u06FF]/);
    expect(zh.generateLesson).toMatch(/[\u4e00-\u9fff]/);
  });
});

const CONTINUE_WITH_GOOGLE: Record<Locale, string> = {
  en: 'Continue with Google',
  ar: 'المتابعة باستخدام Google',
  es: 'Continuar con Google',
  fr: 'Continuer avec Google',
  'zh-Hans': '使用 Google 继续',
};

const NOT_FOUND_DOCUMENT_TITLE: Record<Locale, string> = {
  en: 'Page not found | FreePeriod',
  ar: 'الصفحة غير موجودة | FreePeriod',
  es: 'Página no encontrada | FreePeriod',
  fr: 'Page introuvable | FreePeriod',
  'zh-Hans': '未找到页面 | FreePeriod',
};

describe('auth continue with Google copy', () => {
  it.each(LOCALES)('ships continueWithGoogle for %s', (locale) => {
    const auth = getMessages(locale).auth as unknown as Record<string, string>;
    expect(auth.continueWithGoogle).toBe(CONTINUE_WITH_GOOGLE[locale]);
    expect(auth.continueWithGoogle).not.toContain('\u2014');
  });

  it('keeps Arabic and Chinese Google labels as real translations', () => {
    expect(CONTINUE_WITH_GOOGLE.ar).not.toBe(CONTINUE_WITH_GOOGLE.en);
    expect(CONTINUE_WITH_GOOGLE['zh-Hans']).not.toBe(CONTINUE_WITH_GOOGLE.en);
    expect(CONTINUE_WITH_GOOGLE.ar).toMatch(/[\u0600-\u06FF]/);
    expect(CONTINUE_WITH_GOOGLE['zh-Hans']).toMatch(/[\u4e00-\u9fff]/);
  });
});

describe('404 document title copy', () => {
  it.each(LOCALES)('ships status.notFoundDocumentTitle for %s', (locale) => {
    const status = getMessages(locale).status as unknown as Record<string, string>;
    expect(status.notFoundDocumentTitle).toBe(NOT_FOUND_DOCUMENT_TITLE[locale]);
    expect(status.notFoundDocumentTitle).toContain('FreePeriod');
    expect(status.notFoundDocumentTitle).toContain(' | ');
    expect(status.notFoundDocumentTitle).not.toContain('\u2014');
  });
});

describe('settings usage copy', () => {
  it.each(LOCALES)('ships one interpolated usage string for %s', (locale) => {
    const settings = getMessages(locale).settings as unknown as Record<string, string>;
    expect(settings.usageThisPeriod).toContain('{used}');
    expect(settings.usageThisPeriod).toContain('{limit}');
    expect(settings.usageUnlimited).toContain('{used}');
    expect(settings.usageThisPeriod).not.toContain('\u2014');
    expect(settings.usageUnlimited).not.toContain('\u2014');
  });

  it('keeps Arabic and Chinese usage lines as real translations', () => {
    const en = getMessages('en').settings as unknown as Record<string, string>;
    const ar = getMessages('ar').settings as unknown as Record<string, string>;
    const zh = getMessages('zh-Hans').settings as unknown as Record<string, string>;

    expect(ar.usageThisPeriod).not.toBe(en.usageThisPeriod);
    expect(zh.usageThisPeriod).not.toBe(en.usageThisPeriod);
    expect(ar.usageThisPeriod).toMatch(/[\u0600-\u06FF]/);
    expect(zh.usageThisPeriod).toMatch(/[\u4e00-\u9fff]/);
  });
});

