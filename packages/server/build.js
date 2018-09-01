const rimraf = require('rimraf');
const copy = require('copy');

rimraf.sync('dist');

[
    'server.js',
    'app.yaml',
    'package.json'
].forEach(file => {
    copy(file, 'dist', function(err) {
        if (err) throw err;    
    });
});

const gamePath = require.resolve('tank-wars-redo-game/package.json').replace('package.json', 'dist');
copy(`${gamePath}/**/*`, 'dist/static/game', function(err) {
    if (err) throw err;    
});