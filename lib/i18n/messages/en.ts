export const en = {
  nav: {
    dashboard: 'Dashboard',
    generate: 'Generate',
    history: 'History',
    settings: 'Settings',
    homeAriaLabel: 'FreePeriod home',
  },
  settings: {
    title: 'Settings',
    zenMode: 'Zen Mode',
    zenModeDescription: 'Are our colorful backgrounds too much for you? Try Zen Mode.',
    background: 'Background',
    backgroundDescription: 'Colour of the moving bands behind the app.',
    backgroundBrand: 'FreePeriod colours',
    backgroundRainbow: 'Multicolour',
    backgroundZenLocked: 'Turn Zen Mode off to change this.',
    language: 'Language',
    languageDescription: 'Website and new lesson plans use this language.',
    defaultSubject: 'Default Subject',
    selectSubject: 'Select subject',
    enterSubject: 'Enter subject',
    defaultGrade: 'Default Grade / Year Group',
    selectGrade: 'Select grade',
    defaultCurriculum: 'Default Curriculum',
    selectCurriculum: 'Select curriculum',
    enterCurriculum: 'Enter curriculum',
    country: 'Country',
    selectCountry: 'Select your country',
    save: 'Save Settings',
    saving: 'Saving...',
    saved: 'Settings saved!',
    saveFailed: 'Failed to save settings',
    account: 'Account',
    email: 'Email',
    plan: 'Plan',
    usage: 'Usage',
    usageThisPeriod: '{used} of {limit} used this period',
    usageUnlimited: '{used} generated this period (Unlimited)',
    manageSubscription: 'Manage subscription',
    logOut: 'Log out',
    deleteAccount: 'Delete account',
    deleteConfirmDescription:
      'Your account will be deactivated immediately. Personal data is permanently deleted after a 30-day grace period. Export any lesson plans you want to keep first.',
    deleteConfirmLabel: 'Type "DELETE" to confirm',
    deleting: 'Deleting...',
    confirmDeletion: 'Confirm deletion',
    cancel: 'Cancel',
    legal: 'Legal',
    legalDescription: 'How we handle your data and the rules for using FreePeriod.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
  },
  landing: {
    headerHome: 'Home',
    headerPricing: 'Pricing',
    headerSignIn: 'Sign in',
    backToHome: 'Back to home',
    heroHeadline1: 'Lesson plans in',
    heroHeadlineHighlight: 'seconds,',
    heroHeadline2: 'not hours',
    heroSub:
      'Upload your curriculum docs, describe what you need, and FreePeriod generates a complete, structured lesson plan you can edit and export.',
    heroCtaPrimary: 'Start for free',
    heroCtaSecondary: 'Sign in',
    heroStatTime: 'Avg. 15 seconds to generate',
    heroStatFree: 'Free to start',
    featuresTitle: 'Why Teachers Love FreePeriod',
    featuresSub: 'Structure you can trust, speed when you need it.',
    featureStructuredPlans: 'Structured Plans',
    featureStructuredPlansDesc:
      'Twelve sections covering objectives, activities, differentiation, and assessment, with consistent structure you can trust every time.',
    featureAiPowered: 'AI-Powered',
    featureAiPoweredDesc: 'Tailored to your subject, year group, and curriculum in seconds.',
    featureExportAnywhere: 'Export Anywhere',
    featureExportAnywhereDesc:
      'Download the Free Period template lesson plan or fill in your own template.',
    ctaHeadline: 'Ready to reclaim your evenings?',
    ctaSub: 'Join teachers who plan faster without sacrificing structure.',
    ctaBandTitle: 'Your plan, your way',
    ctaBandSub: 'Start from scratch, or send your template and AI fills it in.',
    conversionPoint1: '12 structured sections in every plan',
    conversionPoint2: 'Edit before you export',
    conversionPoint3: 'Free to start. No credit card required.',
    ctaButton: 'Start for free',
    footerNavAriaLabel: 'Legal and support',
    footerContact: 'Contact',
    footerTagline: 'Built for teachers, by teachers.',
    tryLightMode: 'Try light mode',
    tryDarkMode: 'Try dark mode',
    switchToLightMode: 'Switch to light mode',
    switchToDarkMode: 'Switch to dark mode',
  },
  generate: {
    planLanguageHint: 'New plans will be written in {language}',
    heading: 'Generate a Lesson',
    documentTitle: 'Generate | FreePeriod',
    subject: 'Subject',
    grade: 'Grade',
    curriculum: 'Curriculum',
    duration: 'Duration',
    selectSubject: 'Select subject',
    selectGrade: 'Select grade',
    selectCurriculum: 'Select curriculum (optional)',
    selectDuration: 'Select duration',
    customDuration: 'Custom',
    durationMinutes: '{minutes} min',
    durationShort: '{minutes}m',
    enterSubject: 'Enter subject',
    enterCurriculum: 'Enter curriculum',
    customDurationInput: 'How long is the lesson? (minutes)',
    focusLabel: 'Any specific focus or requirements? (optional)',
    focusPlaceholder: 'E.g. Include hands-on activities, emphasize critical thinking...',
    modeLabel: 'Generation mode',
    selectMode: 'Select generation mode',
    modeFast: 'Fast',
    modeQuality: 'Quality',
    modeFastDescription: 'Quicker plans for everyday lessons.',
    modeQualityDescription: 'More thorough plans. Takes a bit longer.',
    modeAria: 'Generation mode: {label}. {description}',
    upgradeToPro: 'Upgrade to Pro',
    unlockQuality: 'to unlock Quality mode.',
    qualityProOnly: '(Pro only)',
    qualityUpgradeMessage:
      'Quality mode is available on Pro and Pro+. Upgrade to unlock more thorough lesson plans.',
    submit: 'Generate Lesson Plan',
    generating: 'Generating...',
    waitingForUpload: 'Waiting for upload…',
    alignmentTitle: 'Curriculum alignment notice',
    alignmentTitleFor: 'Curriculum alignment notice for {curriculum}',
    alignmentBody:
      'FreePeriod provides AI-generated curriculum guidance, not verified curriculum compliance. Standards codes are only included when supported by an uploaded curriculum document. Verify the plan against your official requirements before an observation or submission.',
    alignmentAria: 'Curriculum accuracy notice',
    errorSelectSubject: 'Please select a subject',
    errorOneSubject: 'Please enter one subject only',
    errorSelectGrade: 'Please select a grade',
    errorDurationRange: 'Enter a duration between {min} and {max} minutes',
    upload: {
      curriculumHeading: 'Curriculum Document',
      templateHeading: 'Lesson Plan Template',
      dragDropPrompt: 'Drag and drop a file here, or',
      browse: 'browse',
      uploading: 'Uploading…',
      parsing: 'Reading document…',
      helpMax: 'Max {size}',
      retry: 'Retry',
      retryAria: 'Retry upload of {name}',
      removeAria: 'Remove {name}',
      uploadingFile: 'Uploading {name}',
      readingFile: 'Reading {name}',
      extractedText: 'Extracted text sent to generation',
      extractedRegion: 'Extracted curriculum text',
      selectedFile: 'Selected file',
      ready: 'Uploaded. Ready to generate.',
      inputAriaCurriculum: 'Upload curriculum document',
      inputAriaTemplate: 'Upload lesson plan template',
      fileFallback: 'file',
      filesSuffix: 'files',
      errorAuth: 'Please sign in again to upload.',
      errorTooLarge: '{name} is too large. The maximum size is {size}.',
      errorWrongType: 'This file type is not supported. Please choose a different file.',
      errorEmpty: '{name} is empty. Please choose a file with content.',
      errorNetwork: 'Upload failed. Check your connection and try again.',
      errorNoText:
        'No extractable text was found. If this is a scanned PDF, upload a text-based file instead.',
      errorTimeout:
        'This document is taking too long to read. Try a smaller file, or wait a moment and try again.',
      errorParse: 'The document could not be processed. Please try a different file.',
      errorGeneric: "Couldn't upload this file. Please try again.",
    },
  },
  pricing: {
    title: 'Plans for every classroom',
    subtitle: "Start free, upgrade when you're ready. No credit card required.",
    billingPeriodAria: 'Billing period',
    monthly: 'Monthly',
    annual: 'Annual',
    savePercent: 'Save 20%',
    mostPopular: 'Most Popular',
    freePrice: 'Free',
    perMonth: '/mo',
    billedAnnually: 'Billed as {amount}/yr',
    trustFooter: 'Paid plans include a 30-day free trial. Cancel anytime. No hidden fees.',
    checkoutRedirecting: 'Opening checkout…',
    checkoutSettingUp: 'Setting up checkout…',
    checkoutError: "Couldn't open checkout, try again",
    plans: {
      free: {
        name: 'Free',
        description: 'Try FreePeriod with no commitment.',
        feature1: '3 lesson plans per month',
        feature2: 'Fast mode',
        feature3: 'PDF, DOCX, XLSX upload',
        feature4: 'DOCX export',
        feature5: 'Filled-in template download',
        feature6: 'Community support',
        cta: 'Start for free',
      },
      pro: {
        name: 'Pro',
        description: 'Weekly planners: up to 20 AI plans a month, Fast and Quality.',
        feature1: 'Everything in Free',
        feature2: '20 lesson plans per month',
        feature3: 'Fast and Quality modes',
        feature4: 'OCR text extraction',
        feature5: 'Priority support',
        cta: 'Start Pro',
      },
      pro_plus: {
        name: 'Pro+',
        description: 'Daily planners: unlimited lesson plans, no monthly cap.',
        feature1: 'Unlimited lesson plans',
        feature2: 'Everything in Pro',
        cta: 'Start Pro+',
      },
    },
  },
  auth: {
    confirmPassword: 'Confirm password',
    confirmPasswordRequired: 'Please confirm your password',
    passwordsDoNotMatch: 'Passwords do not match',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    showConfirmPassword: 'Show confirm password',
    hideConfirmPassword: 'Hide confirm password',
  },
  lesson: {
    edited: 'Edited',
    savedToast: 'Saved. Downloads use your edits.',
    discardEdits: 'Discard your edits?',
    leaveWithoutSaving: 'Leave without saving your edits?',
    save: 'Save',
    cancel: 'Cancel',
    saveFailed: "Couldn't save, try again",
  },
  history: {
    title: 'Lesson Plan History',
    searchPlaceholder: 'Search by title...',
    searchAriaLabel: 'Search lessons by title',
    planLesson: 'Plan Lesson',
    allSubjects: 'All subjects',
    nothingFound: 'Nothing found, try a different search.',
    noLessons: 'No lessons yet.',
    generateALesson: 'Generate a lesson',
  },
  grades: {
    numbered: 'Grade {n}',
    year: 'Year {n}',
    kindergarten: 'Kindergarten',
    preK: 'Pre-K',
  },
  countries: {
    common: 'Common',
    all: 'All countries',
  },
  onboarding: {
    subtitle: 'Set up your teaching profile',
    whatDoYouTeach: 'What do you teach?',
    pickSubjectHint: 'Pick one subject, you can change this anytime in settings.',
    otherSubject: 'Other subject...',
    next: 'Next',
    whatGrade: 'What grade do you teach?',
    gradeLevel: 'Grade Level',
    selectGrade: 'Select a grade...',
    back: 'Back',
    whereDoYouTeach: 'Where do you teach?',
    changeInSettings: 'You can change this in Settings.',
    selectCountry: 'Select your country',
    selectCurriculum: 'Select your curriculum',
    curriculumLabel: 'Curriculum',
    enterCurriculum: 'Enter curriculum',
    finish: 'Finish',
    saving: 'Saving…',
    redirecting: 'Redirecting…',
    redirectingToDashboard: 'Redirecting to your dashboard…',
    takingAWhile: 'Taking a while?',
    goToDashboard: 'Go to dashboard',
    mustBeSignedIn: 'You must be signed in to complete onboarding.',
    selectACountry: 'Select a country.',
    somethingWentWrong: 'Something went wrong. Please try again.',
    stepOf: 'Step {step} of {total}',
  },
} as const;

