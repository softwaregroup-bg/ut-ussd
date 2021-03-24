// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        sessions
    }
}) => ({
    async 'ussd.session.get'({key}) {
        const value = await sessions.get(key);
        if (!value) {
            return 'no session data';
        } else {
            return '<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
                JSON.stringify(value, null, 4) +
                '</span>';
        }
    }
});
