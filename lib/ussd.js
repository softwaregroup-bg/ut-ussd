var _ = {
    defaults: require('lodash/object/defaults'),
    isFunction: require('lodash/lang/isFunction'),
    isObject: require('lodash/lang/isObject'),
    cloneDeep: require('lodash/lang/cloneDeep')
};
var Path = require('path');
var when = require('when');
var pipeline = require('when/pipeline');
var sax = require('sax');
var url = require('url');
var util = {
    backtrack: function(data) {
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
        var map = {'>': '&gt;', '<': '&lt;', '\'': '&apos;', '"': '&quot;', '&': '&amp;'};
        var regExp = /([&"<>'])/g;
        util.escapeXml = function(str) {
            return str.replace(regExp, function(str, symbol) { return map[symbol]; });
        };
        return util.escapeXml(str);
    }
};

module.exports = function(params) {
    var bus = params.bus;
    var config = params.config;
    var states = Path.resolve('ussd');
    var loadTemplate = bus.importMethod('template.load');
    var hooks;
    try {
        hooks = require(Path.join(states, 'hooks.js'));
        Object.keys(hooks).map(function(hook) {
            hooks[hook] = when.lift(hooks[hook]);
        });
    } catch (e) {
        hooks = {};
    }
    var ussd = {
        buildResponse: function(x) {
            _.defaults(x, {errorCode: 0, errorMessage: '', shortMessage: 'no message provided'});
            return '<UssdResponse version="1.0">' +
                        '<Status code="' + x.errorCode + '">' +
                            x.errorMessage +
                        '</Status>' +
                        '<Message>' +
                            util.escapeXml(x.shortMessage) +
                        '</Message>' +
                        '<DefaultCode>' +
                            config.defaultShortCode +
                        '</DefaultCode>' +
                        '<PhoneNumber>' +
                            config.defaultPhone +
                        '</PhoneNumber>' +
                   '</UssdResponse>';
        },
        route: function(data) {
            var state;
            if (config.shortCodes[data.system.message]) {
                state = config.shortCodes[data.system.message];
            } else if (data.system.routes[data.system.message] || data.system.routes['*']) {
                state = data.system.routes[data.system.message] || data.system.routes['*'];
                if (state === 'back') {
                    state = data.system.backtrack[data.system.backtrack.length - 2];
                }
            } else {
                state = config.wrongInputState || 'error/wrongInput';
            }
            data.system.prevState = data.system.state;
            data.system.state = state;
            util.backtrack(data);
            util.parseRequestParams(data);
            return when(data);
        },
        send: function(data) {
            // initialization
            var controllerPath;
            var controller;
            var send;
            try {
                controllerPath = require.resolve(Path.join(states, data.system.state, 'controller.js'));
                try {
                    controller = require(controllerPath);
                    if (_.isFunction(controller)) {
                        send = controller;
                    } else if (_.isObject(controller) && _.isFunction(controller.send)) {
                        send = controller.send;
                    } else {
                        send = function(data) { return data; };
                    }
                } catch (e) {
                    e.reThrow = true;
                    throw e;
                }
            } catch (e) {
                if (e.reThrow) { // error in controller
                    throw e;
                } else { // controller path could not be resolved
                    send = function(data) { return data; };
                }
            }
            // logic
            var system = _.cloneDeep(data.system);
            function formatResult(result) {
                var formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (redirect) {
                    data.system = system;
                    return ussd.route(data).then(ussd.send);
                }
                if (result === true) {
                    formattedResult = data;
                } else if (_.isObject(result)) {
                    formattedResult = result;
                }
                formattedResult.system = system;
                return formattedResult;
            }
            var tasks = [];
            var redirect = false;
            var context = {
                bus: bus,
                redirect: function(state) {
                    system.routes = {'redirect': (typeof state === 'string' ? state : state.href)};
                    system.message = 'redirect';
                    redirect = true;
                    return redirect;
                }
            };
            if (hooks.beforeSend) {
                tasks.push(function(params) {
                    return hooks.beforeSend.call(context, params).then(function(result) {
                        return formatResult(result);
                    });
                });
            }
            tasks.push(function(params) {
                if (redirect) {
                    return params;
                }
                return when.lift(send).call(context, params).then(function(result) {
                    return formatResult(result);
                });
            });
            if (hooks.afterSend) {
                tasks.push(function(params) {
                    if (redirect) {
                        return params;
                    }
                    return hooks.afterSend.call(context, params).then(function(result) {
                        return formatResult(result);
                    });
                });
            }
            return pipeline(tasks, data).catch(function(err) {
                throw new Error(((err.message || '') + ' | js error thrown by controller at state ' + system.state));
            });
        },
        receive: function(data) {
            if (!data.system.state) {
                return when(data);
            }
            // initialization
            var controllerPath;
            var controller;
            var receive;
            try {
                controllerPath = require.resolve(Path.join(states, data.system.state, 'controller.js'));
                try {
                    controller = require(controllerPath);
                    if (_.isObject(controller) && _.isFunction(controller.receive)) {
                        receive = controller.receive;
                    } else {
                        receive = function(data) { return data; };
                    }
                } catch (e) {
                    e.reThrow = true;
                    throw e;
                }
            } catch (e) {
                if (e.reThrow) { // error in controller
                    throw e;
                } else { // controller path could not be resolved
                    receive = function(data) { return data; };
                }
            }
            // logic
            var system;
            function formatResult(result) {
                var formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (redirect) {
                    data.system = system;
                    return data;
                }
                if (result === true) {
                    formattedResult = data;
                } else if (_.isObject(result)) {
                    formattedResult = result;
                }
                formattedResult.system = system;
                return formattedResult;
            }
            var redirect = false;
            var context = {
                bus: bus,
                redirect: function(state) {
                    system.routes = {'redirect': (typeof state === 'string' ? state : state.href)};
                    system.message = 'redirect';
                    redirect = true;
                    return redirect;
                }
            };
            var tasks = [];
            tasks.push(function(params) {
                var href = params.system.routes[data.system.message] || params.system.routes['*'];
                if (href) {
                    var parsedUrl = url.parse(href, true);
                    params.system.input = {
                        state: parsedUrl.pathname,
                        requestParams: parsedUrl.query
                    };
                }
                system = _.cloneDeep(params.system);
                return params;
            });
            if (data.system.resume && hooks.resume) {
                tasks.push(function(params) {
                    return hooks.resume.call(context, params).then(function(result) {
                        return formatResult(result);
                    });
                });
            }
            if (hooks.beforeReceive) {
                tasks.push(function(params) {
                    if (redirect) {
                        return params;
                    }
                    return hooks.beforeReceive.call(context, params).then(function(result) {
                        return formatResult(result);
                    });
                });
            }
            tasks.push(function(params) {
                if (redirect) {
                    return params;
                }
                return when.lift(receive).call(context, params).then(function(result) {
                    return formatResult(result);
                });
            });
            if (hooks.afterReceive) {
                tasks.push(function(params) {
                    if (redirect) {
                        return params;
                    }
                    return hooks.afterReceive.call(context, params).then(function(result) {
                        return formatResult(result);
                    });
                });
            }
            tasks.push(function(params) {
                delete params.system.input;
                if (params.system.resume) {
                    delete params.system.resume;
                    if (!redirect && config.resumeState) {
                        params.system.routes = {'resume': config.resumeState};
                        params.system.message = 'resume';
                    }
                }
                return params;
            });
            return pipeline(tasks, data).catch(function(err) {
                throw new Error(((err.message || '') + ' | js error thrown by controller at state ' + system.state));
            });
        },
        render: function(data) {
            return loadTemplate(Path.join(states, data.system.state, 'view.ussd.marko')).render(data)
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
                                data.system.routes[tag.attributes.id] = tag.attributes.href;
                            }
                        };
                        parser.onend = function() {
                            resolve({
                                shortMessage: shortMessage,
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
                    throw new Error('template load error: ' + (err.message || ''));
                });
        }
    };
    return ussd;
};
