const port = process.env.PORT || 8080;
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const server = new http.createServer(app);
const { createRoute } = require('./models');

app.use('/', (req, res, next) => {
    if (req.url === '/') {
        res.redirect('/static/game/index.html');
    } else {
        next();
    }
});

app.use(createRoute('demo', {
    projectId: 'tank-wars-211122',
    // ttl: 25 * 1000,
    query: {
        filter: (query, queryParams) => {
            console.log(queryParams);
            // nothing to do here now..yet - but we have ability to filter differently for different collections
            // query.filter('myProp', '>=', queryParams.thing);
            
            if(queryParams.a){
                query.filter('hello.a', '=', queryParams.a);
            }
        }
    }
 }));

 // clients use this route to check who else is in a lobby
 // they all setInterval to both post and to get to presence
 // this is where REST falls apart and some smartass says why cant it be 1 POST to update my presence AND query!
app.use(createRoute('presence', {
    projectId: 'tank-wars-211122',
    ttl: 25 * 1000,
    query: {
    
    }
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