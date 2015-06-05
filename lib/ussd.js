var _ = require('lodash');
var Path = require('path');
var when = require('when');

function getExpirationTime() {
    var d = new Date();
    d.setTime(d.getTime() + 5 * 60 * 1000); // 5 minutes in the future
    return d.toLocaleString();
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
            var nextState;
            if (data.system.expire && (new Date(data.system.expire) < new Date())) { // session expired
                data.system.expire = null;
                nextState = 'resume';
            } else {
                var router = require(Path.join(states, data.system.currentState, 'router.json'));
                nextState = router[data.system.message] || router['*'];
                if (nextState == 'previousState' || nextState == 'currentState') {
                    nextState = data.system[nextState];
                }
            }
            if (!data.system.expire) {
                data.system.expire = getExpirationTime();
            }
            data.system.nextState = nextState || 'error/wrongInput';
            return data;
        },
        callController: function(data) {
            var self = this;
            var controller;
            var state = data.system.nextState;
            delete data.system.nextState;
            try {
                controller = require(Path.join(states, state, 'controller.js'));
            } catch (e) {
                controller = function dummyController(data) {return data};
            }
            return when.lift(controller).call(bus, _.cloneDeep(data))
                .then(function(result) {
                    if (typeof result == 'string') {
                        throw result;
                    } else {
                        if (!_.isObject(result)) {
                            result = {system:{}};
                        }
                        result.system = data.system;
                        var redirect = result._redirect;
                        if (redirect) {
                            delete result._redirect;
                            if(redirect.callController) {
                                result.system.nextState = redirect.state;
                                return self.callController(result);
                            } else {
                                result.system.previousState = result.system.currentState;
                                result.system.currentState = redirect.state;
                            }
                        } else if (result.system.currentState != state) {
                            result.system.previousState = result.system.currentState;
                            result.system.currentState = state;
                        }
                        return result;
                    }
                })
                .catch(function(err) {
                    if (typeof err === 'string') { // errorState
                        data.system.previousState = data.system.currentState;
                        data.system.currentState = err;
                        throw data;
                    } else {
                        throw (err.message || '') + ' | js error thrown by controller: ' + Path.join(states, state, 'controller.js');
                    }
                })
        },
        render: function(data) {
            return loadTemplate(Path.join(states, data.system.currentState, 'view.marko')).render(data)
                .then(function(shortMessage) {
                    return {
                        shortMessage : shortMessage,
                        sourceAddr: data.system.phone
                    };
                })
                .catch(function(err) {
                    throw ('template load error: ' + (err.message || ''));
                })
        }
    }
}
