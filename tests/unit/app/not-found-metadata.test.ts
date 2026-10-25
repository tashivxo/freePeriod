/**
 * @jest-environment node
 */

jest.mock('@/lib/i18n/server', () => ({
  readLocaleCookie: jest.fn(),
}));

import { readLocaleCookie } from '@/lib/i18n/server';
import { generateMetadata } from '@/app/not-found';
import { getMessages, LOCALES } from '@/lib/i18n';

describe('not-found generateMetadata', () => {
  it.each(LOCALES)('uses the localized 404 document title for %s', async (locale) => {
    (readLocaleCookie as jest.Mock).mockResolvedValue(locale);

    await expect(generateMetadata()).resolves.toEqual({
      title: getMessages(locale).status.notFoundDocumentTitle,
    });
  });
});
