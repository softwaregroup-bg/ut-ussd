const {resolve} = require('path');

const test = {
    ussd: {
        shortCodes: {
            '*123#': 'menu'
        },
        baseDir: resolve(__dirname, 'test', 'ussd')
    },
    sqlStandard: true
};

module.exports = () => ({
    // environments
    common: {
        ussd: {
            shortCodes: {},
            defaultShortCode: '*123#',
            defaultPhone: '0888',
            identity: false,
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
        }
    },
    dev: {
        sqlStandard: true
    },
    test,
    jenkins: test,
    uat: {
        sqlStandard: true
    },
    // methods
    kustomize: {
        adapter: true,
        orchestrator: true,
        gateway: true
    },
    types: {
        gateway: true,
        ussd: {
            baseDir: __dirname
        }
    },
    doc: {
        gateway: true
    },
    // test types
    unit: {
        adapter: true,
        orchestrator: true,
        gateway: true,
        test: true
    },
    integration: {
        adapter: true,
        orchestrator: true,
        gateway: true,
        test: true
    },
    db: {
        adapter: true
    },
    validation: ({joi}) => joi.object({
        adapter: joi.boolean(),
        orchestrator: joi.boolean(),
        gateway: joi.boolean(),
        test: joi.boolean(),
        sql: joi.object({
            exclude: joi.any()
        }),
        sqlStandard: [
            joi.boolean(),
            joi.object({
                exclude: joi.any()
            })
        ],
        ussdDispatch: [
            joi.boolean(),
            joi.object()
        ],
        ussd: joi.object({
            baseDir: joi.string().required(),
            shortCodes: joi.object(),
            defaultShortCode: joi.string(),
            defaultPhone: joi.string(),
            identity: joi.boolean(),
            routes: joi.object({
                common: joi.object(),
                public: joi.object(),
                session: joi.object(),
                sessionKey: joi.object(),
                ussd: joi.object(),
                config: joi.object(),
                closeSession: joi.object()
            })
        })
    })
});
