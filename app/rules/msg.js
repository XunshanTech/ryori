var info = (function() {
  var date = new Date();
  var groups = ['普通', '资深', '达人'];
  var base = 'http://ryoristack.com/';
  var testBase = 'http://wx.applesstt.com/';
  var _getShareLink = function(mediaId) {
    var link = '<a href="' + base + 'play/' + mediaId + '">分享语音</a>';
    return mediaId ? link : '';
  }
  var _getFoodLink = function(season, food) {
    var link = '<a href="' + base + 'season/' + season._id + '/food/' + food._id + '">' +
      food.name + '</a>';
    return link;
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
        '    |',
        '    | 看到“收听评论”了吗',
        '    | 点一下试试吧！',
        '   V'
      ].join('\n')
    },
    getFeedback: function(restaurantName, group, mediaId) {
      group = group || 1;
      var groupName = groups[group - 1];
      return ['这是“' + restaurantName + '”的一条点评，来自' + groupName + '用户。' + _getShareLink(mediaId),
        '- 回复“T”可查看文字版',
        '- 试试发一条语音，让大家听到你的评论'].join('\n');
    },
    getTopic: function(mediaId) {
      return '这是一条专题评论。' + _getShareLink(mediaId) +
        '\n继续点击，收听下一条！';
    },
    getTopicInfo: function(mediaId) {
      return '这是“日料栈”的语音说明，' + _getShareLink(mediaId);
    },
    noT: '先收听一条语音评论再回复T试试',
    cancelCoupon: function(formatDate) {
      return '您的优惠券被保留，请于' + formatDate + '前使用';
    },
    noFeedback: function(restaurantName, isLocation) {
      var preStr = isLocation ? ('我猜你在“' + restaurantName + '”，这家店') : '“' + restaurantName + '”';
      return preStr + '目前还没有评价，你可以抢先发送语音评价成为第一人';
    },
    unKnow: '未检索到关键词，将交由人工处理',
    unKnowBind: ['我们无法识别您输入的店铺名,', '您可以输入更完整的名字来匹配！'].join('\n'),
    getMedia: function(restaurantName, mediaId) {
      return ['已收到你对“' + restaurantName + '”的点评，' + _getShareLink(mediaId),
        '- 试试发一张图片作为语音配图',
        '- 如果你要点评的不是这家店，请回复“#店铺名”修改'].join('\n')
    },
    mediaNoRestaurant: function(mediaId) {
      return '不知道你在评论哪家店铺，请回复“#店铺名”绑定，' + _getShareLink(mediaId);
    },
    rebindRestaurant: function(restaurantName, mediaId) {
      return ['你的评论已关联到“' + restaurantName + '”，' + _getShareLink(mediaId),
        '- 试试发一张图片作为语音配图'].join('\n')
    },
    bindMediaImage: function(mediaId) {
      return '图片已经成功绑定上一条语音，' + _getShareLink(mediaId);
    },
    playIt: ['初级玩家的玩法很简单：',
      '· 菜单都可以点击；',
      '· 听完一条语音后可以回复“T”获取文字版；',
      '· 可以跟我们发语音说说你对某家店的评论，如果得到日料达人的赞赏会得到礼物哦！',
      '· 其他的功能请自己探索吧~'].join('\n'),
    aboutMe: ['我们的工作：',
      '纯（chi）自（ju）费（zi）邀请真正了解日本料理，并且有能力对料理做出评价的日料达人们对日料店进行实地探访并发表他们的评论。',
      '我们的目标：',
      '让喜欢日料的人更懂日本料理，让想吃日料的人知道哪家店真正对得起你的消费额。'].join('\n'),
    formSeason: function(season) {
      var foods = [];
      for(var i = 0; i < season.foods.length; i++) {
        foods.push(_getFoodLink(season, season.foods[i]));
      }
      return [foods.join('\n'),
        '\n去哪儿吃？戳蓝字！'].join('');
    }
  }
}).call(this);

module.exports = info