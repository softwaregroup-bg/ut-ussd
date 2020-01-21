module.exports = ({defineError, getError, fetchErrors}) => {
    if (!getError('ussd')) {
        defineError('ussd', null, 'ussd error', 'error');
    }
    return fetchErrors('ussd');
};
