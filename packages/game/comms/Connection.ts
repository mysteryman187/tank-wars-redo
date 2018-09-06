import { EventEmitter } from 'events';

import * as qs from 'qs';

const params = qs.parse(window.location.search.substring(1, window.location.search.length));
const nostun = Object.keys(params).includes('nostun');

export class Connection {
    private rtcPeerConnection: RTCPeerConnection;
    private sendChannel: RTCDataChannel;
    private emitter: EventEmitter = new EventEmitter();

    constructor(transportICECandidate: (candidate: RTCIceCandidate) => void,
        private transportOffer: (description: RTCSessionDescriptionInit) => void,
        private transportAnswer: (description: RTCSessionDescriptionInit) => void,
        public onMessage: (message) => void,
        onReady?: () => void,
    ) {
        this.onReady(onReady);
        const config: RTCConfiguration = {
            iceServers: [{
                urls: [
                    'stun:66.102.1.127:19302',
                    'stun:[2a00:1450:400c:c06::7f]:19302'
                ]
            },
            {
                urls: [
                    'turn:74.125.140.127:19305?transport=udp',
                    'turn:[2a00:1450:400c:c08::7f]:19305?transport=udp',
                    'turn:74.125.140.127:19305?transport=tcp',
                    'turn:[2a00:1450:400c:c08::7f]:19305?transport=tcp'
                ],
                username: 'CKL6ttwFEgb+iCD4CYEYzc/s6OMTIICjBQ',
                credential: '7Wmakx6hnrMQ1epAT3kEoCfvhek='
            }]
        };
        if (nostun) {
            console.log('avoid using stun/turn server');
            delete config.iceServers;
        } else {
            console.log('using stun/turn server');
        }
        this.rtcPeerConnection = new RTCPeerConnection(config);
        this.sendChannel = this.rtcPeerConnection.createDataChannel('sendDataChannel');
        this.rtcPeerConnection.onicecandidate = event => transportICECandidate(event.candidate);
        this.rtcPeerConnection.ondatachannel = ({ channel }) => {
            channel.onopen = () => {
                console.log('datachannel established!');
                this.emitter.emit('ready');
            }
            channel.onmessage = ({ data }) => {
                const message = JSON.parse(data);
                this.onMessage(message);
            }
        };
    }

    public async receiveICECandidate(candidate: RTCIceCandidate) {
        console.log('recieve ICECandidate', candidate);
        try {
            await this.rtcPeerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.warn('dodgy ICE candidate', candidate);
        }
    }

    public async connect() {
        const sessionDescription = await this.rtcPeerConnection.createOffer()
        this.rtcPeerConnection.setLocalDescription(sessionDescription);
        this.transportOffer(sessionDescription);
    }

    public async receiveOffer(sessionDescription: RTCSessionDescriptionInit) {
        console.log('recieve offer', sessionDescription);
        await this.rtcPeerConnection.setRemoteDescription(sessionDescription);
        const answerDescription = await this.rtcPeerConnection.createAnswer();
        this.rtcPeerConnection.setLocalDescription(answerDescription);
        this.transportAnswer(answerDescription);
    }

    public async receiveAnswer(sessionDescription: RTCSessionDescriptionInit) {
        console.log('recieve answer', sessionDescription);
        await this.rtcPeerConnection.setRemoteDescription(sessionDescription);
    }
    public send(obj) {
        this.sendChannel.send(JSON.stringify(obj));
    }
    public onReady(callback){
        this.emitter.on('ready', callback);
    }
}


// const connection1 = new Connection(
//     (c) => connection2.receiveICECandidate(c),
//     o => connection2.receiveOffer(o),
//     a => connection2.receiveAnswer(a),
//     msg => console.log('connection1 got', msg),
//     () => connection1.send({ hello: 'world'})
// );

// const connection2 = new Connection(
//     (c) => connection1.receiveICECandidate(c),
//     o => connection1.receiveOffer(o),
//     a => connection1.receiveAnswer(a),
//     msg => {
//         console.log('connection2 got', msg);
//         connection2.send({ more : 'stuff' });
//     }
// );

// connection1.connect();

