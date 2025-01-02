// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        sessions
    }
}) => {
    async function add({key, value}) {
        await sessions.set(key, value);
        return '<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                JSON.stringify(value, null, 4) +
                '</span>';
    }
    return {
        'ussd.session.add': add
    };
};
