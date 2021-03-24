module.exports = ({
    import: {
        ussd$menuIdentityCheck,
        ussd$menuFirstLogin
    }
}) => ({
    async receive(params) {
        // If the customer chose to Cancel
        if (params.system.ussdMessage === '9') {
            // Redirect to session beginning screen
            this.redirect('menu');
            return params;
        }

        // If there was an error the only option is to Cancel
        if (params.view === 'error') {
            return params;
        }

        // If the new PIN was entered or the PINs didn't match
        if (params.view === 'newPin' || params.view === 'notMatching') {
            // Save the entered PIN
            params.newPin = params.system.ussdMessage;

            // Next view - Confirm new PIN
            params.view = 'confirmPin';

            // Redirect to the same screen to continue
            this.redirect('menu/login');
            return params;
        // If the new PIN was confirmed
        } else if (params.view === 'confirmPin') {
            // Check if the PIN entries match
            if (params.newPin !== params.system.ussdMessage) {
                params.view = 'notMatching';
                // Redirect to the same screen to continue
                this.redirect('menu/login');
                return params;
            }
            // Proceed to login and PIN change below

        // If the PIN was changed successfully and the success view was shown
        } else if (params.view === 'changeSuccessful') {
            // Return to ut-ussd to route based on the input
            return params;
        }

        try {
            let newMeta = {};
            let login = null;

            // If we're just logging the customer in or the password was wrong on the last attempt
            if (params.view === 'pin' || params.view === 'wrongPin') {
                // Save the entered PIN in case a PIN change is required
                params.pin = params.system.ussdMessage;

                // Login
                login = await ussd$menuIdentityCheck({
                    channel: 'ussd',
                    username: params.system.phone,
                    password: params.pin
                }, params.$meta || {});

            // If we're changing the PIN of a customer
            } else if (params.view === 'confirmPin') {
                // Login and Change the PIN
                login = await ussd$menuIdentityCheck({
                    channel: 'ussd',
                    username: params.system.phone,
                    password: params.pin,
                    newPassword: params.newPin
                }, params.$meta || {});
            }

            // Create $meta using the actorId of the logged customer
            newMeta = {
                ...params.$meta,
                auth: {
                    actorId: login && login['identity.check'] && login['identity.check'].actorId,
                    sessionId: login && login['identity.check'] && login['identity.check'].sessionId
                },
                requestHeaders: {},
                channel: 'ussd'
            };

            // Save login flag and $meta
            params.accessGranted = true;
            params.$meta = newMeta;

            // Delete PINs
            delete params.pin;
            delete params.newPin;

            // If the customer is logging in for the first time
            if (!params.hasLoggedInBefore) {
                // Flip the hasLoggedInBefore flag
                await ussd$menuFirstLogin({
                    actorId: params.$meta.auth.actorId
                }, params.$meta);
            }

            if (params.view === 'pin' || params.view === 'wrongPin') {
                // Redirect to the home screen
                this.redirect('menu/home');
            } else if (params.view === 'confirmPin') {
                // Redirect to the same screen with a different view - success message
                params.view = 'changeSuccessful';
                this.redirect('menu/login');
            }
            return params;
        } catch (e) {
            // If the PIN was wrong
            if (e.type === 'identity.invalidCredentials') {
                // Redirect to the same screen with a different view - wrong pin
                params.view = 'wrongPin';
                this.redirect('menu/login');
                return params;
            // If a PIN change is required
            } else if (e.type === 'policy.param.newPassword') {
                // Redirect to the same screen with a different view - pin change required
                params.view = 'newPin';
                this.redirect('menu/login');
                return params;
            }

            // Note - UT returns Invalid credentials even if the user is locked so...
            params.view = 'error';

            // Redirect to the same screen to display an error and let the customer try again
            this.redirect('menu/login');
            return params;
        }
    }
});
