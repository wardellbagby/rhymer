const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const packageInfo = require('@lyricistant/package_info.json');

module.exports = ({ htmlTemplate }) => ({
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Untitled',
        template: htmlTemplate,
        inject: false
      }),
      new DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(packageInfo.version),
        'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
        'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name)
      })
    ],
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(woff|woff2|eot|ttf|svg|png)$/,
          loader: 'url-loader'
        }
      ]
    },
    output: {
      filename: 'renderer.js'
    },
  });
