'use strict' 

import net from 'node:net'; 
import { Buffer } from 'node:buffer'; 

import { getPeers } from './tracker.js';
import message from './message.js';
import Pieces from './Pieces.js';
import Queue from './Queue.js';

export default torrent => {
    getPeers(torrent, peers => {
        const pieces = new Pieces(torrent);
        peers.forEach(peer => download(peer, torrent, pieces));
    }); 
}; 

const download = (peer, torrent, pieces) => {
    const socket = new net.socket(); 
    socket.on('error', console.log); 
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent)); 
    }); 
    const queue = new Queue(torrent);
    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue)); 
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

function msgHandler(msg, socket, pieces, queue) {
    if (isHandshake(msg)) {
        socket.write(message.buildInterested());
    } else {
        const m = message.parse(msg); 

        if (m.id===0) chokeHandler(); 
        if (m.id===1) unchokeHandler(); 
        if (m.id===4) haveHandler(m.payload, socket, pieces, queue);
        if (m.id===5) bitfieldHandler(m.payload); 
        if (m.id===7) pieceHandler(m.payload);
    }
}; 

function chokeHandler(socket) {
    socket.end();
}; 

function unchokeHandler(socket, pieces, queue) {
    queue.choked = false; 

    requestPiece(socket, pieces, queue);
};

function haveHandler(payload, socket, requested, queue) {
    const pieceIndex = payload.readUInt32BE(0); 
    if (!requested[pieceIndex]) {
        socket.write(message.buildRequest());
    }
    requested[pieceIndex] = true;
};

function bitfieldHandler(payload) {

};

function pieceHandler(payload, socket, requested, queue) {

};

function requestPiece(socket, pieces, queue) {
    if (queue.choked) return null;

    while (queue.length) {
        const pieceBlock = queue.dequeu(); 
        if (pieces.needed(pieceBlock)) {
            socket.write(message.buildRequest(pieceBlock)); 
            pieces.addRequested(pieceBlock); 
            break;
        }
    }
}; 