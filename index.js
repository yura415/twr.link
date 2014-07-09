/**
 * @description Main project file
 * @filename /index.js
 */

module.exports = exports = (function (rq) {
    'use strict';

    var cfg = rq(__dirname + '/modules/config')
        , fs = rq('fs')
        , catalogueDir = __dirname + "/" + cfg["directory_name"];
    if (process.argv && process.argv.indexOf('-c') >= 0) {
        var path = rq('path')
            , clean = rq(__dirname + '/modules/clean')
            , md5 = rq('MD5')
            , urlignoreFile = __dirname + '/.urlignore'
            , ignored = fs.existsSync(urlignoreFile) ? fs.readFileSync(urlignoreFile).toString().trim().split('\n') : [];
        ignored = ignored.map(function (x) {
            x = md5(x);
            return x.substr(0, 2) + path.sep + x.substr(2, 2) + path.sep + x.substr(4);
        });
        //clean all links not in ignore list.
        clean(catalogueDir, function (x, cb) {
            var stats = fs.statSync(x)
                , ignore = false;
            for (var i = 0; i < ignored.length; i++) {
                if (x.indexOf(ignored[i]) >= 0) {
                    ignore = true;
                    return;
                }
            }
            if (stats.isFile() && !ignore) {
                return fs.unlinkSync(x);
            }
            cb(x);
        });
        //clean all empty dirs. twice because of file structure.
        var f = function () {
            clean(catalogueDir, function (x, cb) {
                var stats = fs.statSync(x);
                if (!stats.isDirectory())return;
                var data = fs.readdirSync(x);
                if (data.length == 0) {
                    fs.rmdirSync(x);
                }
                cb(x);
            });
        };
        return f(f());
    }

    if (!fs.existsSync(catalogueDir)) {
        fs.mkdirSync(catalogueDir);
    }

    rq(__dirname + '/modules/httpServer').listen(cfg["port"], cfg["hostname"]);
    console.log("server listens on port", cfg["port"]);

    if (process.argv && process.argv.indexOf('-d') >= 0)
        rq('daemon')();

    return this;
})
(require);