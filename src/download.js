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
    socket.on('data', data => {
        console.log('data');
    }); 
}; 

