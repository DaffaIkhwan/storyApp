const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.js');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const path = require('path');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
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
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
      chunkFilename: 'styles/[id].[contenthash].css',
    }),
    new WorkboxWebpackPlugin.GenerateSW({
      swDest: './sw.bundle.js',
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'storyku-pages-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
          },
        },
        {
          urlPattern: ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'storyku-api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 6 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: ({ url }) => url.href.includes('.dicoding.dev') && /\.(?:png|gif|jpg|jpeg|svg)$/.test(url.pathname),
          handler: 'CacheFirst',
          options: {
            cacheName: 'storyku-image-cache',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
          },
        },
         {
           urlPattern: ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker' || request.destination === 'font' || request.destination === 'image',
           handler: 'StaleWhileRevalidate',
           options: {
             cacheName: 'storyku-static-assets-cache',
             expiration: {
               maxEntries: 100,
               maxAgeSeconds: 7 * 24 * 60 * 60,
             },
           },
         },
         {
           urlPattern: ({url}) => url.href.startsWith('https://cdnjs.cloudflare.com') || url.href.startsWith('https://unpkg.com/leaflet'),
           handler: 'CacheFirst',
           options: {
             cacheName: 'storyku-external-libs-cache',
             expiration: {
               maxAgeSeconds: 30 * 24 * 60 * 60,
             },
             cacheableResponse: { statuses: [0, 200] },
           }
         },
         {
           urlPattern: ({url}) => url.href.startsWith('https://fonts.googleapis.com') || url.href.startsWith('https://fonts.gstatic.com'),
           handler: 'StaleWhileRevalidate',
           options: {
             cacheName: 'storyku-google-fonts-cache',
             expiration: {
               maxEntries: 30,
               maxAgeSeconds: 30 * 24 * 60 * 60
             },
             cacheableResponse: { statuses: [0, 200] },
           }
         }
      ],
      importScripts: ['./push-handler.js'],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
         terserOptions: {
            compress: {
               drop_console: true,
            },
            format: {
               comments: false,
            },
         },
         extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
       chunks: 'all',
       cacheGroups: {
          vendor: {
             test: /[\\/]node_modules[\\/]/,
             name: 'vendors',
             chunks: 'all',
             priority: -10,
          },
       },
    },
    runtimeChunk: 'single',
  },
  performance: {
     hints: 'warning',
     maxAssetSize: 512000,
     maxEntrypointSize: 768000,
  },
});