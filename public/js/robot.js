var Robot = (function() {
  var t;
  var user = 'you';
  var robot = 'Dath Vader';
  var _setText = function(id, text, second) {
    var second = second || 100;
    var len = 1;
    if(t) {
      window.setTimeout(function() {
        _setText(id, text, second);
      }, 500);
      return;
    }
    t = window.setInterval(function() {
      $('#' + id).parents('.robot-answer').show();
      $('#' + id).html(text.substring(0, len));
      if(len === text.length) {
        window.clearInterval(t);
        t = null;
        return;
      }
      len++;
    }, second);
  }

  var _setName = function() {
    $('#user-name').html(user);
    $('#robot-name').html(robot);
  }

  var _insertTerminal = function(text) {
    $('.terminal').append(text);
    $('.terminal-wrap').scrollTop($('.terminal').height());
  }

  var setRobotAnswer = function(d) {
    var robotText = typeof d.answer === 'string' ? d.answer : (d.answer.text || '');
    var robotImgs = typeof d.answer === 'string' ? '' : d.answer.imgs;

    if(d.answer === '#robot.img#') {
      robotText = '';
      robotImgs = [{img: '/img/robot/robot.jpg'}];
    }
    //_setText('robot-answer-text', robotText);
    var userText = $('#robot-question').val();
    var userHtml = ['<div class="terminal-line">',
      '<em>', user, ' says:</em> ', userText,
      '</div>'].join('');
    _insertTerminal(userHtml);

    if(d) {
      setRobotSegment(d);
    }

    var robotHtml = '';
    if(robotText !== '') {
      robotHtml = ['<div class="terminal-line">',
        '<em>', robot, ' says(<i>robot</i>):</em> ', robotText,
        '</div>'].join('');
    }
    if(robotImgs.length > 0) {
      for(var i = 0; i < robotImgs.length; i++) {
        var robotImg = '<img src="' + robotImgs[i].img + '" />';
        robotHtml += ['<div class="terminal-line">',
          '<em>', robot, ' says(<i>robot</i>):</em> ', robotImg,
          '</div>'].join('');
      }
    }
    _insertTerminal(robotHtml);
  }

  var setRobotSegment = function(d) {
    var words = d.words;
    var spent = d.spent;

    var wordsAry = [];
    for(var i = 0; i < words.length; i++) {
      wordsAry.push(words[i].w);
    }
    var segmentInfo = ['<div class="terminal-line">',
        '<em>系统分词(<i>耗时 ', spent, ' 毫秒</i>):</em> ', wordsAry.join(','),
      '</div>'].join('');
    _insertTerminal(segmentInfo);
  }

  var _submit = function(cb) {
    var question = $.trim($('#robot-question').val());
    if(question !== '') {
      $.post('/robot/segment', {question: question}, function (d) {
        setRobotAnswer(d);
        $('#robot-question').val('');
        if(cb) cb();
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

      $('#robot-question').val(testList[testIndex]);
      testIndex++;

      _submit(function() {
        _testItem();
      });
    }

    _testItem();
  }

  var init = function() {
    _setName();
    $('#robot-form').submit(_submit);
    $('#test-all').click(function() {
      _test();
    })
/*
    $('#robot-question').focus().keyup(function(event) {
      var self = this;
      var inputVal = $.trim($(self).val());
      $('#robot-answer-text').html('');
      if(inputVal !== '') {
        $('#robot-question-text').html(inputVal);
        $('#robot-question-text').parents('.robot-answer').show();
      }
    })
*/
  }

  return {
    init: init
  }
}).call(this);

$(function() {
  Robot.init();
});