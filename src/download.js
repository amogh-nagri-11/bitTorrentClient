'use strict' 

import net from 'node:net'; 
import { Buffer } from 'node:buffer'; 
import { getPeers } from './tracker.js';
import message from './message.js';

export const startDownload = (torrent) => {
    getPeers(torrent, peers => {
        peers.forEach(peer => download(peer, torrent));
    }); 
}; 

const download = (peer, torrent) => {
    const socket = new net.socket(); 
    socket.on('error', console.log); 
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent)); 
    }); 
    onWholeMsg(socket, msg => msgHandler(msg, socket)); 
}; 

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0)+49 && msg.toString('utf8',1) === 'BitTorrent protocol';
}

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

function msgHandler(msg, socket) {
    if (isHandshake(msg)) {
        socket.write(message.buildInterested());
    } else {
        const m = message.parse(msg); 

        if (m.id===1) chokeHandler(); 
        if (m.id===2) unchokeHandler(); 
        if (m.id===3) haveHandler(m.payload);
        if (m.id===4) bitfieldHandler(m.payload); 
        if (m.id===5) pieceHandler(m.payload);
    }
}; 

function chokeHandler() {

}; 

function unchokeHandler() {

};

function haveHandler(payload) {

};

function bitfieldHandler(payload) {

};

function pieceHandler(payload) {

};