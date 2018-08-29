import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';


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
    scene: LobbyScene
});

// const ws = new WebSocket(`ws://${location.host}`);

// ws.onopen =  function open() {
//   ws.send('something');
// };
 
// ws.onmessage = function incoming(data) {
//   console.log('received', data);
// };
