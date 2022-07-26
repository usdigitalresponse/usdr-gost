module.exports = {
    root: true,
    env: {
        node: true,
        jest: true,
        mocha: true,
        es6: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
    },
    extends: [
        'eslint-config-airbnb-base',
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
    },
};
