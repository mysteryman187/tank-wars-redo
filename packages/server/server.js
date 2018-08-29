const port = process.env.PORT || 8080;
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const server = new http.createServer(app);

if(process.argv.indexOf('--watch-game') != -1){
    // dev uses webpack dev middleware!
    const webpack = require('webpack');
    const middleware = require('webpack-dev-middleware');
    const compiler = webpack(require('tank-wars-redo-game/webpack.config'));
    app.use('/static/game', middleware(compiler, {
        // webpack-dev-middleware options
    }));       
} else {
    // otherwise the build creates a /static directory
    app.use('/static/game', express.static(path.join(__dirname, 'static', 'game')));
}

server.listen(port, () => console.log(`Example app listening on port ${port}`));