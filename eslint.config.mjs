import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Same files the Next config loads the react-hooks plugin for; without this, .cjs
    // files get these rules but not the plugin and `eslint .` crashes.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // Next.js 16 enables React Compiler rules that predate this migration.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.agents/**',
    'tests/e2e/**',
    'test-results/**',
    'playwright-report/**',
  ]),
]);

export default eslintConfig;
