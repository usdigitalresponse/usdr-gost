/* eslint-disable import/no-commonjs */
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
  ],
  env: {
    test: {
      plugins: [['babel-plugin-istanbul']],
    },
  },
};
