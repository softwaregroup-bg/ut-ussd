const errorsFactory = require('./errors');
module.exports = (params = {}) => {
    const Parent = params.parent;
    class USSD extends Parent {
        constructor(params) {
            super(params);
            this.config = this.merge({
                shortcodes: {},
                defaultShortCode: '*123#',
                defaultPhone: '123456789',
                identity: true,
                routes: {
                    common: { // applies for all routes
                        config: {
                            auth: false
                        }
                    },
                    public: {}, // to access the public resources
                    session: {}, // for remote access to the whole session object
                    sessionKey: {}, // for remote access to a single record from the session object
                    ussd: {}, // to call the ussd api remotely
                    config: {}, // to obtain information about ussd simulator's default phone and shortcode
                    closeSession: {} // to close ussd session
                }
            }, params.config);
            Object.assign(this.errors, errorsFactory(this.bus));
        }
    };

    return USSD;
};
