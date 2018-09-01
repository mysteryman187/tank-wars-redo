import { Model } from './Model';

export interface PresenceMessage {
    userId: string
}

const ANNOUNCE_INTERVAL = 30 * 1000;
const POLL_INTERVAL = 10 * 1000;

export class PresenceClient extends Model {
    private intervals: number[] = [];
    private presentUsers: PresenceMessage[] = [];
    constructor(private userId: string, private onUpdate: (users: PresenceMessage[]) => void){
        super('presence');
        const announce = () => this.upsert(userId, { userId, presence : 'present' });

        const announceInterval = window.setInterval(announce, ANNOUNCE_INTERVAL);
        this.intervals.push(announceInterval);

        const poll = async () => {
            const newPresentUsers = await this.query({ presence : 'present' });
            const myIndex = newPresentUsers.indexOf(newPresentUsers.find(u => u.userId === userId ));
            if(myIndex !== -1){
                newPresentUsers.splice(myIndex, 1);
            }
            if(newPresentUsers.length !== this.presentUsers.length){
                this.presentUsers = newPresentUsers;
                this.onUpdate(newPresentUsers);
                return;
            }
            const allSame = newPresentUsers.every(newUser => this.presentUsers.find(prevUser => prevUser.userId === newUser.userId));
            console.log(allSame);
            if(!allSame){
                this.onUpdate(newPresentUsers);
            }
        };
        const pollInterval = window.setInterval(poll, POLL_INTERVAL);
        this.intervals.push(pollInterval);

        announce();
        poll();
    }
    close(){
        this.intervals.forEach(i => window.clearInterval(i));
    }
    away(){
        this.upsert(this.userId, { userId: this.userId, presence : 'away' });
    }
}