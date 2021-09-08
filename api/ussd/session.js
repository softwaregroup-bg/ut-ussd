// @ts-check
/** @type { import("../../handlers").libFactory } */

const merge = require('ut-function.merge');
const Cache = (utMethod) => ({
    get(key) {
        return utMethod(undefined, {
            cache: {
                operation: 'get',
                key: {id: key}
            }
        });
    },
    set(key, value) {
        return utMethod(value, {
            cache: {
                operation: 'set',
                ttl: 999999,
                key: {id: key}
            }
        });
    },
    del(key) {
        return utMethod(undefined, {
            cache: {
                operation: 'drop',
                key: {id: key}
            }
        });
    }
});

module.exports = ({
    import: {
        'cache/ussd.session.update': cache
    }
}) => {
    const cacheObj = Cache(cache);

    return {
        sessions: {
            get: async key => cacheObj.get(key),
            del: async key => cacheObj.del(key),
            set: async(key, value) => {
                if (!value) {
                    value = key;
                    key = value.system.phone;
                }
                await cacheObj.set(key, value);
                return value;
            },
            merge: async(key, value) => {
                const s = await cacheObj.get(key);
                const sn = merge(s, value);
                await cacheObj.set(key, sn);
                return cacheObj.get(key);
            }
        }
    };
};
