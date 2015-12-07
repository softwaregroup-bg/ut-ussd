var when = require('when');
var Path = require('path');
var session;
var ussd;
var config;

module.exports = {
    init: function(bus) {
        session = require('./lib/session')({bus: bus});
        ussd = require('./lib/ussd')({bus: bus});
        config = bus.config.ussd;
    },
    start: function() {
        console.log(this.config.id);
        this && this.registerRequestHandler && this.registerRequestHandler([{
            method: 'GET',
            path: '/ussd/{p*}',
            handler: {
                directory: {
                    path: Path.join(__dirname, 'public'),
                    listing: false,
                    index: true
                }
            }
        }, {
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
                            });
                        }
                        reply('<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                            response +
                            '</span>');
                    })
                    .done();
            }
        }, {
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
        }, {
            method: 'POST',
            path: '/ussd',
            handler: function(request, reply) {
                module.exports.request(request.payload)
                    .then(function(data) {
                        reply(ussd.buildResponse(data));
                    })
                    .done();
            }
        }, {
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
        }]);
    },
    request: function(msg) {
        return session.get('globalConfig').then(function(globalConfig) {
            if (globalConfig && globalConfig.maintenanceMode) {
                var e = new Error('Maintenance mode.\nPlease try again later.');
                e.state = config.maintenanceModeState;
                throw e;
            }
            return session.get(msg.phone);
        }).then(function(data) {
            if (!data) {
                data = {system: {phone: msg.phone, backtrack: [], routes: {}}};
            } else if (data.system.ussdString) {
                var commands = [msg.message].concat(data.system.ussdString);
                var i = 0; // iterration counter
                return when.iterate(function(data) {
                    return ussd.receive(data).then(ussd.route).then(function(data) {
                        if (i && data.system.state === data.system.prevState) {
                            // if states match and flow wasn't previously interrupted (i.e the code here should never execute for the first when.iterrate cycle)
                            commands.splice(1);
                            return when.reject(data);
                        } else {
                            return data;
                        }
                    }).then(ussd.send).then(function(data) {
                        return ussd.render(data).then(function() {
                            return session.set(data);
                        });
                    });
                }, function() { // predicate
                    data.system.message = commands.shift();
                    if (!commands.length) {
                        delete data.system.ussdString;
                        return true;
                    } else {
                        return false;
                    }
                }, function() { // handler
                    i += 1;
                }, data).then(ussd.receive).then(ussd.route).then(ussd.send).catch(function(err) {
                    if (err.system) {
                        return err;
                    } else {
                        return when.reject(err);
                    }
                });
            }
            if (Array.isArray(config.strings) && ~config.strings.indexOf(msg.message)) { // ussd string
                data.system.ussdString = msg.message.split(/[\*#]/).slice(1, -1);
                data.system.message = '*' + data.system.ussdString.shift() + '#';
            } else {
                data.system.message = msg.message;
            }
            return ussd.receive(data).then(ussd.route).then(ussd.send);
        }).then(function(data) {
            return ussd.render(data).then(function(result) {
                return session.set(data).then(function() {
                    return result;
                });
            });
        }).catch(function(err) {
            if (err.state) {
                return ussd.render({system: {state: err.state}});
            }
            throw err;
        }).catch(function(err) {
            console.log('Error!!!', err);
            return {
                shortMessage: (err instanceof Error) ? err.message : (typeof err === 'string' ? err : 'System Error!'),
                sourceAddr: msg.phone
            };
        });
    }
};
