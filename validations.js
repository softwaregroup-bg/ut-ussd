var joi = require('joi');
module.exports = {
    'request': {
        auth: false,
        params: joi.object({
            phone: joi.string().label('phone'),
            message: joi.string().label('message')
        }),
        result: joi.object({
            shortMessage: joi.string().label('short message'),
            sourceAddr: joi.string().label('source address'),
            debug: joi.object().label('debug info')
        })
    },
    'closeSession': {
        auth: false,
        params: joi.object({
            phone: joi.string().label('phone')
        }),
        result: joi.object({
            shortMessage: joi.string().label('short message'),
            sourceAddr: joi.string().label('source address')
        })
    }
};
