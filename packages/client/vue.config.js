module.exports = {
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
