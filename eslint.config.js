const { FlatCompat } = require('@eslint/eslintrc');
const json = require("@eslint/json");
const process = require('process');

const dirname = process.cwd();

const compat = new FlatCompat({
    baseDirectory: dirname,
    resolvePluginsRelativeTo: dirname,
});

const appConfigs = compat.config({
    env: {
        node: true,
        'react-native/react-native': true,
        es2020: true,
    },
    root: true,
    extends: [
        'airbnb',
        'airbnb/hooks',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
        'simple-import-sort',
        'import-newlines'
    ],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {
                project: [
                    './tsconfig.json',
                ],
            },
        },
    },
    rules: {
        'linebreak-style': 'off',

        'no-unused-vars': 0,
        '@typescript-eslint/no-unused-vars': 1,

        'no-use-before-define': 0,
        '@typescript-eslint/no-use-before-define': 1,

        'no-shadow': 0,
        '@typescript-eslint/no-shadow': ['error'],

        '@typescript-eslint/consistent-type-imports': [
            'warn',
            {
                disallowTypeAnnotations: false,
                fixStyle: 'inline-type-imports',
                prefer: 'type-imports',
            },
        ],

        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    '**/*.test.{ts,tsx}',
                    'eslint.config.js',
                    'babel.config.js',
                    'tailwind.config.js',
                ],
                optionalDependencies: false,
            },
        ],

        // Disabled formatting rules - let Prettier handle these
        'indent': 'off',
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'max-len': 'off',
        'no-tabs': 'off',
        'simple-import-sort/imports': 'off',
        'simple-import-sort/exports': 'off',
        'import-newlines/enforce': 'off',
        'object-curly-newline': 'off',
        'object-curly-spacing': 'off',
        'array-bracket-spacing': 'off',
        'comma-dangle': 'off',
        'semi': 'off',
        'quotes': 'off',
        'jsx-quotes': 'off',
        'arrow-parens': 'off',
        'implicit-arrow-linebreak': 'off',
        'function-paren-newline': 'off',
        'operator-linebreak': 'off',
        'no-multiple-empty-lines': 'off',
        'padded-blocks': 'off',
        'eol-last': 'off',
        'no-trailing-spaces': 'off',

        'import/no-cycle': ['error', { allowUnsafeDynamicCyclicDependency: true }],

        'react/react-in-jsx-scope': 'off',
        'camelcase': 'off',

        'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],

        'import/extensions': ['off', 'never'],

        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        'react/require-default-props': ['warn', { ignoreFunctionalComponents: true }],
        'import/order': 'off',
        'react/jsx-props-no-spreading': 'off',
        'import/prefer-default-export': 'off',

        // React Native specific adjustments
        'global-require': 'off',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    overrides: []
}).map((conf) => ({
    ...conf,
    files: ['src/**/*.tsx', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.js'],
    ignores: [
        "node_modules/",
        "build/",
        "coverage/",
        "dist/",
        ".expo/",
        "android/",
        "ios/",
        'src/generated/types.ts'
    ],
}));

const jsonConfig = {
    files: ['**/*.json'],
    language: 'json/json',
    rules: {
        'json/no-duplicate-keys': 'error',
    },
};

module.exports = [
    {
        plugins: {
            json,
        },
    },
    ...appConfigs,
    jsonConfig,
];
