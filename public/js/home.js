$(function() {
  var img = '/img/home05.jpg';
  $('.home-img-wrap').backstretch(img);
  $(window).scroll( function() {
    var st = $(this).scrollTop(),
      wh = $(window).height(),
      sf = 1.2 - st/(10*wh);

    $('.backstretch img').css({
      'transform' : 'scale('+sf+')',
      '-webkit-transform' : 'scale('+sf+')',
      'position': 'fixed'
    });

    $('.home-img-wrap .home-img-content').css({ 'opacity' : (1.4 - st/400) });

    if($(window).scrollTop() > ($(window).height() - 41)){
      //$('.backstretch').hide();
      $('header').removeClass('header-scroll');
    }else{
      //$('.backstretch').show();
      $('header').addClass('header-scroll');
    }

  });

  var st = $(this).scrollTop(),
    wh = $(window).height(),
    sf = 1.2 - st/(10*wh);

  $('.backstretch img').css({
    'transform' : 'scale('+sf+')',
    '-webkit-transform' : 'scale('+sf+')',
    'position': 'fixed'
  });

  $('.home-img-wrap .home-img-content').css({ 'opacity' : (1.4 - st/400) });

  if($(window).scrollTop() > ($(window).height() - 41)){
    $('.backstretch').hide();
    $('header').removeClass('header-scroll');
  }else{
    $('.backstretch').show();
    $('header').addClass('header-scroll');
  }

  $('.home-img-wrap').height($(window).height());

});




var Robot = (function() {

  var _insertTerminal = function(text) {
    $('.home-phone-show').append(text);
    $('.home-phone-show-wrap').scrollTop($('.home-phone-show').height());
  }

  var setRobotAnswer = function(d) {
    var robotText = typeof d.answer === 'string' ? d.answer : (d.answer.text || '');
    var robotImgs = typeof d.answer === 'string' ? [] : d.answer.imgs;
    if(!robotImgs && d.answer.img) {
      robotImgs = [{img: d.answer.img}];
    }

    if(d.answer === '#robot.img#') {
      robotText = '';
      robotImgs = [{img: '/img/robot/robot.jpg'}];
    }
    var _getHtml = function(text, isRobot) {
      var cls = isRobot ? 'wx-robot' : 'wx-user';
      var _html = ['<div class="clearfix wx-box ', cls, '">',
        '<div class="wx-img"></div>',
        '<div class="wx-msg">', text, '</div>',
        '</div>'].join('');
      return _html;
    }

    var userText = $('#robot-test-question').val();
    _insertTerminal(_getHtml(userText, false));

    if(robotText === '') {
      if(robotImgs && robotImgs.length === 0) {
        robotText = '这个我回答不了哎。。。想知道我擅长回答哪些问题可以回复“特长”~';
        _insertTerminal(_getHtml(robotText, true));
      }
    } else {
      _insertTerminal(_getHtml(robotText, true));
    }

    if(robotImgs && robotImgs.length > 0) {
      for(var i = 0; i < robotImgs.length; i++) {
        _insertTerminal(_getHtml('<img src="' + robotImgs[i].img + '" />', true));
      }
    }
  }


  var _submit = function(cb) {
    var question = $.trim($('#robot-test-question').val());
    if(question !== '') {
      $.post('/robot/segment', {question: question}, function (d) {
        setRobotAnswer(d);
        $('#robot-test-question').val('');
        if(cb && typeof cb === 'function') cb();
      });
    }

    return false;
  }

  var _test = function() {
    var testList = [
      '你好',
      '你是谁',
      '你长什么样',
      '去哪儿吃',
      '北京',
      '鳗鱼饭',
      '鳗鱼饭怎么样',
      '什么样',
      '有哪些分类',
      '寿司呢',
      '去哪儿吃',
      '寿司去哪儿吃',
      '北京',
      '北京哪家寿司好吃',
      '重庆',
      '重庆哪家寿司好吃',
      '今天天气不错'
    ];

    var testIndex = 0, testLen = testList.length;

    var _testItem = function() {
      if(testIndex >= testLen) return false;

      $('#robot-test-question').val(testList[testIndex]);
      testIndex++;

      _submit(function() {
        _testItem();
      });
    }

    _testItem();
  }

  var init = function() {
    $('#robot-test-form').submit(_submit);
    $('.home-test-robot').click(function() {
      _test();
    })
    $('#robot-test-question').focus();
  }

  return {
    init: init
  }
}).call(this);

$(function() {
  Robot.init();
});