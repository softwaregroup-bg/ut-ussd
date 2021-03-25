const got = require('got');

module.exports = function test() {
    return {
        ussd: function(test, bus, run, ports, {
            ussdSend
        }) {
            return run(test, bus, [
                {
                    name: 'uri',
                    params: bus.jsonrpc ? bus.rpc.info().uri : ports[0].config.url,
                    result(result, assert) {
                        assert.ok(result, 'Base uri');
                    }
                },
                {
                    name: 'config',
                    params: ({uri}) => got(`${uri}/rpc/ussd/config`, {
                        method: 'get'
                    }).json(),
                    result(result, assert) {
                        assert.ok(result.routes, 'routes found');
                    }
                },
                ussdSend('*123#', 'Please enter your PIN'),
                ussdSend('555', 'Wrong PIN'),
                ussdSend('0888', 'Welcome'),
                ussdSend('1', 'Mini statement'),
                ussdSend('1', 'Please select an account'),
                ussdSend('1', '100.00 USD'),
                ussdSend('0', 'Welcome'),
                ussdSend('1', 'Balance enquiry'),
                ussdSend('2', 'Please select an account'),
                ussdSend('1', 'Working balance: 1050.30 USD')
            ]);
        }
    };
};
