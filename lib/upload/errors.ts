import type { TranslateFn } from '@/lib/i18n/format';

export type UploadErrorKind =
  | 'auth'
  | 'tooLarge'
  | 'wrongType'
  | 'empty'
  | 'network'
  | 'noText'
  | 'timeout'
  | 'parse'
  | 'generic';

export type UploadFailure = {
  kind: UploadErrorKind;
  vars?: Record<string, string>;
};

const ERROR_KEYS: Record<UploadErrorKind, `generate.upload.${string}`> = {
  auth: 'generate.upload.errorAuth',
  tooLarge: 'generate.upload.errorTooLarge',
  wrongType: 'generate.upload.errorWrongType',
  empty: 'generate.upload.errorEmpty',
  network: 'generate.upload.errorNetwork',
  noText: 'generate.upload.errorNoText',
  timeout: 'generate.upload.errorTimeout',
  parse: 'generate.upload.errorParse',
  generic: 'generate.upload.errorGeneric',
};

export function formatUploadError(t: TranslateFn, failure: UploadFailure): string {
  return t(ERROR_KEYS[failure.kind], failure.vars);
}

export class UploadError extends Error {
  readonly failure: UploadFailure;

  constructor(failure: UploadFailure) {
    super(failure.kind);
    this.name = 'UploadError';
    this.failure = failure;
  }
}
