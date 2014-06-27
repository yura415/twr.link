/**
 * @description Main project file
 * @filename /index.js
 */

module.exports = exports = (function (rq) {
    'use strict';

    var cfg = rq(__dirname + '/modules/config')
        , Key = rq(__dirname + '/modules/Key')
        , http = rq('http')
        , fs = rq('fs');
    var dir = __dirname + "/" + cfg["directory_name"];
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

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

    http.createServer(function (req, res) {
        var key = req.url.slice(1)
            , curDate = new Date().getTime();
        if (!key || key in cfg["excluded_keys"]) {
            respond(200, "sup :)", res);
            return;
        }
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
    }).listen(cfg["port"]);
    console.log("server listens on port", cfg["port"]);

    http.createServer(function (req, res) {
        var url = req.url.substr(1)
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
                            url: key ? ("http://" + cfg["hostname"] + "/" + key) : undefined,
                            originalUrl: url
                        }, res);
                    });
                    break;
                default:
                    return respond(200, {error: "wrong method"}, res);
                    break;
            }
        });
    }).listen(cfg["api_port"]);
    console.log("api server listens on port", cfg["api_port"]);

    return Key;
})(require);