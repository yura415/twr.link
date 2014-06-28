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
        , gobtn = $("#btn-shorten")
        , form = $("#form-shorten")
        , xhr = Xhr;
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