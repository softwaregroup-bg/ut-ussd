/* eslint-disable no-var */
window.ussd = {};
function ussdRequest(button, destination, phoneInput, dataCollection) {
    this.data = {};

    // clock control
    if (clock && clock.state === undefined) {
        clock.reset();
        clock.start();
    }

    // instance methods
    this.enableButton = function() {
        button.removeAttr('disabled');
    };
    this.disableButton = function() {
        button.attr('disabled', 'disabled');
    };
    this.hidePhoneInput = function() {
        phoneInput.addClass('hidden');
    };

    this.collectData = function collectData() {
        var _collections;

        jQuery(dataCollection).each(function(index, val) {
            var _el = jQuery(val);

            if (!(_collections instanceof Object))
                _collections = {};
            _collections[_el.attr('name')] = _el.val();
        });

        this.data = _collections;

        jQuery('[name="ussdMessage"]')[0].value = '';

        return (_collections ? true : false);
    };

    this.doRequest = function doRequest() {
        var _self = this;
        if (!phone.isInUSSD) {
            this.data.newSession = true;
        }
        phone.startLoading();
        jQuery.ajax({
            url: '/rpc/ussd/message',
            type: 'POST',
            dataType: 'json',
            data: this.data
        })
            .always(function() {
                phone.stopLoading();
                _self.enableButton();
            })
            .done(function(data) {
                phone.isInUSSD = true;
                _self.enableButton();
                var stat = data.error;
                var msg = data.message;
                destination.html(destination.html() + _self.data.phone + '<br/>');
                destination.html(destination.html() + _self.data.ussdMessage + '<br/>**************** (' + msg.length + ' characters)<br/>');
                destination.html(destination.html() + msg + '<br/>----------------<br/>');
                if (stat && stat.message) {
                    destination.html(destination.html() + stat.textContent + '<br/>----------------<br/>');
                }
                if (window.ussd.config.charsCount) {
                    $('#charsCount').html(msg.length);
                }
                destination.animate({
                    scrollTop: destination.scrollTop() + destination.height()
                }, 500);
                // _self.hidePhoneInput();

                // @@@@@@@@@@@@@@
                if (stat && stat.message !== '') {
                    $('#phone_screen code').html(stat.message);
                } else {
                    $('#phone_screen code').html(msg);
                }
                $('#code-input input').focus();
                // @@@@@@@@@@@@@@
            })
            .fail(function(r, err, errDesc) {
                destination.find('code').text('Error: ' + err);
            });
    };

    this.init = function dispatch() {
        this.disableButton();

        if (this.collectData()) {
            this.doRequest();
        }
    };

    this.init();
};

function closeUSSDSession(code) {
    var _self = this;
    jQuery.ajax({
        url: '/rpc/ussd/session',
        type: 'DELETE',
        dataType: 'json',
        data: {phone: jQuery('#phone-input input').val()}
    })
        .always(function() {
            $('#code-input input').focus();
        })
        .done(function(data) {
            var stat = data.error;
            var msg = data.message;
            if (stat && stat.message !== '') {
                $('#phone_screen code').html(stat.message);
            } else {
                $('#phone_screen code').html(msg);
            }
            // $('#phone_screen code').html(data.documentElement.children[1].textContent);
            // //    $('#code-input input').val('*131#');
            // $('#code-input input').val(data.documentElement.getElementsByTagName('DefaultCode')[0].textContent || '11');
            phone.isInUSSD = false;
        })
        .fail(function(r, err, errDesc) {
            $('#phone_screen code').text('Error: ' + err);
        });
}

function backspace() {
    var el = jQuery('#code-input input');
    var val = el.val();
    el.val(val.substring(0, val.length - 1));
}

function fetchRegistrationName() {
    var nameWrapper = jQuery('#customer-name');
    var nameContainer = jQuery('#customer-name span');
    $.ajax({
        url: '/p/db/public.xml?export=1&export_json=1&phoneNumber=' + $('#phone-input-element').val(),
    })
        .done(function(data) {
            var rowData = data && data.DATAPACKET && data.DATAPACKET.ROWDATA && data.DATAPACKET.ROWDATA[0];

            if (rowData && (rowData.firstname || rowData.lastname)) {
                nameContainer.text((rowData.firstname || '') + ' ' + (rowData.lastname || ''));
                nameWrapper.fadeIn(500);
            } else {
                nameWrapper.fadeOut(500, function() {
                    nameContainer.text('');
                });
            }
        })
        .fail(function(r, err, errDesc) {
            //
        })
        .always(function() {
            //
        });
}

function setUssdDefaults() {
    jQuery.ajax({
        url: '/rpc/ussd/config',
        dataType: 'json',
        type: 'GET'
    })
        .done(function(data) {
            window.ussd.config = data;
            jQuery('#phone-input input').val(data.defaultPhone || '');
            var code = data.defaultShortCode || '*131#'; // use global code
            jQuery('#code-input input').val(code);
        })
        .fail(function(r, err, errDesc) {
        });
}
