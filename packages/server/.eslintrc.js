module.exports = {
    root: true,
    env: {
        node: true,
        mocha: true,
        es6: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
    },
    extends: [
        'eslint-config-airbnb-base',
    ],
    ignorePatterns: [
        // NOTE(mbroussard): this is temporary, just to make committing on ARPA integration dev branch a bit
        // less annoying.
        'src/arpa_reporter/**/*',
        'seeds/arpa_reporter_dev/*',
        '__tests__/arpa_reporter/**/*',
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        camelcase: 'off',
        'consistent-return': 'warn',
        'array-callback-return': 'error',
        indent: ['error', 4, {
            SwitchCase: 1,
            ObjectExpression: 1,
        }],
        'no-mixed-spaces-and-tabs': 'off',
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        semi: ['error', 'always'],
        'no-restricted-syntax': [
            'error',
            {
                selector: 'ForOfStatement',
                message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
            },
            {
                selector: 'LabeledStatement',
                message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
            },
            {
                selector: 'WithStatement',
                message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
            },
        ],
        'guard-for-in': 'off',
        'max-len': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-unused-expressions': 'off',
        'import/no-dynamic-require': 'off',
        'no-param-reassign': 'off',
        'func-names': 'off',
    },
    overrides: [
        {
            files: ['*.test.js', '*.spec.js'],
            rules: {
                'no-underscore-dangle': 'off',
            },
        },
    ],
};
