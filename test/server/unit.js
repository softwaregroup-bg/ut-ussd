module.exports = {
    implementation: 'ussd',
    adapter: true,
    utPort: {
        noRecursion: true
    },
    utBus: {
        serviceBus: {
            requireMeta: true
        }
    },
    utLog: {
        streams: {
            sentry: {
                level: 'error',
                stream: '../sentryNodeStream',
                streamConfig: {
                    dsn: 'http://32bf0ea099474de9821c466ecac070d9@sentry.k8s.softwaregroup-bg.com/18',
                    patchGlobal: false,
                    logger: 'ut-ussd'
                },
                type: 'raw'
            }
        }
    },
    db: true,
    utCache: {
        adapter: true
    },
    utCore: true,
    utCustomer: true,
    utDocument: true,
    utUser: true,
    utUssd: true
};
