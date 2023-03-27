// This will be used to branch behaviors in ARPA Reporter code based on running
// in GOST environment.
process.env.VUE_APP_IS_GOST = true;

module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },
  pages: {
    main: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Grants',
    },
    arpaReporter: {
      entry: 'src/arpa_reporter/main.js',
      template: 'public/arpa_reporter/index.html',
      filename: 'arpa_reporter/index.html',
      title: 'ARPA Reporter',
    },
  },
  devServer: {
    allowedHosts: 'all',
    client: {
      progress: false,
    },
    proxy: {
      '/api': {
        target: process.env.GOST_API_URL || 'http://localhost:3000',
      },
    },
    historyApiFallback: {
      disableDotRule: true,
      verbose: true,
      rewrites: [
        {
          from: /^\/arpa_reporter\/.*/,
          to: '/arpa_reporter/index.html',
        },
      ],
    },
  },
};
