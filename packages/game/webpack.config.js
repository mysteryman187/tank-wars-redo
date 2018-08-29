const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const package = JSON.parse(fs.readFileSync('package.json'));

module.exports = {
    mode: 'development', // "production" | "development" | "none"  // Chosen mode tells webpack to use its built-in optimizations accordingly.
    entry: "./game",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `game-${package.version}.js`,
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
            {
                test: /\.mustache$/,
                loader: 'mustache-loader',
                options: {
                    render: {
                        title: 'Tank Wars!',
                        version: package.version
                    }
                },
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.mustache'
        })
    ],
    devtool: "source-map"
}