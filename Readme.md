qfgets
======

line-at-a-time stream reader and fast newline terminated data transport.  3x
faster than require('readline'), and works like C fgets(), it doesn't modify
the input.  Reads and returns a million lines / second.

### Fgets( stream )

create a new file reader.  Stream is any object with a `read([numbytes],
callback)` method, or a string filename.  If a filename, a FileReader object
will be created to read the input.

#### fgets( )

return the next buffered newline-terminated line, or "" if the buffer is
currently empty.  Will return the empty string "" when the buffer is being
filled, as well as after end of file.  Use feof() to distinguish.  Note: the
caller must periodically yield with setImmediate or setTimeout to allow the
buffer to fill.

        var fs = require('fs');
        var Fgets = require('qfgets');
        var fp = new Fgets(fs.createReadStream('/etc/motd', 'r'));
        // line = fp.fgets();

#### feof( )

returns true when fgets has no more lines to return

        var Fgets = require('qfgets');
        var fp = new Fgets('/etc/motd');        // use buit-in FileReader
        var contents = "";
        (function readfile() {
            for (var i=0; i<40; i++) contents += fp.fgets();
            if (!fp.feof()) setImmediate(readfile);     // yield periodically
        })();

#### Fgets.FileReader

fast file reader to feed data to fgets.  A smidge faster than a read stream
created with a reasonable highWaterMark (50% faster than a stream created with
defaults)

        var Fgets = require('qfgets');
        var fp = new Fgets(new Fgets.FileReader('/etc/motd'));
        // line = fp.fgets();
