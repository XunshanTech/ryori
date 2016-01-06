var Order = (function() {
  var _initToggle = function() {
    $('.isTui').click(function() {
      $('.isTui').each(function(index, e) {
        var cls = e.value === '1' ? 'tuijian-wrap' : 'zizhu-wrap';
        $('.' + cls).css('display', e.checked ? 'block' : 'none');
        if(e.checked) {
          $('.tuijian-group .tuijian').remove();
          $('.zizhu-wrap .zizhu').remove();
          if(e.value === '1') {
            _addTuijian();
          } else {
            _addZizhu();
          }
        }
      })
    })
    $('.orderMeals').click(function() {
      $('.orderMeals').each(function(index, e) {
        $(e).parents('.checkbox').find('.' + e.value).css('display', e.checked ? 'block' : 'none');
      })
    })

  }

  var _addTuijian = function() {
    $('.tuijian-group').append($('.tuijian-temp .tuijian').first().clone(true));
    _initBind();
  }

  var _addZizhu = function() {
    $('.zizhu-wrap').append($('.zizhu-temp .zizhu').first().clone(true));
    _initBind();
  }

  var _bindAddOther = function() {
    $('.add-other').click(function() {
      if($(this)[0].checked) {
        _addTuijian();
      }
    })
  }

  var _initBind = function() {
    $('.zizhu-wrap .order-date, .tuijian-wrap .order-date').each(function() {
      $(this).attr('id', 'order-date-' + (new Date()).getTime());
      $(this).datepicker({
        format: 'yyyy-mm-dd',
        autoclose: true
      })
    })
    $('#order-form').validate();
  }

  var __getParams = function() {
    var params = {};
    params.open_id = $('.openId')[0].value;
    params.open_name = $('.openName')[0].value;
    params.name = $('#order-name').val();
    params.tel = $('#order-tel').val();
    params.no = $('#order-no').val();
    params.child = $('#order-child').val();
    params.advice = $('#order-advice').val();
    params.is_tui = null;
    $('.isTui').each(function(index, e) {
      if(e.checked) {
        params.is_tui = e.value === '1' && true;
      }
    })
    //is tuijian
    if(params.is_tui) {
      var likes = ['hsll', 'ss', 'tfl', 'hnll', 'htll', 'qt'];
      for(var i = 0; i < likes.length; i++) {
        $('.' + likes[i]).each(function(index, e) {
          if(e.checked) {
            params[likes[i]] = e.value;
          }
        })
      }

      var orders = [];
      $('.tuijian-wrap .tuijian').each(function(index, e) {
        var wrap = $(e);
        var order = {};

        order.date = wrap.find('.order-date')[0].value;
        order.city = wrap.find('.city')[0].value;
        wrap.find('.orderMeals').each(function(_index, _e) {
          if(_e.checked && _e.value === 'lunch') {
            order.isLunch = true;
            order.lunch = wrap.find('.lunch input')[0].value;
          }
          if(_e.checked && _e.value === 'dinner') {
            order.isDinner = true;
            order.dinner = wrap.find('.dinner input')[0].value;
          }
        })

        orders.push(order);
      })
      params.orders = orders;
    } else if(params.is_tui === false) {
      var order = {};
      var wrap = $('.zizhu-wrap');

      wrap.find('.city').each(function(index, e) {
        if(e.checked) {
          order.city = e.value === '' ? wrap.find('.other_city')[0].value : e.value;
        }
      })
      order.restaurant = wrap.find('.restaurant')[0].value;
      order.date = wrap.find('.order-date')[0].value;
      wrap.find('.time').each(function(index, e) {
        if(e.checked) {
          order.time = e.value;
        }
      })

      params.orders = [order];
    }
    return params;
  }

  var _initForm = function() {
    $('#order-form').submit(function() {
      var params = __getParams();
      console.log(params);
      //return false;
      $.ajax({
        url: '/client/order',
        type: 'POST',
        data: params,
        dataType: 'json',
        success: function() {
          window.location.href = '/client/orderSuccess';
        }
      })
      return false;
    })
  }

  var _initCate = function() {
    $('input.cate').click(function(e) {
      var me = $(this);
      if(me[0].checked) {
        var name = me.attr('name');
        $('input.cate[name="' + name + '"]').each(function(index, el) {
          if(me.val() !== el.value) {
            el.checked = false;
          }
        })
      }
    })
  }

  var init = function() {
    _initForm();
    _initBind();
    _initCate();
    _bindAddOther();
    _initToggle();
  }

  return {
    init: init
  }
}).call(this);

$(function() {
  Order.init();
})