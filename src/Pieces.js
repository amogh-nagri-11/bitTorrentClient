'use strict' 

export default class {
    constructor (size) {
        this.requested = new Array(size).fill(false); 
        this.recieved = new Array(size).fill(false);
    }

    addRequested(pieceIndex) {
        this.requested[pieceIndex] = true; 
    }

    addRecieved(pieceIndex) {
        this.recieved[pieceIndex] = true; 
    }

    needed(pieceIndex) {
        if (this.requested.every(i => i === true)) {
            // if all pieces are requested then copy recieved to requested to identify missing pieces
            this.requested = this.recieved.slice(); 
        } 
        return !this.requested[pieceIndex]; 
    }

    isDone() {
        return this.requested.every(i => i === true);
    }
}