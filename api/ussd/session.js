// @ts-check
/** @type { import("../../handlers").libFactory } */

const merge = require('ut-function.merge');

class Cache {
    constructor(utMethod) {
        this.storage = {};
        this.remoteCall = utMethod;
    }

    get(key) {
        if (this.remoteCall) {
            return this.remoteCall('session.get')({key});
        }
        return this.storage[key];
    }

    set(key, value) {
        if (this.remoteCall) {
            return this.remoteCall('session.set')({key, value});
        }
        this.storage[key] = value;
    }

    del(key) {
        if (this.remoteCall) {
            return this.remoteCall('session.delete')({key});
        }
        delete this.storage[key];
    }
}

module.exports = ({
    config: {
        session : {remote} = {}
    } = {}, 
    utMethod
}) => {
    const cacheSession = new Cache(
        remote &&
            (suffix) =>
                utMethod([remote, suffix].join('.'))
    );

    return {
        sessions: {
            get: async key => cacheSession.get(key),
            del: async key => cacheSession.del(key),
            set: async(key, value) => {
                if (!value) {
                    value = key;
                    key = value.system.phone;
                }
                await cacheSession.set(key, value);
                return value;
            },
            merge: async(key, value) => {
                const s = await cacheSession.get(key);
                const sn = merge(s, value);
                await cacheSession.set(key, sn);
                return cacheSession.get(key);
            }
        }
    };
};
