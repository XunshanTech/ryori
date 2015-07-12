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

  var _insertTerminal = function(robotText) {
    var userText = $('#robot-question-text').html();
    var userHtml = ['<p class="terminal-line">',
        '<em>', user, ' says:</em> ', userText,
      '</p>'].join('');
    var robotHtml = ['<p class="terminal-line">',
        '<em>', robot, ' says(<i>robot</i>):</em> ', robotText,
      '</p>'].join('');
    $('.terminal').append(userHtml).append(robotHtml);
    $('.terminal-wrap').scrollTop($('.terminal').height());
  }

  var setRobotAnswer = function(text) {
    _setText('robot-answer-text', text);
    _insertTerminal(text);
  }

  var init = function() {
    _setName();
    $('#robot-question').focus().keyup(function(event) {
      var self = this;
      var inputVal = $(self).val();
      $('#robot-answer-text').html('');
      $('#robot-question-text').html(inputVal);
      if($.trim(inputVal) != '') {
        $('#robot-question-text').parents('.robot-answer').show();
      }
      if(event.keyCode == '13' && $.trim(inputVal) !== '') {
        $(self).val('');
        setRobotAnswer('I\' kill you!');
      }
    })
  }

  return {
    init: init
  }
}).call(this);

$(function() {
  Robot.init();
});