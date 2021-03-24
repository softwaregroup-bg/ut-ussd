module.exports = {
    send(params) {
        try {
            // check if phone is registered
            // onboarding logic

            // Redirect to login screen to receive the PIN
            params.view = 'pin';
            this.redirect('menu/login');
            return params;
        } catch (e) {
            params.view = 'error';
            return params;
        }
    }
};
