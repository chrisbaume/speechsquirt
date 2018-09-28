const path = require('path');

module.exports = {
  mode: 'development',
  devServer: {
    contentBase: './dist',
    port: 4000
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  }
};
