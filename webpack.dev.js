const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
      filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
              loader: 'css-loader',
              options: { sourceMap: true }
          }
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              cacheDirectory: true,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    static: [
        {
          directory: path.resolve(__dirname, 'dist'),
        },
        {
          directory: path.resolve(__dirname, 'src/public'),
          publicPath: '/',
        },
    ],
    open: true,
    port: 9000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    watchFiles: ['src/**/*'],
  },
});