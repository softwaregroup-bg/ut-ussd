const got = require('got');

module.exports = [
    function steps({callSite}) {
        return {
            'steps.ussd.send': (ussdMessage, expect, name = 'sending ' + ussdMessage) => ({
                ...callSite?.(),
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
            })
        };
    }
];
