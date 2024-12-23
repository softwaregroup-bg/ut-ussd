const path = require('path');
module.exports = function sql({
    config: {
        ...config
    } = {}
} = {}) {
    return {
        namespace: 'db/ussd',
        schema: [{
            path: path.join(__dirname, 'ussdAudit'),
            linkSP: true,
            config
        }]
    };
};
