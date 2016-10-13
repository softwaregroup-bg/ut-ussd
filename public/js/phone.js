var phone;

(function($) {
    function Phone(config) {
        this.input = $('#' + config.inputId);
        this.infoPane = $('#' + config.infoPaneId);
        this.buttons = this.fetchButtons(config.buttons);
        this.altModeOn = false;
        this.btnClickTimeout = null;
        this.laodingTimeout = null;
        this.lastClickedButton = null;
        this.isInUSSD = false;
    }

    Phone.prototype.fetchButtons = function(btnArr) {
        var buttons = {};
        var btn;
        for (var i = 0, n = btnArr.length; i < n; i += 1) {
            btn = btnArr[i];
            btn.phone = this;
            buttons[btn.id] = new PhoneButton(btn);
        }
        return buttons;
    };

    Phone.prototype.getInputField = function() {
        return this.input;
    };

    Phone.prototype.clr = function() {
        var val = this.input.val();
        this.input.val((val && val.length > 0) ? val.substring(0, val.length - 1) : '');
    };

    Phone.prototype.clearBtnClickTimeout = function(btn) {
        if (btn) {
            btn.resetValue();
        }
        clearTimeout(this.btnClickTimeout);
        this.btnClickTimeout = null;
    };

    Phone.prototype.showMessage = function(message) {
        var pane = this.infoPane;
        pane.text(message);
        pane.fadeIn(500, function() {
            setTimeout(function() {
                pane.fadeOut(500, function() {
                    pane.text('');
                });
            }, 500);
        });
    };

    Phone.prototype.startLoading = function() {
        var self = this;
        this.loadingTimeout = setTimeout(function() {
            self.infoPane.show();
            self.infoPane.addClass('loading');
        }, 500);
    };

    Phone.prototype.stopLoading = function(message) {
        clearTimeout(this.loadingTimeout);
        this.btnClickTimeout = null;
        this.infoPane.hide();
        this.infoPane.removeClass('loading');
    };

    Phone.prototype.resetButtons = function() {
        for (var prop in this.buttons) {
            if (this.buttons.hasOwnProperty(prop)) {
                this.buttons[prop].resetValue();
            }
        }
    };

    function PhoneButton(config) {
        this.phone = config.phone;
        this.id = config.id;
        this.el = $('#' + config.id);
        this.val = config.val;
        this.alt = config.alt || [config.val];
        this.swapKeyboard = config.swapKeyboard;
        this.resetValue();
        this.addEventHandlers();
    }

    PhoneButton.prototype.addEventHandlers = function() {
        this.addClickHandler();
    };

    PhoneButton.prototype.resetValue = function() {
        this.currentAltIndex = 0;
        this.currentVal = this.phone.altModeOn ? this.alt[0] : this.val;
    };

    PhoneButton.prototype.displayValue = function() {
        this.phone.input.val(this.phone.input.val() + this.currentVal);
    };

    PhoneButton.prototype.addClickHandler = function() {
        var phoneInstance = this.phone;
        var self = this;
        var clickFn = function() {
            if (phoneInstance.altModeOn) {
                if (phoneInstance.lastClickedButton && phoneInstance.lastClickedButton !== self) {
                    phoneInstance.clearBtnClickTimeout(phoneInstance.lastClickedButton);
                }
                phoneInstance.lastClickedButton = self;

                if (phoneInstance.btnClickTimeout) {
                    phoneInstance.clr();
                    phoneInstance.clearBtnClickTimeout();
                }

                self.currentVal = self.alt[self.currentAltIndex];
                self.displayValue();
                self.currentAltIndex = (self.currentAltIndex < self.alt.length - 1) ? self.currentAltIndex + 1 : 0;
                phoneInstance.btnClickTimeout = setTimeout(function() {
                    phoneInstance.clearBtnClickTimeout(self);
                }, 700);
            } else {
                self.displayValue();
            }
        };

        var tmt;
        var mouseDownFn = function() {
            tmt = setTimeout(function() {
                self.el.unbind('mouseup');
                if (phoneInstance.altModeOn) {
                    phoneInstance.altModeOn = false;
                    phoneInstance.resetButtons();
                } else {
                    phoneInstance.altModeOn = true;
                }

                phoneInstance.showMessage('Keyboard mode changed');
                self.el.bind('mouseup', function() {
                    self.el.unbind('mouseup');
                    self.el.bind('mouseup', mouseUpFn);
                });
            }, 1000);
        };

        var mouseUpFn = function() {
            clearTimeout(tmt);
            clickFn();
        };
        if (this.swapKeyboard) {
            this.el.bind('mousedown', mouseDownFn);
            this.el.bind('mouseup', mouseUpFn);
        } else {
            this.el.bind('click', clickFn);
        }
    };

    $(document).ready(function() {
        phone = new Phone({
            inputId: 'code-input-element',
            infoPaneId: 'infoPane',
            buttons: [
                {
                    id: 'btn_0',
                    val: '0',
                    alt: [' ']
                },
                {
                    id: 'btn_1',
                    val: '1',
                    alt: ['1']
                },
                {
                    id: 'btn_2',
                    val: '2',
                    alt: ['a', 'b', 'c']
                },
                {
                    id: 'btn_3',
                    val: '3',
                    alt: ['d', 'e', 'f']
                },
                {
                    id: 'btn_4',
                    val: '4',
                    alt: ['g', 'h', 'i']
                },
                {
                    id: 'btn_5',
                    val: '5',
                    alt: ['j', 'k', 'l']
                },
                {
                    id: 'btn_6',
                    val: '6',
                    alt: ['m', 'n', 'o']
                },
                {
                    id: 'btn_7',
                    val: '7',
                    alt: ['p', 'q', 'r', 's']
                },
                {
                    id: 'btn_8',
                    val: '8',
                    alt: ['t', 'u', 'v']
                },
                {
                    id: 'btn_9',
                    val: '9',
                    alt: ['w', 'x', 'y', 'z']
                },
                {
                    id: 'btn_asterisk',
                    val: '*',
                    alt: ['*']
                },
                {
                    id: 'btn_hash',
                    val: '#',
                    alt: ['#'],
                    swapKeyboard: true
                }
            ]
        });
    });
})(window.jQuery);
