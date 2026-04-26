'use strict' 

import fs from 'fs'; 
import bencode from 'bencode';
import crypto from 'node:crypto';

const open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath)); 
};

// calculates the size of torrent files
const size = torrent => {
    const size = torrent.info.files ? 
        torrent.info.files.map(file => file.length).reduce((a, b) => a+b) : 
        torrent.info.length; 

    // const buf = Buffer.alloc(8);
    // buf.writeBigUint64BE(BigInt(size));

    return size;
}; 

// hashes the info property of torrent files to unique identification
const infoHash = torrent => {
    const info = bencode.decode(torrent.info); 
    return crypto.createHash('sha1').update(info).digest(); // sha1 is used by bitTorrent
};

const BLOCK_LEN = 2 ** 14; 

// not really required
// const buffertoBigInt = (buf) => {
//     let result = 0n;

//     for (const byte of buf) { 
//         result = ( result << 8n ) + BigInt(byte); 
//     }
//     return result; 
// };

const pieceLen = (torrent, piecesIndex) => {
    const totalLength = size(torrent); 
    const pieceLength = torrent.info['piece length'];

    const lastPieceLength = totalLength % pieceLength;
    const lastPieceIndex = Math.floor(totalLength / pieceLength); 

    return lastPieceIndex === piecesIndex ? lastPieceLength : pieceLength;
};  

const blocksPerPiece = (torrent, pieceIndex) => {
    const pieceLength = pieceLen(torrent, pieceIndex); 
    return Math.ceil( pieceLength / BLOCK_LEN );
}; 

const blockLen = (torrent, pieceIndex, blockIndex) => {
    const pieceLength = pieceLen(torrent, pieceIndex); 
    const lastBlockLen = pieceLength % BLOCK_LEN; 
    const lastBlockIndex = Math.floor( pieceLength / BLOCK_LEN );

    return blockIndex === lastBlockIndex ? lastBlockIndex : blockIndex;
}; 

export default { open, size, infoHash, BLOCK_LEN, pieceLen, blockLen, blocksPerPiece };