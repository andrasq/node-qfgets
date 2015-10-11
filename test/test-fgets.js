var fs = require('fs');

var Fgets = require('../index');

module.exports = {
    'package.json should parse': function(t) {
        require('../package.json');
        t.done();
    },

    'should export Fgets.fgets and FileReader': function(t) {
        t.equal('function', typeof Fgets);
        t.equal('function', typeof Fgets.prototype.fgets);
        t.equal('function', typeof Fgets.FileReader);
        t.done();
    },

    'FileReader should have a read method': function(t) {
        var reader = new Fgets.FileReader('/etc/motd');
        t.equal('function', typeof reader.read);
        t.done();
    },

    'FileReader should use configured bufferSize': function(t) {
        var reader = new Fgets.FileReader('/etc/motd', {bufferSize: 3});
        t.equal(reader.buf.length, 3);
        t.done();
    },

    'processLines should return all lines': function(t) {
        var data = "", nlines = 10000;
        for (var i=0; i<nlines; i++) data += "middling length test line number " + i + "\n";
        fs.writeFileSync("/tmp/unit-fgets.tmp", data);
        var fp = new Fgets("/tmp/unit-fgets.tmp");
        var lines = [];
        var yieldCount = 0, yieldLoop = setImmediate(function yield(){ yieldCount += 1; setImmediate(yield) });
        fp.processLines(function(line, cb) {
            lines.push(line);
            cb();
        }, function(err) {
            if (global.clearImmediate) clearImmediate(yieldLoop);
            fs.unlinkSync("/tmp/unit-fgets.tmp");
            t.equal(lines.length, nlines);
            t.equal(lines.join(''), data);
            t.ok(yieldCount > nlines/100);
            t.done();
        });
    },

    // TODO: more tests
};
