'use strict'

import dgram from 'dgram'; 
import { Buffer } from 'node:buffer'; // not required 
import { URL } from 'node:url'; // not required
import crypto from 'node:crypto'; // to create a random number for the buffer
import torrentParser from './torrent-parser'; 
import util from './util';

export const getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4'); 
    const torrent = torrent.announce.toString('utf8'); 
    
    //send connection request 
    udpSend(socket, buildConnReq(), url); 

    socket.on('message', response => {
        if (resType(response) == 'connect') {
            const connResp = parseConnResp(response) 
            //send announce request 
            const announceReq = buildAnnounceReq(connResp.connection_id); 
            udpSend(socket, announceReq, url); 
        } else if (resType(response) == 'announce') {
            const announceResp = parseAnnounceResp(response); 
            // send peers to callback 
            callback(announceResp.peers); 
        }
    }); 
}; 

function udpSend(socket, message, rawURL, callback=()=>{}) {
    const url = urlParse(rawURL); 
    socket.send(message, 0, message.length, Number(url.port), url.hostname, callback); 
}

function resType(response) {

}

function buildConnReq() {
    const buf = Buffer.alloc(16); 

    // node.js does not support precise 64 bit integers
    //connection id using magic constant = 0x41727101980 split into two 32 bit integers, hence the two writeBigUint64BE's used
    buf.writeBigUint64BE(0x417, 0); // writeBigUint64BE - writes 32 bit unsigned integer in big endian format
    buf.writeBigUint64BE(0x27101980, 4); //starting from 27 but offset by 4, i.e. the index of 27 is 4 
    //action
    buf.writeUint32BE(0, 8); // writes 0 at offset 8 which means connect
    //transaction id 
    crypto.randomBytes(4).copy(buf, 12);

    return buf; 
}

function parseConnReq(response) {
    return {
        action: response.readUint32BE(0), 
        transactionId: response.readUint32BE(4), 
        connectionId: response.slice(8), // since we cannot read a 64 bit integer we leave it as a buffer
    };
}

function buildAnnounceReq(response) {
    const buf = Buffer.allocUnsafe(98); 

    // connectoinId, action, transactionId, infoHash, peerId, downloaded, left, uploaded, event, ipAdd, key, num want, port in the same order
    connId.copy(buf, 0); 
    buf.writeUint32BE(1, 8); 
    crypto.randomBytes(4).copy(buf, 12); 
    torrentParser.infoHash(torrent).copy(buf, 16); 
    util.genId().copy(buf, 36); 
    Buffer.alloc(8).copy(buf, 56);
    torrentParser.size(torrent).copy(buf, 64); 
    Buffer.alloc(8).copy(buf, 72);
    buf.writeUint32BE(0, 80); 
    buf.writeUint32BE(0, 80); 
    crypto.randomBytes(4).copy(buf, 88); 
    buf.writeint32BE(-1, 92); 
    buf.writeUint16BE(port, 96); 

    return buf;
}

function parseAnnounceReq(response) {
    function group (iterable, groupSize) {
        let groups = []; 
        for (let i=0;i<iterable.length;i+=groupSize) {
            groups.push(iterable.slice(i,i+groupSize));
        }
        return groups; 
    }

    return {
        action: response.readUint32BE(0), 
        transactionId: response.readUint32BE(4), 
        leechers: response.readUint32BE(8), 
        seeders: response.readUint32BE(12), 
        peers: group(response.slice(20), 6).map(address => {
            return {
                id: address.slice(0,4).join('.'), 
                port: address.readUint32BE(4),
            }; 
        })
    }
}