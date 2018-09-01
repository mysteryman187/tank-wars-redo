import { Model } from './Model';
const uuidv4 = require('uuid/v4');

const POLL_INTERVAL = 10 * 1000;

export class MessageClient extends Model {
    private messages : any[] = [];
    private interval: number;
    constructor(userId: string, onMessage:(message: any) => void) {
        super('message');
        const checkForMessages = async () => {
            const messages = await this.query({ recipient: userId });
            const newMessages = messages.filter((m) => !this.messages.find(oldMessage => oldMessage.uuid === m.uuid));
            if(newMessages.length){
                newMessages.forEach(m => onMessage(m.message));
            }
            this.messages = messages;
        }
        this.interval = window.setInterval(checkForMessages, POLL_INTERVAL );
    }
    send(recipient, message) {
        const uuid = uuidv4();
        super.upsert(uuid, { recipient, uuid, message })
    }
    close(){
        window.clearInterval(this.interval);
    }
}