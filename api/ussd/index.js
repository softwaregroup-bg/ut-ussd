// @ts-check
/** @type { import("../../handlers").handlerSet } */
module.exports = function ussd() {
    return [
        require('./session'),
        require('./engine'),
        require('./request'),
        require('./ussd.config.get'),
        require('./ussd.message.process'),
        require('./ussd.session.fetch'),
        require('./ussd.session.get'),
        require('./ussd.session.remove')
    ];
};
