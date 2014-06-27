/**
 * @description Catalogue module
 * @filename /modules/Key.js
 */

module.exports = (function (rq) {
    'use strict';
    var cfg = rq(__dirname + '/config')
        , fs = rq('fs')
        , crc32 = require('crc').crc32
        , urlRegex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

    function keyToFilename(key) {
        return __dirname + "/../" + cfg["directory_name"] + "/" + key;
    }

    function hash(url) {
        return crc32(url).slice(0, cfg["key_length"]).toString('utf8')
    }

    return {
        hash: hash,
        Exists: function (key, cb) {
            return fs.exists(keyToFilename(key), cb)
        },
        Get: function (key, cb) {
            return fs.readFile(keyToFilename(key), function (err, data) {
                if (err) {
                    return cb(err, undefined)
                } else {
                    return cb(undefined, JSON.parse(data.toString('utf8')));
                }
            });
        },
        Create: function (options, cb) {
            if (!options.url || typeof(options.url) !== "string") {
                return cb("ERR_NO_URL")
            }
            if (!urlRegex.test(options.url)) {
                return cb("ERR_WRONG_URL")
            }
            if (options.url.length > cfg["url_maxlength"]) {
                return cb("ERR_WRONG_URL")
            }
            var key = hash(options.url);
            fs.writeFile(keyToFilename(key), JSON.stringify(options), function (err) {
                if (err) {
                    console.log(err);
                    return cb("ERR_INTERNAL");
                }
                return cb(undefined, key);
            })
        },
        Remove: function (key, cb) {
            return fs.unlink(keyToFilename(key), cb);
        }
    }
})
(require);