module.exports = ({
    import: {
        ussd$menuMiniStatement
    }
}) => ({
    async send(params) {
        try {
            const result = await ussd$menuMiniStatement({
                accountNumber: params.choice.chosenItem.accountNumber
            }, params.$meta);

            params.miniStatement = result.miniStatement || [];
            return params;
        } catch (e) {
            params.error = e;
            this.redirect('menu/error/runtimeError');
            return params;
        }
    }
});
