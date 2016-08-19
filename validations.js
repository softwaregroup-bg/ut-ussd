var joi = require('joi');
module.exports = {
    'request': {
        params: joi.object({
            phone: joi.string().label('phone'),
            message: joi.string().label('message')
        }),
        result: joi.object({
            shortMessage: joi.string().label('short message'),
            sourceAddr: joi.string().label('source address')
        })
    }
};
