// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', 'docs/', 'build/', 'coverage/', 'node_modules/']),
  tseslint.configs.recommended
);
