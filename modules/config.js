/**
 * @description Config module. Loads various configurations depending on the environment.
 * @filename /modules/config.js
 */

module.exports = (function (rq) {
    'use strict';
    var env = process.env.NODE_ENV || 'production';
    return rq(__dirname + '/../config/' + env);
})(require);