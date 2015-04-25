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
    noGuess: '实在猜不到你在哪儿啦，给我个提示吧！回复"包子"试试看~',
    unKnow: '意味不明，不如发条语音评论吧？或者点击”玩法介绍“看看还有什么有趣的内容',
    getMedia: function(restaurantName) {
      return '已收到你对"' + restaurantName +
        '"店 的点评，如果你要点评的不是这家店，请回复"#店铺名"，我们会根据你的输入匹配店铺';
    },
    mediaNoRestaurant: '不知道你在评论哪家店铺，请回复"#店铺名"，我们会根据你的输入匹配店铺'
  }
}).call(this);

module.exports = info