import { Scene, Math, Physics } from 'phaser';
import { PresenceClient } from './comms/PresenceClient';
import { MessageClient } from './comms/MessageClient';
import { Connection } from './comms/Connection';
import { BattleScene } from './BattleScene';
import { lobbyRectangle } from './textures';
import { username } from './username';
import * as morsify from 'morsify';

export class LobbyScene extends Scene {
    private texts: any[] = [];
    private connection: Connection;
    private messageClient: MessageClient;
    private presenceClient: PresenceClient;
    private userId: string = username;
    private outstandingChallenges: Map<string, boolean> = new Map();

    constructor() {
        super(null);
    }
    preload() {
        this.load.image('lobby-background', 'assets/images/lobby_bg.png');
        this.load.image('lobby-map', 'assets/images/map.jpg');

        lobbyRectangle(this);
    }
    createConnection(userId, connect) {
        this.connection = new Connection(
            (candidate) => this.messageClient.send(userId, { type: 'ICEcandidate', from: this.userId, candidate }),
            offer => console.log(offer) || this.messageClient.send(userId, { type: 'offer', from: this.userId, offer }),
            answer => console.log(answer) || this.messageClient.send(userId, { type: 'answer', from: this.userId, answer }),
            msg => console.log('connection1 got', msg),
            () => {
                console.log('connection is OPEN!');
                this.destroy();
            }
        );

        this.scene.start('loading-battle', {
            connection: this.connection,
            isPlayerGerman: connect
        });

        if (connect) {
            this.connection.connect();
        }
    }
    create() {
        window.onbeforeunload = this.destroy.bind(this);

        const centre = this.cameras.main.width / 2;
        this.add.image(0, 0, 'lobby-background')
            .setOrigin(0)
            .setDisplaySize(centre, this.cameras.main.height);
        this.add.image(centre, 0, 'lobby-map')
            .setOrigin(0)
            .setDisplaySize(centre, this.cameras.main.height);

        this.messageClient = new MessageClient(this.userId, (message) => {
            switch (message.type) {
                case 'challenge': {

                    const audio = morsify.audio(message.from);
                    audio.play();

                    const accepted = window.confirm(`challenge from ${message.from}`);
                    this.messageClient.send(message.from, { type: 'challenge_response', from: this.userId, accepted });
                    if (accepted) {
                        this.createConnection(message.from, false);
                    }
                    break;
                }
                case 'challenge_response': {
                    if (message.accepted) {
                        this.createConnection(message.from, true);
                    } else {
                        this.outstandingChallenges.set(message.from, false);
                    }
                    break;
                }
                case 'offer': {
                    this.connection.receiveOffer(message.offer);
                    break;
                }
                case 'answer': {
                    this.connection.receiveAnswer(message.answer);
                    break;
                }
                case 'ICEcandidate': {
                    this.connection.receiveICECandidate(message.candidate);
                    break;
                }
            }
        });

        this.presenceClient = new PresenceClient(this.userId, (presentUsers) => {
            console.log('update UsSers', presentUsers)
            this.texts.forEach(textArray => textArray.forEach(text => text.destroy()));
            this.texts = presentUsers.map((u, i) => {
                const normalStyle = { fontSize: '28px', fill: '#444444', fontFamily: 'handwritten' };
                const hoverStyle = { fontSize: '32px', fill: '#444444', fontFamily: 'handwritten' };

                const y = this.cameras.main.height / 3  + (40 * i);
                
                const text = this.add
                    .text(this.cameras.main.width / 12, y, `pvt     ${u.userId}`, normalStyle)
                    .setInteractive();

                text.on('pointerdown', (pointer) => {
                    if (!this.outstandingChallenges.has(u.userId)) {
                        this.messageClient.send(u.userId, { type: 'challenge', from: this.userId });
                        this.outstandingChallenges.set(u.userId, true);
                    }
                });

                text.on('pointerover', (pointer) => {
                    text.setStyle(hoverStyle);
                });
                text.on('pointerout', (pointer) => {
                    text.setStyle(normalStyle);
                });
                return [text];
            });
        });
    }
    update() {
    }

    destroy() {
        this.presenceClient.away();
        this.presenceClient.close();
        this.messageClient.close();
    }
}