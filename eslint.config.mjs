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
                sourceType: 'module'
            }
        },
        rules: {
            'semi': 'warn',
            'quotes': 'warn',
            'indent': 'off',
            'no-trailing-spaces': 'warn',
            'eol-last': 'warn',
            'comma-dangle': 'warn',
            'object-curly-spacing': 'warn',
            'array-bracket-spacing': 'warn',
            'arrow-parens': 'warn',
            'prefer-const': 'warn',
            'no-multiple-empty-lines': 'warn',
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-require-imports': 'warn',
            '@typescript-eslint/no-this-alias': 'warn',
            'no-case-declarations': 'warn',
            'no-prototype-builtins': 'warn',
            'no-empty': 'warn',
            'no-useless-catch': 'warn'
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
