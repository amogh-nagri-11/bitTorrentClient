// message format - this one is for the handshake but all messages follow this format
// handshake: <pstrlen><pstr><reserved><info_hash><peer_id>

// pstrlen: string length of <pstr>, as a single raw byte
// pstr: string identifier of the protocol
// reserved: eight (8) reserved bytes. All current implementations use all zeroes.
// peer_id: 20-byte string used as a unique ID for the client.

// In version 1.0 of the BitTorrent protocol, pstrlen = 19, and pstr = "BitTorrent protocol".

'use strict'

import { Buffer } from 'node:buffer'; 
import { open, size, infoHash } from './torrent-parser.js';
import gendId from '../util.js';

//parse messges 
// only messages with length > 4 have ids 
// only messages with length > 5 have payloads 
// and only messages with id 6,7 or 8 have payloads that are split into index, begin and block length
// refer bitTorrent spec
const parse = msg => {
    const id = msg.length > 4 ? msg.readUInt(8) : null;
    let payload = msg.length > 5 ? msg.slice(5) : null; 

    if (id===6 || id===7 || id===8) {
        const rest = payload.slice(8); 
        payload = {
            index: payload.readUInt32BE(0), 
            begin: payload.readUInt32BE(4),
        }; 
        payload[id===7 ? 'block' : 'length']=rest; 
    }

    return {
        size: msg.readUInt32BE(0), 
        id: id, 
        payload: payload,
    }
}; 

const buildHandshake = torrent => {
    const buf = Buffer.alloc(68); 

    buf.writeUInt8(19, 0); //pstrlen 
    buf.write('BitTorrent protocol',1); //pstr 
    //reserved 
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);

    infoHash(torrent).copy(buf, 28); // info hash;
    buf.write(genId());

    return buf; 
}; 

const buildKeepAlive = () => Buffer.alloc(4);

const buildChoke = () => {
    const buf = Buffer.alloc(5); 
    buf.writeUInt32BE(1,0); // length 
    buf.writeUInt8(0,4); // id
    return buf; 
};

const buildUnchoke = () => {
    const buf = Buffer.alloc(5); 
    buf.writeUInt32BE(1,0); // length 
    buf.writeUInt8(1,4); // id
    return buf; 
};

const buildInterested = () => {
    const buf = Buffer.alloc(5); 
    buf.writeUInt32BE(1,0); // length 
    buf.writeUInt8(2,4); // id
    return buf; 
};

const buildUninterested = () => {
    const buf = Buffer.alloc(5); 
    buf.writeUInt32BE(1,0); // length 
    buf.writeUInt8(3,4); // id
    return buf; 
};

const buildHave = payload => {
    const buf = Buffer.alloc(5); 
    buf.writeUInt32BE(5,0); // length 
    buf.writeUInt8(4,4); // id
    buf.writeUInt32BE(payload,  5); // piece index
    return buf;
}

// payload = bitfield representing pieces that have been sucessfully downloaded
// high bit in first byte <- index 0 
// cleared bits -> missing piece 
// set bits -> valid and available sp
const buildBitfield = bitfield => { 
    const buf = Buffer.alloc(14); 
    buf.writeUInt32BE(bitfield.length+1,0); // length -> variable length
    buf.writeUInt8(5,4); // id
    buf.writeUInt32BE(buf, 5) // bitfield
    return buf;
}; 

const buildRequest = payload => {
    const buf = Buffer.alloc(17); 
    buf.writeUInt32BE(13,0); // length   
    buf.writeUInt8(6,4); // id
    buf.writeUInt32BE(payload.index, 5) // piece index
    buf.writeUInt32BE(payload.begin, 9) // begin 
    buf.writeUInt32BE(payload.length, 13); // length 
    return buf;
}; 


const buildPiece = payload => {
    const buf = Buffer.alloc(17); 
    buf.writeUInt32BE(payload.length+9,0); // length  
    buf.writeUInt8(7,4); // id
    buf.writeUInt32BE(payload.index, 5) // piece index
    buf.writeUInt32BE(payload.begin, 9) // begin 
    buf.copy(buf, 13); // block 
    return buf;
}; 

const buildCancel = payload => {
    const buf = Buffer.alloc(17); 
    buf.writeUInt32BE(13,0); // length   
    buf.writeUInt8(8,4); // id
    buf.writeUInt32BE(payload.index, 5) // piece index
    buf.writeUInt32BE(payload.begin, 9) // begin 
    buf.writeUInt32BE(payload.length, 13); // length 
    return buf;
}; 

const buildPort = payload => {
    const buf = Buffer.alloc(7); 
    buf.writeUInt32BE(3,0); // length
    buf.writeUInt8(9,4); // id
    buf.writeUInt16BE(payload, 4); // listen-port
    return buf;
}; 

export default { 
    parse,
    buildHandshake, 
    buildKeepAlive,
    buildChoke,
    buildUnchoke,
    buildInterested,
    buildUninterested,
    buildHave,
    buildBitfield,
    buildRequest,
    buildPiece,
    buildCancel,
    buildPort,
}