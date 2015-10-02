var map = require('../lib/map');

var info = (function() {
  var groups = ['普通', '资深', '达人'];
  var base = 'http://ryoristack.com/';
  //var testBase = 'http://wx.applesstt.com/';
  var _getShareLink = function(mediaId) {
    var link = '<a href="' + base + 'play/' + mediaId + '">分享语音</a>';
    return mediaId ? link : '';
  }
  var _getFoodLink = function(season, food) {
    var _material = food.material !== '' ? food.material : food.name;
    var link = '<a href="' + base + 'season/' + season._id + '/food/' + food._id + '">' +
      _material + '</a>';
    return link;
  }
  var _citys = map.citys;
  var _cityAry = [];
  for(var i = 0; i < _citys.length; i++) {
    _cityAry.push(_citys[i].name);
  }
  return {
    getSubscribe: function(isSubscribe, userName) {

      var ary = [];
      if(userName) {
        ary.push('欢迎你回来，' + userName + '！');
      } else if(isSubscribe) {
        ary.push('感谢关注！');
      }

      ary.push('我是日料栈的机器人栈栈，可以回答你关于日料的各种问题。');
      ary.push('例如寿司，可以问我:');
      ary.push('\n寿司是什么？');
      ary.push('寿司有哪些种类？');
      ary.push('寿司长啥样？');
      ary.push('为啥叫寿司？');
      ary.push('寿司怎么吃？');
      ary.push('哪家店寿司好吃？');
      ary.push('北京哪家店寿司好吃？');
      ary.push('(目前我熟悉的城市有：' + _cityAry.join(',') + ')');
      ary.push('……');
      ary.push('\n');
      ary.push('不知道问啥就先问我“日本料理有哪些”吧！');
      return ary.join('\n');
      /*var day = '';
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
      ].join('\n')*/
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
      return ['本周应季食材：',
        foods.join('\n'),
        '去哪儿吃？戳蓝字！'].join('\n');
    },
    unknowCity: function(dishName) {
      var _citys = map.citys;
      var _dishName = dishName || '鳗鱼饭';
      var _cityAry = [];
      for(var i = 0; i < _citys.length; i++) {
        _cityAry.push(_citys[i].name);
      }
      return ['我们暂时仅支持下列城市：' + _cityAry.join('，'),
        '您可以在提问中加入城市，例如：北京哪家' + _dishName + '最好吃？'].join('\n\n');
    },
    robotUnknow: '这个我回答不了哎。。。想知道我擅长回答哪些问题可以回复“特长”~',
    robotHelp: ['我对各种常见的日本料理都一定的了解，并且还在持续不断地学习中。',
      '例如寿司，可以问我:',
      '\n寿司是什么？',
      '寿司有哪些种类？',
      '寿司长啥样？',
      '为啥叫寿司？',
      '寿司怎么吃？',
      '哪家店寿司好吃？',
      '北京哪家店寿司好吃？',
      '(目前我熟悉的城市有：' + _cityAry.join(',') + ')',
      '……',
      '\n不知道问啥就先问我“日本料理有哪些”吧！'].join('\n')
  }
}).call(this);

module.exports = info