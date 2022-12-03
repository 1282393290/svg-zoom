var path = require('path');
var htmlwebpackplugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, './dist'),//指定打包好的文件，输出到哪个目录中去
    filename: 'index.js' //这是指定 输出的文件的名称
  },
  devServer: {
    hot: true,
    compress: true,
    port: 9000,
  },

  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new htmlwebpackplugin({     // html-webpack-plugin 插件对象
      template: path.join(__dirname, './demo/index.html'), // 指定模板文件
      filename: "index.html"  //设置内存中的文件名
    })
  ]
};