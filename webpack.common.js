const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].[contenthash].bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: true,
    assetModuleFilename: 'assets/[hash][ext][query]',
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
           filename: 'assets/images/[hash][ext][query]'
        }
      },
       {
         test: /\.(woff|woff2|eot|ttf|otf)$/i,
         type: 'asset/resource',
         generator: {
           filename: 'assets/fonts/[hash][ext][query]'
         }
       },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'public/'),  // Changed from 'dist' to 'public'
          globOptions: {
            ignore: ['**/STUDENT.txt'],
          },
        },
        {
          from: path.resolve(__dirname, 'src/scripts/push-handler.js'),
          to: path.resolve(__dirname, 'public/push-handler.js'),  // Changed from 'dist' to 'public'
        }
      ],
    }),
  ],
};
