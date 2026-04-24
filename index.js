'use strict' 

import fs from 'fs'; 
import bencode from 'bencode'; // data serialization format 
import dgram from 'node:dgram'; // provides impelementation of udp 
import { Buffer } from 'node:buffer'; // handles raw binary data
import { URL } from 'node:url'; // handles web addresses 

// location of tracker ( tracker - sends list of peers on request, small file hence UDP is used )
const torrent = bencode.decode(fs.readFileSync('puppy.torrent')); 

console.log(torrent.announce.toString('utf8'));

const url = new URL(torrent.announce.toString('utf8'));

// create udp socket 
const socket = dgram.createSocket('udp4'); 

const myMsg = Buffer.from('hello?', 'utf8'); 

socket.send(myMsg, 0, myMsg.length, Number(url.port), url.hostname, () => {});

socket.on('message', msg => {
    console.log("message is ", msg); 
}); 

