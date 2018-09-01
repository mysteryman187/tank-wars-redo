import * as qs from 'qs';

export class Model {
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
        const response = await fetch(`${location.origin}/${this.kind}/${id}`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        const payload = await response.json();
        return payload;
    }
    async all(){
        const response = await fetch(`${location.origin}/${this.kind}`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        const payload = await response.json();
        return payload;
    }
    async query(params){
        const query = qs.stringify(params);
        const response = await fetch(`${location.origin}/${this.kind}/query?${query}`, {
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
