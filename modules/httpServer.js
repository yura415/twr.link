/**
 * @description Main http server script.
 * @filename /modules/httpServer.js
 */

module.exports = (function (rq) {
    'use strict';

    var cfg = rq(__dirname + '/config')
        , Key = rq(__dirname + '/Key')
        , http = rq('http')
        , fs = rq('fs')
        , st = rq('node-static')
        , static_dir = __dirname + "/.." + cfg["static_dir"]
        , fileServer = new st.Server(static_dir, { cache: cfg["cacheTime"] });

    function respond(statusCode, response, res, headers) {
        headers = headers || {};
        headers["Content-Type"] = headers["Content-Type"] || "text/plain";
        if (typeof(response) === "object") {
            headers["Content-Type"] = "application/json";
            response = JSON.stringify(response);
        }
        headers["Content-Length"] = headers["Content-Length"] || response.length;
        headers["Access-Control-Allow-Origin"] = "*";
        res.writeHead(statusCode, headers);
        res.end(response);
    }

    return http.createServer(function (req, res) {
        if (req.url.indexOf('/api') === 0) {
            var url = req.url.substr(5)
                , slash = url.indexOf('/')
                , method = url.substr(0, slash)
                , postData = "";
            if (req.method == 'OPTIONS') {
                return respond(200, null, res);
            }
            if (req.method != 'POST') {
                return respond(405, {error: "Method not supported"}, res);
            }
            req.on('data', function (chunk) {
                postData += chunk.toString();
            });
            req.on('end', function () {
                switch (method) {
                    case "create":
                        try {
                            postData = JSON.parse(postData);
                        } catch (e) {
                            console.log(e);
                            return respond(200, {error: e.toString()}, res);
                        }
                        url = postData.url;
                        var key = Key.random();
                        Key.Create({
                            url: url,
                            expiry: postData.expiry,
                            anonymize: postData.anonymize
                        }, function (err, key) {
                            return respond(200, {
                                error: err,
                                url: key ? ("http://twr.link/" + key) : undefined,
                                originalUrl: url
                            }, res);
                        });
                        break;
                    default:
                        return respond(200, {error: "wrong method"}, res);
                        break;
                }
            });
        } else {
            req.addListener('end', function () {
                if (req.url == '/') {
                    return fileServer.serveFile('/index.html', 200, {}, req, res);
                }
                fs.exists(static_dir + req.url, function (exists) {
                    if (exists) {
                        return fileServer.serve(req, res);
                    }
                    var key = req.url.slice(1)
                        , curDate = new Date().getTime();
                    Key.Exists(key, function (exists) {
                        if (exists) {
                            Key.Get(key, function (err, data) {
                                if (err) {
                                    console.log(err);
                                    return respond(200, err.toString(), res);
                                } else {
                                    if (data.anonymize) {
                                        respond(200, cfg["redirect-template"].replace("_%_", data.url), res, {
                                            'Content-Type': 'text/html; charset=utf-8'
                                        });
                                    } else {
                                        respond(302, null, res, {
                                            'Location': data.url
                                        });
                                    }
                                    if (data['expiry'] && data['expiry'] <= curDate) {
                                        Key.Remove(key, function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log("deleted key", key)
                                            }
                                        })
                                    }
                                }
                            })
                        } else {
                            respond(302, null, res, {'Location': "http://" + cfg["hostname"] + "/"});
                        }
                    });
                });
            }).resume();
        }
    })
})
(require);