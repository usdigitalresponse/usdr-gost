module.exports = {
  pages: {
    main: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
    },
    // arpaReporter: {
    //   entry: 'src/arpa_reporter/index.js',
    //   template: 'public/arpa_reporter/index.html',
    //   filename: 'arpa_reporter/index.html',
    // },
  },
  devServer: {
    client: {
      progress: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
};
