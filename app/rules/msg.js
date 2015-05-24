var info = (function() {
  var date = new Date();
  var groups = ['普通', '资深', '达人'];
  var _getShareLink = function(mediaId) {
    var base = 'http://ryoristack.com/';
    var testBase = 'http://wx.applesstt.com/';
    return '<a href="' + base + 'play/' + mediaId + '">分享语音</a>';
  }
  return {
    getSubscribe: function(hasRestaurant) {
      var day = '';
      var gift = '';
      if(hasRestaurant) {
        day = '今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
        gift = '，我们为你准备了一份小礼物，快让服务员拿给你看看是什么~'
      }
      return ['欢迎关注我们！' + day + gift,
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
        '    | 收听评论后回复“T”（听）可查看文字版',
        '   V'
      ].join('\n')
    },
    getFeedback: function(restaurantName, group, mediaId) {
      group = group || 1;
      var groupName = groups[group - 1];
      return '这是“' + restaurantName + '”的一条点评，来自' + groupName + '用户。' + _getShareLink(mediaId);
    },
    noT: '先收听一条语音评论再回复T试试',
    cancelCoupon: function(formatDate) {
      return '您的优惠券被保留，请于' + formatDate + '前使用';
    },
    getFeedbackGuess: function(restaurantName, group, mediaId) {
      group = group || 1;
      var groupName = groups[group - 1];
      return '我猜你在“' + restaurantName + '”，下面是来自' + groupName + '用户的点评，' + _getShareLink(mediaId) + '，如果猜错了，请给我个提示让我再猜猜，回复“包子”试试看~';
    },
    noFeedback: function(restaurantName, isLocation) {
      var preStr = isLocation ? ('我猜你在“' + restaurantName + '”，这家店') : '“' + restaurantName + '”';
      return preStr + '目前没有评价，你可以抢先发送语音评价成为第一人';
    },
    noGuess: '实在猜不到你在哪儿啦，给我个提示吧！回复“包子”试试看~',
    unKnow: '关键词未检出，不如发条语音评论吧？或者回复“包子”试试看~',
    unKnowBind: ['我们无法识别您输入的店铺名,', '您可以输入更完整的名字来匹配！'].join('\n'),
    getMedia: function(restaurantName) {
      return '已收到你对“' + restaurantName +
        '”的点评，如果你要点评的不是这家店，请回复“#店铺名”，我们会根据你的输入匹配店铺';
    },
    mediaNoRestaurant: '不知道你在评论哪家店铺，请回复“#店铺名”，我们会根据你的输入匹配店铺',
    rebindRestaurant: function(restaurantName) {
      return '你的评论已关联到“' + restaurantName + '”，放心地继续评论吧！';
    },
    playIt: ['初级玩家的玩法很简单：',
      '· 菜单都可以点击；',
      '· 听完一条语音后可以回复“T”获取文字版；',
      '· 可以跟我们发语音说说你对某家店的评论，如果得到日料达人的赞赏会得到礼物哦！',
      '· 其他的功能请自己探索吧~'].join('\n'),
    aboutMe: ['我们的工作：',
      '纯（chi）自（ju）费（zi）邀请真正了解日本料理，并且有能力对料理做出评价的日料达人们对日料店进行实地探访并发表他们的评论。',
      '我们的目标：',
      '让喜欢日料的人更懂日本料理，让想吃日料的人知道哪家店真正对得起你的消费额。'].join('\n')
  }
}).call(this);

module.exports = info