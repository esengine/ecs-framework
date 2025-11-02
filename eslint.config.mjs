import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['packages/**/src/**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'indent': ['error', 4, { SwitchCase: 1 }],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'arrow-parens': ['error', 'always'],
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-non-null-assertion': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            '**/node_modules/**',
            'dist/**',
            '**/dist/**',
            'bin/**',
            '**/bin/**',
            'build/**',
            '**/build/**',
            'coverage/**',
            '**/coverage/**',
            'thirdparty/**',
            'examples/lawn-mower-demo/**',
            'extensions/**',
            '**/*.min.js',
            '**/*.d.ts'
        ]
    }
];
