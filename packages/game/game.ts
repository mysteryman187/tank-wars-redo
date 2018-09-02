import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';
import * as qs from 'qs';

//debugger;
const dev = Object.keys(qs.parse(window.location.search.substring(1,window.location.search.length))).includes('dev');

console.log('===dev=', dev);

const game = new Game({
    type: AUTO,
    width: 1440,
    height: 640,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#815b4d',
    scene: dev ? BattleScene: LobbyScene
});

game.scene.add('lobby', LobbyScene, false);
game.scene.add('battle', BattleScene, false);