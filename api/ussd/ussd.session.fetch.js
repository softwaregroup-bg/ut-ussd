// @ts-check
/** @type { import("../../handlers").handlerFactory } */
const text1 = (a1, a2) =>
    `<div style="border-bottom: 1px dashed grey; padding: 20px">${a1}: ${a2}</div>`;
const text2 = (a1) =>
    `<span style="white-space: pre; font-family: 'Courier New', Courier, monospace">${a1}</span>`;

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
                response += text1(
                    record.key,
                    JSON.stringify(record.value, null, 4)
                );
            });
        }
        return text2(response);
    }

    return {
        'ussd.session.fetch': fetch,
        'ussd.session.fetchRest': fetch
    };
};
