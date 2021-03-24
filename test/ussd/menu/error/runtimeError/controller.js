module.exports = {
    send(params) {
        // By default we don't show the error
        params.error.showError = false;

        if (!params.error) {
            return params;
        }

        // Show specific errors
        if (params.error.message.includes('Insufficient balance') || params.error.message.includes('Account is restricted')) {
            params.error.showError = true;
            return params;
        }

        return params;
    },
    receive(params) {
        delete params.error;
        return params;
    }
};
