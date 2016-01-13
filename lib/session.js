module.exports = function(params) {
    var sessionDB = params.bus.importMethod('cache.collection')('ussd');
    return {
        get: function(key) {
            return sessionDB.get(key)
                .then(function(result) {
                    return result;
                })
                .catch(function() {
                    return null;
                });
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
};
