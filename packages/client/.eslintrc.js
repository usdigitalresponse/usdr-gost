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
    // This override is part of the process of upgrading plugin:vue/essential -> plugin:vue/recommended.
    // In order to avoid a huge stop-the-world PR, we're introducing the plugin upgrade and a file list here
    // that ignores the added rules. That way, we can bring individual files into compliance in smaller, less
    // disruptive PRs. We'll plan to burn down the list of files in this list until we're done and can remove
    // this override entirely.
    {
      files: [
        // File list to ignore generated by `yarn run lint --no-fix --format unix | sed -E 's/:.+//g' | uniq`
        // then organized by hand into reasonable chunks of work

        // ARPA Reporter: app files
        './src/arpa_reporter/App.vue',
        './src/arpa_reporter/components/Navigation.vue',

        // ARPA Reporter: basic components
        './src/arpa_reporter/components/AlertBox.vue',
        './src/arpa_reporter/components/DownloadButton.vue',
        './src/arpa_reporter/components/DownloadFileButton.vue',
        './src/arpa_reporter/components/DownloadFileButtonSmall.vue',
        './src/arpa_reporter/components/DownloadTemplateBtn.vue',
        './src/arpa_reporter/components/StandardForm.vue',

        // ARPA Reporter: home/login/validation views
        './src/arpa_reporter/views/Home.vue',
        './src/arpa_reporter/views/Login.vue',
        './src/arpa_reporter/views/Validation.vue',

        // ARPA Reporter: new views
        './src/arpa_reporter/views/NewTemplate.vue',
        './src/arpa_reporter/views/NewUpload.vue',

        // ARPA Reporter: agency views
        './src/arpa_reporter/views/Agencies.vue',
        './src/arpa_reporter/views/Agency.vue',

        // ARPA Reporter: reporting period views
        './src/arpa_reporter/views/ReportingPeriod.vue',
        './src/arpa_reporter/views/ReportingPeriods.vue',

        // ARPA Reporter: subrecipient views
        './src/arpa_reporter/views/Subrecipient.vue',
        './src/arpa_reporter/views/Subrecipients.vue',

        // ARPA Reporter: upload views
        './src/arpa_reporter/views/Upload.vue',
        './src/arpa_reporter/views/Uploads.vue',

        // ARPA Reporter: user views
        './src/arpa_reporter/views/User.vue',
        './src/arpa_reporter/views/Users.vue',

        // ARPA Reporter: annual performance reporter
        './src/views/ArpaAnnualPerformanceReporter.vue',

        // Grant Finder: app files
        './src/App.vue',
        './src/main.js',
        './src/components/Layout.vue',

        // Grant Finder: search modals
        './src/components/Modals/AddKeyword.vue',
        './src/components/Modals/SavedSearchPanel.vue',
        './src/components/Modals/SearchPanel.vue',
        './src/components/SearchFilter.vue',

        // Grant Finder: teams
        './src/views/Teams.vue',
        './src/components/Modals/AddTeam.vue',
        './src/components/Modals/EditTeam.vue',
        './src/components/Modals/ImportTeams.vue',
        './src/components/Uploader.vue',

        // Grant Finder: users
        './src/views/Users.vue',
        './src/components/Modals/AddUser.vue',
        './src/components/Modals/EditUser.vue',
        './src/components/Modals/ImportUsers.vue',

        // Grant Finder: grant details
        './src/views/GrantDetails.vue',
        './src/components/Modals/GrantDetailsLegacy.vue',

        // Grant Finder: profile
        './src/views/MyProfile.vue',
        './src/components/Modals/ProfileSettings.vue',
        './src/components/UserAvatar.vue',

        // Grant Finder: dashboard
        './src/views/Dashboard.vue',
        './src/views/RecentActivity.vue',
        './src/views/UpcomingClosingDates.vue',
        './src/components/ActivityTable.vue',
        './src/components/ClosingDatesTable.vue',

        // DELETE -- no longer used
        './src/views/EligibilityCodes.vue',
        './src/views/Keywords.vue',
      ],
      rules: {
        // List of essential rules we previously had turned off
        'vue/multi-word-component-names': 'off',
        'vue/no-mutating-props': 'off',
        // List of strongly recommended rules introduced (https://eslint.vuejs.org/rules/#priority-b-strongly-recommended-improving-readability)
        'vue/attribute-hyphenation': 'off',
        'vue/component-definition-name-casing': 'off',
        'vue/first-attribute-linebreak': 'off',
        'vue/html-closing-bracket-newline': 'off',
        'vue/html-closing-bracket-spacing': 'off',
        'vue/html-end-tags': 'off',
        'vue/html-indent': 'off',
        'vue/html-quotes': 'off',
        'vue/html-self-closing': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/multiline-html-element-content-newline': 'off',
        'vue/mustache-interpolation-spacing': 'off',
        'vue/no-multi-spaces': 'off',
        'vue/no-spaces-around-equal-signs-in-attribute': 'off',
        'vue/no-template-shadow': 'off',
        'vue/one-component-per-file': 'off',
        'vue/prop-name-casing': 'off',
        'vue/require-default-prop': 'off',
        'vue/require-explicit-emits': 'off',
        'vue/require-prop-types': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/v-bind-style': 'off',
        'vue/v-on-event-hyphenation': 'off',
        'vue/v-on-style': 'off',
        'vue/v-slot-style': 'off',
        // List of recommended rules introduced (https://eslint.vuejs.org/rules/#priority-b-strongly-recommended-improving-readability)
        'vue/attributes-order': 'off',
        'vue/component-tags-order': 'off',
        'vue/no-lone-template': 'off',
        'vue/no-multiple-slot-args': 'off',
        'vue/no-v-html': 'off',
        'vue/order-in-components': 'off',
        'vue/this-in-template': 'off',
      },
    },
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
