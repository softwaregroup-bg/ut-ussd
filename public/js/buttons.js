function PhoneButton(el, val){
  var codeInput = $('#code-input input');
  el.bind( "click", function() {
    codeInput.val(codeInput.val() + val)
  });
}


function bindPhoneButtons(){
  var buttons = $(".phoneBtn");
  var val;
  var btn;
  for(var i = 0, n = buttons.length; i < n; i += 1) {
    btn = buttons[i];
    val = btn.id.split("_").pop();
    if(val == "asterisk"){
      val = "*";
    } else if (val == "hash") {
      val = "#";
    }
    new PhoneButton($(btn), val);
  }
}

$(document).ready(function(){
  bindPhoneButtons();
})