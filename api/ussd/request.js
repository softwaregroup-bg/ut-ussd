// @ts-check
/** @type { import("../../handlers").libFactory } */

module.exports = ({
    config,
    import: {
        'db/user.identity.get': dbIdentity
    },
    lib: {
        sessions,
        engine
    }
}) => {
    const {
        maintenanceModeState,
        identity,
        expireRule,
        strings,
        debug,
        timeOut = 300 // 5 minutes default
    } = config;

    function getExpirationTime() {
        const d = new Date();
        d.setTime(d.getTime() + timeOut * 1000);
        return d.toLocaleString();
    }

    return {
        async request(msg) {
            try {
                try {
                    const globalConfig = await sessions.get('globalConfig');
                    if (globalConfig && globalConfig.maintenanceMode) {
                        const e = new Error('Maintenance mode.\nPlease try again later.');
                        // @ts-ignore
                        e.state = maintenanceModeState;
                        throw e;
                    }
                    let session = await sessions.get(msg.phone);
                    if (!session || msg.newSession) { // no session
                        if (identity) {
                            const identityGet = await dbIdentity({
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
                    } else if (expireRule === 'refresh') {
                        session.system.expire = getExpirationTime();
                        delete session.system.newSession;
                    }
                    if (session.system.ussdString) {
                        const commands = [msg.ussdMessage].concat(session.system.ussdString);
                        let i = 0; // iterration counter
                        let data = session;
                        let loop = false;
                        while (commands.length) {
                            data = await engine.route(
                                engine.receive(data)
                            );
                            if (
                                i &&
                                data.system.state === data.system.prevState
                            ) {
                            // if states match and flow wasn't previously interrupted (i.e the code here should never execute for the first when.iterate cycle)
                                commands.splice(1);
                                loop = true;
                                break;
                            }
                            data = await engine.send(data);
                            engine.render(data);
                            delete data.system.ussdString;
                            sessions.set(data);
                            data.system.ussdMessage = commands
                                .shift();
                            i += 1;
                        };
                        if (!loop) {
                            await engine.send(
                                await engine.route(
                                    await engine.receive(data)
                                )
                            );
                        }
                    }
                    if (
                        !session.system.state &&
                        Array.isArray(strings) &&
                        ~strings.indexOf(msg.ussdMessage)
                    ) { // ussd string
                        session.system.ussdString = msg.ussdMessage.split(/[*#]/).slice(1, -1);
                        session.system.ussdMessage = '*' + session.system.ussdString.shift() + '#';
                    } else {
                        session.system.ussdMessage = msg.ussdMessage;
                    }
                    if (session.system) {
                        // @ts-ignore
                        session.system.config = config;
                    }
                    const data = await engine.send(
                        await engine.route(
                            await engine.receive(session)
                        )
                    );
                    const result = await engine.render(data);
                    await sessions.set(data);
                    if (debug) {
                        result.debug = data;
                    }
                    return result;
                } catch (error) {
                    if (error.state) {
                        return await engine.render(await engine.send({
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
                if (debug) {
                    return {
                        // @ts-ignore
                        shortMessage: (error instanceof Error)
                            ? error.ussdMessage
                            : (
                                typeof error === 'string'
                                ? error
                                : 'System Error!'
                            ),
                        sourceAddr: msg.phone
                    };
                }
                throw error;
            };
        }
    };
};
