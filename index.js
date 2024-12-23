const path = require('path');

module.exports = () => function utUssd() {
    return {
        config: require('./config'),
        orchestrator: () => [
            require('ut-dispatch-db')(['ussd'], ['utUssd.ussd']),
            require('./api/ussd')
        ],
        adapter: () => [
            require('./api/sql/schema'),
            function cache() {
                return class cache extends require('ut-port-cache')(...arguments) {
                    get defaults() {
                        return {
                            namespace: ['cache/ussd']
                        };
                    }
                };
            }
        ],
        gateway: () => [
            require('./validations'),
            // static assets are on /a
            function asset() {
                return {
                    // adds /ussd route
                    ussd: () => ({
                        directory: {
                            path: path.join(__dirname, 'public'),
                            listing: false,
                            index: true
                        }
                    })
                };
            }

        ],
        test: () => [
            ...require('./test/steps'),
            ...require('./test/jobs'),
            ...require('./test/mock')
        ]
    };
};
