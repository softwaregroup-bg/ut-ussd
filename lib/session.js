module.exports = function(config) {
    var sessionDB = config.bus.importMethod('cache.collection')('ussd');
    return {
        get: function(key) {
            return sessionDB.get(key)
                .then(function(result) {
                    return result;
                })
                .catch(function(err) {
                    return null;
                })
        },
        del: sessionDB.del,
        set: function(key, value) {
            if (!value) {
                value = key;
                key = value.system.phone;
            }
            return sessionDB.set(key, value);
        }
    };
}
