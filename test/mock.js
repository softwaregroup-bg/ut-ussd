const dispatch = require('ut-function.dispatch');
module.exports = [
    dispatch({
        namespace: 'ussd/menu',
        methods: {
            'menu.identity.check'({username, password}) {
                if (username === password) {
                    return {
                        'identity.check': {
                            actorId: 1,
                            session: 'session-1'
                        }
                    };
                } else {
                    const e = new Error('invalid credentials');
                    e.type = 'identity.invalidCredentials';
                    throw e;
                }
            },
            'menu.first.login'({actorId}) {
                return false;
            },
            'menu.mini.statement'({accountNumber}) {
                return {
                    miniStatement: {
                        1001: [{
                            amount: '  100.00 USD',
                            postDate: '24 Mar 2020 15:27'
                        }, {
                            amount: '   15.20 USD',
                            postDate: '23 Mar 2020 09:32'
                        }]
                    }[accountNumber]
                };
            },
            'menu.balance.enquiry'({accountNumber}) {
                return {
                    1001: {
                        accountNumber,
                        currency: 'USD',
                        workingBalance: '1050.30',
                        onlineClearedBalance: '1000.30',
                        onlineActualBalance: '1010.00'
                    }
                }[accountNumber];
            }
        }
    })
];
