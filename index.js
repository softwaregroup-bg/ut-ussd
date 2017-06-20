var when = require('when');
var Path = require('path');
var _ = {
    merge: require('lodash.merge')
};
var session;
var ussd;
var config = {
    shortcodes: {},
    defaultShortCode: '*123#',
    defaultPhone: '123456789',
    identity: true,
    routes: {
        common: { // applies for all routes
            config: {
                auth: false
            }
        },
        public: {}, // to access the public resources
        session: {}, // for remote access to the whole session object
        sessionKey: {}, // for remote access to a single record from the session object
        ussd: {}, // to call the ussd api remotely
        config: {}, // to obtain information about ussd simulator's default phone and shortcode
        closeSession: {} // to close ussd session
    }
};
var identity;

function getExpirationTime() {
    var d = new Date();
    d.setTime(d.getTime() + (config.timeOut || 300) * 1000); // 5 minutes default
    return d.toLocaleString();
}
var ussdModule = {
    config: function(c) {
        _.merge(config, c);
        return ussdModule;
    },
    init: function(bus) {
        delete ussdModule.config;
        _.merge(config, bus.config.ussd || {}, {debug: bus.config.debug});
        session = require('./lib/session')({bus: bus});
        ussd = require('./lib/ussd')({bus: bus, config: config});
        if (config.identity) {
            identity = bus.importMethod('identity.get');
        }
    },
    start: function() {
        this.registerRequestHandler && this.registerRequestHandler([
            _.merge({}, config.routes.common, config.routes.public, {
                method: 'GET',
                path: '/ussd/{p*}',
                handler: {
                    directory: {
                        path: Path.join(__dirname, 'public'),
                        listing: false,
                        index: true
                    }
                }
            }),
            _.merge({}, config.routes.common, config.routes.session, {
                method: 'GET',
                path: '/ussd/session',
                handler: function(request, reply) {
                    return session.get()
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
                            return reply('<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                                response +
                                '</span>');
                        });
                }
            }),
            _.merge({}, config.routes.common, config.routes.sessionKey, {
                method: 'GET',
                path: '/ussd/session/{key}',
                handler: function(request, reply) {
                    return session.get(request.params.key)
                        .then(function(value) {
                            if (!value) {
                                return reply('no session data');
                            } else {
                                return reply('<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                                    JSON.stringify(value, null, 4) +
                                    '</span>');
                            }
                        });
                }
            }),
            _.merge({}, config.routes.common, config.routes.ussd, {
                method: 'POST',
                path: '/ussd',
                handler: function(request, reply) {
                    return module.exports.request(request.payload)
                        .then(function(data) {
                            return reply(ussd.buildResponse(data));
                        });
                }
            }),
            _.merge({}, config.routes.common, config.routes.config, {
                method: 'POST',
                path: '/getUssdConfig',
                handler: function(request, reply) {
                    reply(config);
                }
            }),
            _.merge({}, config.routes.common, config.routes.closeSession, {
                method: 'POST',
                path: '/closeUSSDSession',
                handler: function(request, reply) {
                    return module.exports.closeSession(request.payload)
                        .then(function(data) {
                            return reply(ussd.buildResponse(data));
                        });
                }
            })
        ]);
    },
    request: function(msg) {
        return session.get('globalConfig').then(function(globalConfig) {
            if (globalConfig && globalConfig.maintenanceMode) {
                var e = new Error('Maintenance mode.\nPlease try again later.');
                e.state = config.maintenanceModeState;
                throw e;
            }
            return session.get(msg.phone).then(function(data) {
                if (!data || msg.newSession) { // no session
                    if (identity) {
                        data = identity({
                            username: msg.phone,
                            type: 'ussd'
                        }).then(function(auth) {
                            return {
                                system: {
                                    expire: getExpirationTime(),
                                    phone: msg.phone,
                                    backtrack: [],
                                    routes: {},
                                    meta: {
                                        auth: auth
                                    },
                                    newSession: msg.newSession
                                }
                            };
                        });
                    } else {
                        data = {
                            system: {
                                expire: getExpirationTime(),
                                phone: msg.phone,
                                backtrack: [],
                                routes: {},
                                newSession: msg.newSession
                            }
                        };
                    }
                } else if (new Date(data.system.expire) < new Date()) { // session expired
                    data.system.resume = true;
                    data.system.expire = getExpirationTime();
                    delete data.system.newSession;
                } else if (config.expireRule === 'refresh') {
                    data.system.expire = getExpirationTime();
                    delete data.system.newSession;
                }
                return data;
            });
        }).then(function(data) {
            if (data.system.ussdString) {
                var commands = [msg.message].concat(data.system.ussdString);
                var i = 0; // iterration counter
                return when.iterate(function(data) {
                    return ussd.receive(data).then(ussd.route).then(function(data) {
                        if (i && data.system.state === data.system.prevState) {
                            // if states match and flow wasn't previously interrupted (i.e the code here should never execute for the first when.iterate cycle)
                            commands.splice(1);
                            return when.reject(data);
                        } else {
                            return data;
                        }
                    }).then(ussd.send).then(function(data) {
                        return ussd.render(data).then(function() {
                            delete data.system.ussdString;
                            return session.set(data);
                        });
                    });
                }, function(data) { // predicate
                    data.system.message = commands.shift();
                    return !commands.length;
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
            if (!data.system.state && Array.isArray(config.strings) && ~config.strings.indexOf(msg.message)) { // ussd string
                data.system.ussdString = msg.message.split(/[*#]/).slice(1, -1);
                data.system.message = '*' + data.system.ussdString.shift() + '#';
            } else {
                data.system.message = msg.message;
            }
            return ussd.receive(data).then(ussd.route).then(ussd.send);
        }).then(function(data) {
            return ussd.render(data).then(function(result) {
                return session.set(data).then(function() {
                    if (config.debug) {
                        result.debug = data;
                    }
                    return result;
                });
            });
        }).catch(function(err) {
            if (err.state) {
                return ussd.send({
                    system: {
                        state: err.state,
                        phone: msg.phone,
                        message: msg.message
                    }
                }).then(ussd.render);
            }
            throw err;
        }).catch(function(err) {
            if (config.debug) {
                return {
                    shortMessage: (err instanceof Error) ? err.message : (typeof err === 'string' ? err : 'System Error!'),
                    sourceAddr: msg.phone
                };
            }
            throw err;
        });
    },
    closeSession: function(msg) {
        return session.del(msg.phone)
        .then(function() {
            return {
                shortMessage: 'Session Closed',
                sourceAddr: msg.phone
            };
        })
        .catch(function() {
            return {
                shortMessage: 'error occurred when deleting the session data',
                sourceAddr: msg.phone
            };
        });
    }
};

module.exports = ussdModule;
