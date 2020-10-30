module.exports = {
    root: true,
    env: {
        node: true,
        jest: true,
    },
    extends: [
        'airbnb-base',
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'array-callback-return': 'error',
        indent: ['error', 4, {
            SwitchCase: 1,
            ObjectExpression: 1,
        }],
        'no-mixed-spaces-and-tabs': 'off',
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        semi: ['error', 'always'],
    },
};
