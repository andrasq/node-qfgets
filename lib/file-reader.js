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
    this.buf = new Buffer(options.bufferSize || 409600);
    this.str = "";
    this.read = function() { return null; };
    this._eof = false;

    var self = this;
    fs.open(filename, 'r', function(err, fd) {
        if (err) throw err;
        self.fd = fd;

        self.read = function(limit) {
            limit = limit > 0 ? Math.min(limit, self.buf.length) : self.buf.length;
            // faster to not start a second read while the first is in progress
            if (self._reading) return null;
            self._reading = true;
            fs.read(self.fd, self.buf, 0, limit, null, function(err, nBytes, buffer) {
                self._reading = false;
                if (err) throw err;
                self.str += buffer.toString('utf8', 0, nBytes);
                if (nBytes === 0 && !self._eof) {
                    self._eof = true;
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
