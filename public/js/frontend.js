Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

(function (w, d) {
    'use strict';
    function $(s) {
        return d.querySelector(s);
    }

    var select = w.select = function () {
        this.focus();
        this.select();
    };

    if (!localStorage && document.cookie.length == 0) {
        document.cookie = "x={}";
    }

    var c = {
        get: function () {
            return JSON.parse(document.cookie.toString().substr(2));
        }
    };

    function renderShortened(url, origUrl) {
        var div = d.createElement("div");
        div.className = "success";
        div.innerHTML = "<input type=\"text\" readonly class=\"short-url\" title=\"" + url + "\" value=\"" + url + "\" onclick=\"select()\" /> - sends to - <input type=\"text\" class=\"short-url\" readonly title=\"" + origUrl + "\" value=\"" + origUrl + "\" onclick=\"select()\" /> ";
        return div;
    }

    var storage = {
        raw: {get: function () {
            return localStorage || c;
        }},
        put: function (key, value) {
            localStorage && localStorage.setObject(key, value);
            var x = c;
            x[key] = value;
            !localStorage && (document.cookie = "x=" + JSON.stringify(x));
        },
        get: function (key) {
            return localStorage ? localStorage.getObject(key) : c.key;
        }
    };

    var shortened = $("#shortened")
        , url = $("#input-url")
        , oneTime = $("#check-one-time")
        , anon = $("#check-remove-referrer")
        , gobtn = $("#btn-shorten")
        , form = $("#form-shorten")
        , arr = storage.get("shortened")
        , xhr = Xhr;

    if (arr) {
        for (var i = arr.length - 1; i >= 0; i--) {
            shortened.appendChild(renderShortened(arr[i][0], arr[i][1]));
        }
    } else arr=[];

    gobtn.innerHTML = gobtn.getAttribute("data-default");

    gobtn.onclick = form.onsubmit = function (e) {
        e.preventDefault();
        var req = xhr();
        req.open("POST", "/api/create/", true);
        req.responseType = "json";
        req.onreadystatechange = function () {
            if (req.readyState != 4) return;
            if (req.status != 200 && req.status != 304) {
                return;
            }
            gobtn.removeAttribute("disabled");
            gobtn.className = "";
            gobtn.innerHTML = gobtn.getAttribute("data-default");
            url.value = "";
            var data = req.response;
            if (!data.error) {
                arr.push([data.url, data.originalUrl]);
                storage.put("shortened", arr);
                shortened.insertBefore(renderShortened(data.url, data.originalUrl), shortened.firstChild);
            } else {
                alert("Error! Original url is %1. Error code - %2"
                    .replace("%1", data.originalUrl)
                    .replace("%2", data.error))
            }
        };
        if (req.readyState == 4) return;
        if (url.value.indexOf("://") < 0) {
            url.value = "http://" + url.value;
        }
        gobtn.className = "loading";
        gobtn.setAttribute("disabled", "");
        gobtn.innerHTML = gobtn.getAttribute("data-loading");
        req.send(JSON.stringify({
            url: url.value.trim(),
            expiry: oneTime.checked ? Date.now() : undefined,
            anonymize: anon.checked
        }));
    };
})(window, document);