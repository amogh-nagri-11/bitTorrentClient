'use strict' 

import net from 'node:net'; 
import { Buffer } from 'node:buffer'; 
import { getPeers } from './tracker.js';

export const startDownload = (torrent) => {
    getPeers(torrent, peers => {
        peers.forEach(download);
    }); 
}; 

const download = (peer) => {
    const socket = net.socket(); 
    socket.on('error', console.log('error')); 
    socket.connect(peer.port, peer.ip, () => {
        socket.write('hi there'); 
    }); 
    onWholeMsg('data', data => {
        console.log('data');
    }); 
}; 

function onWholeMsg (socket, callback) {
    let savedBuf = Buffer.alloc(0); 
    let handshake = true; 

    socket.on('data', recvBuf => {
        // msgLen calculates the length of the whole message
        const msgLen = () => handshake ? savedBuf.readUInt8(0)+49 : savedBuf.readUInt32BE(0) + 4; 
        savedBuf = Buffer.concat([savedBuf, recvBuf]); 

        while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
            callback(savedBuf.slice(0, msgLen())); 
            savedBuf = savedBuf.slice(msgLen()); 
            handshake = false; 
        }
    });
}; 