export type Messages = {
  nav: {
    dashboard: string;
    generate: string;
    history: string;
    settings: string;
    homeAriaLabel: string;
  };
  settings: {
    title: string;
    zenMode: string;
    zenModeDescription: string;
    background: string;
    backgroundDescription: string;
    backgroundBrand: string;
    backgroundRainbow: string;
    backgroundZenLocked: string;
    language: string;
    languageDescription: string;
    defaultSubject: string;
    selectSubject: string;
    enterSubject: string;
    defaultGrade: string;
    selectGrade: string;
    defaultCurriculum: string;
    selectCurriculum: string;
    enterCurriculum: string;
    country: string;
    selectCountry: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    account: string;
    email: string;
    plan: string;
    usage: string;
    usageThisPeriod: string;
    usageUnlimited: string;
    manageSubscription: string;
    logOut: string;
    deleteAccount: string;
    deleteConfirmDescription: string;
    deleteConfirmLabel: string;
    deleting: string;
    confirmDeletion: string;
    cancel: string;
    legal: string;
    legalDescription: string;
    privacyPolicy: string;
    termsOfService: string;
  };
  landing: {
    headerHome: string;
    headerPricing: string;
    headerSignIn: string;
    backToHome: string;
    heroHeadline1: string;
    heroHeadlineHighlight: string;
    heroHeadline2: string;
    heroSub: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    heroStatTime: string;
    heroStatFree: string;
    featuresTitle: string;
    featuresSub: string;
    featureStructuredPlans: string;
    featureStructuredPlansDesc: string;
    featureAiPowered: string;
    featureAiPoweredDesc: string;
    featureExportAnywhere: string;
    featureExportAnywhereDesc: string;
    ctaHeadline: string;
    ctaSub: string;
    ctaBandTitle: string;
    ctaBandSub: string;
    conversionPoint1: string;
    conversionPoint2: string;
    conversionPoint3: string;
    ctaButton: string;
    footerNavAriaLabel: string;
    footerContact: string;
    footerTagline: string;
    tryLightMode: string;
    tryDarkMode: string;
    switchToLightMode: string;
    switchToDarkMode: string;
  };
  generate: {
    planLanguageHint: string;
    heading: string;
    documentTitle: string;
    subject: string;
    grade: string;
    curriculum: string;
    duration: string;
    selectSubject: string;
    selectGrade: string;
    selectCurriculum: string;
    selectDuration: string;
    customDuration: string;
    durationMinutes: string;
    durationShort: string;
    enterSubject: string;
    enterCurriculum: string;
    customDurationInput: string;
    focusLabel: string;
    focusPlaceholder: string;
    modeLabel: string;
    selectMode: string;
    modeFast: string;
    modeQuality: string;
    modeFastDescription: string;
    modeQualityDescription: string;
    modeAria: string;
    upgradeToPro: string;
    unlockQuality: string;
    qualityProOnly: string;
    qualityUpgradeMessage: string;
    submit: string;
    generating: string;
    waitingForUpload: string;
    alignmentTitle: string;
    alignmentTitleFor: string;
    alignmentBody: string;
    alignmentAria: string;
    errorSelectSubject: string;
    errorOneSubject: string;
    errorSelectGrade: string;
    errorDurationRange: string;
    upload: {
      curriculumHeading: string;
      templateHeading: string;
      dragDropPrompt: string;
      browse: string;
      uploading: string;
      parsing: string;
      helpMax: string;
      retry: string;
      retryAria: string;
      removeAria: string;
      uploadingFile: string;
      readingFile: string;
      extractedText: string;
      extractedRegion: string;
      selectedFile: string;
      ready: string;
      inputAriaCurriculum: string;
      inputAriaTemplate: string;
      fileFallback: string;
      filesSuffix: string;
      errorAuth: string;
      errorTooLarge: string;
      errorWrongType: string;
      errorEmpty: string;
      errorNetwork: string;
      errorNoText: string;
      errorTimeout: string;
      errorParse: string;
      errorGeneric: string;
    };
  };
  lesson: {
    edited: string;
    savedToast: string;
    discardEdits: string;
    leaveWithoutSaving: string;
    save: string;
    cancel: string;
    saveFailed: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    billingPeriodAria: string;
    monthly: string;
    annual: string;
    savePercent: string;
    mostPopular: string;
    freePrice: string;
    perMonth: string;
    billedAnnually: string;
    trustFooter: string;
    checkoutRedirecting: string;
    checkoutSettingUp: string;
    checkoutError: string;
    plans: {
      free: {
        name: string;
        description: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        feature5: string;
        feature6: string;
        cta: string;
      };
      pro: {
        name: string;
        description: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        feature5: string;
        cta: string;
      };
      pro_plus: {
        name: string;
        description: string;
        feature1: string;
        feature2: string;
        cta: string;
      };
    };
  };
  auth: {
    confirmPassword: string;
    confirmPasswordRequired: string;
    passwordsDoNotMatch: string;
    showPassword: string;
    hidePassword: string;
    showConfirmPassword: string;
    hideConfirmPassword: string;
  };
  history: {
    title: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    planLesson: string;
    allSubjects: string;
    nothingFound: string;
    noLessons: string;
    generateALesson: string;
  };
  grades: {
    numbered: string;
    year: string;
    kindergarten: string;
    preK: string;
  };
  countries: {
    common: string;
    all: string;
  };
  onboarding: {
    subtitle: string;
    whatDoYouTeach: string;
    pickSubjectHint: string;
    otherSubject: string;
    next: string;
    whatGrade: string;
    gradeLevel: string;
    selectGrade: string;
    back: string;
    whereDoYouTeach: string;
    changeInSettings: string;
    selectCountry: string;
    selectCurriculum: string;
    curriculumLabel: string;
    enterCurriculum: string;
    finish: string;
    saving: string;
    redirecting: string;
    redirectingToDashboard: string;
    takingAWhile: string;
    goToDashboard: string;
    mustBeSignedIn: string;
    selectACountry: string;
    somethingWentWrong: string;
    stepOf: string;
  };
};
