const merge = require('ut-function.merge');

module.exports = function ussd({config, utMethod, utBus, vfs, import: imp}) {
    const settings = merge({
        shortcodes: {},
        defaultShortCode: '*123#',
        defaultPhone: '123456789',
        identity: false,
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
    }, config);
    const sessions = require('../lib/session')({utBus});
    const ussdEngine = require('../lib/ussd')({config: settings, vfs, import: imp, utMethod});

    let identity;
    if (settings.identity) {
        identity = utMethod('db/user.identity.get');
    }

    function getExpirationTime() {
        const d = new Date();
        d.setTime(d.getTime() + (settings.timeOut || 300) * 1000); // 5 minutes default
        return d.toLocaleString();
    }

    async function request(msg) {
        try {
            try {
                const globalConfig = await sessions.get('globalConfig');
                if (globalConfig && globalConfig.maintenanceMode) {
                    const e = new Error('Maintenance mode.\nPlease try again later.');
                    e.state = settings.maintenanceModeState;
                    throw e;
                }
                let session = await sessions.get(msg.phone);
                if (!session || msg.newSession) { // no session
                    if (identity) {
                        const identityGet = await identity({
                            username: msg.phone,
                            type: 'password'
                        });
                        session = {
                            system: {
                                expire: getExpirationTime(),
                                phone: msg.phone,
                                backtrack: [],
                                routes: {},
                                meta: {
                                    auth: identityGet.hashParams[0]
                                },
                                newSession: msg.newSession
                            }
                        };
                    } else {
                        session = {
                            system: {
                                expire: getExpirationTime(),
                                phone: msg.phone,
                                backtrack: [],
                                routes: {},
                                newSession: msg.newSession
                            }
                        };
                    }
                } else if (new Date(session.system.expire) < new Date()) { // session expired
                    session.system.resume = true;
                    session.system.expire = getExpirationTime();
                    delete session.system.newSession;
                } else if (settings.expireRule === 'refresh') {
                    session.system.expire = getExpirationTime();
                    delete session.system.newSession;
                }
                if (session.system.ussdString) {
                    const commands = [msg.ussdMessage].concat(session.system.ussdString);
                    let i = 0; // iterration counter
                    let data = session;
                    let loop = false;
                    while (commands.length) {
                        data = await ussdEngine.route(ussdEngine.receive(data));
                        if (i && data.system.state === data.system.prevState) {
                        // if states match and flow wasn't previously interrupted (i.e the code here should never execute for the first when.iterate cycle)
                            commands.splice(1);
                            loop = true;
                            break;
                        }
                        data = await ussdEngine.send(data);
                        ussdEngine.render(data);
                        delete data.system.ussdString;
                        sessions.set(data);
                        data.system.ussdMessage = commands.shift();
                        i += 1;
                    };
                    if (!loop) {
                        await ussdEngine.send(await ussdEngine.route(await ussdEngine.receive(data)));
                    }
                }
                if (!session.system.state && Array.isArray(settings.strings) && ~settings.strings.indexOf(msg.ussdMessage)) { // ussd string
                    session.system.ussdString = msg.ussdMessage.split(/[*#]/).slice(1, -1);
                    session.system.ussdMessage = '*' + session.system.ussdString.shift() + '#';
                } else {
                    session.system.ussdMessage = msg.ussdMessage;
                }
                if (session.system) {
                    session.system.config = config;
                }
                const data = await ussdEngine.send(await ussdEngine.route(await ussdEngine.receive(session)));
                const result = await ussdEngine.render(data);
                await sessions.set(data);
                if (settings.debug) {
                    result.debug = data;
                }
                return result;
            } catch (error) {
                if (error.state) {
                    return await ussdEngine.render(await ussdEngine.send({
                        system: {
                            state: error.state,
                            phone: msg.phone,
                            ussdMessage: msg.ussdMessage
                        }
                    }));
                }
                throw error;
            }
        } catch (error) {
            if (settings.debug) {
                return {
                    shortMessage: (error instanceof Error) ? error.ussdMessage : (typeof error === 'string' ? error : 'System Error!'),
                    sourceAddr: msg.phone
                };
            }
            throw error;
        };
    }

    return {
        async start() {

        },
        async 'ussd.session.fetch'() {
            const data = await sessions.get();
            let response = '';
            if (!data) {
                response = 'db empty';
            } else {
                data.forEach(function(record) {
                    response += '<div style="border-bottom: 1px dashed grey; padding: 20px">' +
                        record.key + ': ' + JSON.stringify(record.value, null, 4) +
                        '</div>';
                });
            }
            return '<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                response +
                '</span>';
        },
        async 'ussd.session.get'({key}) {
            const value = await sessions.get(key);
            if (!value) {
                return 'no session data';
            } else {
                return '<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                    JSON.stringify(value, null, 4) +
                    '</span>';
            }
        },
        async 'ussd.session.remove'() {
            try {
                await sessions.del(request.payload.phone);
                return ussdEngine.buildResponse({shortMessage: 'Session Closed'});
            } catch (e) {
                return ussdEngine.buildResponse({shortMessage: 'error occurred when deleting the session data'});
            }
        },
        async 'ussd.message.process'(params, $meta) {
            return ussdEngine.buildResponse(await request(params));
        },
        'ussd.config.get'() {
            return settings;
        }
    };
};
