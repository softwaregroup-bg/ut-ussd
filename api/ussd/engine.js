// @ts-check
const merge = require('ut-function.merge');
const cloneDeep = require('lodash.clonedeep');
const path = require('path');
const sax = require('sax');
const loadTemplate = require('ut-function.template');
const util = require('./util');

const buildResponse = ({
    defaultShortCode,
    defaultPhone
}) => function(data) {
    const x = merge({
        errorCode: 0,
        errorMessage: '',
        shortMessage: 'no ussdMessage provided'
    }, data);

    return {
        ...(x.errorCode !== 0) && {
            error: {
                code: x.errorCode,
                message: x.errorMessage,
                shortMessage: x.shortMessage
            }
        },
        message: x.shortMessage,
        defaultCode: defaultShortCode,
        phoneNumber: defaultPhone
    };
};

/** @type { import("../../handlers").libFactory } */
module.exports = ({
    config,
    utMethod,
    vfs,
    import: imp
}) => {
    const {
        baseDir: statesDir,
        defaultShortCode,
        defaultPhone,
        shortCodes
    } = config;
    let hooks;
    try {
        hooks = require(path.join(statesDir, 'hooks.js'));
    } catch (e) {
        hooks = {};
    }
    const engine = {
        buildResponse: buildResponse({
            defaultShortCode,
            defaultPhone
        }),
        route(data) {
            const {
                system: {
                    ussdMessage,
                    routes,
                    backtrack,
                    state
                }
            } = data;

            let newState;
            if (shortCodes[ussdMessage]) {
                newState = shortCodes[ussdMessage];
            } else if (routes[ussdMessage] || routes['*']) {
                newState = routes[ussdMessage] || routes['*'];
                if (newState === 'back') {
                    newState = backtrack[backtrack.length - 2];
                }
            } else {
                newState = config.wrongInputState ||
                'menu/error/wrongInput';
            }
            newState = util.normalizeState(state, newState);
            data.system.prevState = state;
            data.system.state = newState;
            util.backtrack(data);
            util.parseRequestParams(data);
            return data;
        },
        async send(data) {
            // initialization
            let controllerPath;
            let controller;
            let send;
            try {
                controllerPath = require.resolve(path.join(
                    statesDir,
                    data.system.state,
                    'controller.js'
                ));
            } catch (e) {
            }
            if (controllerPath) {
                controller = require(controllerPath);
                if (typeof controller === 'function') {
                    send = (await controller({import: imp})).send;
                } else if (typeof (controller && controller.send) === 'function') {
                    send = controller.send;
                }
            }
            send = send || (x => x);
            // logic
            const system = cloneDeep(data.system);
            async function formatResult(result) {
                let formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (redirect) {
                    data.system = system;
                    return await engine.send(
                        await engine.route(data)
                    );
                }
                if (result === true) {
                    formattedResult = data;
                } else if (typeof result === 'object') {
                    formattedResult = result;
                }
                formattedResult.system = system;
                return formattedResult;
            }
            const tasks = [];
            let redirect = false;
            const context = {
                config,
                vfs,
                import: imp,
                utMethod,
                redirect: function(state) {
                    system.routes = {
                        redirect: (
                            typeof state === 'string'
                                ? state
                                : state.href
                        )
                    };
                    system.ussdMessage = 'redirect';
                    redirect = true;
                    return redirect;
                }
            };
            if (hooks.beforeSend) {
                tasks.push(
                    async params =>
                        await formatResult(
                            await hooks.beforeSend.call(
                                context,
                                params
                            )
                        )
                );
            }
            tasks.push(
                async params =>
                    redirect
                        ? params
                        : await formatResult(
                            await send.call(
                                context,
                                params
                            )
                        )
            );
            if (hooks.afterSend) {
                tasks.push(
                    async params =>
                        redirect
                            ? params
                            : await formatResult(
                                await hooks.afterSend.call(
                                    context,
                                    params
                                )
                            )
                );
            }
            try {
                for (const task of tasks) {
                    data = await task(data);
                }
            } catch (error) {
                const err = new Error((
                    (error.ussdMessage || '') +
                    ' | js error thrown by controller at state ' +
                    system.state
                ));
                // @ts-ignore
                err.cause = error;
                throw err;
            }
            return data;
        },
        async receive(data) {
            if (!data.system.state) return data;
            // initialization
            let controllerPath;
            let controller;
            let receive;
            try {
                controllerPath = require.resolve(
                    path.join(
                        statesDir,
                        data.system.state,
                        'controller.js'
                    )
                );
            } catch (e) {
            }
            if (controllerPath) {
                controller = require(controllerPath);
                if (typeof controller === 'function') {
                    receive = (await controller({import: imp})).receive;
                } else if (typeof (controller && controller.receive) === 'function') {
                    receive = controller.receive;
                }
            }
            receive = receive || (x => x);
            // logic
            let system;
            function formatResult(result) {
                let formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (redirect) {
                    data.system = system;
                    return data;
                }
                if (result === true) {
                    formattedResult = data;
                } else if (typeof result === 'object') {
                    formattedResult = result;
                }
                formattedResult.system = system;
                return formattedResult;
            }
            const tasks = [];
            let redirect = false;
            const context = {
                config,
                vfs,
                import: imp,
                utMethod,
                redirect: function(state) {
                    system.routes = {
                        redirect: (
                            typeof state === 'string'
                                ? state
                                : state.href
                        )
                    };
                    system.ussdMessage = 'redirect';
                    redirect = true;
                    return redirect;
                }
            };
            tasks.push(function(params) {
                const href = params.system.routes[data.system.ussdMessage] ||
                    params.system.routes['*'];
                if (href) {
                    const parsedUrl = new URL(
                        href,
                        'http://localhost'
                    );
                    params.system.input = {
                        state: parsedUrl.pathname,
                        requestParams: parsedUrl.searchParams
                    };
                }
                system = cloneDeep(params.system);
                return params;
            });
            if (data.system.resume && hooks.resume) {
                tasks.push(
                    async params =>
                        redirect
                            ? params
                            : formatResult(
                                await hooks.resume.call(context, params)
                            )
                );
            }
            if (hooks.beforeReceive) {
                tasks.push(
                    async params =>
                        redirect
                            ? params
                            : formatResult(
                                await hooks.beforeReceive.call(
                                    context,
                                    params
                                )
                            )
                );
            }
            tasks.push(
                async params =>
                    redirect
                        ? params
                        : formatResult(
                            await receive.call(
                                context,
                                params
                            )
                        )
            );
            if (hooks.afterReceive) {
                tasks.push(
                    async params =>
                        redirect
                            ? params
                            : formatResult(
                                await hooks.afterReceive.call(
                                    context,
                                    params
                                )
                            )
                );
            }
            tasks.push(function(params) {
                delete params.system.input;
                if (params.system.resume) {
                    delete params.system.resume;
                }
                return params;
            });
            try {
                for (const task of tasks) {
                    data = await task(data);
                }
            } catch (error) {
                const err = new Error((
                    (error.ussdMessage || '') +
                    ' | js error thrown by controller at state ' +
                    (system && system.state)
                ));
                // @ts-ignore
                err.cause = error;
                throw err;
            }
            return data;
        },
        async render(data) {
            // Called from the tagged template strings in the screen templates
            const translate = (strings, ...values) => {
                // Build the full text from the interpolation parts
                const text = strings
                    .map((string, index) =>
                        index < values.length
                            ? string + values[index]
                            : string
                    ).join('');
                // Translate it if possible
                return (
                    data.translations &&
                    data.translations[text]
                ) || text;
            };

            function load(file, params) {
                return loadTemplate(
                    vfs.readFileSync(file).toString(),
                    ['params', 'T', 'include'],
                    {},
                    null
                )(
                    {
                        ...data,
                        ...params
                    },
                    translate,
                    (newFile, p) => load(
                        path.resolve(path.dirname(file), newFile),
                        p
                    )
                );
            }
            try {
                const result = load(path.join(
                    statesDir,
                    data.system.state,
                    'view.xml'
                ));
                const parser = sax.parser(
                    false,
                    {lowercase: true}
                );
                let shortMessage = '';
                parser.ontext = function(text) {
                    shortMessage += text;
                };
                parser.onopentag = function(tag) {
                    if (tag.name === 'br') {
                        shortMessage += '\n';
                    } else if (
                        tag.name === 'a' &&
                        tag.attributes.id &&
                        tag.attributes.href
                    ) {
                        data.system.routes[tag.attributes.id.toString()] = util.normalizeState(data.system.state, tag.attributes.href);
                    }
                };
                data.system.routes = {};
                return await new Promise(function(resolve, reject) {
                    parser.onend = function() {
                        resolve({
                            shortMessage: shortMessage,
                            sourceAddr: data.system.phone
                        });
                    };
                    parser.onerror = reject;
                    parser.write('<root>' + result + '</root>').close();
                });
            } catch (err) {
                const error = new Error('template load error: ' + (err.ussdMessage || ''));
                // @ts-ignore
                error.cause = err;
                throw error;
            }
        }
    };
    return {engine};
};
