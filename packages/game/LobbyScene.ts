import { Scene, Math, Physics } from 'phaser';
export class LobbyScene extends Scene {
    constructor(a) {
        super(a);
    }
    preload() {
        console.log('lobby preload');
    }
    create() {
        console.log('lobby create');
    }
    update() {
        console.log('lobby update');
    }
}