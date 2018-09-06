import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';
import { LoadingScene } from './LoadingScene';

import * as qs from 'qs';


const params = qs.parse(window.location.search.substring(1, window.location.search.length));
const dev = Object.keys(params).includes('dev');
const german = Object.keys(params).includes('german');
const tanks = Object.keys(params).includes('tanks');
const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
const disableFullscreen = Object.keys(params).includes('fs');

console.log('===dev=', dev);

const width = disableFullscreen ? Math.max(window.innerWidth, window.innerHeight) : Math.max(window.screen.width, window.screen.height);
const height = disableFullscreen ? Math.min(window.innerWidth, window.innerHeight) : Math.min(window.screen.width, window.screen.height);

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
game.scene.add('loading-battle', LoadingScene, false);

if(dev){
    game.scene.start('battle', { 
        numTanks: tanks || 3,
        isPlayerGerman: german
    });
} else {
    game.scene.start('lobby'); 
}


const promptFullScreen = () => {
    if(!isSafari && !disableFullscreen){
        const modal = document.querySelector('.modal') as HTMLElement;
        modal.style.display = 'flex';
    }
};

document.addEventListener('webkitfullscreenchange', promptFullScreen, false);
document.addEventListener('mozfullscreenchange', promptFullScreen, false);
document.addEventListener('fullscreenchange', promptFullScreen, false);
document.addEventListener('MSFullscreenChange', promptFullScreen, false);

const fullscreen = () => {
    const modal = document.querySelector('.modal') as HTMLElement;
    try {
        game.canvas[game.device.fullscreen.request].call(game.canvas);
    } catch (e) {
        // not supported on iphones
    }
    setTimeout(() => {
        modal.style.display = 'none';
    }, 500);
};

const modal = document.querySelector('.modal') as HTMLElement;
modal.addEventListener('click', fullscreen);
modal.addEventListener('touchend', fullscreen);
promptFullScreen();
