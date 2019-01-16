module.exports = {
    entry:  __dirname + "/src/frontend-sniper-explorer.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/lib",//打包后的文件存放的地方
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
    }
};