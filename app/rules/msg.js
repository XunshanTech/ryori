var info = (function() {
  var date = new Date();
  return {
    subscribe: ['欢迎关注我们！今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日，我们为你准备了一份小礼物，快让服务员拿给你看看是什么~',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    |',
      '    | 看到收听评论了吗',
      '    | 点一下试试吧！',
      '    | 也可回复"T"(听)试试',
      '   V'
    ].join('\n'),
    getFeedback: function(restaurantName) {
      return '这是"' + restaurantName + '"店的一条点评';
    },
    getFeedbackGuess: function(restaurantName) {
      return '我猜你在"' + restaurantName + '"店，下面是这家店的点评，如果猜错了，请给我个提示让我再猜猜，回复"包子"试试看~';
    },
    noGuess: '实在猜不到你在哪儿啦，给我个提示吧！回复"包子"试试看~'
  }
}).call(this);

module.exports = info