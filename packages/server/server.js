const port = process.env.PORT || 8080;
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const server = new http.createServer(app);
const { createRoute } = require('./models');
const morgan = require('morgan');

app.use(morgan('tiny'));

app.use('/', (req, res, next) => {
    if (req.url === '/') {
        res.redirect('/static/game/index.html');
    } else {
        next();
    }
});

app.use(createRoute('presence', {
    projectId: 'tank-wars-211122',
    ttl: 35 * 1000
 }));

 app.use(createRoute('message', {
    projectId: 'tank-wars-211122',
    ttl: 60 * 1000
 }));

if (process.argv.indexOf('--watch-game') !== -1) {
    // dev uses webpack dev middleware!
    const webpack = require('webpack');
    const middleware = require('webpack-dev-middleware');
    const compiler = webpack(require('tank-wars-redo-game/webpack.config'));
    app.use('/static/game', middleware(compiler, {
        // webpack-dev-middleware options
    }));
    app.use('/static/game', express.static(path.join(__dirname, 'dist', 'static', 'game')));
}

app.use('/static/game', express.static(path.join(__dirname, 'static', 'game')));

server.listen(port, () => console.log(`Example app listening on port ${port}`));