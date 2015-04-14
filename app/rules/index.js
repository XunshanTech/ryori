var mongoose = require('mongoose');
var User = mongoose.model('User');

var _saveFromWx = function(wx_user, restaurantId, time) {
  var user = new User({
    wx_name: wx_user.nickname,
    wx_app_id: wx_user.openid,
    wx_img: wx_user.headimgurl,
    wx_remark: wx_user.remark,
    sex: wx_user.sex,
    city: wx_user.city,
    province: wx_user.province,
    country: wx_user.country,
    createdAt: time ? new Date(time * 1000) : new Date()
  });
  User.findOne({
    'wx_app_id': wx_user.openid
  }, function(err, retUser) {
    console.log(retUser);
    user.save(function(err) {
      if(err) {
        console.log(err)
      } else {
        console.log('Create user from wx success!');
      }
    });
  })
}


module.exports = exports = function(webot, wx_api) {
  webot.set('subscribe', {
    pattern: function(info) {
      return info.is('event') && info.param.event === 'subscribe';
    },
    handler: function(info) {
      var uid = info.uid;
      console.log(info);
      wx_api.getUser(uid, function(err, result) {
        console.log(result);
        _saveFromWx(result, null, result.subscribe_time);
      })
      var date = new Date();
      return ['欢迎关注日料栈, 今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日',
        '您可以通过这条消息向服务员领取一份精美日料餐具。',
        '在这里，可以收听别人对日料餐厅的语音趣评。',
        '点击语音点评收听当前餐厅，或者输入其他餐厅名字来收听。',
        '想让你的声音出现在日料栈吗？直接发送语音评论给我们吧。'].join('\n');
    }
  });

  webot.set('test', {
    pattern: /^test/i,
    handler: function(info, next) {
      next(null, 'roger that!')
    }
  })

  webot.set('media', {
    pattern: function(info) {
      if(info.is('voice')) {
        console.log(info);
      }
      return info.is('voice');
    },
    handler: function(info) {
      return '感谢您提交语音评价';
    }
  });

  webot.set('hi', {
    pattern: /^hi/i,
    handler: function(info, next) {
      wx_api.sendText(info.uid, '这是一条测试语音', function() {
        info.reply = {
          type: 'voice',
          mediaId: 'E699XYa8TjXTHA8SAD9YgL7Y9ce8S8kIa1W9_KIyu2XDSUnzcE9enGVB_G6X6BPa'
        }
        next(null, info.reply);
      });
    }
  })

}