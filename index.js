var when = require('when');
var Path = require('path');
var initRoute;
var session;
var ussd;
module.exports = {
    init: function(bus) {
        initRoute = bus.importMethod('internal.registerRequestHandler');
        session = require('./lib/session')({ bus: bus });
        ussd = require('./lib/ussd')({ bus: bus });
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
        var commands = [];
        if (msg.message.startsWith('*') && msg.message.endsWith('#')) {
            commands.push(msg.message);
        } else {
            commands = msg.message.split('*');
        }
        return session.get(msg.phone)
            .then(function(data) {
                if (!data) {
                    data = {system:{phone: msg.phone, currentState: ''}}; // no session
                }
                return when.iterate(
                    function(data) {
                        data.system.message = commands.shift();
                        ussd.route(data);
                        return ussd.callController(data)
                            .then(session.put)
                            .catch(function(err) {
                                commands = [];
                                if (typeof err === 'string') { // errorMessage
                                    throw err
                                } else { // errorState
                                    return err;
                                }
                            })
                    },
                    function(context) { // predicate
                        return !commands.length;
                    },
                    function(context) { // handler
                        //
                    },
                    data
                )
            })
            .then(function(data){
                return ussd.render(data)
                    .then(function(result) {
                        return session.put(data)
                            .then(function(data){ console.dir(result)
                                return result;
                            });
                    });
            })
            .catch(function(errorMessage) {
                return {
                    shortMessage: errorMessage,
                    sourceAddr: msg.phone
                };
            })
    }
};
