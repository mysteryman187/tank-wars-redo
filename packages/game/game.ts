import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';

var generateUsername = require('project-name-generator');
const userId = window.localStorage['tank-wars.userId'] || generateUsername().dashed;

const game = new Game({
    type: AUTO,
    width: 1024,
    height: 1024,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#055f19',
    scene: new LobbyScene(userId)
});
