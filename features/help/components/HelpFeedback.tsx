'use client';

import { useId, useState, type MouseEvent } from 'react';
import { ChipRadio } from '@/components/forms/ChipRadio';
import { Button, buttonVariants } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Switch } from '@/components/ui/switch';
import { useLocale, useT } from '@/providers/locale';
import { cn } from '@/lib/utils';
import {
  buildSupportEmail,
  SIGNED_OUT_PLAN,
  SUPPORT_CATEGORIES,
  SUPPORT_MESSAGE_MAX_LENGTH,
  type SupportCategory,
} from '@/lib/support/mailto';

const CATEGORY_LABEL_KEYS: Record<SupportCategory, string> = {
  bug: 'help.categoryBug',
  idea: 'help.categoryIdea',
  billing: 'help.categoryBilling',
  account: 'help.categoryAccount',
};

type HelpFeedbackProps = {
  supportEmail: string;
  labelledBy: string;
  accountEmail?: string;
  userId?: string;
  plan?: string;
};

export function HelpFeedback({
  supportEmail,
  labelledBy,
  accountEmail,
  userId,
  plan,
}: HelpFeedbackProps) {
  const t = useT();
  const { locale } = useLocale();
  const id = useId();
  const isSignedIn = Boolean(accountEmail && userId);
  const [category, setCategory] = useState<SupportCategory>('bug');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(false);
  const [shortened, setShortened] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const messageId = `${id}-message`;
  const errorId = `${id}-message-error`;

  // Built at click time so the page, browser and timestamp are current.
  function compose() {
    const planTag = plan ?? SIGNED_OUT_PLAN;
    return buildSupportEmail({
      to: supportEmail,
      category,
      message,
      plan: planTag,
      diagnostics: includeDiagnostics
        ? {
            email: accountEmail,
            userId,
            plan,
            locale,
            browser: navigator.userAgent,
            sentAt: new Date().toISOString(),
          }
        : undefined,
    });
  }

  function handleOpenEmail(event: MouseEvent<HTMLAnchorElement>) {
    if (!message.trim()) {
      event.preventDefault();
      // Drop a draft left on the link by an earlier click.
      event.currentTarget.href = `mailto:${supportEmail}`;
      setError(t('help.messageRequired'));
      document.getElementById(messageId)?.focus();
      return;
    }
    // The link's default action reads href after this handler, so the email app gets the full draft.
    const draft = compose();
    event.currentTarget.href = draft.href;
    setShortened(draft.shortened);
    setOpened(true);
    setCopyState('idle');
  }

  async function handleCopy() {
    const { subject, body } = compose();
    try {
      await navigator.clipboard.writeText(
        `To: ${supportEmail}\nSubject: ${subject}\n\n${body.replace(/\r\n/g, '\n')}`,
      );
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  const diagnosticsLabelKey = isSignedIn ? 'help.includeDiagnostics' : 'help.includeDiagnosticsGuest';
  const diagnosticsHintKey = isSignedIn ? 'help.includeDiagnosticsHint' : 'help.includeDiagnosticsGuestHint';
  const [fallbackBefore, fallbackAfter = ''] = t('help.fallback').split('{email}');

  return (
    <section
      id="help"
      aria-labelledby={labelledBy}
      className="rounded-2xl border border-border bg-surface p-6 md:p-8"
    >
      <div className="space-y-4">
        <div>
          <p id={`${id}-category`} className="mb-2 font-body text-sm font-medium text-text-secondary">
            {t('help.category')}
          </p>
          <div role="radiogroup" aria-labelledby={`${id}-category`} className="flex flex-wrap gap-2">
            {SUPPORT_CATEGORIES.map((value) => (
              <ChipRadio key={value} checked={category === value} onSelect={() => setCategory(value)}>
                {t(CATEGORY_LABEL_KEYS[value])}
              </ChipRadio>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={messageId} className="mb-2 block font-body text-sm font-medium text-text-secondary">
            {t('help.message')}
          </label>
          <textarea
            id={messageId}
            value={message}
            maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('help.messagePlaceholder')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 font-body text-base text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">{error && <FieldError id={errorId} message={error} />}</div>
            <span className="shrink-0 font-body text-xs tabular-nums text-text-secondary">
              {message.length}/{SUPPORT_MESSAGE_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
          <div className="min-w-0">
            <label htmlFor={`${id}-diagnostics`} className="block font-body text-sm font-medium text-text-primary">
              {t(diagnosticsLabelKey)}
            </label>
            <p id={`${id}-diagnostics-hint`} className="mt-1 font-body text-sm text-text-secondary">
              {t(diagnosticsHintKey)}
            </p>
          </div>
          <Switch
            id={`${id}-diagnostics`}
            checked={includeDiagnostics}
            onCheckedChange={(checked) => setIncludeDiagnostics(!!checked)}
            aria-describedby={`${id}-diagnostics-hint`}
            className="data-checked:bg-coral shrink-0"
          />
        </div>

        {/* A real mailto link: without JS it still opens a blank email to support. */}
        <a
          href={`mailto:${supportEmail}`}
          onClick={handleOpenEmail}
          className={cn(buttonVariants(), 'min-h-11 w-full sm:min-h-11')}
        >
          {t('help.openEmail')}
        </a>

        {opened && (
          <div role="status" className="space-y-3 rounded-xl bg-success/10 p-4 font-body text-sm text-text-primary">
            <p>{t('help.opened')}</p>
            {shortened && <p>{t('help.shortened')}</p>}
            <p className="text-text-secondary">
              {fallbackBefore}
              <bdi dir="ltr">{supportEmail}</bdi>
              {fallbackAfter}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" className="min-h-11 sm:min-h-11" onClick={handleCopy}>
                {t('help.copy')}
              </Button>
              {copyState === 'copied' && <span>{t('help.copied')}</span>}
              {copyState === 'failed' && <FieldError message={t('help.copyFailed')} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
