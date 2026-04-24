'use strict'

import crypto from 'node:crypto';

let id = null; 

export default genId = () => {
    if (!id) {
        crypto.randomBytes(20); 
        Buffer.from('-AT0001-').copy(id, 0); 
    }
    return id;
}; 