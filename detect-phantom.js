var page = require('webpage').create()
,	system = require('system')
,       urllib = require('./node_modules/url/url.js')
,       querystring = require('./node_modules/querystring/index.js')
,	url = system.args[1]
;

var whitelisted_domains = ["www.w3.org"];

var scheme = urllib.parse(url).protocol;
if (scheme !== 'http:' && scheme !== 'https:') {
    console.log('not allowed to load ' + url);
    phantom.exit(1);
}

var progress = 0;
var found = false;

//this function is loaded each time a resource is requested
page.onResourceRequested = function(requestData, networkRequest) {
    progress++;
    if (progress > 1) {
        // We would falsely report the first request if it is relative
        // such is life
        if (progress === 2) {
            page.evaluate(function() {
                var b = document.createElement("base");
                b.setAttribute("href", "http://staging/");
                document.getElementsByTagName("head")[0].appendChild(b);
            });
        }
        var parsedUrl = urllib.parse(requestData.url);
        if (parsedUrl.hostname === 'staging') {
            networkRequest.changeUrl(urllib.resolve(url, parsedUrl.path));
        }
        var domain = urllib.parse(requestData.url).hostname;
        if (whitelisted_domains.indexOf(domain) === -1 && domain !== "staging") {
            found = true;
            console.log(requestData.url);
            // let's save ourselves unnecessary efforts when testing
            if (domain === "example.org") {
                networkRequest.abort();
            }
        } else {
            // we assume resources on whitelisted domains have already been vetted
            // and don't need to be checked for third-party resources
            if (domain !== "staging") {
                networkRequest.abort();
            }
        }
    }
};

page.open(system.args[1], function (status) {
    if (status !== 'success') {
        console.log('fail to load ' + url);
        phantom.exit(1);
    } else {
        if (!found) {
  	    phantom.exit(0);
        } else {
            phantom.exit(64);
        }
    }
});