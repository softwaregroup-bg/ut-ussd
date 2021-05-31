const path = require('path');
const escapeXmlMap = {'>': '&gt;', '<': '&lt;', '\'': '&apos;', '"': '&quot;', '&': '&amp;'};
const excapeXmlRegExp = /([&"<>'])/g;

module.exports = {
    backtrack: function(data) { // pass ussd session data object
        const state = data.system.state;
        const idx = data.system.backtrack.indexOf(state);
        const len = data.system.backtrack.length;
        if (idx < 0) {
            data.system.backtrack.push(state);
        } else if (idx !== len) {
            data.system.backtrack.splice(idx + 1, len - idx);
        }
    },
    parseRequestParams: function(data) {
        const parsedUrl = new URL(
            data.system.state,
            'http://localhost'
        );
        data.system.state = parsedUrl.pathname;
        data.system.requestParams = parsedUrl.searchParams;
    },
    escapeXml: function(str) {
        return str.replace(excapeXmlRegExp, function(str, x) {
            return escapeXmlMap[x];
        });
    },
    normalizeState(dir, state) {
        return state.startsWith('.')
            ? path.join(dir, state)
            : state;
    }
};
