import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.es2021,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
            'unused-imports': unusedImports,
            import: importPlugin,
            prettier,
        },
        rules: {
            // TypeScript
            'no-unused-vars': 'off',
            'unused-imports/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_.*?$',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    caughtErrors: 'all',
                },
            ],
            // Import
            'unused-imports/no-unused-imports': 'warn',
            'import/order': [
                'warn',
                {
                    groups: [
                        'type',
                        'builtin',
                        'object',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    pathGroups: [
                        {
                            pattern: '~/**',
                            group: 'external',
                            position: 'after',
                        },
                    ],
                    'newlines-between': 'always',
                },
            ],
            'prettier/prettier': 'error',
        },
    },
]);
