import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';
import { aliases, DelegatesPlugin, MonacoPlugin, resolve } from '../shared';

const config: Configuration = {
  target: 'web',
  entry: './src/web/index.ts',
  devtool: 'eval-source-map',
  mode: 'development',
  resolve: {
    alias: aliases('web'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
  plugins: [
    DelegatesPlugin,
    MonacoPlugin,
    new HtmlWebpackPlugin({
      title: 'Untitled',
      templateContent: `
      <meta charset="utf-8">
      <html lang="en">
        <body>
          <div id='app'></div>
        </body>
      </html>
      `
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [resolve('src/')],
        exclude: [resolve('src/electron')],
        use: 'ts-loader'
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        loader: 'file-loader'
      }
    ]
  },
  output: {
    path: resolve('dist/web'),
    filename: 'web.js'
  },
  devServer: {
    contentBase: resolve('dist/web')
  }
};

export default config;