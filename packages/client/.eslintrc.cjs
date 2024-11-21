/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    'import-alias',
    'vuejs-accessibility',
  ],
  extends: [
    'plugin:vue/recommended',
    'airbnb-base',
    'plugin:import/recommended',
    'plugin:vuejs-accessibility/recommended',
  ],
  settings: {
    'import/resolver': {
      'custom-alias': {
        alias: {
          '@': './src',
        },
        extensions: ['.js', '.vue'],
      },
    },
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

    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: [
        'state', // for vuex/pinia state
      ],
    }],

    'import/prefer-default-export': 'off',
    'import/no-commonjs': 'error',
    'import-alias/import-alias': [
      'error',
      {
        aliases: [
          { alias: '@', matcher: '^@/' },
        ],
      },
    ],
  },
};
