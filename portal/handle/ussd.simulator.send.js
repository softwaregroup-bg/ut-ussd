// @ts-check
/** @type { import("../../handlers").handlerFactory } */
export default ({
    import: {
        ussdMessageSend
    }
}) => ({
    'ussd.simulator.send': ussdMessageSend
});
