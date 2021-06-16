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
        translations = {},
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
        async request({
            phone,
            newSession,
            ussdMessage,
            language
        }) {
            try {
                try {
                    const {
                        maintenanceMode
                    } = (await sessions.get('globalConfig')) ||
                        {};

                    if (maintenanceMode) {
                        const e = new Error('Maintenance mode.\nPlease try again later.');
                        // @ts-ignore
                        e.state = maintenanceModeState;
                        throw e;
                    }

                    let session = await sessions.get(phone);
                    if (!session || newSession) { // no session
                        if (identity) {
                            const identityGet = await dbIdentity({
                                username: phone,
                                type: 'password'
                            });
                            await sessions.set(phone, {
                                system: {
                                    expire: getExpirationTime(),
                                    phone,
                                    backtrack: [],
                                    routes: {},
                                    meta: {
                                        auth: identityGet.hashParams[0]
                                    },
                                    newSession
                                }
                            });
                        } else {
                            await sessions.set(phone, {
                                system: {
                                    expire: getExpirationTime(),
                                    phone,
                                    backtrack: [],
                                    routes: {},
                                    newSession
                                }
                            });
                        }
                    } else if (new Date(session.system.expire) < new Date()) { // session expired
                        await sessions.merge(
                            phone,
                            {system: {resume: true}}
                        );
                        await sessions.merge(
                            phone,
                            {system: {expire: getExpirationTime()}}
                        );
                        await sessions.merge(
                            phone,
                            {system: {newSession: undefined}}
                        );
                    } else if (expireRule === 'refresh') {
                        await sessions.merge(
                            phone,
                            {system: {expire: getExpirationTime()}}
                        );
                        await sessions.merge(
                            phone,
                            {system: {newSession: undefined}}
                        );
                    }
                    session = await sessions.get(phone);
                    if (session.system.ussdString) {
                        const commands = [ussdMessage].concat(
                            session.system.ussdString
                        );
                        let i = 0; // iteration counter
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
                            // if states match and flow wasn't previously interrupted
                            // (i.e the code here should never execute for the
                            // first when.iterate cycle)
                                commands.splice(1);
                                loop = true;
                                break;
                            }
                            data = await engine.send(data);
                            engine.render({
                                translations: translations[language] || {},
                                ...data
                            });
                            delete data.system.ussdString;
                            await sessions.set(data);
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
                        ~strings.indexOf(ussdMessage)
                    ) { // ussd string
                        await sessions.merge(
                            phone,
                            {
                                system: {
                                    ussdString: ussdMessage
                                        .split(/[*#]/)
                                        .slice(1, -1)
                                }
                            }
                        );
                        await sessions.merge(
                            phone,
                            {
                                system: {
                                    ussdMessage: `*${session.system.ussdString.shift()}#`
                                }
                            }
                        );
                    } else {
                        await sessions.merge(
                            phone,
                            {system: {ussdMessage: ussdMessage}}
                        );
                    }
                    session = await sessions.get(phone);
                    if (session.system) {
                        // @ts-ignore
                        await sessions.merge(
                            phone,
                            {system: {config}}
                        );
                    }
                    const data = await engine.send(
                        await engine.route(
                            await engine.receive(session)
                        )
                    );
                    const result = await engine.render({
                        translations: translations[language] || {},
                        ...data
                    });
                    await sessions.set(data);
                    if (debug) {
                        result.debug = data;
                    }
                    return result;
                } catch (error) {
                    if (error.state) {
                        const data = await engine.send({
                            system: {
                                state: error.state,
                                phone,
                                ussdMessage
                            }
                        });
                        return await engine.render({
                            translations: translations[language] || {},
                            ...data
                        });
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
                        sourceAddr: phone
                    };
                }
                throw error;
            };
        }
    };
};
