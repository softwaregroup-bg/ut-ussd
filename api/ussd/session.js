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
            return this.remoteCall('ussd.session.update')(undefined, {
                cache:{
                    operation:'get',
                    key:{id: key}
                }
            });
        }
        return this.storage[key];
    }

    set(key, value) {
        if (this.remoteCall) {
            return this.remoteCall('ussd.session.update')(value, {
                cache:{
                    operation:'set',
                    ttl: 999999,
                    key:{id: key}
                }
            });
        }
        this.storage[key] = value;
    }

    del(key) {
        if (this.remoteCall) {
            return this.remoteCall('ussd.session.update')(undefined, {
                cache:{
                    operation:'drop',
                    key:{id: key}
                }
            });
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
        remote && (
            (suffix) => utMethod([remote, suffix].join(''))
        )
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
