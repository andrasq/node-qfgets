/**
 * fast file reader to feed data to Fgets
 *
 * Copyright (C) 2014 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2014-09-13 - AR.
 */

module.exports = FileReader;

fs = require('fs');
util = require('util');
EventEmitter = require('events').EventEmitter;

function FileReader( filename, options ) {
    'use strict';
    EventEmitter.call(this);

    options = options || {};

    // outperforms default createReadStream 50%, but is only 10% faster
    // when created with highWaterMark: 409600.
    //return new fs.createReadStream(filename, {highWaterMark: 409600});
    //return new fs.createReadStream(filename);

    if (!this instanceof FileReader) return new FileReader(filename);

    this.filename = filename;
    this.fd = null;
    // use a large enough buffer to capture large payloads too
    this.buf = new Buffer((options.bufferSize || 409600) + 4);
    this._bytesLeft = 0;
    this.str = "";
    this.read = function() { return null; };
    this._eof = false;

    var self = this;
    fs.open(filename, 'r', function(err, fd) {
        if (err) throw err;
        self.fd = fd;

        self.read = function(limit) {
            limit = limit > 0 ? Math.min(limit, self.buf.length - 4) : self.buf.length - 4;
            // faster to not start a second read while the first is in progress
            if (self._reading) return null;
            self._reading = true;
            fs.read(self.fd, self.buf, self._bytesLeft, limit, null, function(err, nBytes, buffer) {
                self._reading = false;
                if (err) throw err;

                // Do not split multi-byte utf8 chars between the start and continuation bytes.
                // Multi-byte chars start with an 11xxxxxx byte and are followed by 10xxxxxx bytes.
                var bound = self._bytesLeft + nBytes;
                self._bytesLeft = 0;
                if (nBytes > 0) {
                    if (self.buf[bound - 1] & 0x80) {
                        // ends on multi-char start byte
                        if ((self.buf[bound-1] & 0xC0) === 0xC0) { bound -= 1; self._bytesLeft = 1; }
                        // ends on 2nd byte
                        else if (bound >= 2 && (self.buf[bound-2] & 0xC0) === 0xC0) { bound -= 2; self._bytesLeft = 2; }
                        // ends on 3rd byte
                        else if (bound >= 3 && (self.buf[bound-3] & 0xC0) === 0xC0) { bound -= 3; self._bytesLeft = 3; }
                        // ends on 4th ie last byte, no need to back up
                    }

                    self.str += buffer.toString('utf8', 0, bound);
                    if (self._bytesLeft > 0) self.buf.copy(self.buf, 0, bound, bound + self._bytesLeft);
                }
                else if (!self._eof) {
                    self._eof = true;
                    // on end of input flush any remaining stray bytes.  This should not occur with utf8.
                    if (self._bytesLeft > 0) { self.str += buffer.toString('utf8', 0, self._bytesLeft); self._bytesLeft = 0; }
                    // FIXME: what does it mean to emit 'end' without also emitting 'data' ?
                    self.emit('end');
                }
            });
            var ret = self.str;
            self.str = "";
            return ret;
        };
    });

    // FileReader only emits 'end' events
    this.pause = function() { };
    this.resume = function() { };
}
util.inherits(FileReader, EventEmitter);
