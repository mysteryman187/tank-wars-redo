import { Scene } from 'phaser';
import * as morsify from 'morsify';
var generateUsername = require('project-name-generator');
const longRandomString = () => `${generateUsername().spaced}${generateUsername().spaced}${generateUsername().spaced}${generateUsername().spaced}${generateUsername().spaced}`;

export class LoadingScene extends Scene {
    preload(){

    }
    create({ connection, isPlayerGerman }){
        const audio = morsify.audio(longRandomString());
        audio.play();
        const { width, height, scrollY, scrollX } =  this.cameras.main;
        const centre = () => ({ x: (width / 2) + scrollX, y: (height / 2) + scrollY });
        this.add.text(centre().x, centre().y, 'Establishing RTCPeerConnection...', { fontSize: '32px', fill: '#444444' })
        .setOrigin(0.5, 0.5);
        connection.onReady(() => {
            audio.stop();
            this.scene.start('battle', {
                connection,
                isPlayerGerman
            });
        });
    }
    update(){

    }
}