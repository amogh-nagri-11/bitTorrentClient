import bencode from 'bencode';
import fs from 'fs';

console.log("method 2");
const torrent2 = bencode.decode(fs.readFileSync('puppy.torrent'));
console.log('announce: ',torrent2.announce.toString('utf8'));

console.log("original: "); 
const torrent3 = fs.readFileSync('puppy.torrent'); 
console.log("original: ", torrent3.toString('utf8')); 

console.log('bencoded '); 
console.log('bencoded: ', torrent2.toString('utf8'))

const announce = Buffer.from(torrent2.announce).toString('utf8'); 
console.log('fixed ', announce);