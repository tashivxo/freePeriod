import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
import { FILL_MY_TEMPLATE_LABEL } from '@/features/lesson/components/filled-template-copy';

describe('FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL', () => {
  it('is exactly the sentence-case Free Period template button label', () => {
    expect(FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL).toBe('Free Period template');
    expect(FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL).not.toBe('Free Period Template');
    expect(FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL).not.toBe('free period template');
    expect(FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL).not.toBe(
      'Download lesson plan (FreePeriod template)',
    );
    expect(FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL).not.toBe(FILL_MY_TEMPLATE_LABEL);
    expect(FILL_MY_TEMPLATE_LABEL).toBe('Fill my template');
  });
});
