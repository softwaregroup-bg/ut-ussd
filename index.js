var when = require('when');
var Path = require('path');
var initRoute;
var session;
var ussd;
var config;
module.exports = {
    init: function(bus) {
        initRoute = bus.importMethod('internal.registerRequestHandler');
        session = require('./lib/session')({bus: bus});
        ussd = require('./lib/ussd')({bus: bus});
        config = bus.config.ussd;
    },
    initRoutes: function() {
        initRoute({
            method: 'GET',
            path: '/ussd/{p*}',
            handler: {
                directory: {
                    path: Path.join(__dirname, 'public'),
                    listing: false,
                    index: true
                }
            }
        });
        initRoute({
            method: 'GET',
            path: '/ussd/session',
            handler: function(request, reply) {
                session.get()
                    .then(function(data) {
                        var response = '';
                        if (!data) {
                            response = 'db empty';
                        } else {
                            data.forEach(function(record) {
                                response += '<div style="border-bottom: 1px dashed grey; padding: 20px">' +
                                    record.key + ': ' + JSON.stringify(record.value, null, 4) +
                                    '</div>';
                            })
                        }
                        reply('<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                            response +
                            '</span>');
                    })
                    .done();
            }
        });
        initRoute({
            method: 'GET',
            path: '/ussd/session/{key}',
            handler: function(request, reply) {
                session.get(request.params.key)
                    .then(function(value) {
                        if (!value) {
                            reply('no session data');
                        } else {
                            reply('<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                                JSON.stringify(value, null, 4) +
                                '</span>');
                        }
                    })
                    .done();
            }
        });
        initRoute({
            method: 'POST',
            path: '/ussd',
            handler: function(request, reply) {
                this.request(request.payload)
                    .then(function(data) {
                        reply(ussd.buildResponse(data));
                    })
                    .done();
            }.bind(this)
        });
        initRoute({
            method: 'POST',
            path: '/closeUSSDSession',
            handler: function(request, reply) {
                session.del(request.payload.phone)
                    .then(function() {
                        reply(ussd.buildResponse({
                            shortMessage: 'Session Closed'
                        }));
                    })
                    .catch(function() {
                        reply(ussd.buildResponse({
                            shortMessage: 'error occurred when deleting the session data'
                        }));
                    })
                    .done();
            }
        });
    },
    request: function(msg) {
        var ussdString = null;
        if ((config.strings || []).indexOf(msg.message) != -1) { // ussd string
            ussdString = msg.message.split('*').slice(1);
            msg.message = '*' + ussdString.shift() + '#';
            ussdString[ussdString.length - 1] = ussdString[ussdString.length - 1].slice(0, -1);
        };
        return session.get(msg.phone).then(function(data) {
            if (!data) {
                data = {system: {phone: msg.phone, backtrack: [], routes: {}}}
            } else if (data.system.ussdString) {
                var commands = data.system.ussdString;
                commands.unshift(msg.message);
                return when.iterate(function(data) {
                    return ussd.route(data).then(function(data) {
                        if (data.system.state == data.system.prevState) {
                            commands.splice(1);
                            return when.reject(data);
                        } else {
                            return data;
                        }
                    }).then(ussd.callController).then(function(data) {
                        return ussd.render(data).then(function(result) {
                            return session.set(data);
                        });
                    });
                }, function(context) {// predicate
                    data.system.message = commands.shift();
                    if (!commands.length) {
                        delete data.system.ussdString;
                        return true;
                    } else {
                        return false;
                    }
                }, function(context) { // handler
                    // do nothing
                }, data).then(ussd.route).then(ussd.callController).catch(function(err) {
                    if (err.system) {
                        return err;
                    } else {
                        return when.reject(data);
                    }
                });
            }
            if (ussdString) {
                data.system.ussdString = ussdString;
            }
            data.system.message = msg.message;
            return ussd.route(data).then(ussd.callController);
        }).then(function(data) {
            return ussd.render(data).then(function(result) {
                return session.set(data).then(function(data) {
                    return result;
                });
            });
        }).catch(function(err) {
            return {
                shortMessage: err,
                sourceAddr: msg.phone
            };
        });
    }
};
