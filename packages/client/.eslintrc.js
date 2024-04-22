module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'plugin:vue/recommended',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    // TODO: enable these lint rules over time
    'max-len': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'func-names': 'off',

    // Modern browsers have much greater support for ES6+ features than they did
    // when our version of eslint-config-airbnb was written.
    // TODO: consider upgrading eslint-config-airbnb
    'no-restricted-syntax': 'off',

    'import/prefer-default-export': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
};
