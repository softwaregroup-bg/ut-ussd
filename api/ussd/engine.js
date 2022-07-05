// @ts-check
const merge = require('ut-function.merge');
const cloneDeep = require('lodash.clonedeep');
const path = require('path');
const sax = require('sax');
const loadTemplate = require('ut-function.template');
const {
    normalizeState,
    parseRequestParams,
    backtrack: backtrackFn
} = require('./util');

const buildResponse = ({
    defaultShortCode,
    defaultPhone
}) => function({state, ...data}) {
    const x = merge({
        errorCode: 0,
        errorMessage: '',
        shortMessage: 'no ussdMessage provided'
    }, data);
    const result = {
        ...(x.errorCode !== 0) && {
            error: {
                code: x.errorCode,
                message: x.errorMessage,
                shortMessage: x.shortMessage
            }
        },
        message: x.shortMessage,
        defaultCode: defaultShortCode,
        phoneNumber: x.sourceAddr
    };
    state && (result.state = state);
    return result;
};

const loadController = async({
    statesDir,
    data,
    imp,
    direction = 'send'
}) => {
    const def = x => (x);
    try {
        const controllerPath = require.resolve(
            path.join(
                statesDir,
                data.system.state,
                'controller.js'
            )
        );
        if (controllerPath) {
            const controller = require(controllerPath);
            if (typeof controller === 'function') {
                return (
                    await controller({import: imp})
                )[direction] || def;
            } else if (typeof (controller && controller[direction]) === 'function') {
                return controller[direction] || def;
            }
            return def;
        }
    } catch (e) {
        return def;
    }
};

const ctxRedirect = (localState) => (state) => {
    localState.system.routes = {
        redirect: (
            typeof state === 'string'
                ? state
                : state.href
        )
    };
    localState.system.ussdMessage = 'redirect';
    localState.redirect = true;
    return true;
};

const taskPush = (
    context,
    fr,
    fn
) => async params =>
    await fr(
        await fn.call(
            context,
            params
        )
    );

const taskPushRedirect = (
    redirect,
    context,
    formatResult,
    fn
) => async params =>
    redirect
        ? params
        : await formatResult(
            await fn.call(
                context,
                params
            )
        );

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
        shortCodes,
        exposeState,
        wrongInputState
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
                newState = wrongInputState ||
                'menu/error/wrongInput';
            }
            data.system.prevState = state;
            data.system.state = normalizeState(state, newState);
            return parseRequestParams(
                backtrackFn(data)
            );
        },
        async send(data) {
            // initialization
            const send = await loadController({
                statesDir,
                data,
                imp
            });
            // logic
            const localState = {
                system: cloneDeep(data.system),
                redirect: false
            };
            async function formatResultSend(result) {
                let formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (localState.redirect) {
                    data.system = localState.system;
                    return await engine.send(
                        await engine.route(data)
                    );
                }
                if (result === true) {
                    formattedResult = data;
                } else if (typeof result === 'object') {
                    formattedResult = result;
                }
                formattedResult.system = localState.system;
                return formattedResult;
            }

            const context = {
                config,
                vfs,
                import: imp,
                utMethod,
                redirect: ctxRedirect(localState)
            };
            const tasks = [];
            hooks.beforeSend && tasks.push(taskPush(
                context,
                formatResultSend,
                hooks.beforeSend
            ));
            tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultSend,
                send
            ));
            hooks.afterSend && tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultSend,
                hooks.afterSend
            ));
            try {
                for (const task of tasks) {
                    data = await task(data);
                }
            } catch (error) {
                const err = new Error((
                    (error.ussdMessage || '') +
                    ' | js error thrown by controller at state ' +
                    localState.system.state
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
            const receive = (await loadController({
                statesDir,
                imp,
                data,
                direction: 'receive'
            }));
            // logic
            let localState = {
                system: undefined,
                redirect: false
            };
            function formatResultReceive(result) {
                let formattedResult = {};
                if (!data) {
                    data = {};
                }
                if (localState.redirect) {
                    data.system = localState.system;
                    return data;
                }
                if (result === true) {
                    formattedResult = data;
                } else if (typeof result === 'object') {
                    formattedResult = result;
                }
                formattedResult.system = localState.system;
                return formattedResult;
            }
            const tasks = [];
            const context = {
                config,
                vfs,
                import: imp,
                utMethod,
                redirect: ctxRedirect(localState)
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
                localState.system = cloneDeep(params.system);
                return params;
            });
            data.system.resume && hooks.resume && tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultReceive,
                hooks.resume
            ));
            hooks.beforeReceive && tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultReceive,
                hooks.beforeReceive
            ));
            tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultReceive,
                receive
            ));
            hooks.afterReceive && tasks.push(taskPushRedirect(
                localState.redirect,
                context,
                formatResultReceive,
                hooks.afterReceive
            ));
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
                    (localState.system && localState.system.state)
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
                const shortMessage = [];
                parser.ontext = text => shortMessage.push(text);
                parser.onopentag = ({
                    name, attributes: {id, href}
                }) => {
                    if (name === 'br') {
                        shortMessage.push('\n');
                    } else if (name === 'a' && id && href) {
                        data.system.routes[id.toString()] =
                            normalizeState(
                                data.system.state,
                                href
                            );
                    }
                };
                data.system.routes = {};
                return await new Promise((resolve, reject) => {
                    parser.onend = () => {
                        resolve({
                            shortMessage: shortMessage.join(''),
                            sourceAddr: data.system.phone,
                            ...(exposeState && {state: data})
                        });
                    };
                    parser.onerror = reject;
                    parser.write(`<root>${result}</root>`)
                        .close();
                });
            } catch (err) {
                const error = new Error(
                    'template load error: ' +
                    (err.ussdMessage || '')
                );
                // @ts-ignore
                error.cause = err;
                throw error;
            }
        }
    };
    return {engine};
};
