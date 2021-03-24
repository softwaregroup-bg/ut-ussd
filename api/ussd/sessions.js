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
            }
        }
    };
};
