import eslint from '@eslint/js';
import * as tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: 'readable',
        JSX: 'readable',
        window: 'readable',
        document: 'readable',
        localStorage: 'readable',
        console: 'readable',
        process: 'readable',
        setTimeout: 'readable',
        fetch: 'readable',
        URL: 'readable',
        HTMLElement: 'readable',
        HTMLInputElement: 'readable',
        HTMLSpanElement: 'readable',
        KeyboardEvent: 'readable',
        RequestInit: 'readable'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': 'off',
      'import/newline-after-import': 'off',
      'import/first': 'off',
      'import/no-duplicates': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-empty-interface': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
];
