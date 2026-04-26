'use strict' 

import * as tp from './torrent-parser.js';

export default class {
    constructor (size) {
        function buildPiecesArray() {
            const nPieces = torrent.info.pieces.length / 20;
            const arr = new Array(nPieces).fill(null);
            return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
        }

        this._requested = buildPiecesArray(); 
        this._recieved = buildPiecesArray();
    }

    addRequested(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN; 
        this._requested[pieceBlock.index][blockIndex] = true; 
    }

    addRecieved(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN; 
        this._recieved[pieceBlock.index][blockIndex] = true; 
    }

    needed(pieceBlock) {
        if (this._requested.every(blocks => blocks.every(i => i))) {
            // if all pieces are requested then copy recieved to requested to identify missing pieces
            this._requested = this._recieved.map(blocks => blocks.slice()); 
        } 

        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN; 
        return !this.requested[pieceBlock.index][blockIndex]; 
    }

    isDone() {
        return this._requested.every(blocks => blocks.every(i => i));
    }
}