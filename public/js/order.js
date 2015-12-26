var Order = (function() {
  var init = function() {
    $('#order-form').validate();

    $('#order-date').datepicker({
      format: 'yyyy-mm-dd',
      autoclose: true
    })
  }

  return {
    init: init
  }
}).call(this);

$(function() {
  Order.init();
})