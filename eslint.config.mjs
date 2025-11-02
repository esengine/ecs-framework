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
            'semi': ['warn', 'always'],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'indent': ['warn', 4, {
                SwitchCase: 1,
                ignoredNodes: [
                    'PropertyDefinition[decorators.length > 0]',
                    'TSTypeParameterInstantiation'
                ]
            }],
            'no-trailing-spaces': 'warn',
            'eol-last': ['warn', 'always'],
            'comma-dangle': ['warn', 'never'],
            'object-curly-spacing': ['warn', 'always'],
            'array-bracket-spacing': ['warn', 'never'],
            'arrow-parens': ['warn', 'always'],
            'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
            'no-console': 'off',
            'no-empty': 'warn',
            'no-case-declarations': 'warn',
            'no-useless-catch': 'warn',
            'no-prototype-builtins': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
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
