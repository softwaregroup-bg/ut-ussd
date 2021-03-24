// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    config
}) => ({
    'ussd.config.get'() {
        return config;
    }
});
