// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        request,
        engine
    }
}) => {
    async function process(params, $meta) {
        return engine.buildResponse(await request(params));
    }
    return {
        'ussd.message.process': process,
        'ussd.message.processRest': process
    };
};
