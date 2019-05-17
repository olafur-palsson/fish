const path = require('path')

module.exports = {
  entry: [
    'babel-polyfill',
    './src/program.js'
  ],

  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
