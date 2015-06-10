var _ = require('lodash');
var Path = require('path');
var when = require('when');
var sax = require('sax');
function getExpirationTime() {
    var d = new Date();
    d.setTime(d.getTime() + 5 * 60 * 1000); // 5 minutes in the future
    return d.toLocaleString();
}

function backtrack(data){
    var state = data.system.state;
    var idx = data.system.backtrack.indexOf(state);
    var len = data.system.backtrack.length;
    if(idx < 0) {
        data.system.backtrack.push(state);
    } else if (idx != len) {
        data.system.backtrack.splice(idx + 1, len - idx);
    }
}

module.exports = function(config) {
    var bus = config.bus;
    var states = Path.resolve('ussd');
    var loadTemplate = bus.importMethod('template.load');
    return {
        buildResponse: function(x) {
            _.defaults(x, {errorCode: 0, errorMessage: '', shortMessage: 'no message provided'});
            return '<UssdResponse version="1.0">' +
                    '<Status code="' + x.errorCode + '">' +
                        x.errorMessage +
                    '</Status>' +
                    '<Message>' +
                        x.shortMessage +
                    '</Message>' +
               '</UssdResponse>';
        },
        route: function(data) {
            var state;
            if (data.system.expire && (new Date(data.system.expire) < new Date())) { // session expired
                data.system.expire = null;
                state = 'resume';
            } else if(state = bus.config.ussd.shortcodes[data.system.message]) {
                // Tozi komentar e narochno taka
            } else if(state = (data.system.routes[data.system.message] || data.system.routes['*'])){
                if(state == 'back') {
                    state = data.system.backtrack[data.system.backtrack.length - 2];
                }
            } else {
                state = 'error/wrongInput';
            }
            if (!data.system.expire) {
                data.system.expire = getExpirationTime();
            }
            data.system.state = state;
            backtrack(data);
            return data;
        },
        callController: function(data) {
            var controller;
            try {
                controller = require(Path.join(states, data.system.state, 'controller.js'));
            } catch (e) {
                controller = function dummyController(data) {return data};
            }
            return when.lift(controller).call({bus: bus}, _.cloneDeep(data))
                .then(function(result) {
                    if (!_.isObject(result)) {
                        result = {};
                    }
                    result.system = data.system;
                    return result;
                })
                .catch(function(err) {
                    throw ((err.message || '') + ' | js error thrown by controller at state ' + data.system.state);
                });
        },
        render: function(data) {
            return loadTemplate(Path.join(states, data.system.state, 'view.marko')).render(data)
                .then(function(result) {
                    var parser = sax.parser(false, {lowercase: true});
                    var shortMessage = '';
                    data.system.routes = {};
                    return when.promise(function(resolve, reject) {
                        parser.ontext = function(text) {
                            shortMessage += text;
                        };
                        parser.onopentag = function(tag) {
                            if (tag.name === 'br') {
                                shortMessage += '\n';
                            } else if (tag.name === 'a') {
                                data.system.routes[tag.attributes.id] = tag.attributes.href
                            }
                        };
                        parser.onend = function() {
                            resolve({
                                shortMessage : shortMessage,
                                sourceAddr: data.system.phone
                            });
                        };
                        parser.onerror = function(e) {
                            console.error('ERROR!!!');
                            console.dir(e);
                        };
                        parser.write('<root>' + result + '</root>').close();
                    });
                })
                .catch(function(err) {
                    throw ('template load error: ' + (err.message || ''));
                })
        }
    }
}
