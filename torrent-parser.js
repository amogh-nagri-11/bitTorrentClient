'use strict' 

import fs from 'fs'; 
import bencode from 'bencode';
import crypto from 'node:crypto';

export const open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath)); 
};

// calculates the size of torrent files
export const size = torrent => {
    const size = torrent.info.files ? 
        torrent.info.files.map(file => file.length).reduce((a, b) => a+b) : 
        torrent.info.length; 

    const buf = Buffer.alloc(8);
    buf.writeBigUint64BE(BigInt(size));

    return buf;
}; 

// hashes the info property of torrent files to unique identification
export const infoHash = torrent => {
    const info = bencode.decode(torrent.info); 
    return crypto.createHash('sha1').update(info).digest(); // sha1 is used by bitTorrent
}; 

