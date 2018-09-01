import { Scene, Math, Physics } from 'phaser';
import { PresenceClient } from './comms/PresenceClient';
import { MessageClient } from './comms/MessageClient';
import { Connection } from './comms/Connection';
import { BattleScene } from './BattleScene';

export class LobbyScene extends Scene {
    private texts: any [] = [];
    private connection: Connection;
    private messageClient: MessageClient;
    private presenceClient: PresenceClient;

    constructor(private userId: string) {
        super(null);
    }
    preload() {
        this.scene.add('battle', BattleScene, false);
        console.log('lobby preload');
    }
    createConnection(userId, connect){
        this.connection = new Connection(
            (candidate) => this.messageClient.send(userId, { type: 'ICEcandidate', from: this.userId, candidate }),
            offer => console.log(offer) || this.messageClient.send(userId, { type: 'offer', from: this.userId, offer }), 
            answer => console.log(answer) || this.messageClient.send(userId, { type: 'answer', from: this.userId, answer }),
            msg => console.log('connection1 got', msg),
            () => {
                console.log('connection is OPEN!');
                this.scene.start('battle', {
                    connection: this.connection,
                    isPlayerGerman: connect
                });
                this.destroy();
            }
        );
        if(connect){
            this.connection.connect();
        }
    }
    create() {
        this.messageClient = new MessageClient(this.userId, (message) => {
            switch(message.type){
                case 'challenge': {
                    const accepted = window.confirm(`challenge from ${message.from}`);
                    this.messageClient.send(message.from, { type: 'challenge_response', from: this.userId, accepted });
                    if(accepted){
                        this.createConnection(message.from, false);              
                    }
                    break;            
                }
                case 'challenge_response': {
                    if(message.accepted){
                        this.createConnection(message.from, true);          
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
            this.texts.forEach(text => text.destroy());
            this.texts = presentUsers.map((u, i) => {
                const text = this.add.text(16, 32 * i, u.userId, { fontSize: '32px', fill: '#000' }).setInteractive();
                text.on('pointerdown', (pointer) => {
                    this.messageClient.send(u.userId, { type: 'challenge', from: this.userId });
                });

                text.on('pointerover', (pointer) => {
                    text.setStyle( { fontSize: '36px' });
                    text.setTint(0xff0000);
                });
                text.on('pointerout', (pointer) => {
                    text.setStyle( { fontSize: '32px' });
                    text.setTint(0xff0000);
                });
                return text;
            });
        });
    }
    update() {
    }

    destroy(){
        this.presenceClient.close();
        this.messageClient.close();
    }
}