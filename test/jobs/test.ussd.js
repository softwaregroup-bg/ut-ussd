const got = require('got');

const send = (ussdMessage, expect, name = ussdMessage) => ({
    name,
    params: ({uri}) => got(`${uri}/rpc/ussd/message`, {
        method: 'post',
        json: {
            phone: '0888',
            ussdMessage
        }
    }).json(),
    result: (result, assert) => {
        assert.comment(`Sent: ${ussdMessage}\nReceived:\n${result.message}`);
        assert.match(result.message, new RegExp(expect), 'Expect ' + expect);
    }
});

module.exports = function test() {
    return {
        ussd: function(test, bus, run, ports) {
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
                send('*123#', 'Please enter your PIN'),
                send('555', 'Wrong PIN'),
                send('0888', 'Welcome'),
                send('1', 'Mini statement'),
                send('1', 'Please select an account'),
                send('1', '100.00 USD'),
                send('0', 'Welcome'),
                send('1', 'Balance enquiry'),
                send('2', 'Please select an account'),
                send('1', 'Working balance: 1050.30 USD')
            ]);
        }
    };
};
