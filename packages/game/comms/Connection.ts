
export class Connection {
    private rtcPeerConnection: RTCPeerConnection;
    private sendChannel: RTCDataChannel;
    constructor(transportICECandidate: (candidate: RTCIceCandidate) => void,
        private transportOffer: (description: RTCSessionDescriptionInit) => void,
        private transportAnswer: (description: RTCSessionDescriptionInit) => void,
        public onMessage: (message) => void,
        private onReady?: () => void,
    ) {
        this.rtcPeerConnection = new RTCPeerConnection(null);
        this.sendChannel = this.rtcPeerConnection.createDataChannel('sendDataChannel');
        this.rtcPeerConnection.onicecandidate = event => transportICECandidate(event.candidate);
        this.rtcPeerConnection.ondatachannel = ({channel}) => {
            channel.onopen = () => {
                console.log('datachannel established!');
                this.onReady && this.onReady();
            }
            channel.onmessage = ({data}) => {
                const message = JSON.parse(data);
                this.onMessage(message);
            }
        };
    }

    public async receiveICECandidate(candidate: RTCIceCandidate) {
        try{
            await this.rtcPeerConnection.addIceCandidate(candidate);
        }catch(e){
            console.warn('dodgy ICE candidate');
        }
    }

    public async connect() {
        const sessionDescription = await this.rtcPeerConnection.createOffer()
        this.rtcPeerConnection.setLocalDescription(sessionDescription);
        this.transportOffer(sessionDescription);
    }

    public async receiveOffer(sessionDescription: RTCSessionDescriptionInit) {
        await this.rtcPeerConnection.setRemoteDescription(sessionDescription);
        const answerDescription = await this.rtcPeerConnection.createAnswer();
        this.rtcPeerConnection.setLocalDescription(answerDescription);
        this.transportAnswer(answerDescription);
    }

    public async receiveAnswer(sessionDescription: RTCSessionDescriptionInit) {
        await this.rtcPeerConnection.setRemoteDescription(sessionDescription);
    }
    public send(obj){
        this.sendChannel.send(JSON.stringify(obj));
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

