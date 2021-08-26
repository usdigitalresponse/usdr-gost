// eslint-disable-next-line import/no-unresolved, no-unused-vars
const configureAPI = require('../server/src/configure');

module.exports = {
  devServer: {
    // proxy: 'http://localhost:3000',
    // before: configureAPI,
    progress: false,
  },
};
