require('should');
var utils = require('../lib/utils');
var map = require('../lib/map');
var seg = require('../lib/seg');
var ai = require('../lib/ai');

describe('Map', function() {
  describe('根据输入名返回城市对象：getCityByName', function() {
    it('根据输入的城市名，返回{name:xxx}对象', function() {
      ('北京').should.eql(map.getCityByName('北京市').name);
    });

    it('如果输入的城市在支持列表中，返回的对象带有key字段', function() {
      (2).should.eql(map.getCityByName('北京').key);
    })

    it('如果输入的城市不在支持列表中，返回的对象没有key字段', function() {
      ('undefined').should.eql(typeof(map.getCityByName('锦州').key));
    })
  });

  describe('根据经纬度，返回城市对象：getCityByCoords', function() {
/*
    it('输入北京的经纬度，返回北京对应的城市对象', function(done) {
      map.getCityByCoords(39.941200, 116.503456, function(err, cityObj) {
        ('北京').should.eql(cityObj.name);
        done();
      })
    })
*/

  })
})

describe('Segment', function() {
  describe('根据输入，正确的进行分词', function() {
    it('对支持的城市名进行分词', function() {
      (seg.doSeg('北京哪家寿司好吃？')).should.containEql({w:'北京', p:7})
    })
    it('对不支持的城市名进行分词', function() {
      (seg.doSeg('锦州哪家寿司好吃？')).should.containEql({w:'锦州', p:11});
    })
    it('对菜品名进行分词', function() {
      (seg.doSeg('北京哪家寿司好吃？')).should.containEql({w:'寿司', p:9})
    })
    it('对用来纠错的菜品名进行分词', function() {
      (seg.doSeg('北京哪家susi好吃？')).should.containEql({w:'susi', p:5})
    })
  })

  var o1 = [{w:'寿司', p:9}, {w:'北京', p:7}];
  var o2 = [{w:'susi', p:5}, {w:'锦州', p:11}];
  describe('获取菜品对象', function() {
    it('通过菜品名，获取菜品对象', function() {
      (seg.getDishSeg(o1)).should.eql(o1[0]);
    })
    it('通过纠错名，获取菜品对象', function() {
      (seg.getDishSeg(o2)).should.eql(o2[0]);
    })
  })

  describe('获取城市对象', function() {
    it('通过支持的城市名，获取城市对象', function() {
      (seg.getCitySeg(o1)).should.eql(o1[1]);
    })
    it('通过不支持的城市名，获取城市对象', function() {
      (seg.getCitySeg(o2)).should.eql(o2[1]);
    })
  })
})

describe('Aiml', function() {
  it('根据分词，查找对应结果', function(done) {
    ai.reply([{w:'寿司', p:9}, {w:'什么样'}], function(err, aimlResult) {
      aimlResult.should.eql('#dish.img#');
      done();
    })
  })
})

describe('翻译', function() {
  it('繁体转简体', function(done) {
    utils.fanjian('壽司', function(err, result) {
      result.should.eql('寿司');
      done();
    })
  })
})