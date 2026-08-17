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
    save: 'Save Settings',
    saving: 'Saving...',
    saved: 'Settings saved!',
    saveFailed: 'Failed to save settings',
    account: 'Account',
    email: 'Email',
    plan: 'Plan',
    usage: 'Usage',
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
    headerPricing: 'Pricing',
    headerSignIn: 'Sign in',
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
      'Download as DOCX or a filled-in template. Edit inline before exporting.',
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
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    account: string;
    email: string;
    plan: string;
    usage: string;
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
    headerPricing: string;
    headerSignIn: string;
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
  };
};
