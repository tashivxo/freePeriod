declare module 'libreoffice-convert' {
  import type { Callback } from 'node:util';

  export function convert(
    document: Buffer,
    format: string,
    filter: string | undefined,
    callback: Callback<Buffer>,
  ): void;

  const libre: { convert: typeof convert };
  export default libre;
}
