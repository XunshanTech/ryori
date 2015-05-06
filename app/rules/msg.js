var info = (function() {
  var date = new Date();
  return {
    getSubscribe: function(hasRestaurant) {
      var day = '';
      var gift = '';
      if(hasRestaurant) {
        day = '今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
        gift = '，我们为你准备了一份小礼物，快让服务员拿给你看看是什么~'
      }
      return ['欢迎关注我们！今天是' + day + gift,
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
      ].join('\n')
    },
    getFeedback: function(restaurantName) {
      return '这是"' + restaurantName + '"店的一条点评';
    },
    noT: '请点击收听评论',
    cancelCoupon: '已取消使用优惠券，您可以再下次到店时使用',
    getFeedbackGuess: function(restaurantName) {
      return '我猜你在"' + restaurantName + '"店，下面是这家店的点评，如果猜错了，请给我个提示让我再猜猜，回复"包子"试试看~';
    },
    noGuess: '实在猜不到你在哪儿啦，给我个提示吧！回复"包子"试试看~',
    unKnow: '意味不明，不如发条语音评论吧？或者点击”玩法介绍“看看还有什么有趣的内容',
    unKnowBind: ['我们无法识别您输入的店铺名,', '您可以输入更完整的名字来匹配！'].join('\n'),
    getMedia: function(restaurantName) {
      return '已收到你对"' + restaurantName +
        '"店 的点评，如果你要点评的不是这家店，请回复"#店铺名"，我们会根据你的输入匹配店铺';
    },
    mediaNoRestaurant: '不知道你在评论哪家店铺，请回复"#店铺名"，我们会根据你的输入匹配店铺',
    rebindRestaurant: function(restaurantName) {
      return '你的评论已关联到"' + restaurantName + '"店，放心地继续评论吧！';
    },
    playIt: ['初级玩家的玩法很简单：',
      '· 菜单都可以点；',
      '· 可以回复”T“',
      '· 可以跟我们发语音说说你对某家店的评论，如果得到日料达人的赞赏会得到礼物哦！',
      '· 其他的自己探索吧'].join('\n'),
    aboutMe: ['我们的工作是：纯（chi）自（ju）费（zi）邀请真正了解日本料理有能力对料理做出评价的日料达人们对日料店进行实地探访并发表他们的评论',
      '我们的目标是：让喜欢日料的人更懂日本料理，让想吃日料的人知道哪家店真的好吃'].join('\n')
  }
}).call(this);

module.exports = info