// @ts-check
/** @type { import("../../handlers").libFactory } */

module.exports = () => {
    class Cache {
        constructor() {
            this.storage = {};
        }

        get(key) {
            return this.storage[key];
        }

        set(key, value) {
            this.storage[key] = value;
        }

        del(key) {
            delete this.storage[key];
        }
    }

    const cacheSession = new Cache();

    const setByPath = (
        path,
        val,
        obj
    ) => {
        if (val == null) {
            return obj;
        }
        if (path.length) {
            const node = path.shift();
            obj[node] = setByPath(path, val, obj[node] || {});
            return obj;
        } else {
            return val;
        }
    };

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
            setByPath: async(key, path, value) => {
                const s = await cacheSession.get(key);
                const sn = setByPath(path, value, s);
                await cacheSession.set(key, sn);
                return cacheSession.get(key);
            }
        }
    };
};
