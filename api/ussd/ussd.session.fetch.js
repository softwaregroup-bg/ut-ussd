// @ts-check
/** @type { import("../../handlers").handlerFactory } */
module.exports = ({
    lib: {
        sessions
    }
}) => {
    async function fetch() {
        const data = await sessions.get();
        let response = '';
        if (!data) {
            response = 'db empty';
        } else {
            data.forEach(function(record) {
                response += '<div style="border-bottom: 1px dashed grey; padding: 20px">' +
                    record.key + ': ' + JSON.stringify(record.value, null, 4) +
                    '</div>';
            });
        }
        return '<span style="white-space: pre; font-family: \'Courier New\', Courier, monospace">' +
            response +
            '</span>';
    };
    return {
        'ussd.session.fetch': fetch,
        'ussd.session.fetchRest': fetch
    };
};
