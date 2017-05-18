window.ussd = {}
function ussdRequest(button, destination, phoneInput, dataCollection) {
  this.data = {};

  // clock control
  if (clock && clock.state === undefined) {
    clock.reset();
    clock.start();
  }

  // instance methods
  this.enableButton = function(){
    button.removeAttr('disabled');
  };
  this.disableButton = function(){
    button.attr('disabled','disabled');
  };
  this.hidePhoneInput = function(){
    phoneInput.addClass('hidden');
  };

  this.collectData = function collectData(){
    var _collections;

    jQuery(dataCollection).each(function(index, val) {
      var _el = jQuery(val);

      if(!(_collections instanceof Object))
        _collections = {};
      _collections[_el.attr('name')] = _el.val();

    });

    this.data = _collections;

    jQuery('[name="message"]')[0].value = ''

    return (_collections?true:false);
  };

  this.doRequest = function doRequest() {
    var _self = this;
    if(!phone.isInUSSD) {
      this.data.newSession = true;
    }
    phone.startLoading();
    jQuery.ajax({
      url: '/ussd',
      type: 'POST',
      dataType: 'xml',
      data: this.data
    })
    .always(function(){
       phone.stopLoading();
      _self.enableButton();
    })
    .done(function(data) {
      phone.isInUSSD = true;
      _self.enableButton();
      var _div = jQuery('<div/>');
      _div.append(data.documentElement);
      var stat = _div.children().children()[0];
      var msg = _div.children().children()[1];
      destination.html(destination.html() + _self.data.phone + '<br/>');
      destination.html(destination.html() + _self.data.message + '<br/>****************<br/>');
      destination.html(destination.html() + msg.textContent + '<br/>----------------<br/>');
      if(stat.textContent && (stat.textContent.match(/[a-zA-Z]+/ig).length>0))
        destination.html(destination.html() + stat.textContent + '<br/>----------------<br/>');
      if (window.ussd.config.charsCount) {
        $("#charsCount").html(msg.textContent.length);
      }
      destination.animate({
        "scrollTop":destination.scrollTop()+destination.height()
      }, 500);
      //_self.hidePhoneInput();

      // @@@@@@@@@@@@@@
      if(stat.textContent != '')
        $("#phone_screen code").html(stat.textContent);
      else
        $("#phone_screen code").html(msg.textContent);
      $("#code-input input").focus();
      // @@@@@@@@@@@@@@
    })
    .fail(function(r,err,errDesc) {
      destination.find('code').text('Error: '+err);
    });
  };

  this.init = function dispatch(){
    this.disableButton();

    if(this.collectData()){
      this.doRequest();
    }
  };

  this.init();
};

function closeUSSDSession(code){
  var _self = this;
  jQuery.ajax({
    url: '/closeUSSDSession',
    type: 'POST',
    dataType: 'xml',
    data: {phone: jQuery('#phone-input input').val()}
  })
  .always(function(){
    $("#code-input input").focus();
  })
  .done(function(data) {
    $("#phone_screen code").html(data.documentElement.childNodes[1].textContent);
//    $('#code-input input').val('*131#');
    $('#code-input input').val(data.documentElement.getElementsByTagName('DefaultCode')[0].textContent || '11');
    phone.isInUSSD = false;
  })
  .fail(function(r,err,errDesc) {
    $("#phone_screen code").text('Error: '+err);
  });
}

function backspace(){
  var el = jQuery('#code-input input');
  var val = el.val();
  el.val(val.substring(0, val.length - 1))
}

function fetchRegistrationName(){
  var nameWrapper = jQuery('#customer-name');
  var nameContainer = jQuery('#customer-name span');
  $.ajax({
    url: '/p/db/public.xml?export=1&export_json=1&phoneNumber=' + $('#phone-input-element').val(),
  })
  .done(function(data) {
    var rowData = data && data.DATAPACKET && data.DATAPACKET.ROWDATA && data.DATAPACKET.ROWDATA[0];

    if(rowData && (rowData.firstname || rowData.lastname)){
      nameContainer.text((rowData.firstname || '') + ' ' + (rowData.lastname || ''));
      nameWrapper.fadeIn(500);
    } else {
      nameWrapper.fadeOut(500, function(){
        nameContainer.text("");
      });
    }
  })
  .fail(function(r,err,errDesc) {
    //
  })
  .always(function() {
    //
  });
}

function setUssdDefaults() {
    jQuery.ajax({
        url: '/getUssdConfig',
        type: 'POST',
        dataType: 'json',
        data: {}
    })
        .done(function (data) {
            window.ussd.config = data;
            jQuery('#phone-input input').val(data.defaultPhone || '');
            code = data.defaultShortCode || '*131#'; // use global code
            jQuery('#code-input input').val(code);
        })
        .fail(function (r, err, errDesc) {
        });
}


