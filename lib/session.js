module.exports = function(params) {
    var sessionDB = params.bus.importMethod('cache.collection')('ussd');
    return {
        get: (key) => {
            return sessionDB
                .then(session => session.get(key))
                .catch(e => null);
        },
        del: (key) => {
            return sessionDB
                .then(session => session.del(key));
        },
        set: (key, value) => {
            if (!value) {
                value = key;
                key = value.system.phone;
            }
            return sessionDB
                .then(session => session.set(key, value));
        }
    };
};
