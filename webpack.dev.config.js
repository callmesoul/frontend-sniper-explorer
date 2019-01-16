var HtmlWebpackPlugin =require('html-webpack-plugin');
module.exports = {
    entry:  __dirname + "/src/index.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/dist",//打包后的文件存放的地方
        filename: "frontend-sniper-explorer.js"//打包后输出文件的文件名
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "env",
                        ]
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: 'head',
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        })
    ]
};