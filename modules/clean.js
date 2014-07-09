/**
 * @description Catalogue cleaning module. Erases empty dirs and all urls that not in .urlignore.
 * @filename /modules/clean.js
 */

module.exports = exports = (function (rq) {
    'use strict';

    var fs = rq('fs')
        , path = rq('path');

    var rec = function (dir, f) {
        if (!fs.existsSync(dir))return;
        var stats = fs.statSync(dir);
        if (!stats.isDirectory())return;
        var data = fs.readdirSync(dir);
        for (var i = 0; i < data.length; i++) {
            f(path.join(dir, data[i]), function (x) {
                rec(x, f);
            });
        }
    };
    return rec;
})
(require);