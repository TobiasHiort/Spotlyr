const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin')

module.exports = {
  plugins: [new NodemonPlugin()],
  node: {
    fs: 'empty',
    tls: 'empty',
    net: 'empty'
  },
  entry: './public/index.js',
  output: {
    filename: 'index-bundle.js',
    path: path.resolve(__dirname, 'public/dist')
  }
};