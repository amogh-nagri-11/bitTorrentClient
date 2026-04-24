'use strict'

import dgram from 'dgram'; 
import { Buffer } from 'node:buffer'; // not required 
import { URL } from 'node:url'; // not required

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

}

function parseConnReq(response) {

}

function parseAnnounceReq(response) {

}

function buildAnnounceReq(response) {
    
}