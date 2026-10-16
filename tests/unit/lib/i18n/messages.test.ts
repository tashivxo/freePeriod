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
  }
> = {
  en: {
    browse: 'browse',
    errorAuth: 'Please sign in again to upload.',
    errorNetwork: 'Upload failed. Check your connection and try again.',
    errorTooLarge: 'This file is too large. Please choose a smaller file.',
    errorWrongType: 'This file type is not supported. Please choose a different file.',
    errorGeneric: "Couldn't upload this file. Please try again.",
  },
  ar: {
    browse: 'تصفح',
    errorAuth: 'يرجى تسجيل الدخول مرة أخرى للرفع.',
    errorNetwork: 'فشل الرفع. تحقق من اتصالك وحاول مرة أخرى.',
    errorTooLarge: 'هذا الملف كبير جدا. يرجى اختيار ملف أصغر.',
    errorWrongType: 'نوع الملف غير مدعوم. يرجى اختيار ملف مختلف.',
    errorGeneric: 'تعذر رفع هذا الملف. يرجى المحاولة مرة أخرى.',
  },
  es: {
    browse: 'explorar',
    errorAuth: 'Vuelve a iniciar sesión para subir.',
    errorNetwork: 'Error al subir. Comprueba tu conexión e inténtalo de nuevo.',
    errorTooLarge: 'Este archivo es demasiado grande. Elige uno más pequeño.',
    errorWrongType: 'Este tipo de archivo no es compatible. Elige otro archivo.',
    errorGeneric: 'No se pudo subir este archivo. Inténtalo de nuevo.',
  },
  fr: {
    browse: 'parcourir',
    errorAuth: 'Veuillez vous reconnecter pour téléverser.',
    errorNetwork: 'Échec du téléversement. Vérifiez votre connexion et réessayez.',
    errorTooLarge: 'Ce fichier est trop volumineux. Veuillez en choisir un plus petit.',
    errorWrongType: 'Ce type de fichier n’est pas pris en charge. Veuillez en choisir un autre.',
    errorGeneric: 'Impossible de téléverser ce fichier. Veuillez réessayer.',
  },
  'zh-Hans': {
    browse: '浏览',
    errorAuth: '请重新登录后再上传。',
    errorNetwork: '上传失败。请检查网络连接后重试。',
    errorTooLarge: '文件太大。请选择更小的文件。',
    errorWrongType: '不支持此文件类型。请选择其他文件。',
    errorGeneric: '无法上传此文件。请重试。',
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

