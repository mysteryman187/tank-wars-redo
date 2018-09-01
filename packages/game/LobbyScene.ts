import { Scene, Math, Physics } from 'phaser';
import { PresenceClient } from './comms/PresenceClient';
import { MessageClient } from './comms/MessageClient';
import { Connection } from './comms/Connection';
import { BattleScene } from './BattleScene';
import { lobbyRectangle } from './textures';

export class LobbyScene extends Scene {
    private texts: any [] = [];
    private connection: Connection;
    private messageClient: MessageClient;
    private presenceClient: PresenceClient;

    constructor(private userId: string) {
        super(null);
    }
    preload() {
        this.load.image('lobby-background', 'assets/images/lobby_bg.png');
        lobbyRectangle(this);
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
        window.onbeforeunload  = this.destroy.bind(this);

        this.add.image(0, 0, 'lobby-background')
        .setOrigin(0)
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

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
            this.texts.forEach(textArray => textArray.forEach(text => text.destroy()));
            this.texts = presentUsers.map((u, i) => {
                const normalStyle = { fontSize: '42px', fill: '#444444', fontFamily: 'handwritten' };
                const hoverStyle = { fontSize: '45px', fill: '#444444', fontFamily: 'handwritten' };
                
                const y = 300 + (40 * i);
                const rankText = this.add
                .text(160, y , 'pvt', normalStyle)
               
                const text = this.add
                .text(400, y, u.userId, normalStyle)
                .setInteractive();

                text.on('pointerdown', (pointer) => {
                    this.messageClient.send(u.userId, { type: 'challenge', from: this.userId });
                });

                text.on('pointerover', (pointer) => {
                    text.setStyle(hoverStyle);
                });
                text.on('pointerout', (pointer) => {
                    text.setStyle(normalStyle);
                });
                return [ text, rankText ] ;
            });
        });
    }
    update() {
    }

    destroy(){
        this.presenceClient.away();
        this.presenceClient.close();
        this.messageClient.close();
    }
}