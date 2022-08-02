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
    },
  ],
};
