/**
 * fgets - line buffered stream input
 *
 * Copyright (C) 2014 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2014-09-13 - AR.
 */

module.exports = Fgets;

var fs = require('fs');
//var util = require('util');                           // TBD
//var EventEmitter = require('events').EventEmitter;    // TBD
var FileReader = require('./file-reader');

/**
 * line-at-a-time stream reader
 */
function Fgets( stream ) {
    'use strict';
    //EventEmitter.call(this);                          // TBD

    this.fp = stream;
    this._readbuf = "";
    this._readoffset = 0;
    this._eof = false;

    var self = this;
    if (typeof stream === 'string') this.fp = stream = new FileReader(stream);
    stream.pause();
    stream.on('error', function(err) { throw err; });
    stream.on('end', function() { self._eof = true; });
}
//util.inherits(Fgets, EventEmitter);                   // TBD

/**
 * return the next newline-terminated line from the stream,
 * or return an empty string.
 */
Fgets.prototype.fgets = function fgets( ) {
    var eol = this._readbuf.indexOf("\n", this._readoffset);
    if (eol >= 0) {
        return this._readbuf.slice(this._readoffset, this._readoffset = eol + 1);
    }
    else if (this._eof) {
        // end of file is not newline terminated... return it like C fgets()
        // note that this is not compatible with newline terminated data
        return this._readbuf.slice(this._readoffset, this._readoffset = this._readbuf.length);
    }
    else {
        this._fillbuf();
        return "";
    }
};

Fgets.prototype.feof = function feof( ) {
    return this._eof && this._readoffset >= this._readbuf.length;
};

/**
 * Run all newline-terminated lines in the file through the visitor() function.
 * Visitor takes two parameters, the line string and a callback, and returns
 * an error to stop the processing.  processLines() returns the final success status
 */
Fgets.prototype.processLines = function processLines( visitor, callback ) {
    var self = this, lineCount = 0, nlines = 0;
    function getline() { try { return self.fgets(); } catch (err) { return err; } };
    (function processLine() {
        var line = getline();
        if (!line) return self.feof() ? callback(null, lineCount) : (nlines = 0, setTimeout(processLine, 1));
        else if (line instanceof Error) return callback(line, lineCount);
        visitor(line, function(err) {
            if (err) return callback(err, lineCount);
            lineCount += 1;
            // yield to the event loop every batch of 20 lines
            return nlines++ < 20 ? processLine() : (nlines = 0, setImmediate(processLine));
        });
    })();
};

Fgets.prototype._fillbuf = function _fillbuf( ) {
    if (this._readoffset > 0) {
        // discard the consumed data, retain the unread
        this._readbuf = this._readbuf.slice(this._readoffset);
        this._readoffset = 0;
    }
    var data = this.fp.read();
    if (data) this._readbuf += data + "";
};


// TODO: maybe should decorate the stream: provide an "fgets" method on the stream itself