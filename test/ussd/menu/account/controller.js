module.exports = {
    receive(params) {
        // Handle Home and Back
        if (params.system.ussdMessage === '0' || params.system.ussdMessage === '9') {
            // Return for routing to the appropriate screen
            return params;
        }

        // Prepare the choice object
        params.choice = {
            nextState: params.system.routes[params.system.ussdMessage],
            message: 'Please select an account:',
            itemFieldsToDisplay: ['accountNumber'],
            collection: [{
                accountNumber: '1001'
            }, {
                accountNumber: '1002'
            }, {
                accountNumber: '1003'
            }, {
                accountNumber: '1004'
            }]
        };

        // Redirect to the choice screen
        this.redirect('menu/common/choice');
        return params;
    }
};
