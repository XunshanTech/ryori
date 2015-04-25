var info = (function() {
  var date = new Date();
  return {
    subscribe: ['欢迎关注我们！今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日，我们为你准备了一份小礼物，快让服务员拿给你看看是什么~',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|',
      '&nbsp;&nbsp;&nbsp;|&nbsp;看到收听评论了吗',
      '&nbsp;&nbsp;&nbsp;|&nbsp;点一下试试吧！',
      '&nbsp;&nbsp;&nbsp;|&nbsp;也可以直接回复”T“（听）试试',
      '&nbsp;&nbsp;&nbsp;V'
    ].join('\n')

  }
}).call(this);

module.exports = info