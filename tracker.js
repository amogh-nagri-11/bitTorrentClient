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

    // 1.connectoinId, 2.action, 3.transactionId, 4.infoHash, 5.peerId, 6.downloaded,
    // 7.left, 8.uploaded, 9.event, 10.ipAdd, 11.key, 12.num want, 13.port 
    connId.copy(buf, 0); // 1
    buf.writeUint32BE(1, 8);  // 2
    crypto.randomBytes(4).copy(buf, 12); // 3
    torrentParser.infoHash(torrent).copy(buf, 16); // 4
    util.genId().copy(buf, 36); // 5
    Buffer.alloc(8).copy(buf, 56); // 6
    torrentParser.size(torrent).copy(buf, 64); // 7 -> sends the whole size of torrent files
    Buffer.alloc(8).copy(buf, 72); // 8
    buf.writeUint32BE(0, 80); // 9
    buf.writeUint32BE(0, 80); // 10
    crypto.randomBytes(4).copy(buf, 88); // 11 
    buf.writeint32BE(-1, 92); // 12
    buf.writeUint16BE(port, 96); // 13

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