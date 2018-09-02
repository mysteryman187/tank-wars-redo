import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';
import * as qs from 'qs';


const params = qs.parse(window.location.search.substring(1, window.location.search.length));
const dev = Object.keys(params).includes('dev');
const german = Object.keys(params).includes('german');

console.log('===dev=', dev);

const width = Math.max(window.screen.width, window.screen.height);
const height = Math.min(window.screen.width, window.screen.height);

const game = new Game({
    type: AUTO,
    width,
    height,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#815b4d'
});

game.scene.add('lobby', LobbyScene, false);
game.scene.add('battle', BattleScene, false);

if(dev){
    game.scene.start('battle', { 
        numTanks: 3,
        isPlayerGerman: german
    });
} else {
    game.scene.start('lobby'); 
}


const promptFullScreen = () => {
    const modal = document.querySelector('.modal') as HTMLElement;
    modal.style.display = 'flex';
};

document.addEventListener('webkitfullscreenchange', promptFullScreen, false);
document.addEventListener('mozfullscreenchange', promptFullScreen, false);
document.addEventListener('fullscreenchange', promptFullScreen, false);
document.addEventListener('MSFullscreenChange', promptFullScreen, false);

const fullscreen = () => {
    const modal = document.querySelector('.modal') as HTMLElement;
    game.canvas[game.device.fullscreen.request].call(game.canvas);
    setTimeout(() => {
        modal.style.display = 'none';
    }, 500);
};

const modal = document.querySelector('.modal') as HTMLElement;
modal.addEventListener('click', fullscreen);
modal.addEventListener('touchend', fullscreen);


promptFullScreen();