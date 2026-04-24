'use strict' 

import fs from 'fs'; 
import bencode from 'bencode'; // data serialization format 
import dgram from 'node:dgram'; // provides impelementation of udp 

import { getPeers } from './tracker.js';
import { open } from './torrent-parser.js';

// location of tracker ( tracker - sends list of peers on request, small file hence UDP is used )
const torrent = open('puppy.torrent'); 

getPeers(torrent, peers => {
    console.log("list of peers: ", peers); 
}); 