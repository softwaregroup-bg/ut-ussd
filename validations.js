module.exports = function validation({joi}) {
    return {
        'ussd.config.getRest': () => ({
            method: 'GET',
            path: '/config',
            auth: false
        }),
        'ussd.session.fetchRest': () => ({
            method: 'GET',
            path: '/session',
            auth: false
        }),
        'ussd.session.getRest': () => ({
            method: 'GET',
            path: '/session/{key}',
            auth: false
        }),
        'ussd.session.removeRest': () => ({
            // Used by the USSD Simulator (disable in prod)
            method: 'DELETE',
            path: '/session',
            auth: false
        }),
        'ussd.message.processRest': () => ({
            // Used by the USSD Simulator (disable in prod)
            method: 'POST',
            // Actual route is /rpc/ussd/message
            path: '/message',
            validate: {
                payload: joi.object({
                    phone: joi.string().required(),
                    ussdMessage: joi.string().required(),
                    newSession: joi.boolean()
                })
            },
            auth: false
        }),
        'ussd.message.process': () => ({
            params: joi.object({
                phone: joi.string().required(),
                ussdMessage: joi.string().required(),
                newSession: joi.boolean()
            }),
            result: joi.object({
                response: joi.string()
            })
        }),
        'ussd.config.get': () => ({
            params: joi.object(),
            result: joi.object()
        })
    };
};
