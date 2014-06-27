(function (w, d) {
    'use strict';
    function $(s) {
        return d.querySelector(s);
    }

    var select = w.select = function () {
        this.focus();
        this.select();
    };

    var shortened = $("#shortened")
        , url = $("#input-url")
        , oneTime = $("#check-one-time")
        , anon = $("#check-remove-referrer")
        , xhr = Xhr;

    $("#btn-shorten").onclick = function () {
        var req = xhr();
        req.open("POST", "/api/create/", true);
        req.responseType = "json";
        req.onreadystatechange = function () {
            if (req.readyState != 4) return;
            if (req.status != 200 && req.status != 304) {
                return;
            }
            var data = req.response
                , div = d.createElement("div");
            if (!data.error) {
                div.className = "success";
                div.innerHTML = "<input type=\"text\" class=\"short-url\" title=\"" + data.url + "\" value=\"" + data.url + "\" onclick=\"select()\" /> - sends to - <input type=\"text\" class=\"short-url\" title=\"" + data.originalUrl + "\" value=\"" + data.originalUrl + "\" onclick=\"select()\" /> ";
            } else {
                alert("Error! Original url is %1. Error code - %2"
                    .replace("%1", data.originalUrl)
                    .replace("%2", data.error))
            }
            shortened.appendChild(div);
        };
        if (req.readyState == 4) return;
        req.send(JSON.stringify({
            url: url.value,
            expiry: oneTime.checked ? Date.now() : undefined,
            anonymize: anon.checked
        }));
    };
})(window, document);