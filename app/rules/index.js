module.exports = exports = function(webot, wx_api) {
  var Rule = require('./rule')(wx_api);

  //用户关注 or 扫码进入
  webot.set('subscribe', {
    pattern: function(info) {
      return info.is('event') &&
        (info.param.event === 'subscribe' || info.param.event === 'SCAN');
    },
    handler: Rule.subscribe
  });

  //打开应用时 记录用户的地理位置信息
  webot.set('location', {
    pattern: function(info) {
      return info.is('event') && info.param.event === 'LOCATION';
    },
    handler: Rule.location
  })

  //用户点击菜单操作
  webot.set('click', {
    pattern: function(info) {
      return info.is('event') && info.param.event === 'CLICK';
    },
    handler: Rule.click
  })

  //用户输入t or T 返回语音的文字内容
  webot.set('t', {
    pattern: function(info) {
      return info.is('text') && (info.text.trim() === 't' || info.text.trim() === 'T');
    },
    handler: Rule.t
  })

  //用户输入n or N 取消之前使用的优惠券
  webot.set('n', {
    pattern: function(info) {
      return info.is('text') && (info.text.trim() === 'n' || info.text.trim() === 'N');
    },
    handler: Rule.n
  })

  //用户发送语音评论
  webot.set('media', {
    pattern: function(info) {
      return info.is('voice');
    },
    handler: Rule.media
  })

  //用户发送图片 做为语音配图
  webot.set('image', {
    pattern: function(info) {
      return info.is('image');
    },
    handler: Rule.image
  })

  //用户修改语音评论所匹配的餐厅
  webot.set('media_bind_restaurant', {
    pattern: function(info) {
      return info.is('text') && info.text.indexOf('#') === 0;
    },
    handler: Rule.mediaBindRestaurant
  })

  //robot help
  webot.set('robot_help', {
    pattern: function(info) {
      return info.is('text') && info.text === '特长'
    },
    handler: Rule.robotHelp
  })

  //ask robot
  webot.set('robot', {
    pattern: function(info) {
      if(info.session) {
        console.log('info session no: ' + info.session.no);
        info.session.no = info.session.no ? (info.session.no + 1) : 1;
      }
      return info.is('text');
    },
    handler: Rule.robot
  })

  //匹配用户输入店铺名 回复语音
  webot.set('restaurant', {
    pattern: function(info) {
      return info.is('text');
    },
    handler: Rule.restaurant
  })

  //过滤用户的其他输入
  webot.set('other', {
    pattern: function(info) {
      return info.is('image') || info.is('vodeo') || info.is('music');
    },
    handler: function(info) {
      info.noReply = true;
      return ;
    }
  })
}