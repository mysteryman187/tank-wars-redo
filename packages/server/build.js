// https://webpack.js.org/api/node
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');


const copyFile = (src, dest) => fs.createReadStream(src).pipe(fs.createWriteStream(dest));
const mkdir = (dir) => {
    try{
        fs.mkdirSync(dir);
    }catch(e){}
}
const copyDir = function(src, dest) {
	mkdir(dest);
    fs.readdirSync(src)
    .map(file => ({ file, dir: fs.lstatSync(path.join(src, file)).isDirectory() }))
    .forEach(({file, dir}) => {
        if(dir) {
            console.log(src, file);
			copyDir(path.join(src, file), path.join(dest, file));
		} else {
			copyFile(path.join(src, file), path.join(dest, file));
		}
    });
};

rimraf.sync('dist');
mkdir('dist');
copyFile('package.json', 'dist');
copyDir('assets', 'dist');

console.log('==================',require.resolve('tank-wars-redo-game'));

return;

copyDir('src/server', 'dist');
