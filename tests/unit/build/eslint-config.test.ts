/**
 * @jest-environment node
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('eslint config', () => {
  it('builds a config for every linted file type, including .cjs', () => {
    const eslintBin = path.join(process.cwd(), 'node_modules/eslint/bin/eslint.js');
    // --print-config fails when a rule references a plugin the config does not load.
    expect(() =>
      execFileSync(process.execPath, [eslintBin, '--print-config', 'scripts/generate-owner-decision-brief.cjs'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});
