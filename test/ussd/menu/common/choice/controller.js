module.exports = {
    receive(params) {
        const messageAsNumber = Number(params.system.ussdMessage);
        // Validate input
        if (isNaN(messageAsNumber) || messageAsNumber < 0 || messageAsNumber > params.choice.collection.length) {
            this.redirect('menu/error/wrongInput');
            return params;
        }

        // Handle Home and Back
        if (messageAsNumber === 0) {
            // Delete the choice parameters and view
            delete params.view;
            delete params.choice;
            // Return for routing to the appropriate screen
            return params;
        } else {
            // Get the chosen item from the collection and save it
            params.choice.chosenItem = params.choice.collection[messageAsNumber - 1];
            // Redirect to the pre-selected next state
            this.redirect(params.choice.nextState);
            return params;
        }
    }
};
