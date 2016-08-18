var url = require('url');
var path = require('path');
var escapeXmlMap = {'>': '&gt;', '<': '&lt;', '\'': '&apos;', '"': '&quot;', '&': '&amp;'};
var excapeXmlRegExp = /([&"<>'])/g;
module.exports = {
    backtrack: function(data) { // pass ussd session data object
        var state = data.system.state;
        var idx = data.system.backtrack.indexOf(state);
        var len = data.system.backtrack.length;
        if (idx < 0) {
            data.system.backtrack.push(state);
        } else if (idx !== len) {
            data.system.backtrack.splice(idx + 1, len - idx);
        }
    },
    parseRequestParams: function(data) {
        var parsedUrl = url.parse(data.system.state, true);
        data.system.state = parsedUrl.pathname;
        data.system.requestParams = parsedUrl.query;
    },
    escapeXml: function(str) {
        return str.replace(excapeXmlRegExp, function(str, x) {
            return escapeXmlMap[x];
        });
    },
    normalizeState(dir, state) {
        return state.startsWith('.') ? path.join(dir, state) : state;
    }
};
