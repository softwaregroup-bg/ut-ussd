module.exports = function validation({joi}) {
    return {
        'ussd.config.get': () => ({
            method: 'GET',
            path: '/config',
            auth: false
        }),
        'ussd.session.fetch': () => ({
            method: 'GET',
            path: '/session',
            auth: false
        }),
        'ussd.session.get': () => ({
            method: 'GET',
            path: '/session/{key}',
            auth: false
        }),
        'ussd.session.remove': () => ({
            method: 'DELETE',
            path: '/session',
            auth: false
        }),
        'ussd.message.process': () => ({
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
        })
    };
};
