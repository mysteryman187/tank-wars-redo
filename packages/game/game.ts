import { Game, AUTO, Scene } from 'phaser';
import { BattleScene } from './BattleScene';
import { LobbyScene } from './LobbyScene';

// todo lets do this first with websockets...then later with polling or whatever
// probs socket.io wouldwork on appengine..but stop any scaling tho! and the 30 seconds rule!

/*
    suddenly its not looking like polling will do this conversation!
    // if i do with websocks
    // then I see all the info we get on the server in what order
    // hmmm maybe...

    what if we just set who the mesasge if for and what it in datastore
    then we are also polling for messages "for me"
    
    ok sounds reasonable
    but how do we know whats a message for me?

    so...
    1. the page loads and now i want to be in the lobby
    2. so I send a message for datastore { recipient: 'everyone', messageType: 'join' }
    2. and i setInterval to send a message for datastore { recipient: 'everyone', messageType: 'presence' }
    
    3. others are polling for messages
    4. how do we know when someone leaves?
    5. each message has a very short ttl, we query the dataStore for stuff thats new only
    6. we alos query the datastore with the id or something of the last message we got(client sends that param)
    7. so someone left or starts a game(essentially they stop sending presence messages to the lobby)

    ...yeah presence interval works!

    .. im having dejavu here!

    I need a backend worker thingy that can delete periodically all the shite that this mechanism is gonna generate!

    so following on from player presence being acheived
    we would list every player somewhere
    and I can challenge someone
    or someone can challenge me
    and thats done be sending { recipient: 'mysteryman', messageType: 'challenge' }
    my polling is gonna pick that up now
    and a GUI box tells me that this asshole challenges me!
    so I accept and...
    ..well if all thats working then the rest should be easy!
    obviously we need to transport the ICE cnadidates n shit in the same way
    and thats done be sending { recipient: 'mysteryman', messageType: 'ICECandidate' }
*/
class Connection {
    private rtcPeerConnection: RTCPeerConnection;
    private sendChannel: RTCDataChannel;
    constructor(transportICECandidate: (candidate: RTCIceCandidate) => void,
        private transportOffer: (description: RTCSessionDescriptionInit) => void,
        private transportAnswer: (description: RTCSessionDescriptionInit) => void,
        private onMessage: (message) => void,
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


const connection1 = new Connection(
    (c) => connection2.receiveICECandidate(c),
    o => connection2.receiveOffer(o),
    a => connection2.receiveAnswer(a),
    msg => console.log('connection1 got', msg),
    () => connection1.send({ hello: 'world'})
);
const connection2 = new Connection(
    (c) => connection1.receiveICECandidate(c),
    o => connection1.receiveOffer(o),
    a => connection1.receiveAnswer(a),
    msg => {
        console.log('connection2 got', msg);
        connection2.send({ more : 'stuff' });
    }
);

connection1.connect();
const userId = `user-${Math.random()}`;

class Model{
    constructor(private kind:string){
    }
    async upsert(id, obj){
        const response = await fetch(`${location.origin}/${this.kind}/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(obj)
        });
        // todo handle errors
    }
    async read(id){
        const response = await fetch(`${location.origin}/presence`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        const payload = await response.json();
        return payload;
    }
}

class PresenceClient extends Model {
    constructor(){
        super('presence');
    }
}

class MessageClient extends Model {
    constructor(){
        super('msg');
    }
    upsert(id){
        // so this things used to poll for messages
        // either they are for me
        // or they are for everyone
        // scratch that...they are for me only
        // we use presence to get userIds
        // and then we know who we are speaking to
        // so I want to challenge someone - we send that userId a challenge message with a uuid I made up
        // and i just need to dedupe uuids once i recieve messages
        // and we give those mesages a long ttl
    }
}

const client = new PresenceClient();
setInterval(() => {
    client.upsert(userId, { userId });
}, 9000);

setInterval(async () => {
    const presentUsers = await client.read(userId);
    document.querySelector('#prev').innerHTML = '';
    presentUsers.map(u => {
        const d = document.createElement('div')
        d.appendChild(document.createTextNode(u.userId));
        document.querySelector('#prev').appendChild(d);
    });
}, 5000);


// const game = new Game({
//     type: AUTO,
//     width: 1024,
//     height: 1024,
//     physics: {
//         default: 'arcade',
//         arcade: {
//             gravity: { y: 0 },
//             debug: false
//         }
//     },
//     backgroundColor: '#055f19',
//     scene: BattleScene
// });

// const ws = new WebSocket(`ws://${location.host}`);

// ws.onopen =  function open() {
//   ws.send('something');
// };

// ws.onmessage = function incoming(data) {
//   console.log('received', data);
// };
