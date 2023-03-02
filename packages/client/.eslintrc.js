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
  ignorePatterns: [
    'src/arpa_reporter/App.vue',
    'src/arpa_reporter/components/DownloadFileButton.vue',
    'src/arpa_reporter/components/DownloadTemplateBtn.vue',
    'src/arpa_reporter/components/Navigation.vue',
    'src/arpa_reporter/components/StandardForm.vue',
    'src/arpa_reporter/helpers/short-uuid.js',
    'src/arpa_reporter/store/index.js',
    'src/arpa_reporter/views/Agency.vue',
    'src/arpa_reporter/views/Home.vue',
    'src/arpa_reporter/views/Login.vue',
    'src/arpa_reporter/views/ReportingPeriod.vue',
    'src/arpa_reporter/views/ReportingPeriods.vue',
    'src/arpa_reporter/views/Subrecipient.vue',
    'src/arpa_reporter/views/Subrecipients.vue',
    'src/arpa_reporter/views/Upload.vue',
    'src/arpa_reporter/views/Uploads.vue',
    'src/arpa_reporter/views/User.vue',
    'src/arpa_reporter/views/Users.vue',
    'src/arpa_reporter/views/Validation.vue',
    'tests/unit/arpa_reporter/server/lib/format.spec.js',
  ],
  rules: {
    'max-len': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // ['warn', {
    //   // eslint-disable-next-line max-len
    //   code: 120, comments: 120, tabWidth: 4, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true,
    // }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'func-names': 'off',
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
    },
  ],
};
