var when = require('when');
module.exports = function(config) {
    var sessionDB = require('level')(config.session, {valueEncoding: 'json'});
    return {
        get: function(key) {
            return when.promise(function(resolve, reject) {
                if (key) {
                    sessionDB.get(key, function(err, data) {
                        resolve(err ? null : data);
                    });
                } else {
                    var data = [];
                    sessionDB.createReadStream()
                    .on('data', function(record) {
                        data.push({key: record.key, value: record.value});
                    })
                    .on('end', function() {
                        resolve(data.length ? data : null);
                    });
                }
            });
        },
        del: function(key) {
            return when.promise(function(resolve, reject) {
                sessionDB.del(key, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        },
        put: function(key, value) {
            if (!value) {
                value = key;
                key = value.system.phone;
            }
            return when.promise(function(resolve, reject) {
                sessionDB.put(key, value, function(err) {
                    if (err) {
                        reject(err.message || 'error occurred when saving session data');
                    } else {
                        resolve(value);
                    }
                });
            });
        }
    };
}
