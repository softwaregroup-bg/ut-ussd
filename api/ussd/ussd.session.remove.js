// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        sessions,
        request,
        engine
    }
}) => {
    async function remove(params, $meta) {
        try {
            await sessions.del(params.phone);
            return engine.buildResponse({shortMessage: 'Session Closed'});
        } catch (e) {
            return engine.buildResponse({shortMessage: 'error occurred when deleting the session data'});
        }
    }
    return {
        'ussd.session.remove': remove,
        'ussd.session.removeRest': remove
    };
};
