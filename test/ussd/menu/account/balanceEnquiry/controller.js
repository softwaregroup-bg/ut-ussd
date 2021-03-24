module.exports = ({
    import: {
        ussd$menuBalanceEnquiry
    }
}) => ({
    async send(params) {
        try {
            const result = await ussd$menuBalanceEnquiry({
                accountNumber: params.choice.chosenItem.accountNumber
            }, params.$meta);

            params.balanceEnquiry = result;
            return params;
        } catch (e) {
            params.error = e;
            this.redirect('menu/error/runtimeError');
            return params;
        }
    }
});
