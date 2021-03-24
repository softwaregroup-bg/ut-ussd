// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        request,
        engine
    }
}) => ({
    async 'ussd.message.process'(params, $meta) {
        return engine.buildResponse(await request(params));
    }
});
