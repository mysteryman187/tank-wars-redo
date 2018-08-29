const rimraf = require('rimraf');
const copy = require('copy');

rimraf.sync('dist');

copy('server.js', 'dist', function(err) {
    if (err) throw err;    
});
copy('app.yaml', 'dist', function(err) {
    if (err) throw err;    
});
copy('package.json', 'dist', function(err) {
    if (err) throw err;    
});

const gamePath = require.resolve('tank-wars-redo-game/package.json').replace('package.json', 'dist');

copy(`${gamePath}/**/*`, 'dist/static/game', function(err) {
    if (err) throw err;    
});