module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'max-len': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // ['warn', {
    //   // eslint-disable-next-line max-len
    //   code: 120, comments: 120, tabWidth: 4, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true,
    // }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'func-names': 'off',

    // Modern browsers have much greater support for ES6+ features than they did
    // when our version of eslint-config-airbnb was written.
    // TODO: consider upgrading eslint-config-airbnb
    'no-restricted-syntax': 'off',

    'import/prefer-default-export': 'off',

    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'off',
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
