function PhoneButton(el, val) {
    const codeInput = $('#code-input input');
    el.bind('click', function() {
        codeInput.val(codeInput.val() + val);
    });
}

function bindPhoneButtons() {
    const buttons = $('.phoneBtn');
    let val;
    let btn;
    for (const i = 0, n = buttons.length; i < n; i += 1) {
        btn = buttons[i];
        val = btn.id.split('_').pop();
        if (val === 'asterisk') {
            val = '*';
        } else if (val === 'hash') {
            val = '#';
        }
        new PhoneButton($(btn), val);
    }
}

$(document).ready(function() {
    bindPhoneButtons();
});
