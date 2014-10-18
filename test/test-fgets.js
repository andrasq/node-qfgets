var fs = require('fs');

var Fgets = require('../index').Fgets;
var FileReader = require('../index').FileReader;

module.exports = {
    'should export Fgets.fgets and FileReader': function(t) {
        t.equal('function', typeof Fgets);
        t.equal('function', typeof Fgets.prototype.fgets);
        t.equal('function', typeof FileReader);
        t.done();
    },

    'FileReader should have a read method': function(t) {
        var reader = new FileReader('/etc/motd');
        t.equal('function', typeof reader.read);
        t.done();
    },

    // TODO: more tests
};
