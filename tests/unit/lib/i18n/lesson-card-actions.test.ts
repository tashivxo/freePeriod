import { getMessages } from '@/lib/i18n';

const KEYS = [
  'actionsAria',
  'rename',
  'delete',
  'renameDialogTitle',
  'renameLabel',
  'titleRequired',
  'renameError',
  'deleteError',
  'deleteConfirm',
] as const;

const LOCALES = ['en', 'ar', 'es', 'fr', 'zh-Hans'] as const;

describe('lesson card action copy', () => {
  it.each(LOCALES)('ships every action label for %s', (locale) => {
    const history = getMessages(locale).history as unknown as Record<string, string>;
    for (const key of KEYS) {
      expect(history[key]).toBeTruthy();
    }
    expect(history.actionsAria).toContain('{title}');
    expect(history.deleteConfirm).toContain('{title}');
  });

  it.each(['ar', 'es', 'fr', 'zh-Hans'] as const)('translates the action labels for %s', (locale) => {
    const en = getMessages('en').history as unknown as Record<string, string>;
    const localized = getMessages(locale).history as unknown as Record<string, string>;
    for (const key of KEYS) {
      expect(localized[key]).not.toBe(en[key]);
    }
  });
});
